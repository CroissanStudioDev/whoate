# WhoAte Skills

Claude Code / Cursor / OpenClaw skills for interacting with WhoAte.

## Installation

### Claude Code

```bash
# Install globally
claude skill install https://github.com/CroissanStudioDev/whoate/tree/main/skills/whoate.md

# Or copy to local skills directory
cp skills/whoate.md ~/.claude/skills/
```

### Cursor

Add to your `.cursor/skills/` directory:

```bash
mkdir -p ~/.cursor/skills
cp skills/whoate.md ~/.cursor/skills/
```

### OpenClaw

```bash
openclaw skill add whoate https://raw.githubusercontent.com/CroissanStudioDev/whoate/main/skills/whoate.md
```

## Usage

1. **Start WhoAte server:**
   ```bash
   cd whoate
   npm run dev
   ```

2. **Use the skill:**
   ```
   /whoate parse /path/to/receipt.jpg
   /whoate create "Alice"
   /whoate join ABC123 "Bob"
   /whoate summary ABC123
   ```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WHOATE_URL` | `http://localhost:3000` | WhoAte server URL |

## Examples

### Parse a receipt
```
User: /whoate parse ~/Downloads/restaurant-bill.jpg