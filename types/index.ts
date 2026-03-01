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
  translateTo?: string; // ISO language code (e.g., "en", "ru", "es") for translating receipt items
}

// Supported translation languages
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: "English",
  ru: "Русский",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  ar: "العربية",
  hi: "हिन्दी",
  th: "ไทย",
  vi: "Tiếng Việt",
  tr: "Türkçe",
  pl: "Polski",
  uk: "Українська",
  nl: "Nederlands",
};

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
  name?: string; // Receipt name/title (e.g., "Dinner at Mario's")
  establishment?: string; // Detected establishment name from OCR
  note?: string; // User note shown during item selection
  uploadedBy: string;
  paidBy: string;
  currency: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  taxIncluded: boolean; // true = tax already in item prices, false = add tax on top
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
  claimedQuantity?: number; // How many of this item (e.g., 1 of 2 ramens)
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
  establishment?: string; // Detected restaurant/venue name
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
  RSD: "RSD",
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
  UAH: "₴",
  ILS: "₪",
  SGD: "S$",
  HKD: "HK$",
  NZD: "NZ$",
  ZAR: "R",
  AED: "د.إ",
  SAR: "﷼",
  VND: "₫",
  IDR: "Rp",
  MYR: "RM",
  PHP: "₱",
};

// Supported currencies for manual selection
export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_SYMBOLS);

export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
}
