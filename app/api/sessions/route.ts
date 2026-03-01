import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { generateSessionCode, getSession, setSession } from "@/lib/redis";
import type { Participant, Session } from "@/types";

// POST /api/sessions - Create a new session
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorName } = body;

    if (!creatorName || typeof creatorName !== "string") {
      return NextResponse.json({ error: "Creator name is required" }, { status: 400 });
    }

    // Generate unique code
    let code = generateSessionCode();
    let attempts = 0;
    while ((await getSession(code)) && attempts < 10) {
      code = generateSessionCode();
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json(
        { error: "Failed to generate unique session code" },
        { status: 500 }
      );
    }

    const now = new Date();
    const participantId = uuid();

    const creator: Participant = {
      id: participantId,
      name: creatorName.trim(),
      status: "selecting",
      joinedAt: now.toISOString(),
    };

    const session: Session = {
      id: uuid(),
      code,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: now.toISOString(),
      creatorId: participantId,
      participants: [creator],
      receipts: [],
    };

    await setSession(session);

    return NextResponse.json({
      session,
      participantId,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
