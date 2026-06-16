# Root-Cause Report — Production Database Timeout & Auth Failure

**Date:** 2026-06-16  
**Environment:** Vercel Production  
**Incident:** `/api/health` returns 504, login fails, `/api/debug/auth` returns 404

---

## 1. Current Debug Endpoints Created

### `GET /api/debug/ping` (NEW)
- **Purpose:** Ultra-lightweight environment check (no Prisma instantiation)
- **Returns:**
  ```json
  { "envLoaded": true, "databaseUrlExists": !!process.env.DATABASE_URL }
  ```
- **Why:** Isolates whether the environment itself loads and whether `DATABASE_URL` is present — no dependency on Prisma or DB connection.

### `GET /api/debug/db` (NEW)
- **Purpose:** Tests actual database connectivity using a fresh PrismaClient
- **Returns:**
  ```json
  { "connected": true, "count": X }
  ```
- On error, returns full Prisma error including `message`, `name`, `stack`, `cause`.

### `GET /api/debug/auth` (EXISTING — was returning 404)
- **Path verified:** `src/app/api/debug/auth/route.ts` exists and exports `GET`
- **Root cause of 404:** Likely the route file is present but either:
  - Vercel deployment did not include it (cache/stale build)
  - Route path is incorrect relative to the `app` router structure

---

## 2. Changes Made to `src/lib/prisma.ts`

### ✅ Query Timeout Logging
Added `client.$use()` middleware that logs warnings for any query taking > 5 seconds:
```ts
client.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;
  if (duration > 5000) {
    console.warn(`[PRISMA] SLOW QUERY (${duration}ms): model=${params.model}`);
  }
  return result;
});
```

### ✅ DATABASE_URL Hostname Logging
```ts
const hostnameMatch = dbUrl.match(/@([^/]+)/);
console.log(`[PRISMA] Database hostname: ${hostnameMatch[1]}`);
```

### ✅ PrismaClient Initialization Timing
Added `initStart` timestamp and logs final timing:
```ts
console.log(`[PRISMA] Client initialized in ${initDuration}ms`);
console.log("[PRISMA] INIT OK — PrismaClient constructor did not hang (synchronous)");
```

### ✅ DATABASE_URL Validation
Added validation log:
```ts
console.log(`[PRISMA] DATABASE_URL used by Prisma: ${dbUrl.startsWith("mongodb") ? "starts with mongodb:// or mongodb+srv:// ✓" : "INVALID PREFIX ✗"}`);
```

### ✅ Query-level Logging
Enabled `query` level in Prisma log config for additional visibility.

---

## 3. Hypothesis: Root Cause of 504 Timeout

### Exact Failing Line
**File:** `src/lib/prisma.ts` → **Line 34** (original) / Line 56 (updated)

```ts
const client = new PrismaClient({
    log: ["warn", "error"],
    datasources: { db: { url: dbUrl } },
});
```

### Why It Hangs
`PrismaClient` constructor itself is **synchronous** and should not hang. However, the **first actual database query** (e.g., `$runCommandRaw({ ping: 1 })` on line 34, or `prisma.$runCommandRaw({ ping: 1 })` in the health check on line 48) triggers the MongoDB driver connection internally.

### Likely Causes (ranked):
1. **DNS resolution failure** — The MongoDB Atlas hostname in `DATABASE_URL` may not resolve from Vercel's runtime environment.
2. **Network egress block** — Vercel serverless functions in `bom1` region cannot reach `cluster0.xxxxx.mongodb.net:27017` (firewall / IP whitelist / Atlas network access).
3. **Connection pool exhaustion** — Multiple instances all trying to connect simultaneously cause driver-level timeout.
4. **Stale Prisma engine** — Binary engine might not match the runtime architecture on Vercel.

### `/api/health` 504 Explanation
The health endpoint imports `prisma` from `@/lib/prisma`, which executes `createPrismaClient()` at **module load time** (line 57). If the constructor or immediate `ping` call hangs, the **entire serverless function times out** (Vercel's 30-second `maxDuration`).

### `/api/debug/auth` 404 Explanation
The route file exists at `src/app/api/debug/auth/route.ts` but likely not deployed to Vercel due to:
- A **stale build cache** (Vercel sometimes caches old function bundles)
- **Only this specific deploy** didn't include the auth route (add/commit/deploy cycle missed it)

---

## 4. Verification Steps (After Deploy)

1. **Hit `GET /api/debug/ping`** — confirms env loading, `DATABASE_URL` existence
2. **Check Vercel Function Logs** — look for:
   - `[PRISMA] Creating PrismaClient with DATABASE_URL: ...` (env var is loaded)
   - `[PRISMA] Database hostname: cluster0.xxxxx.mongodb.net` (DNS target)
   - `[PRISMA] MongoDB connection ping SUCCESSFUL / FAILED` (connectivity)
   - `[PRISMA] Client initialized in Xms` (init performance)
3. **Hit `GET /api/debug/db`** — if ping succeeds but this times out, it's a query-specific issue (permissions, collection access)
4. **Compare masked DATABASE_URL** with Vercel project environment variable to ensure they match

---

## 5. Quick Fix Options

| Option | Description | Effort |
|--------|-------------|--------|
| **A** | Add `mongodb.net` to Vercel's allowed outbound IPs / ensure Atlas network access includes `0.0.0.0/0` (already done per facts) | ⏱️ Immediate |
| **B** | Set `DATABASE_URL` to a replica set string (use `replicaSet=` parameter) for MongoDB Atlas | ⏱️ 5 min |
| **C** | Remove immediate `ping` from `createPrismaClient()` — make it lazy, avoid hanging module load | ⏱️ 2 min |
| **D** | Increase `maxDuration` in `vercel.json` from 30 to 60 seconds for debug routes | ⏱️ 1 min |

**Recommended:** Deploy this branch, hit `/api/debug/ping` first, then `/api/debug/db`. Check Vercel logs for the `[PRISMA]` prefixed lines to pinpoint exact failure.