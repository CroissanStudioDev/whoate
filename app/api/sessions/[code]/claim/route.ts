import { NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/redis";

interface RouteParams {
  params: Promise<{ code: string }>;
}

// POST /api/sessions/[code]/claim - Claim an item
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;
    const { receiptId, itemId, participantId, type, sharedWith, claimedQuantity } =
      await request.json();

    if (!receiptId || !itemId || !participantId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await getSession(code.toUpperCase());

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Find receipt and item
    const receipt = session.receipts.find((r) => r.id === receiptId);
    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const item = receipt.items.find((i) => i.id === itemId);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Add or update claim
    const existingClaimIndex = item.claims.findIndex((c) => c.participantId === participantId);

    const claim = {
      participantId,
      type: type as "individual" | "shared",
      sharedWith: type === "shared" ? sharedWith : undefined,
      claimedQuantity: claimedQuantity || item.quantity, // Default to full quantity
    };

    if (existingClaimIndex >= 0) {
      item.claims[existingClaimIndex] = claim;
    } else {
      item.claims.push(claim);
    }

    await setSession(session);

    return NextResponse.json({ session, item });
  } catch (error) {
    console.error("Error claiming item:", error);
    return NextResponse.json({ error: "Failed to claim item" }, { status: 500 });
  }
}

// DELETE /api/sessions/[code]/claim - Unclaim an item
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;
    const { receiptId, itemId, participantId } = await request.json();

    const session = await getSession(code.toUpperCase());

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const receipt = session.receipts.find((r) => r.id === receiptId);
    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const item = receipt.items.find((i) => i.id === itemId);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    item.claims = item.claims.filter((c) => c.participantId !== participantId);

    await setSession(session);

    return NextResponse.json({ session, item });
  } catch (error) {
    console.error("Error unclaiming item:", error);
    return NextResponse.json({ error: "Failed to unclaim item" }, { status: 500 });
  }
}
