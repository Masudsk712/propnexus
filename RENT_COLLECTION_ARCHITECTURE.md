# PropertyPro — Rent Collection Architecture
## Production-Grade Rent Collection System Design

**Version:** 1.0.0  
**Date:** June 24, 2026  
**Status:** Implementation Ready

---

## 1. CURRENT PAYMENT ARCHITECTURE

### Existing Stack
- **Payment Processor:** Stripe Checkout (one-time payments)
- **Payment Flow:** Tenant → `/api/rent/checkout` → Stripe Session → Webhook → Payment Record
- **Data Models:** `Payment`, `Invoice` (12 total Prisma models)
- **Webhook:** `/api/stripe/webhook` handles `checkout.session.completed`

### Current Flow
```
Tenant requests payment
    ↓
POST /api/rent/checkout (invoiceId, tenantId, amount)
    ↓
Create Stripe Checkout Session
    ↓
Redirect to Stripe-hosted payment page
    ↓
Stripe processes payment
    ↓
Webhook: checkout.session.completed
    ↓
Create Payment record + Mark Invoice as paid
    ↓
Return success
```

### Current Limitations
1. **No tenant-facing payment UI** — API exists but no frontend component
2. **Manual invoice creation** — No auto-generation from lease terms
3. **No late fee automation** — Overdue detection exists but no enforcement
4. **Single payment processor** — Stripe only, no Razorpay for international/regional support
5. **No webhook deduplication** — Idempotency relies only on `invoice.status === "paid"` check
6. **No payment retry logic** — Failed payments not retried
7. **No receipt generation** — Only Stripe dashboard links

---

## 2. EXISTING PAYMENT MODELS

### Invoice Model (Current)
```prisma
model Invoice {
  id              String    @id @default(auto()) @map("_id") @db.ObjectId
  tenantId        String    @db.ObjectId
  propertyId      String    @db.ObjectId
  userId          String    @db.ObjectId
  amount          Float
  dueDate         DateTime
  status          String    @default("pending") // pending | paid | past_due | cancelled
  periodStart     DateTime
  periodEnd       DateTime
  description     String?
  paidAt          DateTime?
  paymentId       String?   @db.ObjectId @unique
  stripeSessionId String?
  receiptUrl      String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

**Gaps:**
- No `invoiceNumber` (human-readable, e.g., INV-2024-001)
- No `lateFee` amount
- No `lateFeeStatus` (pending/applied/waived)
- No `reminderSentAt` timestamp
- No `paymentDueNotifications` tracking
- No `retryCount` for failed payments
- No `isRecurring` flag for auto-generation
- No `razorpayOrderId` field

### Payment Model (Current)
```prisma
model Payment {
  id                  String    @id @default(auto()) @map("_id") @db.ObjectId
  tenantId            String    @db.ObjectId
  propertyId          String    @db.ObjectId
  userId              String    @db.ObjectId
  amount              Float
  type                String    @default("rent") // rent | deposit | fee | refund
  status              String    @default("pending") // pending | completed | failed | refunded
  method              String    @default("bank_transfer") // bank_transfer | credit_card | cash | check
  dueDate             DateTime?
  paidAt              DateTime?
  description         String?
  stripeSessionId     String?
  stripePaymentIntentId String?
  receiptUrl          String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

**Gaps:**
- No `razorpayOrderId` / `razorpayPaymentId` / `razorpaySignature`
- No `currency` field (assumes USD)
- No `transactionId` (external processor ID)
- No `failureReason` for failed payments
- No `refundId` for refunded payments
- No `metadata` JSON field for extensibility

---

## 3. MISSING DATABASE FIELDS

### Invoice Required Fields
| Field | Type | Purpose |
|-------|------|---------|
| `invoiceNumber` | String | Human-readable, unique invoice ID (INV-2024-0001) |
| `lateFee` | Float | Late fee amount applied (if any) |
| `lateFeeStatus` | String | pending/applied/waived |
| `reminderSentAt` | DateTime? | Last reminder notification timestamp |
| `reminderCount` | Int | Number of reminders sent (default: 0) |
| `isRecurring` | Boolean | Auto-generate next invoice (default: true) |
| `parentInvoiceId` | String? | Link to original invoice for retries |
| `razorpayOrderId` | String? | Razorpay order reference |
| `paymentGateway` | String | stripe | razorpay (default: stripe) |

### Payment Required Fields
| Field | Type | Purpose |
|-------|------|---------|
| `currency` | String | ISO 4217 code (USD, INR, etc.) |
| `razorpayOrderId` | String? | Razorpay order ID |
| `razorpayPaymentId` | String? | Razorpay payment ID |
| `razorpaySignature` | String? | HMAC-SHA256 signature for verification |
| `transactionId` | String? | Gateway transaction reference |
| `failureReason` | String? | Decline reason for failed payments |
| `refundId` | String? | External refund transaction ID |
| `refundedAt` | DateTime? | Refund timestamp |
| `metadata` | String? | JSON blob for extensibility |

### New Models Required

#### RazorpayOrder
Track Razorpay orders separately for reconciliation.
```prisma
model RazorpayOrder {
  id              String    @id @default(auto()) @map("_id") @db.ObjectId
  orderId         String    @unique // Razorpay order ID (order_xxx)
  amount          Float
  currency        String    @default("INR")
  receipt         String    // Our internal invoice reference
  status          String    @default("created") // created/attempted/paid
  invoiceId       String?   @db.ObjectId
  paymentId       String?   @db.ObjectId
  tenantId        String    @db.ObjectId
  userId          String    @db.ObjectId
  notes           String?   // Json notes
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([orderId])
  @@index([invoiceId])
  @@index([tenantId])
  @@map("razorpay_orders")
}
```

#### WebhookEvent
Idempotent webhook processing with deduplication.
```prisma
model WebhookEvent {
  id              String    @id @default(auto()) @map("_id") @db.ObjectId
  eventId         String    @unique // Stripe/Razorpay event ID
  source          String    // stripe | razorpay
  type            String    // event type (checkout.session.completed, etc.)
  payload         String    // Full JSON payload for audit
  processed       Boolean   @default(false)
  processedAt     DateTime?
  error           String?
  createdAt       DateTime  @default(now())
  
  @@index([eventId])
  @@index([source, processed])
  @@index([createdAt])
  @@map("webhook_events")
}
```

#### LateFeeConfig
Configurable late fee rules per property or global.
```prisma
model LateFeeConfig {
  id              String    @id @default(auto()) @map("_id") @db.ObjectId
  propertyId      String?   @db.ObjectId // null = global default
  userId          String    @db.ObjectId // owner/manager who configured
  type            String    @default("fixed") // fixed | percentage
  amount          Float     // Fixed fee amount OR percentage (0-100)
  gracePeriodDays Int       @default(3) // Days after due date before fee applies
  maxFee          Float?    // Cap on fee amount (for percentage type)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([propertyId])
  @@index([userId])
  @@map("late_fee_configs")
}
```

---

## 4. MISSING RELATIONSHIPS

### Current Issues
1. **Payment ↔ Invoice** — One-to-one exists but `paymentId` on Invoice is nullable
2. **Tenant → Payments** — One-to-many exists but no scoping by lease period
3. **Property → Invoices** — No composite index for active invoice queries
4. **User → RazorpayOrders** — Missing (new model)

### Required Relationships
```
User 1──* RazorpayOrder
User 1──* WebhookEvent
User 1──* LateFeeConfig

Property 1──* LateFeeConfig

Tenant 1──* RazorpayOrder

Invoice 1──1 RazorpayOrder (optional)
Payment 1──1 RazorpayOrder (optional)
```

---

## 5. RENT LIFECYCLE DESIGN

### Invoice Lifecycle States

```
┌──────────┐
│  DRAFT   │ (Manual creation, optional)
└────┬─────┘
     │ Publish
     ▼
┌──────────┐
│ PENDING  │ ← Default state, visible to tenant
└────┬─────┘
     │ Payment initiated
     ▼
┌──────────┐
│PROCESSING│ (Stripe: payment_intent.created / Razorpay: order.created)
└────┬─────┘
     │
     ├──→ SUCCESS ──→ ┌──────────┐
     │                   │   PAID   │
     │                   └──────────┘
     │
     └──→ FAILURE ──→ ┌──────────┐
                         │  FAILED  │ → Retry logic
                         └────┬─────┘
                              │ After max retries
                              ▼
                         ┌──────────┐
                         │ CANCELLED│
                         └──────────┘

Special transitions:
- PENDING → OVERDUE (after dueDate + grace period)
- OVERDUE → PAID (payment received late)
- OVERDUE → CANCELLED (admin writes off)
- PENDING → CANCELLED (tenant vacates, manual cancel)
```

### Rent Payment Flow (Production)

**Step 1: Invoice Generation**
```
Tenant lease date detected OR cron trigger
    ↓
Calculate period (monthly, bi-weekly, custom)
    ↓
Check for existing invoice for period
    ↓ [if exists, skip]
Create Invoice with status=PENDING
    ↓
Schedule reminders (T-7, T-3, T-1 days before dueDate)
    ↓
Notify tenant (email + in-app)
```

**Step 2: Tenant Payment Initiation**
```
Tenant clicks "Pay Now" on invoice
    ↓
Frontend: POST /api/rent/checkout with invoiceId
    ↓
Verify tenant owns invoice
    ↓
Check payment gateway configured per property/tenant:
  - Default: Stripe
  - If Razorpay enabled: use Razorpay
    ↓
Create gateway session (Stripe Session / Razorpay Order)
    ↓
Store session reference on Invoice
    ↓
Redirect tenant to hosted payment page
```

**Step 3: Payment Processing**
```
Tenant enters payment details on hosted page
    ↓
Gateway processes payment
    ↓
Webhook received (stripe/razorpay)
    ↓
Idempotency check: WebhookEvent already processed? → Skip
    ↓
Verify signature (Stripe: stripe-signature / Razorpay: razorpay-signature)
    ↓
Query Payment record status
    ↓
If PAID:
  - Mark Payment as completed
  - Mark Invoice as paid
  - Link Payment ↔ Invoice
  - Generate receipt (PDF or Stripe receipt URL)
  - Send confirmation email
  - Create notification
  - Log activity
    ↓
If FAILED:
  - Mark Payment as failed
  - Store failure reason
  - Trigger retry if retryCount < MAX_RETRIES
  - Notify tenant of failure
```

**Step 4: Overdue Detection (Cron)**
```
Daily cron job:
  ↓
Queries: SELECT invoices WHERE status=PENDING AND dueDate < NOW()
    ↓
Check grace period (dueDate + gracePeriodDays)
    ↓
If within grace: status=PENDING, send friendly reminder
If past grace: status=PAST_DUE, calculate late fee
    ↓
Calculate late fee:
  - Get LateFeeConfig (property-specific or global)
  - Apply fixed/percentage calculation
  - Cap at maxFee if configured
    ↓
Update Invoice:
  - status = PAST_DUE
  - lateFee = calculated amount
  - lateFeeStatus = 'applied'
  - amount = original + lateFee
    ↓
Notify tenant (email + in-app)
Notify owner/manager (daily summary)
```

**Step 5: Late Fee Payment**
```
Late fee added to invoice → Available for payment
Tenant pays invoice (includes late fee)
    ↓
Payment success handler:
  - Create Payment record (type: 'rent', amount: total with late fee)
  - Mark Invoice as paid
  - Log late fee portion separately if needed for accounting
```

---

## 6. INVOICE LIFECYCLE DESIGN

### States & Transitions

| State | Description | Auto-Transition |
|-------|-------------|-----------------|
| `draft` | Created by admin, not yet sent | Manual publish |
| `pending` | Sent to tenant, awaiting payment | → `past_due` after dueDate |
| `processing` | Payment gateway processing | → `paid`/`failed` |
| `paid` | Payment completed successfully | Terminal |
| `past_due` | Overdue, late fees may apply | → `paid` or `cancelled` |
| `failed` | Payment attempt failed | → `pending` (retry) or `cancelled` |
| `cancelled` | Manually or system-cancelled | Terminal |
| `refunded` | Payment refunded after completion | Terminal |

### Invoice Generation Rules

**Manual (Admin/Manager):**
- Create via API: `POST /api/rent/invoices`
- Can set custom amount, period, due date
- Can attach notes/description

**Auto (Cron/Trigger):**
- Trigger: Lease start date OR first day of month for active tenants
- Frequency: Monthly (default), bi-weekly, custom (from lease)
- Skip if invoice exists for period
- Use tenant.rentAmount as base
- Add late fees from previous month if any

### Invoice Numbering
- Format: `INV-{YEAR}-{SEQUENCE}` (e.g., INV-2024-0042)
- Sequence resets yearly
- Unique across all properties/tenants

---

## 7. OVERDUE LIFECYCLE DESIGN

### Grace Period Logic
```
Due Date: 2024-06-01
Grace Period: 3 days
Freeze Until: 2024-06-04 23:59:59

On 2024-06-05 00:00:00:
  - Status transitions to PAST_DUE
  - Late fee calculated and applied
  - Tenant notified
```

### Reminder Schedule

| Days Relative to Due Date | Action |
|--------------------------|--------|
| -7 | Gentle reminder (email) |
| -3 | Urgent reminder (email + SMS if available) |
| -1 | Final reminder before due |
| +0 | Due date notice |
| +1 | First overdue notice |
| +3 | Late fee applied notice |
| +7 | Second overdue notice + fee warning |
| +14 | Escalation to property owner |
| +30 | Final notice before legal action |

### Late Fee Calculation

**Fixed Fee:**
```
lateFee = config.amount
Example: $50 flat fee after 3 days overdue
```

**Percentage Fee:**
```
lateFee = min(
  (outstandingAmount * config.amount / 100),
  config.maxFee || Infinity
)
Example: 5% monthly, capped at $200
```

**Compound Rules:**
- Late fees can compound (add to outstanding for next calculation)
- Or simple (calculated on base rent only)
- Configurable per property

### Retry Logic for Failed Payments

```
Failed Payment → Increment retryCount
    ↓
retryCount < MAX_RETRIES (3)?
  - YES: Schedule retry in 24h
  - NO: Mark invoice as failed, notify owner
```

---

## 8. RAZORPAY INTEGRATION DESIGN

### Why Razorpay?
- Indian payment methods (UPI, Netbanking, Wallets)
- Lower processing fees for INR transactions
- Regional compliance (RBI guidelines)

### Integration Points

**1. Order Creation API**
- Endpoint: `POST /api/payments/razorpay/order`
- Request: `{ invoiceId, tenantId, amount, currency }`
- Response: `{ orderId, amount, currency, razorpayKeyId }`

**2. Payment Verification API**
- Endpoint: `POST /api/payments/razorpay/verify`
- Request: `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }`
- Action: Verify HMAC, update payment status

**3. Webhook Handler**
- Endpoint: `POST /api/payments/razorpay/webhook`
- Events: `payment.captured`, `payment.failed`, `order.paid`
- Logic: Same idempotency as Stripe

### Razorpay vs Stripe Abstraction

```typescript
interface PaymentGateway {
  createOrder(invoiceId: string, amount: number): Promise<OrderResponse>;
  verifyPayment(orderId: string, paymentId: string, signature: string): Promise<boolean>;
  getWebhookSecret(): string;
}

class StripeGateway implements PaymentGateway { ... }
class RazorpayGateway implements PaymentGateway { ... }

// Factory Pattern
function getPaymentGateway(propertyId: string): PaymentGateway {
  const config = await getGatewayConfig(propertyId);
  return config.gateway === 'razorpay' 
    ? new RazorpayGateway(config) 
    : new StripeGateway(config);
}
```

---

## 9. WEBHOOK ARCHITECTURE

### Design Principles
1. **Idempotency** — Each event processed once via `eventId` unique constraint
2. **Security** — Signature verification before processing
3. **Auditability** — Full payload stored in `WebhookEvent` model
4. **Resilience** — Async processing, retries on failure

### Webhook Processing Flow

```
1. Receive webhook POST
2. Verify signature (reject if invalid)
3. Extract event ID
4. Check WebhookEvent table for existing ID
   - EXISTS → Return 200 (already processed)
   - NOT EXISTS → Continue
5. Parse payload
6. Begin transaction:
   a. Create WebhookEvent (processed=false)
   b. Process business logic
   c. Update WebhookEvent (processed=true, processedAt=now)
7. Return 200
```

### Event Mapping

| Stripe Event | Action |
|--------------|--------|
| `checkout.session.completed` | Mark Payment complete, Invoice paid |
| `checkout.session.expired` | Reset Payment to failed |
| `payment_intent.succeeded` | Confirm payment |
| `payment_intent.payment_failed` | Mark Payment failed, trigger retry |

| Razorpay Event | Action |
|----------------|--------|
| `payment.captured` | Mark Payment complete, Invoice paid |
| `payment.failed` | Mark Payment failed |
| `order.paid` | Order fulfillment |

---

## 10. NOTIFICATION TRIGGERS

### Payment Lifecycle Notifications

| Trigger | Recipient | Channel | Template |
|---------|-----------|---------|----------|
| Invoice created | Tenant | Email + In-app | "New rent invoice ready" |
| Invoice reminder (-7d) | Tenant | Email | "Reminder: Invoice due in 7 days" |
| Invoice reminder (-3d) | Tenant | Email + In-app | "Urgent: Invoice due in 3 days" |
| Payment success | Tenant + Owner | Email | "Payment confirmed - Receipt attached" |
| Payment failed | Tenant | Email + In-app | "Payment failed - Please retry" |
| Invoice overdue (+1d) | Tenant + Owner | Email | "Payment overdue" |
| Late fee applied | Tenant | Email + In-app | "Late fee added to your invoice" |
| Refund processed | Tenant | Email | "Refund issued" |

### Notification Data Model
Reuse existing `Notification` model. Email delivery via `Resend` (already configured).

---

## 11. SECURITY CONSIDERATIONS

### Authentication & Authorization
1. **Role-based access:**
   - `tenant`: Can only view/pay own invoices
   - `manager`: Can create invoices, view reports for assigned properties
   - `admin`: Full access

2. **API Protection:**
   - All payment routes: `await auth()` check
   - Invoice ownership verification on every access
   - No direct IDOR (Insecure Direct Object Reference)

### Payment Security
1. **Webhook Signature Verification:**
   - Stripe: `stripe.webhooks.constructEvent()`
   - Razorpay: HMAC-SHA256 validation

2. **Idempotency:**
   - Webhook deduplication via `WebhookEvent.eventId` unique
   - Payment retry with `retryCount` limit

3. **Data Protection:**
   - No raw card data in database (tokenized by gateway)
   - Receipt URLs ephemeral or gateway-hosted
   - Sensitive fields (signatures) encrypted at rest

### Rate Limiting
- Payment creation: 10 requests/minute per user
- Webhook endpoints: Whitelisted (IP allowlist if possible)
- Checkout session creation: Standard rate limit

### Multi-Tenant Isolation
- All queries scoped by `propertyId` or `tenantId`
- No cross-tenant data leakage
- Database indexes enforce query patterns

---

## 12. MULTI-TENANT CONSIDERATIONS

### Current Model
PropertyPro is a **single-tenant SaaS** (one agency uses the platform, manages multiple properties/tenants). Not a true multi-tenant SaaS where each agency is isolated.

### Data Isolation Strategy
- Role-based query scoping
- Property-level access control (manager only sees their properties)
- User-tenant linking prevents cross-tenant access

### Gateway Configuration Per Property
```
Future: Allow property owner to choose payment gateway
  - Property A → Stripe (US tenants)
  - Property B → Razorpay (India tenants)
Stored in new model: PaymentGatewayConfig
```

### Currency Handling
- Current: Hardcoded `usd`
- Required: `currency` field on Invoice/Payment
- Currency conversion: External API or static rates for reporting

---

## 13. BACKWARD COMPATIBILITY

### Migration Strategy
1. **New fields nullable** — Existing records unaffected
2. **New models additive** — No changes to existing CRUD
3. **Webhook endpoint versioned** — Add `/v2` if breaking changes needed
4. **Feature flags** — Roll out Razorpay gradually per property

### Prisma Considerations
- MongoDB `db push` used (no migrations)
- Schema changes auto-applied by Prisma
- No data loss operations (only additions)

---

## 14. IMPLEMENTATION PHASES

### Phase 1: Database Schema
- Update `Invoice` model with missing fields
- Update `Payment` model with missing fields
- Add `RazorpayOrder`, `WebhookEvent`, `LateFeeConfig` models

### Phase 2: Core APIs
- `POST /api/rent/invoices` — Create invoice
- `GET /api/rent/invoices` — List invoices (role-scoped)
- `GET /api/rent/invoices/[id]` — Detail view
- `PATCH /api/rent/invoices/[id]` — Update (admin only)
- `POST /api/rent/invoices/[id]/pay` — Unified payment initiation

### Phase 3: Payment Gateways
- Abstract gateway interface
- Update Stripe integration
- Add Razorpay integration
- Unified checkout flow

### Phase 4: Webhooks & Automation
- Enhanced webhook handler with idempotency
- Overdue cron job (Vercel Cron or external)
- Late fee calculation engine
- Invoice auto-generation cron

### Phase 5: Business Rules
- State machine for invoice lifecycle
- Retry logic for failed payments
- Receipt generation (PDF or email)

### Phase 6: Reporting
- `GET /api/payments/reports/collections` — Period-based collections
- `GET /api/payments/reports/overdue` — Overdue analysis
- `GET /api/payments/reports/property` — Property-level revenue

---

## 15. MONITORING & OBSERVABILITY

### Metrics to Track
1. **Payment Success Rate** — % of invoices paid successfully
2. **Average Days to Pay** — Time from invoice to payment
3. **Overdue Rate** — % of invoices that become overdue
4. **Retry Success Rate** — % of failed payments recovered
5. **Late Fee Collection** — Revenue from late fees
6. **Gateway Performance** — Stripe vs Razorpay latency/error rates

### Alerts
- Webhook processing failures (Sentry)
- Payment success rate drop below 80%
- More than 10 overdue invoices in a day
- Webhook signature verification failures (>5 in 1h)

---

*Document prepared for: T8, T9, T10 Implementation*  
*Next: Database schema updates + API implementation*