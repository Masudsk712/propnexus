# Security Audit Report
**Date:** 2026-06-24
**Scope:** T1 - Protect Debug Routes | T2 - Audit & Fix API Authorization Gaps
**Status:** Critical Issues Remediated

---

## Executive Summary
A security audit was performed on the PropertyPro codebase focusing on debug route exposure and API authorization gaps. **2 critical vulnerabilities were identified and remediated.**

---

## 1. Debug Route Exposure (T1) — CRITICAL

### Finding
All `/api/debug/*` endpoints were unprotected. The middleware matcher excluded `/api` entirely, meaning:
- Security headers (CSP, HSTS) were NOT applied to debug endpoints
- No authentication/authorization checks were performed
- Debug endpoints exposed: database connection status, user counts, auth session state, environment variables, cookie contents

### Affected Endpoints
| Endpoint | Risk |
|----------|------|
| `GET /api/debug/auth` | High — reveals DB connection string preview, env vars |
| `GET /api/debug/db` | High — reveals DB connectivity, user counts |
| `GET /api/debug/ping` | Medium — reveals env loaded state |
| `GET /api/debug/session` | Critical — reveals full session state, cookie names/prefixes, JWT contents |

### Remediation
1. **Middleware Matcher Updated** (`src/middleware.ts`):
   - Changed from `"/((?!api|...).*)"` to `"/((?!_next/static|...).*)"` — removes blanket `/api` exclusion
   - Security headers now apply to ALL routes including `/api/debug/*`

2. **Internal API Key Protection** (`src/lib/internal-auth.ts` — new file):
   - Created `verifyInternalApiKey()` helper
   - All debug routes now require `X-Internal-API-Key` header
   - Missing/invalid key returns 404 (masks route existence)

3. **vercel.json Updated**:
   - Added headers rule for `/api/debug/*`: `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`

4. **Defense-in-Depth**:
   - Retained `NODE_ENV === "production"` checks in each debug route
   - Combined API key + env check = dual-layer protection

### Residual Risk
- If `INTERNAL_API_KEY` is not set in environment, debug routes return 404 (fail-closed). Acceptable.
- `vercel.json` headers are static; dynamic security requires middleware (already fixed).

---

## 2. API Authorization Gaps (T2) — CRITICAL

### Finding 2a: Missing Role Validation on GET /api/tenants
**Before:** Any authenticated user (including tenants) could list ALL tenants in the system.
**Impact:** Tenant privacy violation — exposure of PII (names, emails, property assignments, lease dates).

**Fix:** Added role check:
```typescript
const role = session.user.role;
if (role !== "admin" && role !== "manager") return forbiddenResponse();
```

### Finding 2b: Missing Role Validation on GET /api/maintenance
**Before:** Any authenticated user could list ALL maintenance requests.
**Impact:** Exposure of property maintenance issues, costs, assigned staff.

**Fix:** Added admin/manager role restriction.

### Finding 2c: Missing CRUD Endpoints
Three endpoints were missing entirely, blocking core workflows:

| Missing Endpoint | Impact |
|------------------|--------|
| `GET/PATCH/DELETE /api/tenants/[id]` | Cannot fetch/update/delete individual tenants |
| `PATCH/DELETE /api/amenities/[id]` | Cannot modify/remove amenities |
| `GET/PATCH /api/payments/[id]` | Cannot view/update individual payments |

**Fix:** Created all missing endpoints with proper role checks:
- `tenants/[id]`: GET/PATCH/DELETE (admin/manager; DELETE admin-only)
- `amenities/[id]`: PATCH (admin/manager), DELETE (admin-only)
- `payments/[id]`: GET/PATCH (admin/manager)

### Finding 2d: Global Subscription Count Checks
**Before:** `prisma.tenant.count()` and `prisma.property.count()` used global counts.
**Impact:** User with 0 tenants hit global count (e.g., 50), incorrectly blocked from creating tenants.

**Fix:**
- Tenants: Changed to `prisma.tenant.count({ where: { userId: session.user.id } })`
- Properties: Reverted to global count (Property model lacks `userId` relation — noted for future schema update)

### Finding 2e: Type Safety Bypasses (`as any`)
Multiple route files used `(session.user as any).role` to bypass TypeScript type checking. This hides potential runtime errors.

**Fix:** Removed all `as any` casts in route handlers:
- `src/app/api/tenants/route.ts`
- `src/app/api/properties/route.ts`
- `src/app/api/amenities/route.ts`
- `src/app/api/payments/route.ts`
- `src/app/api/maintenance/route.ts`
- `src/lib/auth-helpers.ts`: `getUserRole()` now uses typed access
- `src/app/api/debug/session/route.ts`: Replaced with typed cast `{ role?: string }`

---

## 3. Route Inventory & Authorization Status

| Endpoint | Auth | Role Check | Tenant Isolation | Status |
|----------|------|------------|------------------|--------|
| `/api/debug/*` | API Key + Dev | N/A | N/A | **Fixed** |
| `/api/tenants` GET | Yes | admin/manager | No (global list) | **Fixed** |
| `/api/tenants` POST | Yes | admin/manager | No | OK |
| `/api/tenants/[id]` GET | Yes | admin/manager | No | **Created** |
| `/api/tenants/[id]` PATCH | Yes | admin/manager | No | **Created** |
| `/api/tenants/[id]` DELETE | Yes | admin | No | **Created** |
| `/api/properties` GET | Yes | None | No | OK (read) |
| `/api/properties` POST | Yes | admin/manager | No | OK |
| `/api/maintenance` GET | Yes | admin/manager | No | **Fixed** |
| `/api/maintenance` POST | Yes | All | No | OK |
| `/api/amenities` GET | Yes | All | No | OK |
| `/api/amenities` POST | Yes | admin/manager | No | OK |
| `/api/amenities/[id]` PATCH | Yes | admin/manager | No | **Created** |
| `/api/amenities/[id]` DELETE | Yes | admin | No | **Created** |
| `/api/payments` GET | Yes | None | No | OK (read) |
| `/api/payments` POST | Yes | admin/manager | No | OK |
| `/api/payments/[id]` GET | Yes | admin/manager | No | **Created** |
| `/api/payments/[id]` PATCH | Yes | admin/manager | No | **Created** |
| `/api/health` GET | No | N/A | N/A | OK (standard) |

---

## 4. Remaining Issues (Out of Scope for T1/T2)

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| Property model lacks `userId` foreign key | Medium | Add `userId` to Prisma schema for per-user property limits |
| No tenant isolation on list endpoints | Medium | Add `where: { userId }` or property-based filtering for tenant-scoped queries |
| `GET /api/amenities` allows all authenticated users | Low | Consider role restriction if amenities are admin-managed only |
| `GET /api/payments` allows all authenticated users | Low | Consider role restriction for financial data |
| Debug session route retains `(serverSession.user as { role?: string })` | Low | Acceptable typed cast; await full NextAuth type extension |
| `src/lib/auth.ts` session callback still uses `(session.user as any)` | Low | Non-critical; affects debug tooling only |

---

## 5. Recommendations

1. **Add `INTERNAL_API_KEY` to all environments** — including local `.env.local`
2. **Rotate `INTERNAL_API_KEY` periodically** — treat like any other secret
3. **Add audit logging** for all debug route access attempts (success + failure)
4. **Complete Property schema** — add `userId` field to enable proper per-user limits
5. **Implement tenant isolation** — ensure users can only see their own tenants/properties
6. **Add rate limiting** (T4) to prevent brute-force on newly created endpoints
7. **Schedule follow-up audit** for T3 (feature gating) and T4 (rate limiting)

---

## Sign-Off
- [x] Critical debug routes protected
- [x] Missing CRUD endpoints created
- [x] Role validation added to sensitive list endpoints
- [x] Type safety improved (removed `as any` casts)
- [ ] Fully type-safe (debug route + auth.ts session callback pending)