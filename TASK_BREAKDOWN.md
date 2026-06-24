# PropertyPro — Task Breakdown & Execution Plan

This document provides a granular breakdown of each implementation task, organized by phase and week.

---

## Phase 1: Security & Stability (Week 1)

### T1: Protect Debug Routes

**Task:** All `/api/debug/*` endpoints are currently bypassed by middleware because `vercel.json` excludes `/api` from security headers, and the middleware matcher excludes `/api`. Additionally, the `NODE_ENV` guard in route handlers is insufficient.

**Subtasks:**
1. Update `src/middleware.ts` matcher from:
   ```
   "/((?!api|_next/static|_next/image|..."
   ```
   to:
   ```
   "/((?!api/debug|_next/static|_next/image|..."
   ```
2. Add `CRON_SECRET` and `INTERNAL_API_KEY` to `.env.example` and documentation.
3. Create `src/middleware/debug-auth.ts` middleware or add direct check in debug routes.
4. Update `vercel.json` to ensure headers apply to `/api/debug/*`:
   ```json
   "headers": [
     { "source": "/api/debug/(.*)", "headers": [...] }
   ]
   ```
5. Replace `if (process.env.NODE_ENV === "production")` with `if (!isDev)` utility that checks both env and API key.

**Success Criteria:**
- Debug routes return 404 in production without INTERNAL_API_KEY header
- Security headers (CSP, HSTS) present on debug responses
- `curl -H "X-Internal-Key: invalid" https://prod/api/debug/auth` returns 403/404

---

### T2: Audit & Fix API Authorization Gaps

**Task:** Multiple API routes lack proper role checks and several endpoints are missing entirely.

**Subtasks:**
1. **Tenants - List endpoint:** Add role check to `GET /api/tenants`:
   ```typescript
   if (role !== "admin" && role !== "manager") return forbiddenResponse();
   ```
2. **Tenants - Single entity endpoints:** Create `src/app/api/tenants/[id]/route.ts`:
   - GET: fetch tenant by ID with property + user relations
   - PATCH: update tenant (admin/manager only)
   - DELETE: soft-delete tenant (admin only)
3. **Amenities - Update/Delete:** Create `src/app/api/amenities/[id]/route.ts`:
   - PATCH: update amenity
   - DELETE: remove amenity
4. **Payments - Single entity:** Create `src/app/api/payments/[id]/route.ts`:
   - GET: fetch payment with relations
   - PATCH: update payment status/method
5. **Standardize type casts:** Remove `(session.user as any).role` patterns by extending NextAuth session types properly in `src/types/next-auth.d.ts`.

**Success Criteria:**
- All tenant endpoints protected by role
- Missing CRUD endpoints return 200 on test calls (not 404)
- No `as any` patterns in route handlers

---

### T3: Enforce Feature-Level Subscription Gating

**Task:** `hasFeature()` exists in `subscription.service.ts` but is never called. FREE tier users currently have full access to admin features.

**Subtasks:**
1. **Audit all admin routes:** Identify which routes require PRO/BUSINESS features.
2. **Create gating helper:** `src/lib/feature-gate.ts`:
   ```typescript
   export async function requireFeature(feature: string, userId: string) {
     const allowed = await hasFeature(userId, feature);
     if (!allowed) throw new Error("Feature not available on current plan");
   }
   ```
3. **Add guards to API routes:** Before business logic in admin routes:
   ```typescript
   const hasPaymentFeature = await hasFeature(session.user.id, "Payment collection");
   if (!hasPaymentFeature) return forbiddenResponse();
   ```
4. **Create frontend gate component:** `src/components/feature-gate.tsx`:
   ```tsx
   <FeatureGate feature="UPayment collection">
     <PayRentButton />
   </FeatureGate>
   ```
5. **Document gated features:**
   - "Payment collection" → PRO+
   - "Unlimited tenants" → PRO+
   - "Analytics dashboard" → PRO+
   - "White-labeling" → BUSINESS

**Success Criteria:**
- FREE user receives 403 when accessing admin routes with PRO-only features
- Frontend hides disabled buttons for unavailable features
- All 14 subscription gating points documented

---

### T4: Add Request Rate Limiting Beyond Auth

**Task:** Only `/api/auth/callback/credentials` has rate limiting. All mutation endpoints are unprotected.

**Subtasks:**
1. **Generic rate limit utility:** `src/lib/rate-limit.ts`:
   ```typescript
   export async function checkRateLimit(userId: string, action: string, limit: number, windowSec: number)
   ```
2. **Wrap sensitive endpoints:**
   - POST mutations: 10 req/min per user
   - POST uploads: 5 req/min per user
   - GET aggregation: 30 req/min per user
3. **Add to endpoints:** properties, tenants, maintenance, bookings, amenities, payments
4. **Configure Upstash Redis:**
   ```typescript
   const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(10, "1 m"),
   });
   ```

**Success Criteria:**
- After 10 creation requests, user receives 429 Too Many Requests
- Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`) present

---

### T5: Implement CSRF & CORS Protection

**Task:** No CSRF tokens or CORS headers configured.

**Subtasks:**
1. **CSRF middleware:** `src/middleware/csrf.ts`:
   - Generate token on session start
   - Validate token on all POST/PATCH/DELETE
   - Store token in cookie + header
2. **Client token injector:** `src/components/csrf-token.tsx`:
   ```tsx
   useEffect(() => {
     fetch('/api/csrf-token').then(...)
   }, [])
   ```
3. **CORS config:** `next.config.ts`:
   ```typescript
   async headers() {
     return [{
       source: '/api/:path*',
       headers: [
         { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGINS },
         { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE' },
       ]
     }]
   }
   ```

**Success Criteria:**
- Request without CSRF token returns 403
- CORS preflight returns appropriate headers

---

## Phase 2: Subscription Enforcement (Week 2-3)

### T6: Complete Subscription Enforcement

**Task:** Tenant count check uses global `prisma.tenant.count()` instead of per-user count.

**Subtasks:**
1. **Fix tenant count check:** In `src/app/api/tenants/route.ts`:
   ```typescript
   const tenantCount = await prisma.tenant.count({ where: { userId: session.user.id } });
   ```
2. **Verify property check:** In `src/app/api/properties/route.ts`:
   ```typescript
   const propertyCount = await prisma.property.count({ where: { userId: session.user.id } });
   ```
3. **Add per-user Resource checks:** Extend `checkResourceLimit`:
   ```typescript
   export async function checkUserResourceLimit(userId: string, resource: string) {
     const sub = await getUserSubscription(userId);
     const limit = SUBSCRIPTION_TIERS[sub.tier].limits[resource];
     const count = await prisma[resource].count({ where: { userId } });
     return { allowed: count < limit, limit, current: count };
   }
   ```
4. **Create subscription middleware:** `src/middleware/subscription.ts` for server components.

**Success Criteria:**
- User with 0 tenants can create tenant (global count was 50)
- FREE user blocked from creating 2nd property

---

### T7: Wire OAuth Providers

**Task:** Google/GitHub OAuth not wired into NextAuth.

**Subtasks:**
1. **Add providers to `src/lib/auth.ts`:**
   ```typescript
   import Google from "next-auth/providers/google";
   import GitHub from "next-auth/providers/github";
   ```
2. **Update config:**
   ```typescript
   providers: [
     Credentials({...}),
     Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET }),
     GitHub({ clientId: process.env.AUTH_GITHUB_ID, clientSecret: process.env.AUTH_GITHUB_SECRET }),
   ]
   ```
3. **Add OAuth buttons to login page:** `src/app/(auth)/login/page.tsx`
4. **Update `.env.example`** with OAuth variables.

**Success Criteria:**
- "Sign in with Google" button visible on login page
- OAuth flow creates account and redirects to dashboard

---

## Phase 3: Tenant Rent Payments (Week 3-4)

### T8: Build Complete Tenant Payment Flow

**Task:** No tenant-facing invoice list or payment confirmation UI.

**Subtasks:**
1. **Invoice list page:** `src/app/(dashboard)/dashboard/tenant/invoices/page.tsx`
   - Query: `rentalPaymentService.getActiveInvoices(userId)`
   - Display: table with property, amount, due date, status
   - Action: Pay Now button → `/api/rent/checkout`
2. **Payment confirmation page:** `src/app/(dashboard)/dashboard/tenant/payments/confirmation/page.tsx`
   - Parse `?invoice=xxx&session=yyy` from URL
   - Verify payment status via Stripe API
   - Display receipt
3. **Payment history page:** `src/app/(dashboard)/dashboard/tenant/payments/history/page.tsx`
   - Query: `rentalPaymentService.getPaymentHistory(userId)`
   - Display: transaction table with dates, amounts, methods
4. **Receipt generation:** `src/services/email.service.ts`
   - PDF generation via `@react-pdf/renderer`
   - Email via Resend with receipt attachment
5. **Receipt template:** `src/emails/receipt.tsx`
   - React Email component with payment details

**Success Criteria:**
- Tenant can view all invoices from `/dashboard/tenant/invoices`
- Pay Now opens Stripe checkout
- After payment, confirmation shows receipt number and amount
- Receipt email received within 2 minutes

---

### T9: Design & Implement Razorpay Integration

**Task:** Stripe alone doesn't support UPI/Netbanking for Indian market.

**Subtasks:**
1. **Razorpay config:**
   ```typescript
   // src/lib/razorpay.ts
   export const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
   ```
2. **Create Razorpay order:** `POST /api/payments/razorpay/order`
   - Create Razorpay order
   - Return `orderId` to client
3. **Client-side checkout:** `src/hooks/useRazorpay.ts`
   - Load Razorpay script dynamically
   - Open Razorpay checkout modal
   - Handle success/callback
4. **Webhook handler:** `POST /api/payments/razorpay/webhook`
   - Verify signature
   - Mark invoice paid
   - Trigger notification
5. **Payment method selector:** Update `PayRentButton.tsx`:
   - Toggle: Stripe (Card) / Razorpay (UPI/Netbanking)

**Success Criteria:**
- UPI payment completes successfully
- Webhook processes payment within 10 seconds
- Fallback to Stripe if Razorpay errors

---

### T10: Automatic Invoice Generation & Overdue Handling

**Task:** Manually created invoices don't scale. Need automated billing.

**Subtasks:**
1. **Schema updates:**
   - Add `lateFeeAmount`, `gracePeriodDays`, `billingDay` to Invoice model
   ```prisma
   lateFeeAmount Float?
   gracePeriodDays Int @default(0)
   billingDay Int @default(1)
   ```
   - Run `prisma db push --accept-data-loss`
2. **Invoice generation service:** `src/services/invoice.service.ts`
   ```typescript
   async generateMonthlyInvoices() {
     const activeTenants = await prisma.tenant.findMany({ where: { status: "active" } });
     for (const tenant of activeTenants) {
       await this.createInvoiceForTenant(tenant);
     }
   }
   ```
3. **Cron endpoint:** `src/app/api/cron/invoices/route.ts`
   - Protected with `CRON_SECRET`
   - Called weekly via Vercel Cron or external scheduler
4. **Overdue detection:** Daily cron job:
   ```typescript
   const pastDue = await prisma.invoice.findMany({
     where: { dueDate: { lt: now }, status: "pending" }
   });
   for (const invoice of pastDue) {
     await applyLateFee(invoice);
     await sendOverdueNotification(invoice);
   }
   ```
5. **Late fee service:** `src/services/late-fee.service.ts`
   - Flat fee: $50 after 3-day grace
   - Percentage: 5% of rent after 7-day grace

**Success Criteria:**
- Cron runs daily without errors
- Active tenants receive invoice on 1st of month
- 3 days past due → status changes to `past_due`
- Email sent to tenant when invoice becomes overdue

---

## Phase 4: Notifications (Week 5)

### T11: Implement Email Notification System

**Task:** No automated emails sent to tenants or managers.

**Subtasks:**
1. **Resend email service:** `src/lib/email.ts`
   ```typescript
   export async function sendEmail({ to, subject, html }) {
     return resend.emails.send({ from: "PropertyPro <noreply@propertypro.com>", to, subject, html });
   }
   ```
2. **Email templates:** `src/emails/`
   - `payment-reminder.tsx` — 3 days before due
   - `payment-success.tsx` — receipt with PDF attachment
   - `payment-failed.tsx` — retry instructions
   - `maintenance-update.tsx` — status change notification
   - `lease-expiring.tsx` — 30 days before end
3. **Notification triggers:** `src/services/notification.service.ts`
   - `sendPaymentReminder(invoice)` — triggered by cron
   - `sendPaymentConfirmation(payment)` — triggered by webhook
   - `sendMaintenanceUpdate(request)` — triggered by status change
4. **In-app + email doubling:** Store notification in DB AND send email in same transaction.

**Success Criteria:**
- Tenant receives email "Rent due in 3 days" on 28th for 1st-of-month due
- Tenant receives receipt email within 2 minutes of paying
- Admin receives email when maintenance marked urgent

---

### T12: Real-Time Events (Polling Alternative)

**Task:** Socket.IO won't run on Vercel. Need Vercel-compatible real-time updates.

**Subtasks:**
1. **Decision:** Use 30-second polling for tenant dashboard updates.
2. **TanStack Query config:** `src/hooks/useRealtime.ts`
   ```typescript
   useQuery({
     queryKey: ['notifications'],
     queryFn: fetchNotifications,
     refetchInterval: 30000, // 30 seconds
   })
   ```
3. **Server-Sent Events fallback:** `src/app/api/events/route.ts` (optional)
   - For critical updates, use SSE to push to client
   - Works on Vercel Edge Runtime

**Success Criteria:**
- Tenant dashboard shows new notifications within 30 seconds
- No WebSocket errors in production logs

---

## Phase 5: Analytics & Reporting (Week 6)

### T13: Build Revenue & Occupancy Dashboards

**Task:** Admin analytics page lacks trend data.

**Subtasks:**
1. **Revenue trend repo:** `src/repositories/analytics.ts`
   ```typescript
   async getRevenueTrend(months: number = 12) {
     return prisma.payment.groupBy({
       by: ['paidAt'],
       _sum: { amount: true },
       where: { status: 'completed', paidAt: { gte: subMonths(now, months) } }
     });
   }
   ```
2. **Occupancy rate calculation:**
   ```typescript
   const occupied = await prisma.tenant.count({ where: { status: 'active' } });
   const total = await prisma.property.findMany({ select: { units: true } })
   ```
3. **Admin analytics page:** Extend `src/app/(dashboard)/dashboard/admin/analytics/page.tsx`
   - Revenue: LineChart from Recharts
   - Occupancy: DonutChart
   - Payments: BarChart by property
   - Maintenance: PieChart by cost
4. **API endpoint:** `GET /api/dashboard/analytics/trends`

**Success Criteria:**
- Revenue chart shows last 12 months
- Occupancy rate calculated and displayed
- Data refreshes on page load (cached 5 minutes)

---

### T14: Implement Data Export (CSV/PDF)

**Task:** Managers need exportable reports for accounting.

**Subtasks:**
1. **CSV utility:** `src/lib/export.ts`
   ```typescript
   export function toCSV(data: any[], columns: string[]): Blob {
     // Convert array to CSV string
   }
   ```
2. **PDF generation:** `src/lib/pdf.ts`
   - Use `@react-pdf/renderer`
   - Templates: MonthlyStatement, PaymentHistory, TenantList
3. **Export endpoints:**
   - `GET /api/export/payments.csv?start=&end=`
   - `GET /api/export/invoices.pdf?month=2025-08`
4. **List view integration:** Add export button to tables:
   - Payments page
   - Invoices page
   - Tenants page

**Success Criteria:**
- CSV downloads with correct headers and data
- PDF renders A4 landscape with company logo
- Export completes in <5 seconds for 1000 rows

---

## Timeline Summary

| Week | Focus | Tasks | Hours |
|------|-------|-------|-------|
| 1 | Security Foundation | T1-T5 | 38 |
| 2 | Subscription Hardening | T6-T7 | 12 |
| 3 | Payment Foundation | T8 (part 1) | 24 |
| 4 | Payment + Notifications | T8 (part 2), T9, T10, T11 | 72 |
| 5 | Notifications Complete | T11 (part 2), T12 | 28 |
| 6 | Analytics + Export | T13, T14 | 24 |
| **Total** | | **14 tasks** | **178** |

**Buffer:** Add 20% contingency = ~36 hours  
**Grand Total:** ~214 hours ≈ 5.5 weeks (1 dev, full-time)

---

## Dependencies Graph

```
T1 ─┬─→ T2 ─→ T3 ─┬─→ T6 ─→ T8 ─┬─→ T11 ─→ T12
    │              │              ├─→ T10 ─┘
    │              │              └─→ T13 ─→ T14
    │              └─→ T7
    ├─→ T4
    └─→ T5
```

---

## Risk Register

| Task | Risk | Mitigation |
|------|------|-----------|
| T1 | Matcher change breaks other routes | Test all public routes after change |
| T3 | Too many routes to audit | Script to scan all route.ts files for `auth()` usage |
| T8 | Stripe checkout flow breaks existing flow | A/B test with test mode keys |
| T9 | Razorpay API latency | 5-second client timeout, fallback to Stripe message |
| T10 | Cron job consumes resources | Run monthly only; add monitoring alert if >30s |

---

## Definition of Done

Each task is complete when:
1. Code written and type-checked (`tsc --noEmit` passes)
2. Unit tests added (minimum 70% coverage for new code)
3. Manual QA on localhost with test Stripe/Razorpay accounts
4. Documentation updated (AUTH_HELPERS.md if auth-related)
5. PR reviewed and merged to main