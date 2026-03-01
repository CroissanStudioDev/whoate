# WhoAte - Claude Code Instructions

## Project Overview

WhoAte is an open-source web application for splitting bills with friends. Users create sessions, upload receipts (OCR via OpenAI), and use a Tinder-style interface to claim items. The system calculates optimized debt settlements.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **AI**: OpenAI GPT-4o Vision for OCR
- **Storage**: Redis (production) / In-memory (development)
- **Animations**: Framer Motion

## Project Structure

```
app/                    # Next.js App Router pages and API routes
├── api/sessions/       # REST API endpoints
└── session/[code]/     # Session pages (upload, select, summary)

components/
├── ui/                 # shadcn/ui components
└── session/            # App-specific components

lib/
├── openai.ts           # OCR logic with GPT-4o Vision
├── debt-calculator.ts  # Debt settlement algorithm
├── store.ts            # Zustand stores
└── redis.ts            # Redis client with in-memory fallback

types/index.ts          # TypeScript interfaces
```

## Code Style

This project uses **Ultracite** for linting and formatting:

- ESLint with React, Next.js, TypeScript plugins
- Prettier for code formatting
- Run `npm run lint` to check
- Run `npx ultracite fix` to auto-fix issues

### Key Conventions

1. **Use TypeScript strict mode** - All types must be explicit
2. **Prefer functional components** - Use React hooks
3. **Use `'use client'`** directive for client components
4. **API routes** - Use Next.js App Router conventions
5. **Imports** - Use `@/` alias for absolute imports
6. **Components** - Use shadcn/ui components from `@/components/ui`

## Common Commands

```bash
# Development
npm run dev          # Start dev server on port 3000

# Build
npm run build        # Production build
npm start            # Start production server

# Linting
npm run lint         # Run ESLint
npx ultracite fix    # Auto-fix lint issues
npx prettier --write . # Format all files

# Docker
docker-compose up -d # Start with Redis
```

## Environment Variables

Required:

- `OPENAI_API_KEY` - For receipt OCR

Optional:

- `REDIS_URL` - Redis connection (uses in-memory if not set)
- `SESSION_TTL` - Session expiry in seconds (default: 30 days)

## Key Files to Know

| File                                | Purpose                        |
| ----------------------------------- | ------------------------------ |
| `lib/openai.ts`                     | Receipt OCR with GPT-4o Vision |
| `lib/debt-calculator.ts`            | Debt optimization algorithm    |
| `lib/store.ts`                      | Zustand state management       |
| `lib/redis.ts`                      | Session storage                |
| `types/index.ts`                    | All TypeScript interfaces      |
| `components/session/SwipeCard.tsx`  | Tinder-style card component    |
| `components/session/DebtMatrix.tsx` | Debt summary display           |

## API Endpoints

| Method | Endpoint                        | Description      |
| ------ | ------------------------------- | ---------------- |
| POST   | `/api/sessions`                 | Create session   |
| GET    | `/api/sessions/[code]`          | Get session      |
| POST   | `/api/sessions/[code]/join`     | Join session     |
| POST   | `/api/sessions/[code]/receipts` | Upload receipt   |
| POST   | `/api/sessions/[code]/claim`    | Claim item       |
| GET    | `/api/sessions/[code]/summary`  | Get debt summary |

## Testing Receipt OCR

The OCR expects a base64 image and returns structured JSON:

```typescript
interface OCRResult {
  currency: string; // ISO 4217 (USD, EUR, RUB)
  items: {
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}
```

## Debt Calculation

The algorithm:

1. Calculates each participant's share per receipt
2. Distributes tax/tip proportionally
3. Optimizes transactions (A→B, B→C becomes A→C)

## Notes

- Sessions expire after 30 days (configurable)
- No user authentication - uses localStorage for identity
- Images are NOT stored - only sent to OpenAI and discarded
- Supports 20+ currencies with auto-detection
