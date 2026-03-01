import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasRedis: !!process.env.REDIS_URL,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}
