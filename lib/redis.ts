import type { Session } from "@/types";

const SESSION_TTL = parseInt(process.env.SESSION_TTL || "2592000", 10); // 30 days default

// In-memory store for development (no Redis needed)
const memoryStore = new Map<string, Session>();

// Check if Redis is configured
const useRedis = !!process.env.REDIS_URL;

let redis: import("ioredis").default | null = null;

async function getRedis() {
  if (!useRedis) return null;

  if (!redis) {
    const Redis = (await import("ioredis")).default;
    redis = new Redis(process.env.REDIS_URL as string);
  }
  return redis;
}

export async function getSession(code: string): Promise<Session | null> {
  const redisClient = await getRedis();

  if (redisClient) {
    const data = await redisClient.get(`session:${code}`);
    if (!data) return null;
    return JSON.parse(data);
  }

  // In-memory fallback
  const session = memoryStore.get(code);
  if (!session) return null;

  // Check expiration
  if (new Date(session.expiresAt) < new Date()) {
    memoryStore.delete(code);
    return null;
  }

  return session;
}

export async function setSession(session: Session): Promise<void> {
  const redisClient = await getRedis();

  // Update lastActivityAt and extend expiration
  session.lastActivityAt = new Date().toISOString();
  session.expiresAt = new Date(Date.now() + SESSION_TTL * 1000).toISOString();

  if (redisClient) {
    await redisClient.setex(`session:${session.code}`, SESSION_TTL, JSON.stringify(session));
    return;
  }

  // In-memory fallback
  memoryStore.set(session.code, session);
}

export async function deleteSession(code: string): Promise<void> {
  const redisClient = await getRedis();

  if (redisClient) {
    await redisClient.del(`session:${code}`);
    return;
  }

  memoryStore.delete(code);
}

export function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like 0, O, 1, I
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
