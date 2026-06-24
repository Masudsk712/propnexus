# Final CI Failure Report

## Overview

**Workflow:** CI/CD Validation / TypeScript Validation (push)
**Latest Failed Run ID:** 28087588248
**Commit at Time of Failure:** `8f95b1f` ("updated bugs")
**Repository:** Masudsk712/propnexus
**Report Date:** 2026-06-24

---

## Exact Failing Log

**Source:** GitHub Actions run #28087588248 (TypeScript Validation job)

```
./src/lib/stripe.ts:13:7
Type error: Type '"2025-03-31.basil"' is not assignable to type '"2026-05-27.dahlia"'.
```

### Extracted Details

| Field | Value |
|-------|-------|
| **File path** | `src/lib/stripe.ts` |
| **Line number** | 13 |
| **Error code** | TS literal type mismatch (TypeScript compiler error) |
| **Exact error message** | `Type error: Type '"2025-03-31.basil"' is not assignable to type '"2026-05-27.dahlia"'.` |

---

## Failure Classification

**Category:** `old cached Stripe error`

This is NOT:
- ❌ new TypeScript error (fix already applied in code)
- ❌ workflow configuration issue
- ❌ missing environment variable
- ❌ Node version mismatch

It is a **stale cached build from the previous commit (`8f95b1f`)** before the Stripe API version fix was pushed.

---

## Comparison: Local vs GitHub

| Environment | Command | Result | Notes |
|-------------|---------|--------|-------|
| **GitHub Runner** | `npm run typecheck` | FAILED | Ran on commit `8f95b1f` - old code with `"2025-03-31.basil"` |
| **Local HEAD** | `npm run typecheck` | PASSED | Current code `481da7e` already includes the fix |
| **Local HEAD** | `npx tsc --noEmit` | PASSED | 0 TypeScript errors |

### Current Local Code (src/lib/stripe.ts:11-20)
```typescript
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
      appInfo: {
        name: "Unified Property Management",
        version: "1.0.0",
      },
    })
  : ({} as InstanceType<typeof Stripe>);
```

---

## Root Cause Analysis

### Direct Cause
The GitHub Actions run #28087588248 executed on commit `8f95b1f` ("updated bugs"), which still contained the outdated Stripe API version literal `"2025-03-31.basil"` in `src/lib/stripe.ts`. The installed Stripe type definitions expect `"2026-05-27.dahlia"`, causing a TypeScript compile-time error.

### Why GitHub Still Failed Despite Local Fix
1. **Sequential commits pushed after fix:** Fix commit `d2640a8` ("fix: guard Stripe instantiation when env var is missing") was pushed locally *after* the failing commit `8f95b1f` but *before* the current HEAD.
2. **CI run was already queued:** By the time the fix was pushed to GitHub, CI run #28087588248 was already in progress/queued for the old commit (`8f95b1f`).
3. **No subsequent CI run exists in runs.json:** The `runs.json` file shows only two runs (IDs `28087588248` and `28083402084`), both failing on older commits.
4. **Latest commit `481da7e` triggers new CI:** The commit `chore: trigger ci validation` was deliberately pushed to start a fresh validation run with the fixed code.

---

## Fix Applied

**Commit:** `d2640a8`
**File:** `src/lib/stripe.ts`

### Changes
1. Replaced hardcoded Stripe API version `"2025-03-31.basil"` with `"2026-05-27.dahlia"` to match installed `stripe` client type definitions.
2. Wrapped Stripe instantiation in a `process.env.STRIPE_SECRET_KEY` guard to avoid runtime constructor errors when the environment variable is missing (GitHub runner scenario).

**Verified in current HEAD (`481da7e`):**
```typescript
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
      appInfo: {
        name: "Unified Property Management",
        version: "1.0.0",
      },
    })
  : ({} as InstanceType<typeof Stripe>);
```

---

## Verification Results

### Local Build
- `npm run typecheck` — **PASSED** (0 errors)
- `npx tsc --noEmit` — **PASSED** (0 errors)
- `npm run build` — **PASSED** (validated in prior run)

### Code State at HEAD (`481da7e`)
- `src/lib/stripe.ts:13` now correctly uses `"2026-05-27.dahlia"`
- Stripe instantiation is conditionally guarded for missing env vars

---

## Expected GitHub Actions Status After Rerun

Commit `481da7e` ("chore: trigger ci validation") has been pushed with the fixed code. A fresh CI run should:

- **Job:** TypeScript Validation
- **Step:** `npm run typecheck`
- **Expected Result:** ✅ **SUCCESS** — 0 TypeScript errors
- **Expected Overall Status:** ✅ **PASSING**

If a new run does not appear within 2 minutes of the commit push, verify that the workflow is correctly triggered by pushes to `main` in `.github/workflows/ci.yml`.

---

## Prevention Recommendations

1. **Pin or validate Stripe API version at build time** — add a script or test to assert `apiVersion` matches installed `stripe` module expectations.
2. **Run `npm run typecheck` locally before pushing commits** that touch server-side code.
3. **Guard all third-party SDK instantiation** against missing environment variables when the code may execute during Next.js static analysis/build.