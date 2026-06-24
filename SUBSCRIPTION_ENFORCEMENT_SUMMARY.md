# Subscription Enforcement Summary

## Implementation Overview

- **Task:** T3 + T6 — Feature-level subscription enforcement and per-user resource limits
- **Scope:** Server-side API enforcement only (UI gating is deferred)
- **Status:** Core enforcement complete; gaps documented

## What Was Changed

### New Files
- `src/lib/feature-gate.ts` — Reusable server-side feature gate helper for API routes

### Modified Files
- `src/app/api/maintenance/route.ts` — Enforces `Maintenance management`
- `src/app/api/properties/analytics/route.ts` — Enforces `Analytics dashboard`
- `src/app/api/dashboard/stats/route.ts` — Enforces `Analytics dashboard`
- `src/app/api/notifications/route.ts` — Enforces `Advanced analytics`
- `src/app/api/files/route.ts` — Enforces `Advanced analytics`
- `src/app/api/files/[id]/route.ts` — Enforces `Advanced analytics`
- `src/app/api/properties/route.ts` — Per-user property limit check
- `prisma/schema.prisma` — Added `userId` to Property; relations updated
- `prisma/seed.ts` — Seed updated for new Property relation
- `src/app/api/amenities/[id]/route.ts` — Fixed Next.js 15 `Promise<{ id: string }>` params
- `src/app/api/payments/[id]/route.ts` — Fixed Next.js 15 `Promise<{ id: string }>` params
- `src/app/api/tenants/[id]/route.ts` — Fixed Next.js 15 `Promise<{ id: string }>` params

## Features Gated

| Feature Name | Matched Tier | Enforcement Location |
|--------------|--------------|----------------------|
| Analytics dashboard | PRO | dashboard stats, property analytics |
| Advanced analytics | PRO | notifications, files, files/[id] |
| Maintenance management | PRO | maintenance list/create |

## Revenue Protection Improvements

| Risk | Mitigation |
|------|------------|
| FREE tier accessing analytics | Returns 403 from API |
| FREE tier accessing maintenance | Returns 403 from API |
| Global property limit blocking honest users | Changed to per-user count |
| Admin/manager role bypass without subscription | Feature gate runs after role check |

## Remaining Gaps

| Gap | Tier | Action Required |
|-----|------|-----------------|
| Amenities list/create | PRO | Add `requireFeature("Vendor management")` |
| Tenant list | FREE/PRO | Decide if tenant listing is gated |
| Dedicated export endpoints | PRO | Implement `/api/export/*` and gate `Export features` |
| Bulk operation endpoints | PRO | Implement and gate `Bulk operations` |
| AI features endpoints | BUSINESS | Not yet implemented |
| Premium reports endpoints | BUSINESS | Not yet implemented |
| Frontend UI gating | ALL | Wrap admin components with feature gate |

## Architecture Notes

- Enforced via `requireFeature()` which returns either a `NextResponse` (403/401) or a valid session object.
- Uses existing `hasFeature()` from `src/services/subscription.service.ts`.
- Keeps role checks separate from feature checks; both must pass.
- Per-user property counting now uses `prisma.property.count({ where: { userId } })`.