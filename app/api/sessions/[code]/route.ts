import { NextResponse } from "next/server";
import { deleteSession, getSession, setSession } from "@/lib/redis";

interface RouteParams {
  params: Promise<{ code: string }>;
}

// GET /api/sessions/[code] - Get session data
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;
    const session = await getSession(code.toUpperCase());

    if (!session) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
    }

    // Touch session to extend TTL
    await setSession(session);

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error getting session:", error);
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 });
  }
}

// DELETE /api/sessions/[code] - Close session (creator only)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;
    const { participantId } = await request.json();

    const session = await getSession(code.toUpperCase());

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.creatorId !== participantId) {
      return NextResponse.json({ error: "Only the session creator can close it" }, { status: 403 });
    }

    await deleteSession(code.toUpperCase());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
