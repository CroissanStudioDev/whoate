import OpenAI from "openai";
import type { OCRResult } from "@/types";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
  }
  return openai;
}

function getModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4o";
}

const SYSTEM_PROMPT = `You are a receipt parser. Extract all line items from the receipt image.

Return JSON in this exact format:
{
  "currency": "USD",
  "items": [
    {
      "name": "Item name",
      "quantity": 1,
      "unit_price": 10.50,
      "total_price": 10.50
    }
  ],
  "subtotal": 100.00,
  "tax": 8.00,
  "tip": 0,
  "total": 108.00
}

Rules:
- Detect currency from symbols (€, $, £, ₽, ¥, ₩, ฿, etc.) or text on the receipt
- If quantity is not specified, assume 1
- Calculate unit_price as total_price / quantity if not shown
- Include tax/service charge as metadata, NOT as line items
- Use ISO 4217 currency codes (USD, EUR, RUB, THB, JPY, GBP, etc.)
- If unsure about a value, use null
- Always return valid JSON, no markdown code blocks
- Extract ALL items visible on the receipt
- For items like "2x Pizza", set quantity to 2`;

export async function parseReceipt(imageBase64: string): Promise<OCRResult> {
  const client = getOpenAI();
  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: imageBase64.startsWith("data:")
                ? imageBase64
                : `data:image/jpeg;base64,${imageBase64}`,
              detail: "high",
            },
          },
          {
            type: "text",
            text: "Parse this receipt and extract all items with their prices. Return only valid JSON.",
          },
        ],
      },
    ],
    max_tokens: 2000,
    temperature: 0,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  // Clean up response - remove markdown code blocks if present
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```json")) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith("```")) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  try {
    const result = JSON.parse(jsonStr) as OCRResult;

    // Validate and normalize
    return {
      currency: result.currency || "USD",
      items: (result.items || []).map((item) => ({
        name: item.name || "Unknown item",
        quantity: item.quantity || 1,
        unit_price: item.unit_price ?? item.total_price / (item.quantity || 1),
        total_price: item.total_price ?? item.unit_price * (item.quantity || 1),
      })),
      subtotal: result.subtotal,
      tax: result.tax ?? 0,
      tip: result.tip ?? 0,
      total: result.total,
    };
  } catch {
    throw new Error(`Failed to parse OCR response: ${content.slice(0, 200)}`);
  }
}
