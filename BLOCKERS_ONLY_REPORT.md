# BLOCKERS ONLY REPORT — PropNexus

> **Date:** June 24, 2026  
> **Methodology:** Direct source-code examination. No prior reports trusted.  
> **Scope:** Only items that block production deployment, real customer usage, or revenue generation.  

---

## CLASSIFICATION KEY

| Priority | Meaning |
|---|---|
| **P0** | Must fix before ANY production deployment |
| **P1** | Must fix within first month of production |

---

## P0 — MUST FIX BEFORE DEPLOYMENT

### B1. NextAuth `debug: true` enabled in production

| Field | Value |
|---|---|
| **File** | `src/lib/auth.ts` |
| **Line** | 77 |
| **Code** | `debug: true, // Always enable debug — logs to console on Vercel` |
| **Why it is a blocker** | Logs full authentication flow details to stdout/stderr in production. Every login call prints `authorize() called for email="..."`, `bcrypt.compare result for "..."`, `JWT created for user "..."`, `Session created for userId="..."`. On Vercel these logs are visible in the dashboard. This exposes user emails, session IDs, and JWT token payloads to anyone with log access. |
| **Impact** | Data exposure violation. A Vercel project member, or anyone who gains access to the project dashboard, can extract user emails and session patterns. Violates data privacy requirements (GDPR, SOC2). |
| **Fix steps** | Change line 77 to `debug: process.env.NODE_ENV !== "production"` or `debug: !isProduction` using the already-defined `isProduction` constant on line 30. |
| **Estimated fix time** | 5 minutes |

---

### B2. Middleware logs full JWT token data on every request

| Field | Value |
|---|---|
| **File** | `src/middleware.ts` |
| **Line** | 132 |
| **Code** | `console.log("[MIDDLEWARE_TOKEN] pathname:", pathname, "isLoggedIn:", isLoggedIn, ... "token:", token ? JSON.stringify({ sub: token.sub, role: token.role, id: token.id, email: token.email }) : "null")` |
| **Why it is a blocker** | Every single authenticated request writes JWT payload (user ID, email, role, sub) to stdout. On Vercel, all middleware logs are visible in production logs. This is a continuous data leak of user identity information. |
| **Impact** | Every user's email and internal ID is exposed in production logs for every page navigation and API call they make. If logs are ingested by a third-party service (DataDog, Logtail, etc.), user PII is transmitted outside the system. |
| **Fix steps** | Remove the `console.log` on line 132, or replace with a log that omits token payload: `console.log("[MIDDLEWARE] pathname:", pathname, "authenticated:", isLoggedIn)` |
| **Estimated fix time** | 2 minutes |

---

### B3. Login endpoint has no rate limiting — brute force attacks possible

| Field | Value |
|---|---|
| **File** | `src/app/api/auth/[...nextauth]/route.ts` (NextAuth handler) |
| **Line** | 7 |
| **Code** | `export const { GET, POST } = handlers;` — This exports the NextAuth v5 handler directly, which calls `authorize()` in `auth.ts` with zero rate-limiting guards. |
| **Why it is a blocker** | The login flow goes through NextAuth's catch-all route `/api/auth/[...nextauth]`. This handler receives POST requests for login credentials and calls `authorize()` in `auth.ts` lines 106-181. There is no rate-limiting wrapper, no IP-based throttling, no progressive delay. An attacker can submit unlimited login attempts per second. The `src/lib/rate-limit.ts` file exists and is used on `forgot-password` and `reset-password` routes, but is NOT applied to the main login endpoint or the register endpoint (`src/app/api/auth/register/route.ts` has no rate-limiting import either). |
| **Impact** | Account takeover via brute force or credential stuffing. Application vulnerability: CWE-307 (Improper Restriction of Excessive Authentication Attempts). |
| **Fix steps** | 1. Create a custom login route handler that wraps NextAuth's `signIn` with rate limiting. OR 2. Add IP-based rate limiting middleware specifically for `/api/auth/callback/credentials` and `/api/auth/register`. OR 3. Use a middleware matcher to apply rate limiting to auth paths. The rate-limit infrastructure already exists. |
| **Estimated fix time** | 2-4 hours |

---

### B4. Subscription enforcement is completely non-functional — revenue model broken

| Field | Value |
|---|---|
| **File** | `src/services/subscription.service.ts` lines 149-168 (definition) |
| **Evidence** | Zero imports of `checkResourceLimit` anywhere in `src/app/api/` |
| **Why it is a blocker** | The `checkResourceLimit()` function is fully implemented (lines 149-168) but it is **never imported or called** by any API route. A user on the FREE tier can create unlimited properties, tenants, and users — the limits defined in `SUBSCRIPTION_TIERS.FREE` (1 property, 1 user, 5 tenants) are completely ignored. This means: (1) users have no incentive to upgrade to paid tiers, (2) the entire subscription-based monetization strategy does not function, (3) the FREE tier has no ceiling, making the product unbillable. |
| **Impact** | Zero revenue generation capability. Every API route for property creation (`src/app/api/properties/route.ts`), tenant creation, etc. proceeds without checking the user's subscription limits. A user can create 10,000 properties on a FREE plan. |
| **Fix steps** | In every POST route handler that creates a billable resource (properties, tenants, users), add a call to `checkResourceLimit(userId, resourceType, currentCount)` before the create operation. Return a 403 with upgrade prompt when `allowed === false`. |
| **Estimated fix time** | 8-16 hours (across all 8+ resource-creating API routes) |

---

### B5. No online tenant payment collection UI — core revenue feature missing

| Field | Value |
|---|---|
| **File** | Cross-cutting: `src/app/api/payments/route.ts` exists, `src/app/api/stripe/checkout/route.ts` exists, but no tenant-facing "Pay Now" UI in `src/app/(dashboard)/` |
| **Why it is a blocker** | The PropertyPro business model includes rent collection as a core value proposition. Stripe is fully integrated on the backend (connect, webhooks, billing portal) but there is **no UI for tenants to view invoices, click "Pay Now", or submit payments**. The payments page (`src/app/(dashboard)/payments/page.tsx` likely shows a payment list for property managers, not a tenant-facing payment form. Without this, the product cannot generate transaction revenue (2.9% + $0.30 per payment). |
| **Impact** | A property management SaaS that cannot collect rent online has no transactional revenue stream. Stripe subscriptions (PRO/BUSINESS) could still be sold, but the highest-volume revenue channel (transaction fees on rent payments) is zero. |
| **Fix steps** | Build a tenant-facing payment UI: (1) invoice list page showing due/overdue amounts, (2) "Pay Now" button per invoice, (3) Stripe PaymentElement integration for card entry, (4) confirmation screen. This requires new components and a new dashboard section for tenants. |
| **Estimated fix time** | 24-40 hours |

---

### B6. Password strength: 8 characters minimum only — account takeover risk

| Field | Value |
|---|---|
| **File** | `src/validations/index.ts` |
| **Line** | 16 |
| **Code** | `password: z.string().min(8, "Password must be at least 8 characters")` |
| **Why it is a blocker** | The only password requirement is a minimum length of 8 characters. There is no requirement for uppercase letters, lowercase letters, digits, or special characters. Passwords like `password1` or `abcdefgh` satisfy the validator. This makes brute force and dictionary attacks practical. Combined with B3 (no rate limiting on login), account compromise is straightforward. |
| **Impact** | Weak passwords enable account takeover. For a property management system handling tenant PII (names, addresses, payment records) and rental payments, this is an unacceptable risk. |
| **Fix steps** | Update the `password` field in `signUpSchema` to enforce complexity: `z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, "Password must contain uppercase, lowercase, number, and special character")` |
| **Estimated fix time** | 10 minutes |

---

## P1 — MUST FIX WITHIN FIRST MONTH

### B7. Only password-reset emails work — no transactional notifications

| Field | Value |
|---|---|
| **File** | `src/lib/email.ts` |
| **Lines** | 57-109 |
| **Why it is a blocker** | The `buildPasswordResetEmail()` function is the **only** HTML email template. There are no functions for: payment receipt emails, booking confirmation emails, maintenance update emails, billing/ invoice emails, or welcome emails. The `sendEmail()` infrastructure exists (Resend SDK is integrated and working) but is called from exactly one place: `auth.service.ts` line 135. |
| **Impact** | In a real property management SaaS, tenants and landlords expect email notifications for payments, maintenance updates, and bookings. Without these, the product feels broken. Payment confirmations in particular are a regulatory/compliance expectation for financial transactions. |
| **Fix steps** | Create email builder functions for: `buildPaymentReceiptEmail()`, `buildBookingConfirmationEmail()`, `buildMaintenanceUpdateEmail()`, `buildWelcomeEmail()`. Call `sendEmail()` from the respective service handlers when these events occur. |
| **Estimated fix time** | 8-16 hours |

---

### B8. No tenant self-service portal — tenants cannot pay, submit requests, or view their data

| Field | Value |
|---|---|
| **File** | `src/app/(dashboard)/` — directory shows no tenant-specific dashboard with self-service features |
| **Why it is a blocker** | The tenant role exists in the system (role: "tenant") and tenants can log in and see a dashboard page, but there is no dedicated tenant portal where a tenant can: view their lease, pay rent online (see B5), submit maintenance requests, view payment history, update personal information, or communicate with the property manager. For a multi-tenant property management app, this is comparable to a CRM without a customer login. |
| **Impact** | Tenant users will abandon the platform. The property manager cannot onboard tenants into the system because there is no value for them. The product is manager-only. True customer usage requires tenant engagement. |
| **Fix steps** | Build a tenant portal: (1) tenant dashboard showing lease summary and upcoming payments, (2) "Pay Rent" button with Stripe PaymentElement, (3) maintenance request submission form, (4) payment history table, (5) profile/settings page. |
| **Estimated fix time** | 40-60 hours |

---

### B9. Zero CI/CD pipeline — deployment is manual and unrepeatable

| Field | Value |
|---|---|
| **File** | `.github/` does not exist in the repository |
| **Why it is a blocker** | There are no GitHub Actions, no automated tests run on push, no deployment pipeline, no staging environment, no automated rollback capability. The `scripts/deploy.ps1` and `scripts/deploy.sh` exist but are manual scripts that run `vercel deploy --prod`. There is no code review enforcement, no linting gate, no test gate, no approval step before production deployment. |
| **Impact** | Every deployment is a manual, unrepeatable process. If the deploying developer is unavailable, no one else can safely deploy. There is zero protection against pushing broken code to production. Combined with ~0% test coverage (B10), every change carries production risk. |
| **Fix steps** | 1. Create `.github/workflows/ci.yml` with lint, type-check, and test steps. 2. Create `.github/workflows/deploy.yml` with branch-based deployment (staging on develop, production on main). 3. Add environment protection rules in GitHub. |
| **Estimated fix time** | 8-16 hours |

---

### B10. Test coverage is effectively 0% — cannot verify any fix or change

| Field | Value |
|---|---|
| **File** | `src/services/__tests__/auth.service.test.ts` — the ONLY test file |
| **Evidence** | 1 test file, 7 total test cases. Coverage threshold of 40% is configured in `vitest.config.ts` but would fail if coverage were enabled. |
| **Why it is a blocker** | With essentially no test suite, it is impossible to verify that any of the above P0 fixes work correctly without breaking existing functionality. There are no API route tests, no integration tests, no component tests, no E2E tests. Every code change for the first month of production will be deployed without automated verification. |
| **Impact** | High regression risk on every change. Bug fixes will introduce new bugs. Refactoring is unsafe. The only way to validate production changes is manual testing, which won't scale. |
| **Fix steps** | 1. Add unit tests for the critical services (`subscription.service.ts`, `stripe.ts`, `auth.service.ts` remaining paths). 2. Add API route integration tests for the three primary endpoints (properties, tenants, payments). 3. Set up Playwright for a basic E2E smoke test (login → create property → create tenant → view dashboard). Target 20% coverage before production, 40% within the first month. |
| **Estimated fix time** | 24-40 hours |

---

## SUMMARY

| # | Blocker | Priority | Est. Fix Time | Blocks |
|---|---|---|---|---|
| B1 | `debug: true` exposes auth data in production | **P0** | 5 min | Production deployment |
| B2 | Middleware logs user JWT on every request | **P0** | 2 min | Production deployment |
| B3 | Login/register endpoints have no rate limiting | **P0** | 2-4 hrs | Production deployment |
| B4 | Subscription enforcement never called | **P0** | 8-16 hrs | Revenue generation |
| B5 | No tenant payment collection UI | **P0** | 24-40 hrs | Revenue generation |
| B6 | Password: 8-char minimum, no complexity | **P0** | 10 min | Production deployment |
| B7 | Only password-reset email implemented | **P1** | 8-16 hrs | Customer usage |
| B8 | No tenant self-service portal | **P1** | 40-60 hrs | Customer usage |
| B9 | No CI/CD pipeline | **P1** | 8-16 hrs | Production deployment |
| B10 | ~0% test coverage | **P1** | 24-40 hrs | Production deployment |

**Total P0 fix time:** ~60 hours (1.5 weeks with one developer)  
**Total P1 fix time:** ~130 hours (3+ weeks with one developer)  
**Combined:** ~190 hours (5+ weeks)

## VERDICT

**⛔ Production deployment is BLOCKED by 6 P0 issues (B1-B6).**

Of these, B1 and B2 are trivial fixes (7 minutes combined) but represent critical security/compliance failures. B3, B4, B5, and B6 require substantive implementation work.

**Revenue generation is BLOCKED by 2 P0 issues (B4, B5):**
- B4: Subscription monetization is entirely cosmetic — no enforcement code runs.
- B5: No tenant-facing payment UI — cannot collect rent transaction fees.

**Minimum viable production deployment requires:**
1. Fix B1 and B2 (7 minutes) — stop leaking auth data
2. Fix B3 and B6 (2-4 hours) — secure authentication
3. Fix B4 (8-16 hours) — at minimum enforce FREE tier limits on property creation
4. Fix B9 (8-16 hours) — add a basic CI pipeline

**Minimum viable revenue generation requires points 1-4 above plus:**
5. Fix B5 (24-40 hours) — build tenant payment UI

**No project score, completion estimate, or future features are assessed in this report.**