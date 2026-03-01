import { NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/redis";

interface RouteParams {
  params: Promise<{ code: string; receiptId: string }>;
}

// DELETE /api/sessions/[code]/receipts/[receiptId] - Delete a receipt
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { code, receiptId } = await params;
    const { participantId } = await request.json();

    const session = await getSession(code.toUpperCase());

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const receiptIndex = session.receipts.findIndex((r) => r.id === receiptId);
    if (receiptIndex === -1) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const receipt = session.receipts[receiptIndex];

    // Only uploader can delete
    if (receipt.uploadedBy !== participantId) {
      return NextResponse.json(
        { error: "Only the uploader can delete this receipt" },
        { status: 403 }
      );
    }

    // Remove receipt
    session.receipts.splice(receiptIndex, 1);
    await setSession(session);

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error deleting receipt:", error);
    return NextResponse.json({ error: "Failed to delete receipt" }, { status: 500 });
  }
}
