# WhoAte — Product Requirements Document

## 1. Executive Summary

### Problem Statement

Разделение счетов в ресторанах и путешествиях — рутинная головная боль. Люди вручную считают, кто что заказал, пересчитывают валюты, забывают про мелкие позиции. Существующие решения либо требуют регистрации, либо не поддерживают OCR, либо слишком сложные.

### Proposed Solution

**WhoAte** — минималистичное open-source web-приложение для разделения чеков. Пользователь создаёт сессию, загружает фото чека, LLM извлекает позиции, участники в Tinder-style интерфейсе выбирают "своё", система автоматически считает долги.

### Success Criteria

| Метрика                                          | Целевое значение |
| ------------------------------------------------ | ---------------- |
| Время от загрузки чека до готовой таблицы долгов | < 2 минут        |
| Точность OCR-распознавания позиций               | >= 90%           |
| Точность определения валюты                      | >= 95%           |
| Time to first interaction (TTFI)                 | < 3 секунд       |
| Размер Docker-образа                             | < 500MB          |

---

## 2. User Experience & Functionality

### User Personas

| Persona | Описание | Контекст использования |
| --- | --- | --- |
| **Ресторанный организатор** | Человек, который платит картой и потом собирает деньги | Быстро разделить один чек на 3-8 человек |
| **Трэвел-координатор** | Организатор поездки, ведущий общий бюджет | Множество чеков в разных валютах за неделю |
| **Случайный участник** | Просто зашёл по ссылке выбрать свои позиции | Минимум действий, без регистрации |

### User Stories & Acceptance Criteria

#### Epic 1: Управление сессией

**US-1.1**: Как организатор, я хочу создать сессию, чтобы начать разделение чеков.

- AC: Кнопка "Create Session" на главной странице
- AC: Генерируется уникальный 6-символьный код сессии (например, `ABC123`)
- AC: Создатель автоматически перенаправляется в сессию
- AC: Отображается shareable ссылка и QR-код

**US-1.2**: Как участник, я хочу присоединиться к сессии по коду/ссылке.

- AC: Поле ввода кода на главной или прямой переход по URL `/session/[code]`
- AC: При первом входе запрашивается имя
- AC: Имя сохраняется в localStorage и автоматически используется в будущем

**US-1.3**: Как участник, я хочу видеть список всех участников сессии.

- AC: Real-time список участников в sidebar/header
- AC: Показывается статус: "выбирает" / "готов"

**US-1.4**: Как участник, я хочу вернуться в сессию через неделю.

- AC: Ссылка `/session/[code]` работает до 30 дней
- AC: Если имя в localStorage совпадает с участником — автовход
- AC: Если имя не совпадает — предложить выбрать из списка или создать нового участника
- AC: Показывать "Session expires in X days" в footer

**US-1.5**: Как создатель, я хочу закрыть сессию досрочно после расчёта.

- AC: Кнопка "Close session" (только для создателя)
- AC: Confirmation modal: "Все данные будут удалены"
- AC: После закрытия — redirect на главную

#### Epic 2: Загрузка и обработка чеков

**US-2.1**: Как организатор, я хочу загрузить фото чека для распознавания.

- AC: Drag-and-drop зона или кнопка выбора файла
- AC: Поддержка форматов: JPEG, PNG, HEIC, PDF (первая страница)
- AC: Превью загруженного изображения
- AC: Индикатор прогресса обработки

**US-2.2**: Как система, я должна извлечь позиции из чека с помощью LLM.

- AC: Отправка изображения в OpenAI Vision API
- AC: Извлечение: название позиции, количество, цена за единицу, итоговая цена
- AC: Автоопределение валюты по символам (€, $, £, ₽, ¥, etc.) или тексту
- AC: Извлечение итоговой суммы для валидации
- AC: Время обработки < 10 секунд

**US-2.3**: Как организатор, я хочу редактировать распознанные позиции.

- AC: Inline-редактирование названия, цены, количества
- AC: Возможность удалить ошибочную позицию
- AC: Возможность добавить пропущенную позицию вручную
- AC: Возможность изменить валюту чека
- AC: Возможность разбить позицию (например, "2x Пицца" → две отдельные)

**US-2.4**: Как организатор, я хочу указать, кто оплатил чек.

- AC: Dropdown с участниками сессии
- AC: По умолчанию — создатель сессии

#### Epic 3: Выбор позиций (Tinder-style)

**US-3.1**: Как участник, я хочу пролистывать позиции и выбирать свои.

- AC: Карточка с названием позиции, ценой, количеством
- AC: Swipe right / кнопка "Моё" — добавить себе
- AC: Swipe left / кнопка "Не моё" — пропустить
- AC: Swipe up / кнопка "Общее" — modal с выбором "Между всеми" или "Выбрать людей"
- AC: Индикатор прогресса (5/12 позиций)
- AC: Toggle в header: "Card view" / "List view" (drag-drop альтернатива)

**US-3.2**: Как участник, я хочу видеть уже выбранные позиции.

- AC: Список "Мои позиции" с суммой
- AC: Возможность отменить выбор

**US-3.3**: Как участник, я хочу пометить, что закончил выбор.

- AC: Кнопка "Готово"
- AC: После нажатия нельзя менять выбор (или можно с подтверждением)

#### Epic 4: Расчёт долгов

**US-4.1**: Как участник, я хочу видеть итоговую таблицу "кто кому должен".

- AC: Матрица долгов: строки — должники, столбцы — кредиторы
- AC: Группировка по валютам (отдельная таблица для каждой валюты)
- AC: Tax/tip распределяются пропорционально subtotal каждого участника
- AC: Debt simplification algorithm (минимум транзакций)
- AC: Показывается "Optimized" badge если транзакции были упрощены

**US-4.2**: Как участник, я хочу видеть детализацию расчёта.

- AC: Expandable секция "Как посчитано"
- AC: Список: чек → кто оплатил → кто что взял → сумма

**US-4.3**: Как участник, я хочу скопировать/поделиться результатом.

- AC: "Copy as text" — форматированный текст для WhatsApp/Telegram
- AC: "Share image" — генерация PNG-карточки с итогами
- AC: "Export CSV" — скачать детализацию

#### Epic 5: Payment Integration

**US-5.1**: Как участник, я хочу отправить ссылку на оплату должнику.

- AC: Кнопка "Request payment" рядом с каждым долгом
- AC: Выбор метода: Venmo / PayPal / Copy text
- AC: Генерация deep-link или форматированного текста

### Non-Goals (Out of Scope)

- Регистрация и аккаунты пользователей
- Recurring groups (требует auth)
- Push-reminders (требует auth)
- Multi-device sync для одного юзера
- Автоматическая конвертация валют
- Мобильные приложения (PWA достаточно)
- Мультиязычность интерфейса (MVP на английском)

---

## 3. AI System Requirements

### Tool Requirements

| Компонент | Технология | Назначение |
| --- | --- | --- |
| OCR + Extraction | OpenAI GPT-4o Vision | Распознавание текста и структурирование данных |
| SDK | `openai` npm package | Взаимодействие с API |

### Prompt Engineering

**System Prompt для извлечения данных из чека:**

```
You are a receipt parser. Extract all line items from the receipt image.

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
- Detect currency from symbols (€, $, £, ₽, ¥, ₩, ฿, etc.) or text
- If quantity is not specified, assume 1
- Include tax/service charge as separate items if present
- Use ISO 4217 currency codes (USD, EUR, RUB, THB, etc.)
- If unsure about a value, use null
```

### Evaluation Strategy

| Тест | Методика | Pass Criteria |
| --- | --- | --- |
| OCR Accuracy | 50 тестовых чеков из разных стран | >= 90% позиций распознано корректно |
| Currency Detection | 30 чеков в 15 валютах | >= 95% валют определено верно |
| Price Extraction | Сравнение с ручной разметкой | Отклонение суммы < 1% |
| Edge Cases | Мятые чеки, плохое освещение, рукописные | >= 70% usable results |

---

## 4. Technical Specifications

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Next.js App │  │  localStorage │  │  WebSocket Client   │  │
│  │  (React SSR) │  │  (user name)  │  │  (real-time sync)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ /api/session │  │ /api/receipt │  │  /api/ws (Socket.io) │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────┐         ┌──────────────────────┐
│   In-Memory Store    │         │    OpenAI API        │
│   (Sessions, Items)  │         │    (Vision OCR)      │
│                      │         │                      │
│   - Redis (prod)     │         │   - gpt-4o model     │
│   - Map (dev)        │         │   - base64 images    │
└──────────────────────┘         └──────────────────────┘
```

### Data Models

```typescript
// Session
interface Session {
  id: string; // 6-char alphanumeric
  createdAt: Date;
  expiresAt: Date; // +30 days
  lastActivityAt: Date; // for sliding expiration
  creatorId: string; // Participant ID
  participants: Participant[];
  receipts: Receipt[];
}

// Participant
interface Participant {
  id: string; // UUID
  name: string;
  status: "selecting" | "ready";
  joinedAt: Date;
}

// Receipt
interface Receipt {
  id: string; // UUID
  uploadedBy: string; // Participant ID
  paidBy: string; // Participant ID
  currency: string; // ISO 4217
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  processedAt: Date;
}

// Receipt Item
interface ReceiptItem {
  id: string; // UUID
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  claims: Claim[];
}

// Claim
interface Claim {
  oderId: string; // Item ID
  oderlaimantId: string; // Participant ID (or 'shared')
  type: "individual" | "shared";
  sharedWith?: string[]; // Participant IDs if shared
}

// Debt calculation result
interface DebtSummary {
  currency: string;
  debts: Debt[];
  optimized: boolean; // true if simplification was applied
}

interface Debt {
  from: string; // Participant ID
  to: string; // Participant ID
  amount: number;
}
```

### API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/sessions` | Создать сессию |
| GET | `/api/sessions/[code]` | Получить данные сессии |
| DELETE | `/api/sessions/[code]` | Закрыть сессию (только создатель) |
| POST | `/api/sessions/[code]/join` | Присоединиться к сессии |
| POST | `/api/sessions/[code]/receipts` | Загрузить чек |
| PATCH | `/api/sessions/[code]/receipts/[id]` | Редактировать чек |
| POST | `/api/sessions/[code]/items/[id]/claim` | Заявить позицию |
| DELETE | `/api/sessions/[code]/items/[id]/claim` | Отменить заявку |
| PATCH | `/api/sessions/[code]/participants/[id]` | Обновить статус участника |
| GET | `/api/sessions/[code]/summary` | Получить расчёт долгов |

### Tech Stack

| Layer      | Technology               | Rationale                        |
| ---------- | ------------------------ | -------------------------------- |
| Framework  | Next.js 14+ (App Router) | Fullstack, SSR, API routes       |
| Styling    | Tailwind CSS + shadcn/ui | Быстрая разработка UI            |
| State      | Zustand                  | Легковесный state management     |
| Real-time  | Socket.io                | WebSocket с fallback             |
| Storage    | Redis (production)       | Быстрый in-memory store          |
| Storage    | In-memory Map (dev)      | Zero dependencies для разработки |
| AI         | OpenAI SDK               | Официальный SDK для Vision API   |
| Animations | Framer Motion            | Swipe-анимации для карточек      |
| Deployment | Docker + docker-compose  | Self-hosted ready                |

### Integration Points

```yaml
# docker-compose.yml
services:
  whoate:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - REDIS_URL=redis://redis:6379
      - SESSION_TTL=2592000 # 30 days
    depends_on:
      - redis

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### Security & Privacy

| Concern | Mitigation |
| --- | --- |
| Image storage | Изображения НЕ сохраняются — только отправляются в OpenAI API и удаляются |
| Session data | Автоудаление через 30 дней (sliding expiration при активности) |
| API Key exposure | OPENAI_API_KEY только на сервере, никогда на клиенте |
| Rate limiting | 50 чеков на сессию, 500 позиций на сессию, 5 запросов в минуту на IP |
| Input validation | Zod schemas для всех API inputs |
| XSS | React auto-escaping + CSP headers |

### Storage Considerations

| Аспект            | Решение                                    |
| ----------------- | ------------------------------------------ |
| Redis memory      | Ограничить 1000 активных сессий на инстанс |
| Orphaned sessions | Redis TTL автоматически чистит             |
| Large sessions    | Лимит 50 чеков / 500 позиций на сессию     |

---

## 5. Risks & Roadmap

### Technical Risks

| Risk | Impact | Probability | Mitigation |
| --- | --- | --- | --- |
| OpenAI API latency > 10s | UX degradation | Medium | Показывать скелетон + retry logic |
| OCR fails на плохих фото | User frustration | High | Ручное редактирование + tips для фото |
| Redis недоступен | App crash | Low | Fallback на in-memory store |
| WebSocket disconnect | Desync между участниками | Medium | Polling fallback + reconnect logic |
| OpenAI API costs | Budget overrun | Medium | Rate limiting + кэширование |

### Phased Rollout

#### Phase 1: MVP (5 weeks)

- [ ] Session creation/joining
- [ ] Single receipt upload + OCR
- [ ] Basic card swiping UI
- [ ] Tax/tip proportional split
- [ ] Shared items ("На всех")
- [ ] Debt simplification algorithm
- [ ] Copy results as text
- [ ] Docker deployment

#### Phase 2: Polish (2 weeks)

- [ ] Real-time sync между участниками
- [ ] Drag & Drop альтернатива для выбора
- [ ] Payment links (Venmo/PayPal)
- [ ] Share as image
- [ ] PWA support (installable)
- [ ] QR code generation

#### Phase 3: Travel Mode (future)

- [ ] Multiple receipts per session
- [ ] Offline mode (manual entry)
- [ ] CSV export
- [ ] Локализация (RU, EN)

---

## 6. File Structure

```
whoate/
├── app/
│   ├── page.tsx                    # Landing + create/join session
│   ├── session/
│   │   └── [code]/
│   │       ├── page.tsx            # Main session view
│   │       ├── upload/page.tsx     # Receipt upload
│   │       ├── select/page.tsx     # Tinder-style selection
│   │       └── summary/page.tsx    # Final debt table
│   └── api/
│       ├── sessions/
│       │   ├── route.ts            # POST create
│       │   └── [code]/
│       │       ├── route.ts        # GET session, DELETE close
│       │       ├── join/route.ts
│       │       ├── receipts/route.ts
│       │       └── summary/route.ts
│       └── socket/route.ts         # WebSocket handler
├── components/
│   ├── ui/                         # shadcn components
│   ├── SwipeCard.tsx
│   ├── DebtMatrix.tsx
│   ├── ReceiptEditor.tsx
│   └── ParticipantList.tsx
├── lib/
│   ├── openai.ts                   # OCR logic
│   ├── debt-calculator.ts          # Settlement algorithm
│   ├── store.ts                    # Zustand store
│   └── redis.ts                    # Redis client
├── types/
│   └── index.ts                    # TypeScript interfaces
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```
