import { NextResponse } from "next/server";
import { calculateDebts, formatDebtsAsText } from "@/lib/debt-calculator";
import { getSession } from "@/lib/redis";

interface RouteParams {
  params: Promise<{ code: string }>;
}

// GET /api/sessions/[code]/summary - Get debt summary
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;
    const session = await getSession(code.toUpperCase());

    if (!session) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
    }

    const summaries = calculateDebts(session);
    const textSummary = formatDebtsAsText(summaries, session.participants);

    return NextResponse.json({
      summaries,
      textSummary,
      participants: session.participants,
    });
  } catch (error) {
    console.error("Error calculating summary:", error);
    return NextResponse.json({ error: "Failed to calculate summary" }, { status: 500 });
  }
}
