# 🍽️ WhoAte

Split bills fairly with friends. Scan receipts, claim items, see who owes what.

[![CI](https://github.com/CroissanStudioDev/whoate/actions/workflows/ci.yml/badge.svg)](https://github.com/CroissanStudioDev/whoate/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://github.com/CroissanStudioDev/whoate/pkgs/container/whoate)

## Features

- **📸 AI Receipt Scanner** - Snap a photo, AI extracts all items automatically
- **👆 Tinder-style Selection** - Swipe to claim your items
- **👥 Shared Items** - Split appetizers and shared dishes fairly
- **💰 Smart Debt Calculation** - Tax/tip distributed proportionally, transactions optimized
- **🌍 Multi-currency** - Supports 20+ currencies with auto-detection
- **🔗 No Sign-up** - Just share a link, no accounts needed
- **📱 PWA Ready** - Install on your phone like a native app

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repo
git clone https://github.com/CroissanStudioDev/whoate.git
cd whoate

# Create .env file
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run with Docker Compose
docker-compose up -d
```

Open [http://localhost:3000](http://localhost:3000)

### Local Development

```bash
# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local
# Edit .env.local and add your OPENAI_API_KEY

# Run dev server
npm run dev
```

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | Yes | - | Your OpenAI API key for receipt OCR |
| `REDIS_URL` | No | - | Redis connection URL. Uses in-memory store if not set |
| `SESSION_TTL` | No | 2592000 | Session expiry in seconds (default: 30 days) |

## How It Works

1. **Create a Session** - Enter your name and create a new session
2. **Share the Code** - Send the 6-digit code or link to friends
3. **Upload Receipt** - Take a photo of your receipt
4. **Claim Items** - Everyone swipes through items to claim theirs
5. **See Results** - View optimized debt summary showing who owes whom

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **AI**: OpenAI GPT-4o Vision
- **Storage**: Redis (production) / In-memory (development)
- **Animations**: Framer Motion

## Project Structure

```
whoate/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── session/[code]/             # Session pages
│   │   ├── page.tsx                # Session dashboard
│   │   ├── upload/page.tsx         # Receipt upload
│   │   ├── select/page.tsx         # Item selection
│   │   └── summary/page.tsx        # Debt summary
│   └── api/                        # API routes
├── components/
│   ├── ui/                         # shadcn components
│   └── session/                    # App components
├── lib/
│   ├── openai.ts                   # OCR logic
│   ├── debt-calculator.ts          # Settlement algorithm
│   ├── store.ts                    # Zustand store
│   └── redis.ts                    # Redis client
└── types/
    └── index.ts                    # TypeScript types
```

## API Endpoints

| Method | Endpoint                        | Description          |
| ------ | ------------------------------- | -------------------- |
| POST   | `/api/sessions`                 | Create a new session |
| GET    | `/api/sessions/[code]`          | Get session data     |
| DELETE | `/api/sessions/[code]`          | Close session        |
| POST   | `/api/sessions/[code]/join`     | Join a session       |
| POST   | `/api/sessions/[code]/receipts` | Upload receipt       |
| PATCH  | `/api/sessions/[code]/receipts` | Edit receipt         |
| POST   | `/api/sessions/[code]/claim`    | Claim an item        |
| DELETE | `/api/sessions/[code]/claim`    | Unclaim an item      |
| GET    | `/api/sessions/[code]/summary`  | Get debt summary     |

## Self-Hosting

### Docker Compose (with Redis)

```yaml
services:
  whoate:
    image: ghcr.io/croissanstudiodev/whoate:latest
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### Standalone (without Redis)

Sessions are stored in memory and will be lost on restart.

```bash
docker run -p 3000:3000 -e OPENAI_API_KEY=sk-xxx ghcr.io/croissanstudiodev/whoate:latest
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

If you discover a security vulnerability, please report it via [GitHub Security Advisories](https://github.com/CroissanStudioDev/whoate/security/advisories/new) or email serge@croissanstudio.ru. See [SECURITY.md](SECURITY.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [OpenAI](https://openai.com) for GPT-4o Vision API
- [shadcn/ui](https://ui.shadcn.com) for beautiful components
- [Framer Motion](https://www.framer.com/motion/) for smooth animations

---

Built with love for splitting bills without the awkwardness.
