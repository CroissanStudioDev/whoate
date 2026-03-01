# WhoAte API Documentation

Base URL: `https://whoate.app` (or your self-hosted instance)

All endpoints accept and return JSON. No authentication required.

---

## Sessions

### Create Session

Creates a new bill-splitting session.

```http
POST /api/sessions
```

**Request Body:**

```json
{
  "creatorName": "Alice"
}
```

**Response:** `201 Created`

```json
{
  "code": "ABC123",
  "createdAt": "2026-03-01T12:00:00.000Z",
  "participants": [
    {
      "id": "p_abc123",
      "name": "Alice",
      "isCreator": true,
      "joinedAt": "2026-03-01T12:00:00.000Z"
    }
  ],
  "receipts": [],
  "status": "active"
}
```

**Example:**

```bash
curl -X POST https://whoate.app/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"creatorName": "Alice"}'
```

---

### Get Session

Retrieves session data including participants, receipts, and claims.

```http
GET /api/sessions/:code
```

**Response:** `200 OK`

```json
{
  "code": "ABC123",
  "createdAt": "2026-03-01T12:00:00.000Z",
  "participants": [
    {
      "id": "p_abc123",
      "name": "Alice",
      "isCreator": true,
      "joinedAt": "2026-03-01T12:00:00.000Z"
    },
    {
      "id": "p_def456",
      "name": "Bob",
      "isCreator": false,
      "joinedAt": "2026-03-01T12:05:00.000Z"
    }
  ],
  "receipts": [
    {
      "id": "r_xyz789",
      "uploadedBy": "p_abc123",
      "uploadedAt": "2026-03-01T12:10:00.000Z",
      "currency": "RSD",
      "items": [
        {
          "id": "i_001",
          "name": "Avocado toast",
          "quantity": 2,
          "unit_price": 895,
          "total_price": 1790,
          "claims": [
            { "participantId": "p_abc123", "share": 0.5 },
            { "participantId": "p_def456", "share": 0.5 }
          ]
        }
      ],
      "subtotal": 5379.17,
      "tax": 1075.83,
      "tip": 0,
      "total": 6455
    }
  ],
  "status": "active"
}
```

**Errors:**

| Status | Description |
|--------|-------------|
| `404` | Session not found |

---

### Delete Session

Closes a session. Only the creator can delete.

```http
DELETE /api/sessions/:code
```

**Request Body:**

```json
{
  "participantId": "p_abc123"
}
```

**Response:** `200 OK`

```json
{
  "success": true
}
```

---

### Join Session

Adds a new participant to the session.

```http
POST /api/sessions/:code/join
```

**Request Body:**

```json
{
  "name": "Bob"
}
```

**Response:** `200 OK`

```json
{
  "participant": {
    "id": "p_def456",
    "name": "Bob",
    "isCreator": false,
    "joinedAt": "2026-03-01T12:05:00.000Z"
  }
}
```

**Errors:**

| Status | Description |
|--------|-------------|
| `404` | Session not found |
| `400` | Name already taken in this session |

---

## Receipts

### Upload Receipt

Uploads a receipt image for OCR processing. The AI extracts all items automatically.

```http
POST /api/sessions/:code/receipts
```

**Request Body:**

```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "participantId": "p_abc123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `imageBase64` | string | Yes | Base64-encoded image (JPEG, PNG, WebP) |
| `participantId` | string | Yes | ID of the participant uploading |

**Response:** `201 Created`

```json
{
  "receipt": {
    "id": "r_xyz789",
    "uploadedBy": "p_abc123",
    "uploadedAt": "2026-03-01T12:10:00.000Z",
    "currency": "RSD",
    "items": [
      {
        "id": "i_001",
        "name": "Avocado toast",
        "quantity": 2,
        "unit_price": 895,
        "total_price": 1790,
        "claims": []
      },
      {
        "id": "i_002",
        "name": "Cappuccino",
        "quantity": 1,
        "unit_price": 445,
        "total_price": 445,
        "claims": []
      }
    ],
    "subtotal": 5379.17,
    "tax": 1075.83,
    "tip": 0,
    "total": 6455
  }
}
```

**Errors:**

| Status | Description |
|--------|-------------|
| `400` | Invalid image or missing fields |
| `404` | Session not found |
| `500` | OCR processing failed |

**Example:**

```bash
# Convert image to base64 and upload
IMAGE=$(base64 -i receipt.jpg)

curl -X POST https://whoate.app/api/sessions/ABC123/receipts \
  -H "Content-Type: application/json" \
  -d "{\"imageBase64\": \"data:image/jpeg;base64,$IMAGE\", \"participantId\": \"p_abc123\"}"
```

---

### Edit Receipt

Manually edit receipt items (add, update, or delete).

```http
PATCH /api/sessions/:code/receipts
```

**Request Body:**

```json
{
  "receiptId": "r_xyz789",
  "items": [
    {
      "id": "i_001",
      "name": "Avocado toast (updated)",
      "quantity": 2,
      "unit_price": 900,
      "total_price": 1800
    }
  ],
  "tax": 1100,
  "tip": 500,
  "total": 7000
}
```

**Response:** `200 OK`

```json
{
  "receipt": {
    "id": "r_xyz789",
    "items": [...],
    "total": 7000
  }
}
```

---

## Claims

### Claim Item

Claim an item (or a share of it) for a participant.

```http
POST /api/sessions/:code/claim
```

**Request Body:**

```json
{
  "itemId": "i_001",
  "participantId": "p_abc123",
  "share": 1.0
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `itemId` | string | Yes | ID of the item to claim |
| `participantId` | string | Yes | ID of the participant claiming |
| `share` | number | No | Share of the item (0.0-1.0, default: 1.0) |

**Share Examples:**
- `1.0` — Full item (default)
- `0.5` — Half (split between 2 people)
- `0.33` — Third (split between 3 people)

**Response:** `200 OK`

```json
{
  "item": {
    "id": "i_001",
    "name": "Avocado toast",
    "total_price": 1790,
    "claims": [
      { "participantId": "p_abc123", "share": 0.5 },
      { "participantId": "p_def456", "share": 0.5 }
    ]
  }
}
```

**Errors:**

| Status | Description |
|--------|-------------|
| `400` | Total shares exceed 1.0 |
| `404` | Item or session not found |

---

### Unclaim Item

Remove a claim from an item.

```http
DELETE /api/sessions/:code/claim
```

**Request Body:**

```json
{
  "itemId": "i_001",
  "participantId": "p_abc123"
}
```

**Response:** `200 OK`

```json
{
  "success": true
}
```

---

## Summary

### Get Debt Summary

Calculates optimized debt settlements.

```http
GET /api/sessions/:code/summary
```

**Response:** `200 OK`

```json
{
  "currency": "RSD",
  "participants": [
    {
      "id": "p_abc123",
      "name": "Alice",
      "spent": 3500,
      "share": 3227.5,
      "balance": 272.5
    },
    {
      "id": "p_def456",
      "name": "Bob",
      "spent": 0,
      "share": 3227.5,
      "balance": -3227.5
    }
  ],
  "transactions": [
    {
      "from": {
        "id": "p_def456",
        "name": "Bob"
      },
      "to": {
        "id": "p_abc123",
        "name": "Alice"
      },
      "amount": 2955
    }
  ],
  "totals": {
    "subtotal": 5379.17,
    "tax": 1075.83,
    "tip": 0,
    "total": 6455
  }
}
```

**Fields Explained:**

| Field | Description |
|-------|-------------|
| `spent` | How much the participant paid (uploaded receipts) |
| `share` | How much the participant owes (claimed items + proportional tax/tip) |
| `balance` | `spent - share` (positive = owed money, negative = owes money) |
| `transactions` | Optimized list of payments to settle all debts |

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Status Codes

| Status | Description |
|--------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad request (invalid input) |
| `404` | Not found |
| `500` | Server error |

---

## Rate Limits

The public instance at `whoate.app` has the following limits:

| Endpoint | Limit |
|----------|-------|
| Receipt upload (OCR) | 10/minute per IP |
| Other endpoints | 100/minute per IP |

Self-hosted instances have no limits.

---

## SDKs & Integrations

### Claude Code / Cursor Skill

```bash
claude skill install github:CroissanStudioDev/whoate/skills/whoate.md
```

Then use `/whoate` commands in your AI assistant.

### cURL Examples

See individual endpoint documentation above.

### JavaScript/TypeScript

```typescript
const WHOATE_URL = 'https://whoate.app';

// Create session
const session = await fetch(`${WHOATE_URL}/api/sessions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ creatorName: 'Alice' })
}).then(r => r.json());

console.log(`Session code: ${session.code}`);

// Upload receipt
const imageBase64 = await fileToBase64(receiptFile);
const receipt = await fetch(`${WHOATE_URL}/api/sessions/${session.code}/receipts`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageBase64: `data:image/jpeg;base64,${imageBase64}`,
    participantId: session.participants[0].id
  })
}).then(r => r.json());

console.log(`Found ${receipt.receipt.items.length} items`);
```

---

## Webhooks (Coming Soon)

Future versions will support webhooks for:
- New participant joined
- Receipt uploaded
- All items claimed
- Session closed

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Mar 2026 | Initial API release |
