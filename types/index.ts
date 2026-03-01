// Session
export interface Session {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
  creatorId: string;
  participants: Participant[];
  receipts: Receipt[];
}

// Participant
export interface Participant {
  id: string;
  name: string;
  status: "selecting" | "ready";
  joinedAt: string;
}

// Receipt
export interface Receipt {
  id: string;
  uploadedBy: string;
  paidBy: string;
  currency: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  processedAt: string;
}

// Receipt Item
export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  claims: Claim[];
}

// Claim
export interface Claim {
  participantId: string;
  type: "individual" | "shared";
  sharedWith?: string[];
}

// Debt calculation result
export interface DebtSummary {
  currency: string;
  debts: Debt[];
  optimized: boolean;
}

export interface Debt {
  from: string;
  to: string;
  amount: number;
}

// API Response types
export interface CreateSessionResponse {
  session: Session;
  participantId: string;
}

export interface JoinSessionResponse {
  session: Session;
  participantId: string;
}

// OCR Response from OpenAI
export interface OCRResult {
  currency: string;
  items: {
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  total: number | null;
}

// Currency symbols mapping
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  RUB: "₽",
  JPY: "¥",
  CNY: "¥",
  KRW: "₩",
  THB: "฿",
  INR: "₹",
  BRL: "R$",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  MXN: "MX$",
  TRY: "₺",
  PLN: "zł",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  CZK: "Kč",
};

export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
}
