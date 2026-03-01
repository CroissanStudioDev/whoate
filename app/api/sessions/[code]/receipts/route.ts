import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { parseReceipt } from "@/lib/openai";
import { getSession, setSession } from "@/lib/redis";
import type { Receipt, ReceiptItem } from "@/types";

interface RouteParams {
  params: Promise<{ code: string }>;
}

// Manual receipt item input
interface ManualItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

// POST /api/sessions/[code]/receipts - Upload and process a receipt (or create manually)
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { participantId, paidBy } = body;

    if (!participantId) {
      return NextResponse.json({ error: "Participant ID is required" }, { status: 400 });
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

    let items: ReceiptItem[];
    let currency: string;
    let tax: number;
    let tip: number;

    // Check if this is a manual entry or image upload
    if (body.manual && body.items) {
      // Manual entry
      const manualItems: ManualItem[] = body.items;
      currency = body.currency || "USD";
      tax = body.tax || 0;
      tip = body.tip || 0;

      if (!manualItems.length) {
        return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
      }

      items = manualItems.map((item) => ({
        id: uuid(),
        name: item.name.trim(),
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        totalPrice: (item.quantity || 1) * item.unitPrice,
        claims: [],
      }));
    } else if (body.imageBase64) {
      // Image upload - parse with OCR
      const ocrResult = await parseReceipt(body.imageBase64);

      items = ocrResult.items.map((item) => ({
        id: uuid(),
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        claims: [],
      }));

      currency = ocrResult.currency;
      tax = ocrResult.tax ?? 0;
      tip = ocrResult.tip ?? 0;
    } else {
      return NextResponse.json(
        { error: "Either image or manual items are required" },
        { status: 400 }
      );
    }

    // Check item limit
    const totalItems = session.receipts.reduce((sum, r) => sum + r.items.length, 0) + items.length;
    if (totalItems > 500) {
      return NextResponse.json({ error: "Maximum 500 items per session" }, { status: 400 });
    }

    // Calculate subtotal from items
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // taxIncluded: true means tax is already in item prices, don't add on top
    const taxIncluded = body.taxIncluded ?? false;

    const receipt: Receipt = {
      id: uuid(),
      uploadedBy: participantId,
      paidBy: paidBy || participantId,
      currency,
      items,
      subtotal,
      tax,
      tip,
      total: taxIncluded ? subtotal + tip : subtotal + tax + tip,
      taxIncluded,
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
    if (updates.taxIncluded !== undefined) receipt.taxIncluded = updates.taxIncluded;

    if (updates.items) {
      receipt.items = updates.items.map((item: ReceiptItem) => ({
        ...item,
        id: item.id || uuid(),
        claims: item.claims || [],
      }));
      // Recalculate totals
      receipt.subtotal = receipt.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }

    // Recalculate total based on taxIncluded
    receipt.total = receipt.taxIncluded
      ? receipt.subtotal + receipt.tip
      : receipt.subtotal + receipt.tax + receipt.tip;

    session.receipts[receiptIndex] = receipt;
    await setSession(session);

    return NextResponse.json({ receipt, session });
  } catch (error) {
    console.error("Error updating receipt:", error);
    return NextResponse.json({ error: "Failed to update receipt" }, { status: 500 });
  }
}
