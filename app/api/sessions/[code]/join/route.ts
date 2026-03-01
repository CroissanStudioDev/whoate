import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getSession, setSession } from "@/lib/redis";
import type { Participant } from "@/types";

interface RouteParams {
  params: Promise<{ code: string }>;
}

// POST /api/sessions/[code]/join - Join a session
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;
    const { name, existingParticipantId } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const session = await getSession(code.toUpperCase());

    if (!session) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
    }

    // Check if participant with this ID already exists (returning user)
    if (existingParticipantId) {
      const existingParticipant = session.participants.find((p) => p.id === existingParticipantId);
      if (existingParticipant) {
        // Update activity and return
        await setSession(session);
        return NextResponse.json({
          session,
          participantId: existingParticipantId,
          rejoined: true,
        });
      }
    }

    // Check if name already exists
    const existingByName = session.participants.find(
      (p) => p.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existingByName) {
      // Allow rejoining with same name
      await setSession(session);
      return NextResponse.json({
        session,
        participantId: existingByName.id,
        rejoined: true,
      });
    }

    // Create new participant
    const participantId = uuid();
    const newParticipant: Participant = {
      id: participantId,
      name: name.trim(),
      status: "selecting",
      joinedAt: new Date().toISOString(),
    };

    session.participants.push(newParticipant);
    await setSession(session);

    return NextResponse.json({
      session,
      participantId,
      rejoined: false,
    });
  } catch (error) {
    console.error("Error joining session:", error);
    return NextResponse.json({ error: "Failed to join session" }, { status: 500 });
  }
}
