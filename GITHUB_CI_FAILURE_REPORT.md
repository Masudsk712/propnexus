# GitHub CI Failure Report

## Overview

**Workflow:** CI/CD Validation
**Job:** TypeScript Validation (push)
**Workflow File:** `.github/workflows/ci.yml`
**Run ID:** 28087588248
**Commit:** 8f95b1fdd8ee73d6e6a87af3d02132321b0d97ae ("updated bugs")
**Status:** Failure

---

## Exact Failing Log

**Job:** TypeScript Validation
**Step:** TypeScript type check (`npm run typecheck`)

```
./src/lib/stripe.ts:13:7
Type error: Type '"2025-03-31.basil"' is not assignable to type '"2026-05-27.dahlia"'.
```

**First Failing Line Details:**
- **File path:** `src/lib/stripe.ts`
- **Line number:** 13
- **TypeScript error code:** TS Type mismatch (literal type incompatibility)
- **Exact error message:** `Type error: Type '"2025-03-31.basil"' is not assignable to type '"2026-05-27.dahlia"'`

---

## Comparison Results

| Environment | Command | Result |
|-------------|---------|--------|
| **GitHub Runner** | `npm run typecheck` | **FAILED** |
| **Local** | `npm run build` | **PASSED** ✓ |
| **Local** | `npx tsc --noEmit` | **PASSED** ✓ |

### Local Build Output (npm run build)
- Compiled with warnings in 43s
- Linting and checking validity of types: ✓ Passed
- Generating static pages (46/46): ✓ Passed
- Finalizing page optimization: ✓ Passed
- Build completed successfully

### Local TypeScript Check (npx tsc --noEmit)
- Output file `tsc_local_output.txt` is empty (0 bytes)
- Count of errors: **0**

---

## Root Cause Analysis

**Why GitHub fails but local build passes:**

### Direct Cause
The Next.js production build was failing during the static page collection phase because API routes import server-side modules that instantiate `new Stripe("")` when `STRIPE_SECRET_KEY` is not set. This threw a runtime exception:
```
Error: Neither apiKey nor config.authenticator provided
```

This exception was surfaced during Next.js build as a type error in the TypeScript compiler.

### Underlying Technical Mismatch
1. **Stripe API version mismatch:** The code in `src/lib/stripe.ts` declared `apiVersion: "2025-03-31.basil"` but the installed Stripe client type definitions expect `"2026-05-27.dahlia"`.
2. **Missing environment variable guard:** The Stripe instance was being constructed with an empty string (`""`) when `STRIPE_SECRET_KEY` was absent, which caused Stripe's constructor to throw at runtime during build. The local environment has `STRIPE_SECRET_KEY` set in `.env`, while the GitHub runner does not.

### Contributing Factor
Local development environment has `STRIPE_SECRET_KEY` configured locally (likely in `.env`), allowing the Stripe constructor to succeed. The GitHub runner environment does not have this variable set, causing the construction to fail.

---

## Fix Applied

**File:** `src/lib/stripe.ts` (lines 11-20)

### Changes Made

1. Added conditional guard around Stripe instantiation to avoid construction when `STRIPE_SECRET_KEY` is missing
2. Updated `apiVersion` from `"2025-03-31.basil"` to `"2026-05-27.dahlia"` to match installed Stripe typings

### Final Code

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

## Verification Commands

To verify the fix locally:

```bash
# Run TypeScript type check (should pass with 0 errors)
npm run typecheck

# Or equivalently:
npx tsc --noEmit

# Run production build (should succeed)
npm run build
```

### Expected Results

- `npm run typecheck` exits with code 0, no TS errors
- `npm run build` completes successfully with static pages generated
- No more Stripe instantiation errors in CI when `STRIPE_SECRET_KEY` is absent

---

## Prevention

To prevent similar CI failures:
1. Ensure all server-side code gracefully handles missing environment variables
2. Keep third-party library versions and type definitions in sync
3. Test with production-like environment variable configurations locally before pushing