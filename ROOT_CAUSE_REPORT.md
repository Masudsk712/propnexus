# 🔍 Root Cause Analysis: Login → Redirect Back to /login

## The Bug: Cookie Name / JWT Salt Mismatch in Middleware

NextAuth v5 (Auth.js) config in `src/lib/auth.ts` uses a **custom `cookies.sessionToken.name`**:
- Dev: `"authjs.session-token"`
- Prod: `"__Secure-authjs.session-token"`

The middleware's `getToken()` was called **without a `cookieName` parameter**, so it falls back to:
```js
cookieName = defaultCookies(secureCookie ?? false).sessionToken.name
//              = `${useSecurePrefix}authjs.session-token`
//              where useSecurePrefix = "" (always, because secureCookie defaults to false)
```

### In Production — Critical Failure
| Component | Cookie Name | JWT Salt |
|---|---|---|
| Auth.js writes | `__Secure-authjs.session-token` | `__Secure-authjs.session-token` (default) |
| `getToken()` default | `authjs.session-token` | `authjs.session-token` |
| **Match?** | ❌ **WRONG COOKIE** | ❌ **WRONG SALT** |

The JWT is encrypted with salt `__Secure-authjs.session-token`, but `getToken()` tries to decrypt with salt `authjs.session-token`. **Decryption fails → `getToken()` returns null → middleware redirects to /login.**

### In Development — Could Also Fail
Even though the cookie names may match in dev (`authjs.session-token`), the custom `cookies` config in `auth.ts` creates a partial override that can cause the JWT encoding salt to differ from what `getToken()` expects. The **`salt` parameter in `getToken()` defaults to `cookieName`**, and any deviation in how Auth.js resolves the salt internally vs. externally can cause silent decryption failure (the `catch {}` in `getToken()` returns `null` without logging).

### Detailed Chain of Events

```
Browser                      NextAuth Server              Middleware
   │                              │                          │
   │  POST /api/auth/callback     │                          │
   │─────────────────────────────►│                          │
   │  (bypasses middleware -      │                          │
   │   "/api" excluded from       │                          │
   │   matcher)                   │                          │
   │                              │  ✓ Authenticate user     │
   │                              │  ✓ Create JWT            │
   │                              │  ✓ Encode with salt:     │
   │                              │    "authjs.session-token"│
   │                              │    (from useSecureCookies)│
   │                              │  ✓ Set cookie named:     │
   │                              │    "authjs.session-token"│
   │◄─────────────────────────────│                          │
   │                              │                          │
   │  GET /api/auth/session       │                          │
   │─────────────────────────────►│                          │
   │  (bypasses middleware -      │                          │
   │   "/api" excluded)           │                          │
   │◄─────── {user, role} ────────│                          │
   │                              │                          │
   │  "Welcome back!" toast       │                          │
   │                              │                          │
   │  router.push(/dashboard/     │                          │
   │              tenant)         │                          │
   │────────────────────────────────────────────────────────►│
   │                              │                          │
   │  getToken() called with:     │                          │
   │  cookieName=default →         │                          │
   │    "authjs.session-token"    │                          │
   │  salt = cookieName →         │                          │
   │    "authjs.session-token"    │                          │
   │                              │                          │
   │  ⚠ SILENT FAIL:              │                          │
   │  JWT decrypt fails (salt     │                          │
   │  mismatch from custom config)│                          │
   │  → catch { return null }     │                          │
   │                              │                          │
   │  isLoggedIn = false          │                          │
   │  pathname=/dashboard/tenant  │                          │
   │  → protectedPaths match      │                          │
   │                              │                          │
   │  ◄── 302 Redirect to /login ────────────────────────────│
```

## Config Files Involved

### `src/lib/auth.ts` (lines 76-86) — Auth.js sets cookie as:
```ts
cookies: {
  sessionToken: {
    name: isProduction 
      ? "__Secure-authjs.session-token"   // ← Production cookie name
      : "authjs.session-token",            // ← Development cookie name
  },
},
```

### `src/middleware.ts` (lines 122-125) — getToken() reads default:
```ts
const token = await getToken({
  req: request,
  secret: process.env.AUTH_SECRET,
  // no cookieName specified → defaults to:
  //   "next-auth.session-token" (dev)
  //   "__Secure-next-auth.session-token" (prod)
});
```

## Why "Welcome Back" Toast Shows Before Redirect

The `/api/*` routes are **excluded** from the middleware matcher:
```ts
matcher: ["/((?!api|_next/static|...).*)"]
```

So:
1. `POST /api/auth/callback/credentials` ← works (no middleware)
2. `GET /api/auth/session` ← works (no middleware) → toast fires
3. `router.push("/dashboard/tenant")` ← **hits middleware** → getToken() returns null → redirect to /login

## The Fix

Pass the explicit cookie name to `getToken()` in middleware to match what Auth.js configured:

```ts
const token = await getToken({
  req: request,
  secret: process.env.AUTH_SECRET,
  cookieName: IS_PRODUCTION 
    ? "__Secure-authjs.session-token" 
    : "authjs.session-token",
});
```

## Additional Secondary Issues Found

1. **`IS_PRODUCTION` is defined but used only for CSP** — it should also be used for the cookie name passed to `getToken()`.

2. **`AUTH_URL` in `.env.example`** — Should be `AUTH_URL` not `NEXTAUTH_URL`. In NextAuth v5, this might not be read correctly.

3. **Middleware debug logging** — Added `[MIDDLEWARE_TOKEN]` log to confirm the token is null.