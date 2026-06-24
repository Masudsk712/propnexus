# PropertyPro — Production Implementation Plan
**Current Status:** 65% Complete  
**Target:** Production-Ready (100%)  
**Estimated Timeline:** 6-8 Weeks  
**Architecture:** Next.js 15 + Prisma/MongoDB + Stripe + NextAuth v5

---

## Executive Summary

This plan outlines the top 10 highest-priority tasks to move PropertyPro from its current 65% completion to a production-ready SaaS platform. The work is organized into 5 phases: Security & Stability, Subscription Enforcement, Tenant Rent Payments, Notifications, and Analytics & Reporting.

---

## Phase 1: Security & Stability (Week 1)

### T1. Protect Debug Routes — Fix Middleware Bypass
**Priority:** Critical  
**Business Impact:** Debug endpoints expose internal database state, auth sessions, and environment variables. In production, this creates a severe security vulnerability allowing attackers to enumerate users, check database health, and identify misconfigurations.

**Technical Impact:** 
- Middleware `matcher` currently excludes `/api/*`, meaning debug routes never hit the auth/security headers layer
- `vercel.json` also excludes `/api` from security headers
- `NODE_ENV` checks in route handlers alone are insufficient (can be bypassed if env is misconfigured)

**Estimated Hours:** 6  
**Dependencies:** None  
**Files Affected:**
- `src/middleware.ts` — Update matcher to `/api/debug/*` instead of blanket `/api` exclusion
- `src/app/api/debug/auth/route.ts` — Add internal API key auth as defense-in-depth
- `src/app/api/debug/db/route.ts` — Add internal API key auth
- `src/app/api/debug/ping/route.ts` — Add internal API key auth
- `src/app/api/debug/session/route.ts` — Add internal API key auth
- `vercel.json` — Ensure security headers apply to `/api/debug/*` or remove blanket exclusion

### T2. Audit & Fix API Authorization Gaps
**Priority:** Critical  
**Business Impact:** Multiple API routes lack proper role checks. FREE tier users may access admin features. Missing endpoints for tenant CRUD operations block core workflows.

**Technical Impact:**
- `/api/tenants` GET has no role restriction (any authenticated user can list all tenants)
- Missing `GET/PATCH/DELETE /api/tenants/[id]` endpoints exist in service layer but have no API handlers
- No `PATCH/DELETE /api/amenities/[id]` endpoints
- No `GET/PATCH/DELETE /api/payments/[id]` endpoints

**Estimated Hours:** 12  
**Dependencies:** T1 (security)  
**Files Affected:**
- `src/app/api/tenants/[id]/route.ts` — Create missing endpoint
- `src/app/api/amenities/[id]/route.ts` — Create missing endpoint
- `src/app/api/payments/[id]/route.ts` — Create missing endpoint
- `src/services/index.ts` — Standardize `as any` type casts
- `src/lib/auth-helpers.ts` — Strengthen auth helper patterns

### T3. Enforce Feature-Level Subscription Gating
**Priority:** Critical  
**Business Impact:** `hasFeature()` exists but is NEVER called. FREE tier users can access PRO/BUSINESS features. This is a direct revenue leak—users upgrading for feature access are not actually restricted.

**Technical Impact:**
- Must audit every admin/manager API route and add `hasFeature()` checks
- Frontend must hide/disable PRO/BUSINESS-only UI components for FREE users
- Must document all gated features consistently

**Estimated Hours:** 16  
**Dependencies:** T2 (auth audit)  
**Files Affected:**
- `src/services/subscription.service.ts` — Extend `hasFeature()` to support resource-type checks
- All `src/app/api/*/route.ts` files — Add `hasFeature()` guard before business logic
- `src/components/*` — Add feature-gate wrapper component
- `src/lib/feature-gate.ts` — Create new utility for frontend gating

### T4. Add Request Rate Limiting Beyond Auth
**Priority:** High  
**Business Impact:** Only login endpoint has rate limiting (5 req/min). Mutation endpoints (create property, payment) can be brute-forced or DoS'd, causing server cost spikes and data corruption.

**Technical Impact:**
- Wrap Upstash Redis rate limiter around all mutation endpoints
- Add per-user rate limits for GET endpoints with aggregation
- Add request size limits on upload routes

**Estimated Hours:** 8  
**Dependencies:** T1 (security foundation)  
**Files Affected:**
- `src/lib/rate-limit.ts` — Create reusable per-route rate limit middleware
- All API route files — Wrap sensitive endpoints

### T5. Implement CSRF & CORS Protection
**Priority:** High  
**Business Impact:** No CSRF token validation means malicious sites can submit forms on behalf of authenticated users. No CORS headers could enable cross-origin abuse if deployed on multiple domains.

**Estimated Hours:** 6  
**Dependencies:** T1 (security foundation)  
**Files Affected:**
- `src/middleware.ts` — Add CSRF token validation for state-changing requests
- `next.config.ts` — Add CORS headers config
- `src/lib/csrf.ts` — Create CSRF token generator/validator

---

## Phase 2: Subscription Enforcement (Week 2-3)

### T6. Complete Subscription Enforcement on Resource Creation
**Priority:** Critical  
**Business Impact:** Property creation already checks limits (T2 indirectly), but tenant creation check is global (`prisma.tenant.count()`) not per-user. A user with 0 tenants hits a global count that includes others' tenants, blocking legitimate operations.

**Technical Impact:**
- Change tenant count check to `where: { userId }`
- Add property creation limit check (currently exists but verify)
- Add tenant creation for user's own properties (not global)
- Create `checkResourceLimit` per-user variants

**Estimated Hours:** 8  
**Dependencies:** T3, T6  
**Files Affected:**
- `src/app/api/tenants/route.ts` — Fix limit check to `{ userId }`
- `src/app/api/properties/route.ts` — Verify and strengthen limit check
- `src/services/subscription.service.ts` — Add `checkUserPropertyLimit`

### T7. Wire OAuth Providers
**Priority:** Medium  
**Business Impact:** Google/GitHub OAuth is configured in `.env.example` but not wired into `auth.ts`. Users attempting OAuth login get errors. Reduces friction for new user signups.

**Estimated Hours:** 4  
**Dependencies:** None  
**Files Affected:**
- `src/lib/auth.ts` — Add `Google` and `GitHub` providers
- `.env.example` — Document OAuth required variables
- `src/app/(auth)/login/page.tsx` — Add OAuth buttons

---

## Phase 3: Tenant Rent Payments (Week 3-4)

### T8. Build Complete Tenant Rent Payment Flow
**Priority:** Critical  
**Business Impact:** This is the single highest-impact missing feature. No tenant can pay rent through the platform. Without payments, the SaaS has no transaction revenue and cannot demonstrate product-market fit.

**Technical Impact:**
- Invoice list page for tenants (`/dashboard/tenant/invoices`)
- Invoice detail with `PayRentButton` component
- Payment confirmation page after Stripe redirect
- Payment history page for tenants
- Receipt generation (PDF + email)
- Integration with existing `PayRentButton` and `rentalPaymentService`

**Estimated Hours:** 24  
**Dependencies:** T2, T3, T6  
**Files Affected:**
- `src/app/(dashboard)/dashboard/tenant/invoices/page.tsx` — New file
- `src/app/(dashboard)/dashboard/tenant/payments/page.tsx` — New file
- `src/components/rent/` — Add invoice list, payment confirmation components
- `src/services/email.service.ts` — Create email service (Resend)
- `src/lib/stripe.ts` — Add receipt URL generation helper

### T9. Design & Implement Razorpay Integration
**Priority:** High (Market Fit for India)  
**Business Impact:** Current Stripe integration supports international cards but lacks UPI, Netbanking, and popular Indian payment methods (Razorpay). With `Asia/Calcutta` timezone, primary market is likely India. Missing local payments blocks conversion.

**Technical Impact:**
- Create Razorpay checkout flow parallel to Stripe
- Add payment method selection UI
- Handle Razorpay webhooks (verify signature, mark invoice paid)
- Fallback to Stripe if Razorpay unavailable

**Estimated Hours:** 18  
**Dependencies:** T8 (payment flow foundation)  
**Files Affected:**
- `src/lib/razorpay.ts` — New config
- `src/app/api/payments/razorpay/` — New API route
- `src/services/razorpay.service.ts` — New service
- `src/components/rent/PayRentButton.tsx` — Add payment method selector

### T10. Implement Automatic Invoice Generation & Overdue Handling
**Priority:** High  
**Business Impact:** Currently invoices are created manually. Auto-generation from lease data ensures consistent rent collection. Overdue handling triggers late fees and dunning communications.

**Technical Impact:**
- Cron job (or Vercel Cron API) to scan active tenants and generate monthly invoices
- Late fee calculation (configurable grace period, percentage or flat fee)
- Status transitions: `pending` → `past_due` after due date
- Webhook/notification on status change

**Estimated Hours:** 14  
**Dependencies:** T8 (payment flow), T11 (notifications)  
**Files Affected:**
- `src/app/api/cron/invoices/route.ts` — New route (secured with CRON_SECRET)
- `src/services/invoice.service.ts` — Add `generateMonthlyInvoices`
- `src/services/late-fee.service.ts` — New service
- `src/lib/email.ts` — Add late payment reminder template
- `prisma/schema.prisma` — Consider adding `lateFee`, `gracePeriodDays` to Invoice

---

## Phase 4: Notifications (Week 5)

### T11. Implement Email Notification System
**Priority:** High  
**Business Impact:** No emails sent for payment due, payment success, maintenance updates, or lease expiration. Tenants miss critical deadlines, leading to late payments and poor experience.

**Technical Impact:**
- SendGrid/Resend integration (Resend already in package.json)
- Email templates (using React Email or plain HTML)
- Trigger events: payment_succeeded, payment_failed, invoice_due, maintenance_assigned, lease_expiring
- In-app + email double-notification pattern

**Estimated Hours:** 16  
**Dependencies:** T8, T10  
**Files Affected:**
- `src/lib/email.ts` — Extend with template system
- `src/services/notification.service.ts` — Add `sendEmail`
- `src/app/api/notifications/email/` — New endpoint for triggering
- `emails/` — New directory for templates

### T12. Add Real-Time Socket.IO Events for Maintenance & Payments
**Priority:** Medium  
**Business Impact:** Real-time updates for maintenance status changes and payment confirmations improve user experience. However, Socket.IO does NOT work on Vercel serverless (no WebSocket support). This requires architectural decision.

**Technical Impact:**
- Option A: Deploy separate Socket.IO server (Railway/Render) — full real-time
- Option B: Use polling/TanStack Query refetch — simpler, Vercel-compatible
- Option C: Vercel Edge Config + SSE — middle ground

**Estimated Hours:** 12  
**Dependencies:** T11 (notification foundation)  
**Files Affected:**
- `src/lib/socket-server.ts` — Refactor or replace
- `src/hooks/useRealtime.ts` — Update hook
- Decision document required first

---

## Phase 5: Analytics & Reporting (Week 6)

### T13. Build Revenue & Occupancy Dashboards
**Priority:** High  
**Business Impact:** Property managers need at-a-glance financial visibility. Current dashboard has basic KPI cards but lacks trend analysis, occupancy heatmaps, and comparative reporting.

**Technical Impact:**
- Revenue trend chart (LineChart) — monthly/quarterly/annual
- Occupancy rate by property (BarChart)
- Payment collection rate (percentage collected vs pending)
- Maintenance cost breakdown
- Tenant turnover metrics

**Estimated Hours:** 14  
**Dependencies:** T8 (payment data), T10 (invoice data)  
**Files Affected:**
- `src/app/(dashboard)/dashboard/admin/analytics/page.tsx` — Extend
- `src/repositories/dashboard.ts` — Add trend analytics queries
- `src/app/api/dashboard/analytics/route.ts` — New endpoint

### T14. Implement Data Export (CSV/PDF)
**Priority:** Medium  
**Business Impact:** Property managers need exportable reports for accounting, tax, and owner reporting. Manual CSV export from tables is unreliable.

**Technical Impact:**
- CSV export for: payments, invoices, tenants, maintenance requests
- PDF report generation for monthly statements
- Add `export=true` query param to list endpoints

**Estimated Hours:** 10  
**Dependencies:** T13 (analytics dashboard)  
**Files Affected:**
- `src/lib/export.ts` — New utility
- `src/app/api/export/` — New API route
- List endpoints — Add optional export parameter

---

## TASK_BREAKDOWN

### Week 1: Security Foundation
| Task | Type | Est. Hrs | Deliverable |
|------|------|----------|-------------|
| T1: Fix debug route bypass | Security | 6 | All debug routes protected via middleware + internal API key |
| T2: Audit API authorization | Bug | 12 | Missing tenant/amenity/payment endpoints created; role checks verified |
| T3: Feature-level subscription gating | Feature | 16 | hasFeature() called in all admin routes; frontend gating wrapper created |
| T4: Rate limiting expansion | Security | 8 | Mutation endpoints wrapped with Upstash rate limiter |
| T5: CSRF & CORS | Security | 6 | CSRF tokens on state-changing requests; CORS configured |

### Week 2: Subscription Hardening
| Task | Type | Est. Hrs | Deliverable |
|------|------|----------|-------------|
| T6: Per-user resource limits | Bug | 8 | Tenant/Property creation checks use `{ userId }` not global count |
| T7: OAuth providers | Feature | 4 | Google/GitHub login wired and tested |

### Week 3: Payment Foundation
| Task | Type | Est. Hrs | Deliverable |
|------|------|----------|-------------|
| T8: Tenant payment flow | Feature | 24 | Invoices list, Pay Now, confirmation, history, receipts |
| T9: Razorpay integration | Feature | 18 | Razorpay checkout + webhook + UPI/Netbanking support |
| T10: Auto-invoice generation | Feature | 14 | Cron job generates invoices; overdue handling implemented |

### Week 4: Notifications
| Task | Type | Est. Hrs | Deliverable |
|------|------|----------|-------------|
| T11: Email notifications | Feature | 16 | Resend wired; templates for payment due, success, maintenance |
| T12: Real-time events (polling) | Feature | 12 | Tenant dashboard polling; decision doc for Socket.IO |

### Week 5-6: Analytics & Reporting
| Task | Type | Est. Hrs | Deliverable |
|------|------|----------|-------------|
| T13: Revenue/Occupancy dashboards | Feature | 14 | Charts, trends, occupancy rates live on admin analytics page |
| T14: CSV/PDF export | Feature | 10 | Export function on all major list endpoints |

---

## PRODUCTION_READINESS_CHECKLIST

### Security
- [ ] All debug routes protected by middleware AND internal API key
- [ ] `hasFeature()` enforced on every admin-tier API route
- [ ] CSRF tokens on all POST/PATCH/DELETE endpoints
- [ ] CORS headers configured for allowed origins only
- [ ] Rate limiting on all mutation endpoints (10 req/min per user)
- [ ] Request size limits on upload endpoints (10MB max)
- [ ] No `as any` casts in auth-critical paths
- [ ] Security headers applied to ALL responses (including `/api/*`)

### Subscription & Billing
- [ ] Resource limit checks use `{ userId }` not global counts
- [ ] FREE tier cannot access admin routes or PRO features
- [ ] OAuth login working (Google + GitHub)
- [ ] Stripe subscription webhooks tested end-to-end
- [ ] Razorpay integration tested (UPI + card)
- [ ] Receipts generated and emailed after payment

### Tenant Payments
- [ ] Tenant invoice list page (`/dashboard/tenant/invoices`)
- [ ] Pay Now button redirects to Stripe/Razorpay checkout
- [ ] Payment confirmation page displays receipt
- [ ] Payment history page shows all transactions
- [ ] Failed payments retried 3x before marking past_due
- [ ] overdue invoices trigger late fees automatically
- [ ] Monthly invoices auto-generated from active leases

### Notifications
- [ ] Email sent on: payment due, payment success, payment failed, maintenance assigned, lease expiring
- [ ] In-app notification badge updates in real-time (polling)
- [ ] Email templates branded and responsive

### Data & Analytics
- [ ] Revenue dashboard shows monthly trends
- [ ] Occupancy rate calculated per property
- [ ] Payment collection rate tracks pending vs paid
- [ ] CSV export works on payments, invoices, tenants, maintenance
- [ ] PDF monthly statement generation works

### Infrastructure
- [ ] Socket.IO replaced with polling OR deployed separately
- [ ] Cron endpoints secured with `CRON_SECRET`
- [ ] Health check endpoint returns dependency status (DB, Stripe, Redis)
- [ ] Error tracking (Sentry) captures production errors
- [ ] All secrets in environment variables (none hardcoded)
- [ ] TypeScript `tsc --noEmit` passes clean
- [ ] Build completes without warnings
- [ ] Smoke tests pass on Vercel deployment

### Testing
- [ ] Auth flow tests (register, login, logout, password reset)
- [ ] Subscription gating tests
- [ ] Payment flow tests (mock Stripe)
- [ ] API route authorization tests
- [ ] At least 50% unit test coverage on services

### Documentation
- [ ] API documentation (OpenAPI/Swagger) generated
- [ ] Deployment runbook updated with new environment variables
- [ ] Feature gating matrix documented (which features require which tier)
- [ ] Incident response plan for payment failures

---

## Risk Mitigation

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Stripe webhook replay attacks | Medium | Use `stripe-signature` verification + idempotency keys |
| MongoDB connection exhaustion | Medium | Prisma singleton cached; add connection pool monitoring |
| Razorpay API downtime | Low | Fallback to Stripe for international cards |
| Vercel serverless cold start latency | Medium | Add loading states; optimize bundle size; use Edge functions for light routes |
| Payment reconciliation failures | Medium | Retry webhook processing; daily reconciliation job |