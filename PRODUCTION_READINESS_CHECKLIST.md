# PropertyPro — Production Readiness Checklist

This document provides a comprehensive checklist to verify that PropertyPro is ready for production deployment. It covers security, functionality, infrastructure, and operational requirements.

---

## 1. Security Checklist

### Critical Items
- [ ] **Debug routes protected** — All `/api/debug/*` endpoints return 404/403 in production without `INTERNAL_API_KEY`
- [ ] **API authorization complete** — Every route has proper role checks and input validation
- [ ] **Feature gating enforced** — `hasFeature()` called on all admin-tier endpoints before business logic
- [ ] **No `as any` casts in auth paths** — Session types properly extended, no type safety bypasses
- [ ] **Rate limiting configured** — Mutation endpoints wrapped (10 req/min), uploads (5 req/min), aggregations (30 req/min)
- [ ] **CSRF tokens validated** — All POST/PATCH/DELETE requests carry valid CSRF token
- [ ] **CORS headers configured** — Only allowed origins can access API (`Access-Control-Allow-Origin` not `*`)

### Pre-Production Verification
1. Run security scan with `npm audit`
2. Verify no secrets in `.env` (use `scripts/validate-env.ts`)
3. Test all endpoints with Postman/Thunder Client
4. Verify security headers on all responses with `curl -I`
5. Penetration test debug routes with invalid API key

---

## 2. Subscription & Billing Checklist

### Subscription System
- [ ] **Stripe checkout working** — Subscription upgrade/downgrade redirects complete
- [ ] **Webhook handler tested** — `customer.subscription.created/updated/deleted` events processed
- [ ] **Billing portal functional** — Users can manage payment methods and invoices
- [ ] **Tier limits enforced per-user** — `{ userId }` filter on all resource count checks
- [ ] **FREE tier blocked from admin routes** — No unauthorized access to PRO/BUSINESS features
- [ ] **OAuth login tested** — Google and GitHub providers working (if enabled)

### Payment Processing
- [ ] **Stripe rent checkout tested** — Test mode payment completes, webhook fires
- [ ] **Razorpay integration tested** — UPI/Netbanking payments work (India market)
- [ ] **Payment method selector UI** — Users can choose Stripe or Razorpay
- [ ] **Webhook idempotency** — Duplicate events don't double-process payments
- [ ] **Receipts generated** — PDF emailed within 2 minutes of payment
- [ ] **Reconciliation job** — Daily check for missed payments

---

## 3. Tenant Rent Payment Checklist

### Payment Flow
- [ ] **Invoice list page** — `/dashboard/tenant/invoices` shows all invoices
- [ ] **Invoice detail** — Shows property, amount, due date, status, late fees
- [ ] **Pay Now button** — Redirects to Stripe/Razorpay checkout
- [ ] **Payment confirmation** — Shows receipt number, amount, date after redirect
- [ ] **Payment history** — `/dashboard/tenant/payments` shows all transactions
- [ ] **Failed payment retry** — 3 attempts before marking `past_due`

### Invoice Automation
- [ ] **Monthly generation** — Cron job creates invoices for active tenants on billing day
- [ ] **Overdue detection** — Daily cron marks invoices `past_due` after grace period
- [ ] **Late fee calculation** — Flat fee or percentage applied correctly
- [ ] **Payment reminders** — Emails sent 3 days before due date
- [ ] **Lease termination** — Invoices stop when tenant status changes to `expired`

---

## 4. Notifications Checklist

### Email Notifications
- [ ] **Resend configured** — API key valid, sending domain verified
- [ ] **Payment due reminder** — Sent 3 days before `dueDate`
- [ ] **Payment success** — Receipt attached, sent within 2 minutes
- [ ] **Payment failed** — Retry instructions included
- [ ] **Maintenance update** — Status change notifications sent
- [ ] **Lease expiring** — 30-day warning to tenant and manager

### In-App Notifications
- [ ] **Notification badge** — Shows unread count in navbar
- [ ] **Real-time polling** — Updates every 30 seconds (no WebSocket errors)
- [ ] **Mark as read** — Individual and bulk actions work
- [ ] **Notification center** — `/notifications` page lists all notifications
- [ ] **Deep linking** — Clicking notification navigates to relevant page

---

## 5. Analytics & Reporting Checklist

### Revenue Dashboards
- [ ] **Revenue trend chart** — Shows monthly/quarterly/annual revenue
- [ ] **Occupancy rate** — Calculated as `occupiedUnits / totalUnits`
- [ ] **Payment collection rate** — `paid / (paid + pending) * 100`
- [ ] **Maintenance cost breakdown** — By category and property
- [ ] **Tenant turnover** — Move-in/move-out rates

### Data Export
- [ ] **CSV export** — Payments, invoices, tenants, maintenance
- [ ] **PDF reports** — Monthly statements with company logo
- [ ] **Export performance** — Completes in <5 seconds for 1000 rows
- [ ] **Date range filters** — Export API accepts `start` and `end` params

---

## 6. Infrastructure Checklist

### Deployment
- [ ] **Vercel configuration** — `vercel.json` sets timeout (30s), memory (1024MB), region
- [ ] **Environment variables** — All required vars in Vercel dashboard
- [ ] **Build passes** — `npm run build` completes with no errors
- [ ] **TypeScript clean** — `tsc --noEmit` passes
- [ ] **Prisma generate** — Runs in postinstall and vercel-build scripts
- [ ] **Smoke tests** — `npm run test:smoke` passes after deployment

### Monitoring
- [ ] **Sentry configured** — DSN set, errors captured in production
- [ ] **Health check** — `/api/health` returns 200 with DB/Stripe status
- [ ] **Uptime monitoring** — External ping (UptimeRobot, Pingdom) configured
- [ ] **Error alerts** — Sentry alerts for >5 errors/hour
- [ ] **Performance monitoring** — Vercel Analytics enabled

### Database
- [ ] **MongoDB Atlas M10+** — Upgraded from M0 for production
- [ ] **Connection pooling** — Prisma singleton cached globally
- [ ] **Backups** — Automated daily backups with 30-day retention
- [ ] **Indexes defined** — All query fields indexed in Prisma schema
- [ ] **No `db push` in CI** — Production uses migrations or manual schema review

### Security Headers
- [ ] **Strict-Transport-Security** — `max-age=63072000; includeSubDomains; preload`
- [ ] **Content-Security-Policy** — No `unsafe-eval` in production
- [ ] **X-Frame-Options** — `DENY`
- [ ] **X-Content-Type-Options** — `nosniff`
- [ ] **Referrer-Policy** — `strict-origin-when-cross-origin`
- [ ] **Permissions-Policy** — Camera, microphone, geolocation disabled

---

## 7. API Completeness Checklist

### Implemented Endpoints (Verify)
| Endpoint | Method | Auth | Role Check | Status |
|----------|--------|------|------------|--------|
| `/api/auth/register` | POST | No | N/A | Required |
| `/api/auth/callback/credentials` | POST | No | N/A | Required |
| `/api/auth/forgot-password` | POST | No | N/A | Required |
| `/api/auth/reset-password` | POST | No | N/A | Required |
| `/api/auth/update-password` | POST | Yes | Own user | Required |
| `/api/auth/update-profile` | PATCH | Yes | Own user | Required |
| `/api/properties` | GET | Yes | Admin/Manager | Required |
| `/api/properties` | POST | Yes | Admin/Manager | Required |
| `/api/properties/[id]` | GET | Yes | Admin/Manager | Required |
| `/api/properties/[id]` | PATCH | Yes | Admin/Manager | Required |
| `/api/properties/[id]` | DELETE | Yes | Admin | Required |
| `/api/properties/analytics` | GET | Yes | Admin/Manager | Required |
| `/api/tenants` | GET | Yes | Admin/Manager | **Verify** |
| `/api/tenants` | POST | Yes | Admin/Manager | Required |
| `/api/tenants/[id]` | GET | Yes | Admin/Manager | **Missing** |
| `/api/tenants/[id]` | PATCH | Yes | Admin/Manager | **Missing** |
| `/api/tenants/[id]` | DELETE | Yes | Admin | **Missing** |
| `/api/maintenance` | GET | Yes | All | Required |
| `/api/maintenance` | POST | Yes | All | Required |
| `/api/maintenance/[id]` | GET | Yes | All | Required |
| `/api/maintenance/[id]` | PATCH | Yes | Admin/Manager | Required |
| `/api/maintenance/[id]` | DELETE | Yes | Admin | Required |
| `/api/amenities` | GET | Yes | All | Required |
| `/api/amenities` | POST | Yes | Admin/Manager | Required |
| `/api/amenities/[id]` | PATCH | Yes | Admin/Manager | **Missing** |
| `/api/amenities/[id]` | DELETE | Yes | Admin | **Missing** |
| `/api/bookings` | GET | Yes | All | Required |
| `/api/bookings` | POST | Yes | All | Required |
| `/api/bookings/[id]` | GET | Yes | All | Required |
| `/api/bookings/[id]` | PATCH | Yes | All | Required |
| `/api/bookings/[id]` | DELETE | Yes | Admin/Manager | Required |
| `/api/payments` | GET | Yes | Admin/Manager | Required |
| `/api/payments` | POST | Yes | Admin/Manager | Required |
| `/api/payments/[id]` | GET | Yes | Admin/Manager | **Missing** |
| `/api/payments/[id]` | PATCH | Yes | Admin/Manager | **Missing** |
| `/api/rent/invoices` | GET | Yes | Tenant | Required |
| `/api/rent/payments` | GET | Yes | Tenant | Required |
| `/api/rent/checkout` | POST | Yes | Tenant | Required |
| `/api/stripe/checkout` | POST | Yes | All | Required |
| `/api/stripe/portal` | GET | Yes | All | Required |
| `/api/stripe/webhook` | POST | No | Webhook secret | Required |
| `/api/notifications` | GET | Yes | All | Required |
| `/api/notifications` | POST | Yes | All | Required |
| `/api/notifications/[id]` | PATCH | Yes | Own | Required |
| `/api/notifications/read-all` | POST | Yes | Own | Required |
| `/api/upload` | POST | Yes | All | Required |
| `/api/files` | GET | Yes | All | Required |
| `/api/files/[id]` | DELETE | Yes | Admin/Owner | Required |
| `/api/dashboard/stats` | GET | Yes | All | Required |
| `/api/health` | GET | No | N/A | Required |

**Legend:** Required = Must exist for launch; Missing = Create before launch; Verify = Test thoroughly

---

## 8. Frontend Completeness Checklist

### Pages Present
- [ ] `/login` — Login form
- [ ] `/register` — Registration form
- [ ] `/forgot-password` — Password reset request
- [ ] `/reset-password` — Password reset confirmation
- [ ] `/dashboard` — Role-based redirect
- [ ] `/dashboard/admin` — Admin overview
- [ ] `/dashboard/manager` — Manager overview
- [ ] `/dashboard/tenant` — Tenant overview
- [ ] `/dashboard/tenant/invoices` — **Missing (create for T8)**
- [ ] `/dashboard/tenant/payments` — **Missing (create for T8)**
- [ ] `/properties` — Property list
- [ ] `/properties/add` — Create property
- [ ] `/properties/[id]` — Property detail
- [ ] `/properties/[id]/edit` — Edit property
- [ ] `/tenants` — Tenant list
- [ ] `/tenants/add` — Create tenant
- [ ] `/maintenance` — Maintenance list
- [ ] `/maintenance/create` — Create request
- [ ] `/amenities` — Amenity list
- [ ] `/amenities/bookings` — Booking management
- [ ] `/payments` — Payment history
- [ ] `/notifications` — Notification center
- [ ] `/settings` — User settings

### Components Present
- [ ] `PayRentButton` — Renders correctly with loading/error states
- [ ] `FeatureGate` — Conditionally renders based on subscription (create for T3)
- [ ] `InvoiceList` — Tenant invoice table (create for T8)
- [ ] `PaymentConfirmation` — Post-payment receipt (create for T8)
- [ ] `DataTable` — Pagination, sorting, filtering work
- [ ] `Sidebar` — Collapsible, mobile drawer
- [ ] `Navbar` — Notification badge, user menu
- [ ] `ErrorBoundary` — Catches React errors

---

## 9. Testing Checklist

### Unit Tests (Target: 50% coverage)
- [ ] `src/services/__tests__/auth.service.test.ts` — ✅ Exists
- [ ] `src/services/__tests__/subscription.service.test.ts` — Test `hasFeature`, `checkResourceLimit`
- [ ] `src/services/__tests__/rentalPayment.service.test.ts` — Test checkout, webhook handling
- [ ] `src/lib/__tests__/stripe.test.ts` — Test config validation
- [ ] `src/lib/__tests__/email.test.ts` — Test send, template rendering

### Integration Tests
- [ ] Auth flow: register → login → logout
- [ ] Property CRUD: create → read → update → delete
- [ ] Tenant CRUD: create → read → update → delete
- [ ] Maintenance flow: create → assign → resolve
- [ ] Payment flow: invoice → checkout → webhook → confirmation
- [ ] Subscription flow: checkout → webhook → gating

### E2E Tests (Playwright)
- [ ] Tenant can view invoice and pay rent
- [ ] Manager can create property and add tenant
- [ ] Admin can view analytics dashboard
- [ ] Password reset flow works end-to-end

---

## 10. Documentation Checklist

### Developer Documentation
- [ ] `README.md` — Project overview, setup, run commands
- [ ] `ARCHITECTURE.md` — 4-layer architecture explained
- [ ] `API.md` — All endpoints documented with examples
- [ ] `DEPLOYMENT.md` — Vercel + MongoDB + Stripe setup
- [ ] `CONTRIBUTING.md` — Git workflow, PR process
- [ ] `.env.example` — All variables documented with descriptions

### Operations Documentation
- [ ] **Runbook** — Common issues: Stripe webhook failures, DB connection drops
- [ ] **Incident response** — Escalation path for payment failures
- [ ] **Feature gating matrix** — Which features require which tier
- [ ] **Cron schedule** — Invoice generation, overdue detection, reminders
- [ ] **Monitoring dashboard** — Sentry, Vercel Analytics, MongoDB metrics

---

## 11. Compliance & Legal Checklist

### Data Privacy
- [ ] **Privacy Policy** — Published at `/privacy-policy`
- [ ] **Terms of Service** — Published at `/terms-of-service`
- [ ] **GDPR compliance** — Data export/deletion endpoints if EU users
- [ ] **Cookie consent** — Banner for analytics cookies (if used)
- [ ] **Data retention** — Policy for logs, deleted files

### Payment Compliance
- [ ] **Stripe Terms** — Acceptable use policy followed
- [ ] **Razorpay Terms** — Indian payment regulations followed
- [ ] **PCI DSS** — No card data stored locally (Stripe/Razorpay handles)
- [ ] **Tax calculation** — Sales tax/VAT computed if required by jurisdiction

---

## 12. Performance Checklist

### Frontend Performance
- [ ] **Lighthouse score** — >90 on Performance, Accessibility, Best Practices
- [ ] **Bundle size** — Initial JS <300KB gzipped
- [ ] **Image optimization** — Next.js Image component used, Cloudinary transforms
- [ ] **Lazy loading** — Charts loaded with `dynamic()` + `ssr: false`
- [ ] **Caching** — Static assets cached, API responses use `stale-while-revalidate`

### Backend Performance
- [ ] **Database queries** — No N+1, use `select` projection
- [ ] **Connection pooling** — Prisma singleton, max 10 connections
- [ ] **Response times** — P95 <500ms for API routes
- [ ] **Error rate** — <1% 5xx responses
- [ ] **Cold start** — <2s on Vercel serverless (p95)

---

## 13. Go-Live Checklist

### Pre-Launch (T-7 Days)
- [ ] Freeze feature development
- [ ] Run full test suite, fix failures
- [ ] Security audit completed
- [ ] Load test with expected traffic (100 concurrent users)
- [ ] Backup database, test restore procedure
- [ ] Configure Vercel production environment
- [ ] Set up custom domain + SSL
- [ ] Configure Sentry alerts
- [ ] Enable Vercel Analytics

### Launch Day
- [ ] Deploy to production
- [ ] Run smoke tests against production
- [ ] Verify webhooks receiving events
- [ ] Monitor error rate for 2 hours
- [ ] Announce to beta users
- [ ] Enable feature flags for new features

### Post-Launch (T+7 Days)
- [ ] Review Sentry error backlog
- [ ] Check MongoDB connection metrics
- [ ] Verify Stripe/Razorpay reconciliation
- [ ] Collect user feedback
- [ ] Fix critical bugs within 24 hours
- [ ] Schedule weekly stability reviews

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Lead Architect | | | |
| Backend Lead | | | |
| Frontend Lead | | | |
| DevOps | | | |
| QA Lead | | | |
| Product Owner | | | |

**Production Deploy Approved:** ☐ Yes ☐ No

**Date:** _______________