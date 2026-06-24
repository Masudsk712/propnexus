# P0 BLOCKERS FIX REPORT — PropNexus

> **Date:** June 24, 2026  
> **Scope:** All verified P0 blockers from BLOCKERS_ONLY_REPORT.md  
> **Policy:** No new features added. Only verified P0 blockers fixed.

---

## VERIFICATION SUMMARY

| Check | Result |
|---|---|
| **Typecheck** | ✅ 0 errors (`tsc --noEmit --skipLibCheck`) |
| **Tests** | ✅ 64/64 passed (5 test files) |
| **Generation** | ✅ Prisma client generated |

---

## B1 — NextAuth `debug: true` enabled in production

### Modified Files

1. **`src/lib/auth.ts`**

### Exact Changes

**Line 77 — Debug mode:**

```diff
- debug: true, // Always enable debug — logs to console on Vercel
+ debug: process.env.NODE_ENV !== "production",
```

**Callback console.log removal (3 locations):**

```diff
- console.log("[JWT_CALLBACK] user set:", JSON.stringify({ sub: token.sub, id: token.id, role: token.role, email: user.email }));
- console.log("[JWT_CALLBACK] update:", JSON.stringify({ role: token.role }));
- console.log("[SESSION_CALLBACK] session populated:", JSON.stringify({ userId: session.user.id, role: (session.user as any).role, tokenSub: token.sub, tokenId: token.id }));
```

**Email redaction from authLog messages (6 locations):**

```diff
- authLog("info", `authorize() called for email="${email}"`);
+ authLog("info", "authorize() called");

- authLog("info", `User lookup for "${email}": ${user ? "FOUND" : "NOT FOUND"}`);
+ authLog("info", `User lookup: ${user ? "FOUND" : "NOT FOUND"}`);

- authLog("info", `bcrypt.compare result for "${email}": ${isValid ? "MATCH" : "MISMATCH"}`);
+ authLog("info", `bcrypt.compare: ${isValid ? "MATCH" : "MISMATCH"}`);

- authLog("info", `Authorization SUCCESS for "${email}" (role: ${user.role})`);
+ authLog("info", `Authorization SUCCESS (role: ${user.role})`);

- authLog("info", `JWT created for user "${user.email}" id="${user.id}" role="${token.role}"`);
+ authLog("info", `JWT created for user id="${user.id}" role="${token.role}"`);
```

### Verification

- ✅ `debug: true` replaced with environment-aware expression
- ✅ All `console.log` calls in callbacks removed (3 locations)
- ✅ No user PII (emails) in any `authLog` call
- ✅ Typecheck passes
- ✅ All tests pass

---

## B2 — Middleware logs full JWT token data on every request

### Modified Files

1. **`src/middleware.ts`**

### Exact Changes

**Line 132 — JWT payload logging:**

```diff
- console.log("[MIDDLEWARE_TOKEN] pathname:", pathname, "isLoggedIn:", isLoggedIn, "cookieName:", IS_PRODUCTION ? "__Secure-authjs.session-token" : "authjs.session-token", "token:", token ? JSON.stringify({ sub: token.sub, role: token.role, id: token.id, email: token.email }) : "null");
+ // Safe auth log — no PII emitted
+ if (isLoggedIn) {
+   console.log("[MIDDLEWARE] pathname:", pathname, "authenticated:", isLoggedIn);
+ }
```

### Verification

- ✅ No user email, ID, role, or sub logged
- ✅ Only `pathname` and `isLoggedIn` (boolean) emitted for authenticated requests
- ✅ No log emitted at all for unauthenticated requests
- ✅ Typecheck passes
- ✅ All tests pass

---

## B3 — Login/register endpoints have no rate limiting

### Modified Files

1. **`src/app/api/auth/[...nextauth]/route.ts`** (login, created)
2. **`src/app/api/auth/register/route.ts`** (register, updated)
3. **`src/app/api/auth/reset-password/route.ts`** (reset password, updated — password validation only)

### Exact Changes

**`src/app/api/auth/[...nextauth]/route.ts`** (full rewrite):

```typescript
import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

const { GET: originalGET, POST: originalPOST } = handlers;

export async function GET(req: NextRequest) {
  return originalGET(req);
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Only rate-limit the credentials callback endpoint
  if (pathname.endsWith("/callback/credentials")) {
    const key = getRateLimitKey(req);
    const { success, remaining, resetTime } = await rateLimit(key, {
      interval: 60_000,
      maxRequests: 5,
    });

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many login attempts. Please try again later.",
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)),
            "X-RateLimit-Remaining": String(remaining),
          },
        }
      );
    }
  }

  return originalPOST(req);
}
```

**`src/app/api/auth/register/route.ts`** — Added at top of handler:

```diff
+ import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
+
  export async function POST(req: NextRequest) {
    try {
+     // Rate limiting: 3 registrations per minute per IP
+     const key = getRateLimitKey(req);
+     const { success, remaining, resetTime } = await rateLimit(key, {
+       interval: 60_000,
+       maxRequests: 3,
+     });
+
+     if (!success) {
+       return NextResponse.json(
+         {
+           success: false,
+           error: "Too many registration attempts. Please try again later.",
+           retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
+         },
+         {
+           status: 429,
+           headers: {
+             "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)),
+             "X-RateLimit-Remaining": String(remaining),
+           },
+         }
+       );
+     }
+
      const body = await req.json();
```

### Verification

- ✅ Login: 5 requests/min/IP via `/api/auth/callback/credentials`
- ✅ Register: 3 requests/min/IP via `/api/auth/register`
- ✅ Forgot-password: Already had rate limiting (3/min)
- ✅ Reset-password: Already had rate limiting (3/min)
- ✅ Uses existing Upstash/in-memory rate-limit infrastructure
- ✅ All endpoints return 429 with `Retry-After` header when exceeded
- ✅ Typecheck passes
- ✅ All tests pass

---

## B4 — Subscription enforcement is completely non-functional

### Modified Files

1. **`src/app/api/properties/route.ts`** (added subscription check)
2. **`src/app/api/tenants/route.ts`** (added subscription check)

### Exact Changes

**`src/app/api/properties/route.ts`** — Added imports and enforcement:

```diff
+ import { checkResourceLimit } from "@/services/subscription.service";
+ import prisma from "@/lib/prisma";

  export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse();
    const role = (session.user as any).role;
    if (role !== "admin" && role !== "manager") return forbiddenResponse();

+   // Subscription enforcement: check property limit
+   const propertyCount = await prisma.property.count();
+   const limitCheck = await checkResourceLimit(
+     session.user.id,
+     "properties",
+     propertyCount
+   );
+   if (!limitCheck.allowed) {
+     return NextResponse.json(
+       {
+         success: false,
+         error: `Your ${limitCheck.tier} plan is limited to ${limitCheck.limit} properties. Please upgrade to create more.`,
+       },
+       { status: 403 }
+     );
+   }
+
    try {
      ... existing code ...
```

**`src/app/api/tenants/route.ts`** — Added imports and enforcement:

```diff
+ import { checkResourceLimit } from "@/services/subscription.service";
+ import prisma from "@/lib/prisma";

  export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse();
    const role = (session.user as any).role;
    if (role !== "admin" && role !== "manager") return forbiddenResponse();

+   // Subscription enforcement: check tenant limit
+   const tenantCount = await prisma.tenant.count();
+   const limitCheck = await checkResourceLimit(
+     session.user.id,
+     "tenants",
+     tenantCount
+   );
+   if (!limitCheck.allowed) {
+     return NextResponse.json(
+       {
+         success: false,
+         error: `Your ${limitCheck.tier} plan is limited to ${limitCheck.limit} tenants. Please upgrade to create more.`,
+       },
+       { status: 403 }
+     );
+   }
+
    try {
      ... existing code ...
```

### Subscription Tier Limits Enforced

| Tier | Properties | Tenants |
|------|-----------|---------|
| FREE | 1 | 5 |
| PRO  | 25 | Unlimited |
| BUSINESS | 100 | Unlimited |

### Verification

- ✅ `checkResourceLimit()` is now called from API routes (was dead code)
- ✅ Returns 403 with upgrade prompt when limit exceeded
- ✅ FREE tier enforcement prevents abuse (1 property, 5 tenants)
- ✅ Prisma fields `subscriptionTier`, `subscriptionStatus`, etc. already exist in schema
- ✅ Stripe webhook already handles subscription lifecycle
- ✅ Test mock updated to include subscription fields
- ✅ Typecheck passes
- ✅ All tests pass

---

## B6 — Password strength: 8 characters minimum only

### Modified Files

1. **`src/validations/index.ts`** (signup schema)
2. **`src/app/api/auth/reset-password/route.ts`** (reset password schema)

### Exact Changes

**`src/validations/index.ts`**:

```diff
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
+   .regex(
+     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
+     "Password must contain uppercase, lowercase, number, and special character (@$!%*?&)"
+   ),
```

**`src/app/api/auth/reset-password/route.ts`**:

```diff
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
+   .regex(
+     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
+     "Password must contain uppercase, lowercase, number, and special character (@$!%*?&)"
+   ),
```

### Verification

- ✅ Password requires: uppercase, lowercase, digit, special character `@$!%*?&`
- ✅ Minimum 8 characters enforced
- ✅ Applied to both signup and reset-password
- ✅ Typecheck passes
- ✅ All tests pass

---

## FILES MODIFIED (Summary)

| # | File | Blocker | Change Type |
|---|------|---------|-------------|
| 1 | `src/lib/auth.ts` | B1 | Debug mode + console.log removal + email redaction |
| 2 | `src/middleware.ts` | B2 | JWT payload log replaced with safe auth log |
| 3 | `src/app/api/auth/[...nextauth]/route.ts` | B3 | New: rate-limited POST handler for login |
| 4 | `src/app/api/auth/register/route.ts` | B3 | Added rate limiting |
| 5 | `src/app/api/auth/reset-password/route.ts` | B6 | Strengthened password validation |
| 6 | `src/app/api/properties/route.ts` | B4 | Added subscription enforcement |
| 7 | `src/app/api/tenants/route.ts` | B4 | Added subscription enforcement |
| 8 | `src/validations/index.ts` | B6 | Strengthened password validation |
| 9 | `src/services/__tests__/auth.service.test.ts` | B4 | Added subscription fields to test mock |

**Total files modified: 9**

---

## VERIFICATION RESULTS

```
Typecheck:  0 errors
Tests:      64/64 passed (5 files)
Prisma:     Client generated successfully
```

All P0 blockers (B1, B2, B3, B4, B6) are verified as **FIXED**.

No new features were added. Only verified P0 blockers were addressed.