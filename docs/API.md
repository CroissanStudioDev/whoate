# WhoAte API Documentation

Base URL: `https://whoate.app` (or your self-hosted instance)

All endpoints accept and return JSON. No authentication required.

---

## Health Check

### Get Health Status

Check if the API is running.

```http
GET /api/health
```

**Response:** `200 OK`

```json
{
  "status": "healthy",
  "timestamp": "2026-03-01T12:00:00.000Z",
  "uptime": 3600.5,
  "version": "1.2.0"
}
```

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
          "unitPrice": 895,
          "totalPrice": 1790,
          "claims": [
            { "participantId": "p_abc123", "type": "individual", "claimedQuantity": 1 },
            { "participantId": "p_def456", "type": "individual", "claimedQuantity": 1 }
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

### Update Session Settings

Update session settings like translation language.

```http
PATCH /api/sessions/:code
```

**Request Body:**

```json
{
  "participantId": "p_abc123",
  "translateTo": "en"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `participantId` | string | Yes | ID of any participant in the session |
| `translateTo` | string | No | ISO language code for translation (empty string to disable) |

**Supported Languages:**

| Code | Language |
|------|----------|
| `en` | English |
| `ru` | Русский |
| `es` | Español |
| `fr` | Français |
| `de` | Deutsch |
| `it` | Italiano |
| `pt` | Português |
| `zh` | 中文 |
| `ja` | 日本語 |
| `ko` | 한국어 |
| `th` | ไทย |
| `vi` | Tiếng Việt |
| `ar` | العربية |
| `hi` | हिन्दी |
| `tr` | Türkçe |
| `pl` | Polski |
| `uk` | Українська |
| `nl` | Nederlands |

**Response:** `200 OK`

```json
{
  "session": {
    "code": "ABC123",
    "translateTo": "en",
    ...
  }
}
```

**Example:**

```bash
# Enable English translation
curl -X PATCH https://whoate.app/api/sessions/ABC123 \
  -H "Content-Type: application/json" \
  -d '{"participantId": "p_abc123", "translateTo": "en"}'

# Disable translation
curl -X PATCH https://whoate.app/api/sessions/ABC123 \
  -H "Content-Type: application/json" \
  -d '{"participantId": "p_abc123", "translateTo": ""}'
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

### Upload Receipt (OCR)

Uploads a receipt image for OCR processing. The AI extracts all items automatically.

```http
POST /api/sessions/:code/receipts
```

**Request Body:**

```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "participantId": "p_abc123",
  "paidBy": "p_abc123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `imageBase64` | string | Yes | Base64-encoded image (JPEG, PNG, WebP) |
| `participantId` | string | Yes | ID of the participant uploading |
| `paidBy` | string | No | ID of participant who paid (defaults to uploader) |

**Response:** `201 Created`

```json
{
  "receipt": {
    "id": "r_xyz789",
    "uploadedBy": "p_abc123",
    "paidBy": "p_abc123",
    "processedAt": "2026-03-01T12:10:00.000Z",
    "currency": "RSD",
    "items": [
      {
        "id": "i_001",
        "name": "Avocado toast",
        "quantity": 2,
        "unitPrice": 895,
        "totalPrice": 1790,
        "claims": []
      },
      {
        "id": "i_002",
        "name": "Cappuccino",
        "quantity": 1,
        "unitPrice": 445,
        "totalPrice": 445,
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

### Create Receipt Manually

Creates a receipt by manually entering items (no photo required).

```http
POST /api/sessions/:code/receipts
```

**Request Body:**

```json
{
  "manual": true,
  "participantId": "p_abc123",
  "paidBy": "p_abc123",
  "currency": "USD",
  "items": [
    { "name": "Pizza Margherita", "quantity": 1, "unitPrice": 15.99 },
    { "name": "Beer", "quantity": 2, "unitPrice": 6.50 },
    { "name": "Tiramisu", "quantity": 1, "unitPrice": 8.00 }
  ],
  "tax": 3.50,
  "tip": 5.00
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `manual` | boolean | Yes | Must be `true` for manual entry |
| `participantId` | string | Yes | ID of the participant creating |
| `paidBy` | string | No | ID of participant who paid (defaults to creator) |
| `currency` | string | No | ISO 4217 currency code (default: "USD") |
| `items` | array | Yes | Array of items (at least one required) |
| `items[].name` | string | Yes | Item name |
| `items[].quantity` | number | No | Quantity (default: 1) |
| `items[].unitPrice` | number | Yes | Price per unit |
| `tax` | number | No | Tax amount (default: 0) |
| `tip` | number | No | Tip amount (default: 0) |

**Response:** `201 Created`

```json
{
  "receipt": {
    "id": "r_manual123",
    "uploadedBy": "p_abc123",
    "paidBy": "p_abc123",
    "processedAt": "2026-03-01T12:15:00.000Z",
    "currency": "USD",
    "items": [
      {
        "id": "i_001",
        "name": "Pizza Margherita",
        "quantity": 1,
        "unitPrice": 15.99,
        "totalPrice": 15.99,
        "claims": []
      },
      {
        "id": "i_002",
        "name": "Beer",
        "quantity": 2,
        "unitPrice": 6.50,
        "totalPrice": 13.00,
        "claims": []
      },
      {
        "id": "i_003",
        "name": "Tiramisu",
        "quantity": 1,
        "unitPrice": 8.00,
        "totalPrice": 8.00,
        "claims": []
      }
    ],
    "subtotal": 36.99,
    "tax": 3.50,
    "tip": 5.00,
    "total": 45.49
  }
}
```

**Errors:**

| Status | Description |
|--------|-------------|
| `400` | Missing required fields or empty items |
| `404` | Session not found |

**Example:**

```bash
curl -X POST https://whoate.app/api/sessions/ABC123/receipts \
  -H "Content-Type: application/json" \
  -d '{
    "manual": true,
    "participantId": "p_abc123",
    "currency": "EUR",
    "items": [
      { "name": "Pasta", "quantity": 2, "unitPrice": 12.50 },
      { "name": "Wine", "quantity": 1, "unitPrice": 24.00 }
    ],
    "tax": 0,
    "tip": 10.00
  }'
```

---

### Edit Receipt

Update receipt items (name, quantity, price). Only the uploader can edit.

```http
PATCH /api/sessions/:code/receipts
```

**Request Body:**

```json
{
  "receiptId": "r_xyz789",
  "participantId": "p_abc123",
  "updates": {
    "items": [
      {
        "id": "i_001",
        "name": "Avocado toast (updated)",
        "quantity": 2,
        "unitPrice": 900,
        "totalPrice": 1800,
        "claims": []
      }
    ],
    "tax": 1100,
    "tip": 500
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `receiptId` | string | Yes | ID of the receipt to edit |
| `participantId` | string | Yes | ID of the participant (must be uploader) |
| `updates.items` | array | No | Updated items array |
| `updates.tax` | number | No | Updated tax amount |
| `updates.tip` | number | No | Updated tip amount |
| `updates.currency` | string | No | Updated currency code |
| `updates.paidBy` | string | No | Updated payer ID |

**Response:** `200 OK`

```json
{
  "receipt": {
    "id": "r_xyz789",
    "items": [...],
    "subtotal": 1800,
    "tax": 1100,
    "tip": 500,
    "total": 3400
  },
  "session": {...}
}
```

**Errors:**

| Status | Description |
|--------|-------------|
| `403` | Only the uploader can edit this receipt |
| `404` | Receipt or session not found |

**Example:**

```bash
curl -X PATCH https://whoate.app/api/sessions/ABC123/receipts \
  -H "Content-Type: application/json" \
  -d '{
    "receiptId": "r_xyz789",
    "participantId": "p_abc123",
    "updates": {
      "items": [
        { "id": "i_001", "name": "Ramen", "quantity": 2, "unitPrice": 890, "totalPrice": 1780, "claims": [] }
      ]
    }
  }'
```

---

### Delete Receipt

Delete a receipt. Only the uploader can delete.

```http
DELETE /api/sessions/:code/receipts/:receiptId
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
  "session": {...}
}
```

**Errors:**

| Status | Description |
|--------|-------------|
| `403` | Only the uploader can delete this receipt |
| `404` | Receipt or session not found |

**Example:**

```bash
curl -X DELETE https://whoate.app/api/sessions/ABC123/receipts/r_xyz789 \
  -H "Content-Type: application/json" \
  -d '{"participantId": "p_abc123"}'
```

---

## Claims

### Claim Item

Claim an item (or part of it) for a participant.

```http
POST /api/sessions/:code/claim
```

**Request Body:**

```json
{
  "receiptId": "r_xyz789",
  "itemId": "i_001",
  "participantId": "p_abc123",
  "type": "individual",
  "claimedQuantity": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `receiptId` | string | Yes | ID of the receipt |
| `itemId` | string | Yes | ID of the item to claim |
| `participantId` | string | Yes | ID of the participant claiming |
| `type` | string | Yes | `"individual"` or `"shared"` |
| `claimedQuantity` | number | No | How many to claim (for items with qty > 1) |
| `sharedWith` | array | No | Participant IDs to split with (when type = "shared") |

**Claim Types:**

| Type | Description | Example |
|------|-------------|---------|
| `individual` | Claim for yourself | "I ate this ramen" |
| `shared` | Split with others | "We shared this pizza" |

**Quantity Examples:**

For an item "Ramen × 2":
- `claimedQuantity: 1` — Claim 1 of 2 (50% of price)
- `claimedQuantity: 2` — Claim all 2 (100% of price)

**Response:** `200 OK`

```json
{
  "item": {
    "id": "i_001",
    "name": "Ramen",
    "quantity": 2,
    "totalPrice": 1780,
    "claims": [
      { "participantId": "p_abc123", "type": "individual", "claimedQuantity": 1 },
      { "participantId": "p_def456", "type": "individual", "claimedQuantity": 1 }
    ]
  },
  "session": {...}
}
```

**Errors:**

| Status | Description |
|--------|-------------|
| `400` | Missing required fields |
| `404` | Item or session not found |

**Example:**

```bash
# Claim 1 of 2 ramens
curl -X POST https://whoate.app/api/sessions/ABC123/claim \
  -H "Content-Type: application/json" \
  -d '{
    "receiptId": "r_xyz789",
    "itemId": "i_001",
    "participantId": "p_abc123",
    "type": "individual",
    "claimedQuantity": 1
  }'

# Share a pizza with 3 people
curl -X POST https://whoate.app/api/sessions/ABC123/claim \
  -H "Content-Type: application/json" \
  -d '{
    "receiptId": "r_xyz789",
    "itemId": "i_002",
    "participantId": "p_abc123",
    "type": "shared",
    "sharedWith": ["p_abc123", "p_def456", "p_ghi789"]
  }'
```

---

### Unclaim Item

Remove a claim from an item.

```http
DELETE /api/sessions/:code/claim
```

**Request Body:**

```json
{
  "receiptId": "r_xyz789",
  "itemId": "i_001",
  "participantId": "p_abc123"
}
```

**Response:** `200 OK`

```json
{
  "session": {...},
  "item": {...}
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
| `403` | Forbidden (not authorized) |
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

// Claim 1 of 2 items
await fetch(`${WHOATE_URL}/api/sessions/${session.code}/claim`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    receiptId: receipt.receipt.id,
    itemId: receipt.receipt.items[0].id,
    participantId: session.participants[0].id,
    type: 'individual',
    claimedQuantity: 1
  })
});
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
| 1.5.0 | Mar 2026 | Add receipt item translation (18 languages), useful for international travel |
| 1.4.0 | Mar 2026 | Add OCR result editing, tax included toggle |
| 1.3.0 | Mar 2026 | Add skip/not mine actions, action buttons below swipe card |
| 1.2.0 | Mar 2026 | Add quantity selection for claims, receipt editing, receipt deletion, health endpoint |
| 1.1.0 | Mar 2026 | Add manual receipt entry (without photo) |
| 1.0.0 | Mar 2026 | Initial API release |
