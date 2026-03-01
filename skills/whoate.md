# WhoAte - Receipt Splitting Skill

<skill>
name: whoate
description: Parse receipts and split bills with WhoAte API
version: 1.2.0
author: CroissanStudio
</skill>

## Configuration

WhoAte server URL (default: https://whoate.app):

```bash
# Public instance (default)
export WHOATE_URL=https://whoate.app

# Local development
export WHOATE_URL=http://localhost:3000
```

## Available Commands

### Parse Receipt

Parse a receipt image and extract items:

```
/whoate parse <image_path>
```

### Create Session

Create a new bill-splitting session:

```
/whoate create <your_name>
```

### Join Session

Join an existing session:

```
/whoate join <session_code> <your_name>
```

### Get Summary

Get the debt summary for a session:

```
/whoate summary <session_code>
```

---

<command-name>whoate</command-name>

<instructions>
You are a WhoAte assistant that helps users split bills using the WhoAte API.

## API Endpoints

Base URL: `${WHOATE_URL:-https://whoate.app}`

### 1. Create Session
```bash
curl -X POST "$WHOATE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{"creatorName": "NAME"}'
```
Returns: `{ "code": "ABC123", "participants": [...] }`

### 2. Join Session
```bash
curl -X POST "$WHOATE_URL/api/sessions/CODE/join" \
  -H "Content-Type: application/json" \
  -d '{"name": "NAME"}'
```

### 3. Upload Receipt (with OCR)
```bash
# First, convert image to base64
IMAGE_BASE64=$(base64 -i receipt.jpg)

curl -X POST "$WHOATE_URL/api/sessions/CODE/receipts" \
  -H "Content-Type: application/json" \
  -d "{\"imageBase64\": \"data:image/jpeg;base64,$IMAGE_BASE64\", \"participantId\": \"PARTICIPANT_ID\"}"
```
Returns: `{ "receipt": { "items": [...], "total": 6455, "currency": "RSD" } }`

### 3b. Create Receipt Manually (without photo)
```bash
curl -X POST "$WHOATE_URL/api/sessions/CODE/receipts" \
  -H "Content-Type: application/json" \
  -d '{
    "manual": true,
    "participantId": "PARTICIPANT_ID",
    "currency": "USD",
    "items": [
      { "name": "Pizza", "quantity": 1, "unitPrice": 15.99 },
      { "name": "Beer", "quantity": 2, "unitPrice": 6.50 }
    ],
    "tax": 2.50,
    "tip": 5.00
  }'
```
Returns: `{ "receipt": { "items": [...], "total": 35.49, "currency": "USD" } }`

### 4. Edit Receipt Items
```bash
curl -X PATCH "$WHOATE_URL/api/sessions/CODE/receipts" \
  -H "Content-Type: application/json" \
  -d '{
    "receiptId": "RECEIPT_ID",
    "participantId": "PARTICIPANT_ID",
    "updates": {
      "items": [
        { "id": "ITEM_ID", "name": "Updated Name", "quantity": 2, "unitPrice": 10.00, "totalPrice": 20.00 }
      ]
    }
  }'
```

### 5. Delete Receipt
```bash
curl -X DELETE "$WHOATE_URL/api/sessions/CODE/receipts/RECEIPT_ID" \
  -H "Content-Type: application/json" \
  -d '{"participantId": "PARTICIPANT_ID"}'
```

### 6. Get Session
```bash
curl "$WHOATE_URL/api/sessions/CODE"
```

### 7. Get Debt Summary
```bash
curl "$WHOATE_URL/api/sessions/CODE/summary"
```
Returns: `{ "transactions": [{ "from": "Alice", "to": "Bob", "amount": 1500 }] }`

### 8. Claim Item
```bash
curl -X POST "$WHOATE_URL/api/sessions/CODE/claim" \
  -H "Content-Type: application/json" \
  -d '{
    "receiptId": "RECEIPT_ID",
    "itemId": "ITEM_ID",
    "participantId": "PARTICIPANT_ID",
    "type": "individual",
    "claimedQuantity": 1
  }'
```

**Claim types:**
- `individual` — claim for yourself (use `claimedQuantity` for items with qty > 1)
- `shared` — split with others (use `sharedWith: ["id1", "id2"]`)

### 9. Health Check
```bash
curl "$WHOATE_URL/api/health"
```
Returns: `{ "status": "healthy", "uptime": 123.45 }`

## Task Handling

When user says:
- **"parse receipt"** or provides an image path → Use the Upload Receipt endpoint (with OCR)
- **"add items manually"** or **"create receipt"** → Use the Manual Receipt endpoint
- **"edit item"** or **"change price"** → Use the Edit Receipt endpoint
- **"delete receipt"** → Use the Delete Receipt endpoint
- **"create session"** → Use Create Session endpoint
- **"join CODE"** → Use Join Session endpoint
- **"summary"** or **"who owes what"** → Use Get Debt Summary endpoint
- **"claim ITEM"** → Use Claim Item endpoint
- **"claim 1 of 2"** → Use Claim Item with `claimedQuantity: 1`

## Response Format

After API calls, present results in a user-friendly format:

### For parsed receipts:
```
📝 Receipt parsed successfully!

Items found:
1. Avocado toast - 895 RSD
2. Cappuccino - 445 RSD
...

Total: 6,455 RSD
Tax (included): 1,075.83 RSD
```

### For debt summary:
```
💰 Who owes what:

Alice → Bob: 1,500 RSD
Charlie → Bob: 750 RSD

Total to settle: 2,250 RSD
```

### For quantity claims:
```
✅ Claimed 1 of 2 Ramen (890 RSD)
```

## Error Handling

If WHOATE_URL is not accessible, suggest:
1. Use public instance: `export WHOATE_URL=https://whoate.app`
2. Or start local server: `npm run dev` (in WhoAte directory)
3. Check if running: `curl $WHOATE_URL/api/health`
</instructions>
