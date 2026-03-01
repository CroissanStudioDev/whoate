import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { parseReceipt } from "@/lib/openai";
import { getSession, setSession } from "@/lib/redis";
import type { Receipt, ReceiptItem } from "@/types";

interface RouteParams {
  params: Promise<{ code: string }>;
}

// POST /api/sessions/[code]/receipts - Upload and process a receipt
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;
    const { imageBase64, participantId, paidBy } = await request.json();

    if (!imageBase64 || !participantId) {
      return NextResponse.json({ error: "Image and participant ID are required" }, { status: 400 });
    }

    const session = await getSession(code.toUpperCase());

    if (!session) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
    }

    // Verify participant exists
    const participant = session.participants.find((p) => p.id === participantId);
    if (!participant) {
      return NextResponse.json({ error: "Participant not found in session" }, { status: 403 });
    }

    // Check receipt limit
    if (session.receipts.length >= 50) {
      return NextResponse.json({ error: "Maximum 50 receipts per session" }, { status: 400 });
    }

    // Parse receipt with OpenAI
    const ocrResult = await parseReceipt(imageBase64);

    // Create receipt items
    const items: ReceiptItem[] = ocrResult.items.map((item) => ({
      id: uuid(),
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
      claims: [],
    }));

    // Check item limit
    const totalItems = session.receipts.reduce((sum, r) => sum + r.items.length, 0) + items.length;
    if (totalItems > 500) {
      return NextResponse.json({ error: "Maximum 500 items per session" }, { status: 400 });
    }

    // Calculate subtotal from items if not provided
    const calculatedSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const receipt: Receipt = {
      id: uuid(),
      uploadedBy: participantId,
      paidBy: paidBy || participantId,
      currency: ocrResult.currency,
      items,
      subtotal: ocrResult.subtotal ?? calculatedSubtotal,
      tax: ocrResult.tax ?? 0,
      tip: ocrResult.tip ?? 0,
      total: ocrResult.total ?? calculatedSubtotal + (ocrResult.tax ?? 0) + (ocrResult.tip ?? 0),
      processedAt: new Date().toISOString(),
    };

    session.receipts.push(receipt);
    await setSession(session);

    return NextResponse.json({
      receipt,
      session,
    });
  } catch (error) {
    console.error("Error processing receipt:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process receipt",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/[code]/receipts - Update receipt items
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;
    const { receiptId, updates, participantId } = await request.json();

    const session = await getSession(code.toUpperCase());

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const receiptIndex = session.receipts.findIndex((r) => r.id === receiptId);
    if (receiptIndex === -1) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const receipt = session.receipts[receiptIndex];

    // Only uploader can edit
    if (receipt.uploadedBy !== participantId) {
      return NextResponse.json(
        { error: "Only the uploader can edit this receipt" },
        { status: 403 }
      );
    }

    // Apply updates
    if (updates.currency) receipt.currency = updates.currency;
    if (updates.paidBy) receipt.paidBy = updates.paidBy;
    if (updates.tax !== undefined) receipt.tax = updates.tax;
    if (updates.tip !== undefined) receipt.tip = updates.tip;

    if (updates.items) {
      receipt.items = updates.items.map((item: ReceiptItem) => ({
        ...item,
        id: item.id || uuid(),
        claims: item.claims || [],
      }));
      // Recalculate totals
      receipt.subtotal = receipt.items.reduce((sum, item) => sum + item.totalPrice, 0);
      receipt.total = receipt.subtotal + receipt.tax + receipt.tip;
    }

    session.receipts[receiptIndex] = receipt;
    await setSession(session);

    return NextResponse.json({ receipt, session });
  } catch (error) {
    console.error("Error updating receipt:", error);
    return NextResponse.json({ error: "Failed to update receipt" }, { status: 500 });
  }
}
