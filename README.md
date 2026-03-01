# 🍽️ WhoAte

**The smartest way to split bills with friends.**

Snap a photo of your receipt, let AI extract all items, swipe to claim what you ate, and instantly see who owes whom. No more awkward calculations or Venmo requests for $3.47.

**🌐 [whoate.app](https://whoate.app)** — Try it now, no sign-up required!

[![CI](https://github.com/CroissanStudioDev/whoate/actions/workflows/ci.yml/badge.svg)](https://github.com/CroissanStudioDev/whoate/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://github.com/CroissanStudioDev/whoate/pkgs/container/whoate)

---

## Why WhoAte?

Ever been at a restaurant with friends, staring at a receipt, trying to figure out who had what? WhoAte solves this in seconds:

1. 📸 **Snap** — Take a photo of the receipt
2. 🤖 **AI Magic** — Items are extracted automatically (works in 100+ languages!)
3. 👆 **Swipe** — Everyone claims their items Tinder-style
4. 💰 **Done** — See optimized payments: "Alice → Bob: $15.50"

No apps to install. No accounts to create. Just share a link.

---

## Features

| Feature | Description |
|---------|-------------|
| 📸 **AI Receipt Scanner** | Powered by Gemini 3.1 Flash — extracts items from any receipt photo |
| 👆 **Tinder-style Selection** | Swipe right to claim, left to skip |
| 👥 **Shared Items** | Split appetizers and bottles fairly among multiple people |
| 💰 **Smart Settlement** | Optimizes transactions (3 payments become 1) |
| 🌍 **Multi-currency** | Auto-detects 20+ currencies (USD, EUR, RSD, THB, JPY...) |
| 🔗 **No Sign-up** | Just share a 6-digit code or link |
| 📱 **PWA Ready** | Install on your phone like a native app |
| 🤖 **AI Assistant Skill** | Use with Claude Code, Cursor, OpenClaw |

---

## 🤖 AI Assistant Integration

Use WhoAte directly from your AI coding assistant — perfect for developers who live in the terminal.

### Installation

**Claude Code:**
```bash
claude skill install github:CroissanStudioDev/whoate/skills/whoate.md
```

**Cursor / OpenClaw:**
```bash
# Copy to your skills directory
curl -o ~/.cursor/skills/whoate.md https://raw.githubusercontent.com/CroissanStudioDev/whoate/main/skills/whoate.md
```

### Usage

```bash
/whoate parse ~/Downloads/receipt.jpg    # Parse receipt with OCR
/whoate create "Alice"                   # Create new session
/whoate join ABC123 "Bob"                # Join existing session
/whoate summary ABC123                   # Who owes what?
```

The skill uses [whoate.app](https://whoate.app) by default — no server setup needed!

See [skills/README.md](skills/README.md) for more details.

---

## Quick Start

### Option 1: Use the Public Instance

Just go to **[whoate.app](https://whoate.app)** — it's free!

### Option 2: Self-Host with Docker

```bash
git clone https://github.com/CroissanStudioDev/whoate.git
cd whoate
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

docker-compose up -d
```

Open [http://localhost:3000](http://localhost:3000)

### Option 3: Local Development

```bash
npm install
cp .env.example .env.local
# Edit .env.local and add your OPENAI_API_KEY

npm run dev
```

---

## API

WhoAte provides a REST API for programmatic access. Full documentation: **[docs/API.md](docs/API.md)**

### Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sessions` | Create session |
| `GET` | `/api/sessions/:code` | Get session |
| `POST` | `/api/sessions/:code/join` | Join session |
| `POST` | `/api/sessions/:code/receipts` | Upload receipt (OCR) |
| `POST` | `/api/sessions/:code/claim` | Claim item |
| `GET` | `/api/sessions/:code/summary` | Get debt summary |

### Example: Parse a Receipt

```bash
curl -X POST https://whoate.app/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"creatorName": "Alice"}'
# Returns: {"code": "ABC123", ...}

curl -X POST https://whoate.app/api/sessions/ABC123/receipts \
  -H "Content-Type: application/json" \
  -d '{"imageBase64": "data:image/jpeg;base64,...", "participantId": "..."}'
# Returns: {"receipt": {"items": [...], "total": 6455, "currency": "RSD"}}
```

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | — | API key for receipt OCR |
| `OPENAI_BASE_URL` | No | — | Custom endpoint (OpenRouter, Ollama, etc.) |
| `OPENAI_MODEL` | No | `gemini-3.1-flash` | Vision model for OCR |
| `REDIS_URL` | No | — | Redis URL (uses in-memory if not set) |
| `SESSION_TTL` | No | `2592000` | Session expiry in seconds (30 days) |

### AI Providers

WhoAte works with any OpenAI-compatible API. We recommend **OpenRouter** for the best price/quality:

```bash
# OpenRouter (recommended) — $0.0013/receipt
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-your-key
OPENAI_MODEL=google/gemini-3.1-flash-image-preview

# Ollama (local, free)
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=ollama
OPENAI_MODEL=glm-ocr
```

See [docs/OCR_MODELS_RESEARCH.md](docs/OCR_MODELS_RESEARCH.md) for detailed benchmarks.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **AI**: Gemini 3.1 Flash (via OpenRouter)
- **Storage**: Redis / In-memory
- **Animations**: Framer Motion

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/API.md](docs/API.md) | REST API reference |
| [docs/OCR_MODELS_RESEARCH.md](docs/OCR_MODELS_RESEARCH.md) | AI model benchmarks |
| [skills/README.md](skills/README.md) | AI assistant skill guide |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [SECURITY.md](SECURITY.md) | Security policy |

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

```bash
# Fork & clone
git checkout -b feature/amazing-feature
git commit -m 'feat: add amazing feature'
git push origin feature/amazing-feature
# Open PR
```

---

## License

MIT — see [LICENSE](LICENSE)

---

<p align="center">
  Built with ❤️ by <a href="https://croissanstudio.ru">CroissanStudio</a>
  <br>
  <sub>Split bills, not friendships.</sub>
</p>
