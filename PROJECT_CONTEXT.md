# PropertyPro — Unified Property Management Platform
## Complete Project Context for AI Agents

---

# PROJECT OVERVIEW

# PROJECT NAME
PropertyPro (formerly Unified Property Management)

# PROJECT PURPOSE
Enterprise-grade property management SaaS platform enabling landlords, property managers, and tenants to manage properties, tenants, maintenance requests, amenity bookings, and rent payments in a single unified dashboard. The platform handles the full property lifecycle from listing to lease termination, including automated billing via Stripe.

# TARGET USERS
1. **Property Owners / Landlords** — Primary users. Manage portfolio of properties, tenants, and finances.
2. **Property Managers** — Secondary admin users. Similar capabilities to owners but potentially scoped.
3. **Tenants** — End consumers. Submit maintenance requests, view invoices, pay rent, book amenities.

# MAIN BUSINESS GOALS
1. Centralize property management operations (CRM-style for real estate)
2. Automate rent collection and payment processing
3. Digitize maintenance request lifecycle
4. Enable amenity/booking management
5. Provide real-time analytics and reporting dashboards
6. Charge subscription fees (FREE/PRO/BUSINESS tiers) and transaction fees on rent payments

---

# TECH STACK

| Layer | Technology | Version |
|---|---|---|
| **Frontend Framework** | Next.js (App Router) | 15.5.7 |
| **Frontend Runtime** | React | 19.2.1 |
| **Language** | TypeScript | 5.9.3 |
| **Backend** | Next.js API Routes (serverless) | — |
| **Database** | MongoDB Atlas | via Prisma |
| **ORM** | Prisma Client | 5.22.0 |
| **Authentication** | NextAuth v5 (Auth.js) | 5.0.0-beta.31 |
| **State Management** | Zustand (UI state) + TanStack Query (server state) | 5.0.9 / 5.85.1 |
| **UI Framework** | Tailwind CSS | 4.1.18 |
| **Animations** | Framer Motion | 12.26.1 |
| **Icons** | Lucide React | 0.553.0 |
| **Forms** | React Hook Form + Zod | 7.66.0 / 4.1.13 |
| **Charts** | Recharts | 2.15.4 |
| **File Uploads** | Cloudinary | 2.10.0 |
| **Payments** | Stripe | 22.2.1 |
| **Email** | Resend | 6.12.4 |
| **Real-time** | Socket.IO | 4.8.3 |
| **Error Tracking** | Sentry | 10.57.0 |
| **Notifications** | Sonner + in-app notification system | 2.0.7 |
| **Dark Theme** | next-themes | 0.4.6 |
| **Testing** | Vitest | 4.1.9 |
| **Deployment** | Vercel | — |
| **CI/CD** | GitHub Actions + Vercel auto-deploy | — |

---

# FOLDER STRUCTURE ANALYSIS

```
c:\Users\CCS\REAL_ESTATE/
├── prisma/
│   ├── schema.prisma          # MongoDB Prisma schema — 12 models
│   └── seed.ts                # Database seed script
├── public/
│   ├── manifest.json          # PWA manifest
│   └── [favicon/og assets]    # Static assets
├── scripts/
│   ├── deploy.sh              # Bash deployment script
│   ├── deploy.ps1             # PowerShell deployment script
│   ├── init-replica-set.ts    # MongoDB replica set initialization
│   └── validate-env.ts        # Environment variable validator
├── src/
│   ├── app/                   # Next.js App Router (pages + API routes)
│   │   ├── layout.tsx         # Root HTML layout (Providers wrapper)
│   │   ├── page.tsx           # Public landing page
│   │   ├── globals.css        # Global styles + CSS variables
│   │   ├── (auth)/            # Auth route group (no layout inference)
│   │   │   ├── layout.tsx     # Auth-specific layout (maybe simpler header)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── (dashboard)/       # Protected dashboard route group
│   │   │   ├── layout.tsx     # Dashboard shell (sidebar + navbar)
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx             # Role-based default
│   │   │   │   ├── _charts/            # Recharts components
│   │   │   │   ├── admin/page.tsx      # Admin-only dashboard
│   │   │   │   ├── manager/page.tsx    # Manager-only dashboard
│   │   │   │   ├── tenant/page.tsx     # Tenant-only dashboard
│   │   │   │   └── analytics/page.tsx  # Analytics sub-page
│   │   │   ├── properties/
│   │   │   │   ├── page.tsx            # Property list
│   │   │   │   ├── add/page.tsx        # Create property
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # Property detail
│   │   │   │       └── edit/page.tsx   # Edit property
│   │   │   ├── tenants/
│   │   │   │   ├── page.tsx            # Tenant list
│   │   │   │   └── add/page.tsx        # Create tenant
│   │   │   ├── maintenance/
│   │   │   │   ├── page.tsx            # Maintenance request list
│   │   │   │   └── create/page.tsx     # Create request
│   │   │   ├── amenities/
│   │   │   │   ├── page.tsx            # Amenity list
│   │   │   │   └── bookings/page.tsx   # Booking calendar/list
│   │   │   ├── bookings/               # Separate bookings section
│   │   │   ├── payments/page.tsx       # Payment history / processing
│   │   │   ├── notifications/page.tsx  # In-app notifications
│   │   │   └── settings/page.tsx       # User settings
│   │   └── api/               # REST API routes (serverless functions)
│   │       ├── health/route.ts          # Health check (monitoring)
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts  # NextAuth entry point (rate-limited)
│   │       │   ├── register/route.ts        # Manual registration (with password)
│   │       │   ├── forgot-password/route.ts # Password reset request
│   │       │   ├── reset-password/route.ts  # Password reset confirmation
│   │       │   ├── update-password/route.ts # Change password
│   │       │   └── update-profile/route.ts  # Update profile
│   │       ├── properties/route.ts           # GET list, POST create
│   │       ├── properties/[id]/route.ts     # GET detail, PATCH update, DELETE
│   │       ├── properties/analytics/route.ts # Property analytics (sums, breakdowns)
│   │       ├── tenants/route.ts             # GET list, POST create
│   │       ├── maintenance/route.ts         # GET list, POST create
│   │       ├── maintenance/[id]/route.ts    # GET detail, PATCH update, DELETE
│   │       ├── amenities/route.ts           # GET list, POST create
│   │       ├── bookings/route.ts            # GET list, POST create
│   │       ├── bookings/[id]/route.ts       # GET detail, PATCH, DELETE
│   │       ├── payments/route.ts            # GET payment list
│   │       ├── rent/
│   │       │   ├── invoices/route.ts        # GET tenant invoices
│   │       │   ├── payments/route.ts        # GET payment history
│   │       │   └── checkout/route.ts        # Stripe checkout session for rent
│   │       ├── stripe/
│   │       │   ├── checkout/route.ts        # Subscription Stripe checkout
│   │       │   ├── portal/route.ts          # Stripe billing portal
│   │       │   └── webhook/route.ts         # Stripe webhooks (subscriptions + payments)
│   │       ├── notifications/route.ts       # GET user notifications, mark read
│   │       ├── files/route.ts               # File upload handler
│   │       ├── files/[id]/route.ts          # Delete/update file
│   │       ├── upload/route.ts              # Direct upload endpoint
│   │       ├── dashboard/stats/route.ts     # Aggregate dashboard statistics
│   │       ├── socketio/route.ts            # Socket.IO handler
│   │       └── debug/                       # Debug endpoints (auth, db, ping, session)
│   ├── components/
│   │   ├── ui/                 # Reusable base UI (shadcn/ui-inspired)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx / modal.tsx
│   │   │   ├── input.tsx / select.tsx
│   │   │   ├── badge.tsx / status-chip.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── data-table.tsx / table.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── kpi-card.tsx / stat-card.tsx
│   │   │   └── [other primitives]
│   │   ├── forms/              # Shared form building blocks
│   │   │   ├── form-field-wrapper.tsx
│   │   │   ├── form-section.tsx
│   │   │   ├── form-stepper.tsx
│   │   │   ├── form-actions.tsx
│   │   │   ├── file-upload.tsx
│   │   │   ├── form-success-state.tsx
│   │   │   └── index.ts
│   │   ├── auth/               # Auth pages/components
│   │   │   ├── auth-card.tsx
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   ├── forgot-password-form.tsx
│   │   │   └── reset-password-form.tsx
│   │   ├── properties/         # Property-specific UI
│   │   │   ├── property-card.tsx
│   │   │   ├── property-form.tsx
│   │   │   ├── property-details-tabs.tsx
│   │   │   ├── property-filters.tsx
│   │   │   ├── property-stats-bar.tsx
│   │   │   ├── property-quick-actions.tsx
│   │   │   ├── property-card-skeleton.tsx
│   │   │   └── image-upload.tsx
│   │   ├── tenants/
│   │   │   └── tenant-form.tsx
│   │   ├── rent/
│   │   │   └── PayRentButton.tsx
│   │   └── shared/             # Layout-wide components
│   │       ├── sidebar.tsx
│   │       ├── navbar.tsx
│   │       ├── error-boundary.tsx
│   │       ├── breadcrumbs.tsx
│   │       ├── page-header.tsx
│   │       ├── dashboard-widget.tsx
│   │       ├── dashboard-chart-card.tsx
│   │       ├── notification-center.tsx
│   │       ├── activity-timeline.tsx
│   │       ├── activity-feed.tsx
│   │       ├── quick-actions-panel.tsx
│   │       ├── file-uploader.tsx
│   │       └── data-table/     # Advanced table components
│   │           ├── index.ts
│   │           ├── bulk-action-bar.tsx
│   │           ├── table-column-toggle.tsx
│   │           ├── table-empty-state.tsx
│   │           ├── table-pagination.tsx
│   │           └── table-toolbar.tsx
│   ├── lib/
│   │   ├── prisma.ts           # Prisma singleton client
│   │   ├── auth.ts             # NextAuth configuration (v5)
│   │   ├── auth-helpers.ts     # Response helpers (unauthorizedResponse, etc.)
│   │   ├── auth-helpers.ts     # Auth utility functions
│   │   ├── rate-limit.ts       # Upstash Redis rate limiter
│   │   ├── socket-server.ts    # Socket.IO server logic
│   │   ├── socket-types.ts     # Socket.IO event types
│   │   ├── stripe.ts           # Stripe client + webhook helpers
│   │   ├── cloudinary.ts       # Cloudinary upload utilities
│   │   ├── email.ts            # Resend email service
│   │   ├── sentry.ts           # Sentry error tracking setup
│   │   ├── env.ts              # Environment variable validator
│   │   ├── errors.ts           # Custom error classes
│   │   ├── logger.ts           # Structured logging utility
│   │   ├── cache.ts            # Caching utilities
│   │   ├── file-validations.ts # File type/size validators
│   │   ├── utils.ts            # General helpers (cn, etc.)
│   │   └── __tests__/          # Unit tests for lib utilities
│   ├── services/
│   │   ├── auth.service.ts     # Auth business logic
│   │   ├── subscription.service.ts # Subscription limit checks
│   │   ├── file.service.ts     # File upload orchestration
│   │   ├── index.ts            # Central export + service wrappers
│   │   └── __tests__/          # Unit tests for services
│   ├── repositories/
│   │   └── index.ts            # Data-access layer (Prisma wrappers)
│   ├── hooks/
│   │   ├── useApi.ts           # TanStack Query hooks for all entities
│   │   ├── useAuth.ts          # Auth-related custom hooks
│   │   ├── useFileUpload.ts    # Cloudinary upload hook
│   │   ├── useRealtime.ts      # Real-time event hooks
│   │   └── useSocket.ts        # Socket.IO client hook
│   ├── store/
│   │   └── index.ts            # Zustand stores (UI + Notifications)
│   ├── styles/
│   │   └── design-tokens.ts    # CSS custom properties / theme config
│   ├── types/
│   │   └── index.ts            # All TypeScript interfaces + type aliases
│   ├── validations/
│   │   └── index.ts            # Zod schemas for all API inputs
│   └── data/
│       └── mock.ts             # Mock data for dev
├── .env.example               # Environment variable reference
├── .env                       # (gitignored) Local secrets
├── .gitignore
├── next.config.ts             # Next.js configuration (images, redirects)
├── tsconfig.json              # TypeScript config (paths: @/* → src/*)
├── postcss.config.mjs         # PostCSS (Tailwind v4)
├── vitest.config.ts           # Vitest configuration
├── prisma.config.ts           # Prisma singleton config
├── vercel.json                # Vercel deployment config
├── server.ts                  # Custom Node.js server (for WebSocket self-hosted)
├── package.json               # Dependencies + scripts
├── instrumentation.ts         # OpenTelemetry instrumentation (Sentry)
├── sentry.client.config.ts    # Sentry client SDK config
├── sentry.server.config.ts    # Sentry server SDK config
├── middleware.ts              # Next.js Edge Middleware (auth + security headers)
├── smoke-test.cjs             # Smoke test runner
├── smoke-test-results.json    # Smoke test history
├── test-setup.ts              # Vitest setup file
└── [report files]             # Various audit and CI failure reports
```

---

# ARCHITECTURE

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Client Browser                         │
│          https://propertypro.vercel.app                   │
└──────────────────┬───────────────────────────────────────┘
                   │ HTTPS
                   ▼
┌──────────────────────────────────────────────────────────┐
│              Vercel Edge + Serverless Functions           │
│  ┌────────────────────────────────────────────────────┐  │
│  │           Next.js App Router (src/app)             │  │
│  │  ┌──────────────┐  ┌─────────────────────────┐    │  │
│  │  │ Server       │  │  API Routes (REST)       │    │  │
│  │  │ Components   │  │  - Auth                 │    │  │
│  │  │ (SSR)        │  │  - Properties           │    │  │
│  │  │              │  │  - Tenants              │    │  │
│  │  └──────────────┘  │  - Maintenance          │    │  │
│  │                    │  - Payments              │    │  │
│  │  Client Components │  - Stripe webhooks      │    │  │
│  │  (CSR)             │  - Dashboard stats      │    │  │
│  │                    │  - Uploads               │    │  │
│  │                    └──────────┬──────────────┘    │  │
│  └──────────────────────────────────┬─────────────────┘  │
│                                     │                    │
│  ┌──────────────────────────────────▼─────────────────┐  │
│  │           NextAuth v5 (Session + JWT)              │  │
│  └─────────────────────────────────────────────────────┘  │
│                                     │                    │
│  ┌──────────────────────────────────▼─────────────────┐  │
│  │           Repository Layer → Prisma ORM            │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────┬────────────────────┘
                                      │ TLS
                  ┌───────────────────┼───────────────────┐
                  │                   ▼                   │
                  │    MongoDB Atlas (Database)          │
                  │    - users, properties, tenants      │
                  │    - maintenance, bookings           │
                  │    - payments, invoices              │
                  │    - notifications, activity_logs    │
                  └───────────────────────────────────────┘

                  ┌─────────────────────────────────────┐
                  │    Cloudinary (Image CDN)           │
                  │    - Property photos, documents      │
                  └─────────────────────────────────────┘

                  ┌─────────────────────────────────────┐
                  │    Stripe (Payments)                 │
                  │    - Subscriptions + rent collection │
                  └─────────────────────────────────────┘
```

## Layered Architecture Pattern

The codebase follows a strict **4-layer architecture**:

1. **Routes Layer** (`src/app/api/*/route.ts`) — HTTP handlers, auth checks, request validation
2. **Service Layer** (`src/services/`) — Business logic orchestration (wraps repositories)
3. **Repository Layer** (`src/repositories/`) — Optimized data access (Prisma wrappers with selective field projection)
4. **Database Layer** — MongoDB Atlas via Prisma Client

Additionally:
- **Validation Layer** (`src/validations/`) — Zod schemas for all inputs
- **Provider Layer** (`src/providers/`) — React context providers (Session, Theme, Query, Toaster)
- **Store Layer** (`src/store/`) — Zustand for client-side UI state

---

# DATABASE SCHEMA EXPLANATION

## Models (12 total)

### 1. `User`
Core user account. Supports multiple roles.
- **ID:** ObjectId (auto-generated)
- **Auth fields:** email (unique), password (bcrypt hash), emailVerified
- **Profile fields:** name, image, phone
- **Role:** enum string `admin | manager | tenant` (default: tenant)
- **Subscription fields:** subscriptionTier (FREE/PRO/BUSINESS), subscriptionStatus, stripeCustomerId, stripeSubscriptionId, subscriptionCurrentPeriodEnd
- **Relations:** accounts, sessions, tenants, bookings, notifications, activityLogs, assignedMaintenance, payments, invoices, uploadedFiles
- **Indexes:** role, subscriptionTier, subscriptionStatus

### 2. `File`
Centralized file storage record (Cloudinary URLs).
- **Fields:** url, publicId, filename, originalName, mimeType, size, width/height (if image)
- **Categorization:** folder (properties/tenants/maintenance/general), entityId, entityType
- **Relations:** uploader (User)
- **Soft delete:** isDeleted flag

### 3. `Account` (NextAuth)
OAuth/credentials account linking.

### 4. `Session` (NextAuth)
Active user sessions (JWT strategy, redundant for JWT but stored for revocation).

### 5. `VerificationToken` (NextAuth)
Email verification and password reset tokens.

### 6. `Property`
The core asset — represents a rental property/building.
- **Identity:** title, name, description, type (apartment/house/condo/etc.)
- **Status:** occupied, vacant, maintenance, listed
- **Location:** address, city, state, zipCode
- **Financials:** rent, securityDeposit, monthlyRevenue
- **Physical:** bedrooms, bathrooms, area, squareFeet, units, occupiedUnits, yearBuilt
- **Media:** images ([]), image (primary), amenities ([])
- **Relations:** tenants, maintenanceRequests, bookings, amenitiesRef, payments, invoices

### 7. `Tenant`
Lease/rental agreement between a User and a Property.
- **Identity:** userId, propertyId, unit (e.g., "Apt 4B")
- **Lease:** leaseStart, leaseEnd, rentAmount, securityDeposit
- **Status:** active, pending, expired, evicted
- **Relations:** user, property, payments, invoices

### 8. `MaintenanceRequest`
Work order / service request.
- **Identity:** propertyId, unit, title, description
- **Classification:** category (plumbing/electrical/HVAC/etc.), priority (low/medium/high/emergency)
- **Workflow:** status (open/in-progress/resolved/closed)
- **Assignment:** assignedTo (userId)
- **Financials:** cost, resolvedAt
- **Relations:** property, assignedUser

### 9. `Amenity`
Shared facility/resource at a property.
- **Identity:** propertyId, name, type (gym/pool/etc.)
- **Access:** capacity, openTime, closeTime, requiresBooking
- **Status:** available, maintenance, closed
- **Relations:** property, bookings

### 10. `Booking`
Reservation of an amenity by a user.
- **Identity:** propertyId, amenityId, userId, date, startTime, endTime
- **Status:** confirmed, pending, cancelled, completed
- **Meta:** guestCount, notes
- **Denormalized names:** propertyName, amenityName, userName

### 11. `Payment`
Transaction record for any money movement.
- **Identity:** tenantId, propertyId, userId, amount, type (rent/deposit/fee/refund)
- **Status:** pending, completed, failed, refunded
- **Method:** bank_transfer, credit_card, cash, check
- **Stripe fields:** stripeSessionId, stripePaymentIntentId, receiptUrl
- **Relations:** tenant, property, user, invoice (one-to-one)

### 12. `Invoice`
Billing document for rent collection.
- **Identity:** tenantId, propertyId, userId, amount, dueDate
- **Status:** pending, paid, past_due, cancelled
- **Period:** periodStart, periodEnd
- **Stripe fields:** stripeSessionId, receiptUrl
- **Relations:** tenant, property, user, payment (one-to-one)

### 13. `Notification`
In-app notification messages.
- **Identity:** userId, title, message, type (info/warning/success/error)
- **State:** read (boolean)

### 14. `ActivityLog`
Audit trail / activity feed entries.
- **Identity:** userId, userName, action, target, type
- **Timing:** createdAt

## Relationships Summary

```
User 1──* Tenant *──1 Property
User 1──* Booking
User 1──* Payment
User 1──* Invoice
User 1──* Notification
User 1──* ActivityLog
User 1──* MaintenanceRequest (assigned)
User 1──* File (uploaded)

Property 1──* Tenant
Property 1──* MaintenanceRequest
Property 1──* Booking
Property 1──* Payment
Property 1──* Invoice
Property 1──* Amenity

Tenant 1──* Payment
Tenant 1──* Invoice

Amenity 1──* Booking

Payment -1──1 Invoice (optional, when payment is linked)
```

## Potential Issues
- MongoDB `db push` used — no migrations, schema changes rely on Prisma's "push" which silently adds fields
- No soft-delete on most entities (only `File` has `isDeleted`)
- `user.password` is nullable — breaks assumptions in auth code if an OAuth-only user tries credentials login
- No `@db.ObjectId` on all string relations (relies on Prisma's string representation)
- `Property.amenities` is a JSON array of strings, while `Amenity` is a separate model — dual representation could cause sync issues

---

# AUTHENTICATION & AUTHORIZATION

## Login Flow

1. User submits email + password at `/login`
2. POST to `/api/auth/callback/credentials`
3. Rate limiter checks (5 attempts/minute) via Upstash Redis
4. NextAuth `authorize()` callback:
   - Validates input format
   - Looks up user by email in MongoDB
   - Compares password with bcrypt
   - Returns user object with `role`
5. JWT callback attaches `role` to token + sets Sentry user context
6. Session callback exposes `id` and `role` on `session.user`
7. Cookie `authjs.session-token` (or `__Secure-authjs.session-token` in prod) is set
8. Middleware decodes JWT on every request, applies role-based routing

## Roles

| Role | Dashboard Path | Capabilities |
|---|---|---|
| `admin` | `/dashboard/admin` | Full access — can manage properties, tenants, all settings |
| `manager` | `/dashboard/manager` | Manage properties and tenants, cannot modify subscriptions |
| `tenant` | `/dashboard/tenant` | View own data, submit maintenance, view/pay invoices |

## Middleware Protection

- `protectedPaths`: `/dashboard`, `/properties`, `/tenants`, `/maintenance`, `/amenities`, `/bookings`, `/settings`
- `authPaths`: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Role-based redirect: generic `/dashboard` → `/dashboard/{role}`
- Cross-role protection: `/dashboard/admin` rejects non-admin users
- Edge-compatible: uses `getToken()` (Web Crypto API) instead of `auth()` to avoid Prisma/bcrypt in Edge Runtime

## Security Review
- ✅ Rate limiting on credential login (Upstash Redis)
- ✅ Secure cookies in production (`__Secure-` prefix + `secure` flag)
- ✅ HttpOnly + SameSite=Lax cookies
- ✅ Password requirements: 8+ chars, uppercase, lowercase, number, special char
- ✅ Passwords hashed with bcrypt
- ⚠️ OAuth credentials in `.env.example` are empty strings — could accidentally commit without values
- ❌ No CSRF token validation on API routes (relies on SameSite + cookie being HttpOnly)
- ❌ Debug endpoints (`/api/debug/*`) are unprotected — expose sensitive session/auth data
- ❌ CORS not configured (relies on Next.js defaults)

---

# FEATURES IMPLEMENTED

## ✅ Completed
- User registration (email + password)
- User login / logout (credentials-based)
- Password reset flow (forgot + reset pages + API)
- Profile management (update name, phone, avatar)
- Role-based access control (admin/manager/tenant)
- Property CRUD (create, read, update, delete)
- Property list with filtering (type, status, search)
- Property detail page with related data
- Property image upload (Cloudinary)
- Bulk property operations (UI present)
- Property analytics (financial, status breakdowns, occupancy)
- Subscription tier enforcement on property count
- Subscription tier enforcement on tenant count
- Stripe checkout for subscriptions (PRO/BUSINESS)
- Stripe webhook handler (subscription lifecycle + payment events)
- Stripe billing portal integration
- Tenant CRUD (create, read, update, delete)
- Tenant assignment to properties
- Maintenance request CRUD
- Maintenance request creation with photo upload
- Maintenance status transitions
- Maintenance priority/category classification
- Maintenance cost tracking
- Work order assignment to users
- Amenity CRUD (properties)
- Amenity booking system
- Booking status management
- Payment history (admin view)
- Rent invoice system
- In-app notification system
- Activity log / activity timeline
- Dashboard with KPI cards
- Revenue and occupancy charts
- Maintenance category breakdown charts
- Property search and listing UI
- Responsive sidebar (collapsible, mobile drawer)
- Dark/light theme toggle (next-themes)
- Framer Motion animations
- Error boundaries
- Toasts/Sonner notifications
- Health check endpoint
- Real-time Socket.IO events for maintenance
- File upload / download
- Notifications center
- Settings page

## 🟡 Partial
- **Tenant rent payment** — Stripe checkout session created but NO tenant-facing "Pay Now" UI exists. Tenant cannot see invoices or initiate payment from frontend.
- **Invoice generation** — Invoices are manually created via API, no auto-generation from lease
- **Payment notifications** — No email sent when payment is due/paid
- **Feature-level subscription gating** — `hasFeature()` function defined but NEVER called in any API route
- **OAuth providers** — Google/GitHub configured in `.env.example` but not wired in `auth.ts`
- **Loading/empty/error states** — Some skeleton loaders exist but many pages lack comprehensive error handling
- **Tenant self-service portal** — Tenant dashboard exists but lacks lease view, payment history UI, profile controls
- **Receipt generation** — No PDF or email receipt generation

## ❌ Missing
- Dedicated tenant payment flow (browse invoices → click Pay → confirm)
- Automatic invoice generation (recurring billing)
- Payment confirmation emails
- Late fee calculation and application
- Lease document management
- Test coverage (only 1 auth.service.test.ts exists)
- Email templates for tenant communications
- Data export (CSV/PDF reports)
- Bulk tenant operations
- Advanced search with filters across all entities
- Multi-language (i18n)
- API documentation (OpenAPI/Swagger)

---

# API ANALYSIS

## Available Endpoints

### Authentication
- `POST /api/auth/register` — Create user account
- `POST /api/auth/callback/credentials` — NextAuth credentials login (rate-limited)
- `GET /api/auth/callback/google` — OAuth callback (not configured)
- `GET /api/auth/callback/github` — OAuth callback (not configured)
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password` — Confirm password reset
- `POST /api/auth/update-password` — Change password
- `PATCH /api/auth/update-profile` — Update profile (name, phone, image)

### Properties
- `GET /api/properties` — List properties (paginated)
- `POST /api/properties` — Create property (admin/manager)
- `GET /api/properties/[id]` — Property detail with relations
- `PATCH /api/properties/[id]` — Update property
- `DELETE /api/properties/[id]` — Delete property
- `GET /api/properties/analytics` — Property analytics/stats

### Tenants
- `GET /api/tenants` — List tenants (paginated)
- `POST /api/tenants` — Create tenant (admin/manager)

### Maintenance
- `GET /api/maintenance` — List requests (paginated)
- `POST /api/maintenance` — Create request
- `GET /api/maintenance/[id]` — Request detail
- `PATCH /api/maintenance/[id]` — Update request
- `DELETE /api/maintenance/[id]` — Delete request

### Amenities
- `GET /api/amenities` — List amenities (paginated)
- `POST /api/amenities` — Create amenity

### Bookings
- `GET /api/bookings` — List bookings (paginated)
- `POST /api/bookings` — Create booking
- `GET /api/bookings/[id]` — Booking detail
- `PATCH /api/bookings/[id]` — Update booking
- `DELETE /api/bookings/[id]` — Delete booking

### Payments
- `GET /api/payments` — List payments (paginated, admin/manager)
- `POST /api/payments` — Create payment record
- `GET /api/rent/invoices` — Get user's invoices
- `GET /api/rent/payments` — Payment history
- `POST /api/rent/checkout` — Create Stripe checkout for rent invoice

### Stripe
- `POST /api/stripe/checkout` — Subscription checkout
- `GET /api/stripe/portal` — Billing portal redirect
- `POST /api/stripe/webhook` — Stripe webhooks

### Notifications
- `GET /api/notifications` — User's notifications
- `POST /api/notifications` — Create notification
- `PATCH /api/notifications/[id]` — Mark as read
- `POST /api/notifications/read-all` — Mark all read

### Files
- `POST /api/upload` — Upload file (Cloudinary)
- `GET /api/files` — List files
- `DELETE /api/files/[id]` — Delete file

### Dashboard
- `GET /api/dashboard/stats` — Aggregate dashboard data

### Other
- `GET /api/health` — Health check
- `GET/POST /api/socketio` — Socket.IO endpoint
- `GET /api/debug/*` — Debug endpoints (unprotected!)

## Missing Endpoints
- `PATCH /api/properties/[id]` — exists but some update operations may not be fully wired
- `GET /api/tenants/[id]` — Not implemented (tenant details via properties)
- `PATCH /api/tenants/[id]` — Not implemented (only service method exists)
- `DELETE /api/tenants/[id]` — Not implemented
- `POST /api/amenities/[id]/bookings` — No direct amenity booking endpoint (uses generic bookings)
- `PATCH /api/amenities/[id]` — Not implemented
- `DELETE /api/amenities/[id]` — Not implemented
- `GET /api/payments/[id]` — Not implemented
- `POST /api/invoices` — No direct invoice creation endpoint (only via rent checkout)
- `PATCH /api/invoices/[id]` — Not implemented
- Email notification endpoints — None exposed (internal only)

## Security Concerns
- Debug routes under `/api/debug/` are unprotected and expose auth sessions
- No request size limits configured on upload routes
- No SQL injection risk (Prisma parameterized)
- No direct MongoDB injection risk (Prisma handles it)
- Missing CORS headers for cross-origin scenarios
- API uses generic error responses (could leak stack traces in development)

---

# UI/UX ANALYSIS

## Pages (Total: ~35+)

### Auth Pages
- `/login` — Login form
- `/register` — Registration form
- `/forgot-password` — Forgot password
- `/reset-password` — Password reset form

### Dashboard Pages
- `/dashboard` — Role-based redirect to admin/manager/tenant
- `/dashboard/admin` — Admin overview with portfolio stats
- `/dashboard/manager` — Manager-specific stats
- `/dashboard/tenant` — Tenant-specific overview
- `/dashboard/analytics` — Analytics sub-page

### Property Pages
- `/properties` — Property listing with filters
- `/properties/add` — Add property form (multi-step)
- `/properties/[id]` — Property detail with tabs
- `/properties/[id]/edit` — Edit property form

### Tenant Pages
- `/tenants` — Tenant list
- `/tenants/add` — Add tenant form

### Maintenance Pages
- `/maintenance` — Maintenance request list (DataTable)
- `/maintenance/create` — Create request form (multi-step)

### Amenity Pages
- `/amenities` — Amenity listing
- `/amenities/bookings` — Booking management

### Other Pages
- `/payments` — Payment history + processing
- `/notifications` — Notification center
- `/settings` — User settings

## Components (Total: ~40+)

### UI Components (shadcn-inspired)
- Button, Card, Dialog, Modal, Input, Select
- Badge, StatusChip, Tooltip
- DataTable, Table, Pagination
- Skeleton, EmptyState
- KPICard, StatCard
- Form primitives

### Feature Components
- PropertyCard, PropertyCardSkeleton
- PropertyForm, PropertyFilters
- PropertyDetailsTabs, PropertyQuickActions
- PropertyStatsBar
- TenantForm
- Maintenance form components
- File upload components (ImageUpload)
- PayRentButton
- ActivityFeed, ActivityTimeline
- DashboardWidget, DashboardChartCard
- NotificationCenter
- QuickActionsPanel

### Layout Components
- Sidebar (collapsible, mobile-responsive)
- Navbar
- Breadcrumbs
- PageHeader
- ErrorBoundary

## Responsiveness
- ✅ Mobile-first design with Tailwind responsive prefixes
- ✅ Sidebar collapses to icon-only on smaller screens
- ✅ Mobile drawer sidebar (AnimatePresence slide-in)
- ✅ Responsive grid layouts (1→2→4 columns)
- ✅ Charts use `dynamic()` import with `ssr: false` for client-only rendering
- ✅ Max-width containers prevent overflow on large screens

## Accessibility Issues
- ⚠️ Some images lack `alt` text (e.g., sidebar user avatar has alt but it's dynamic)
- ⚠️ No skip-to-content link
- ⚠️ Color contrast not explicitly tested
- ⚠️ No ARIA labels for some icon-only buttons
- ⚠️ `aria-label` partially implemented

---

# PERFORMANCE ANALYSIS

## Observations
- **Lazy loading:** Dynamic imports used for charts (`ssr: false`) — good
- **Selective queries:** Repository layer uses `select` to fetch only needed fields — good
- **Pagination:** Most list endpoints paginate (default 20) — good
- **Aggregate queries:** Dashboard stats use parallel `Promise.all` with aggregate/groupBy — good
- **TanStack Query:** 5-min staleTime, refetch disabled on window focus — reasonable
- **Tailwind CSS v4:** Modern, tree-shakeable
- **Image optimization:** Next.js `Image` component used, Cloudinary transformations available

## Slow Components (Potential)
- Dashboard `page.tsx` fires 7 parallel queries on mount — could be heavy for slow connections
- Property analytics endpoint runs 5 parallel aggregate queries — acceptable
- `dashboardRepo.getStats()` runs 6 parallel queries — acceptable

## Bundle Size Concerns
- `framer-motion` is a large library (animated sidebar, charts, page transitions)
- `recharts` adds significant bundle weight
- `lucide-react` tree-shakeable via named imports — good
- Socket.IO client adds overhead even if unused on some pages

## Database Query Concerns
- No N+1 detected in repository layer (uses `include` with `select` for joins)
- All major queries use indexes (defined in Prisma schema)
- MongoDB connection pooling configured in `src/lib/prisma.ts`
- Prisma client cached on `globalThis` for serverless warm starts

---

# CODE QUALITY AUDIT

## TypeScript Issues
- Many `as any` casts in service layer (`(session.user as any).role`, `paymentRepo.update(payment.id as any, ...)`)
- Strict mode is enabled (`strict: true`) but violations suppressed via `as any`
- Some `unknown` return types in services (`ApiResponse<unknown>`)
- `z.infer` used without re-export in some places

## Architecture Issues
- Service layer returns `ApiResponse<unknown>` — loses type safety consumers need to cast
- Repository layer uses `as any` when calling Prisma — bypasses Zod validation types
- `middleware.ts` imports `getToken` from `next-auth/jwt` but uses `AUTH_SECRET` directly — potential mismatch if secret changes
- Debug routes expose internal state in production

## Duplicate Code
- Similar pagination logic in every repository `findAll()` method
- Similar error wrapping in service layer (could be standardized)
- Similar API route auth check pattern repeated
- create/update/delete patterns nearly identical across all repositories

## Technical Debt
- **Hardcoded currency:** `"usd"` in Stripe checkout, `"$"` in UI — no i18n
- **Hardcoded URLs:** success/cancel URLs in Stripe hardcoded with `NEXT_PUBLIC_APP_URL`
- **No retry/circuit-breaker:** API calls fail immediately without retry logic
- **No request cancellation:** TanStack Query client not configured with `defaultOptions` for mutations
- **Hardcoded date formats:** `.toLocaleDateString()` without locale — environment-dependent
- **Socket.IO placeholder:** Server endpoint exists but frontend integration is minimal
- **Mock data:** `src/data/mock.ts` exists but unused in production

---

# DEPLOYMENT STATUS

## Environment Variables
- **Required (12):** DATABASE_URL, AUTH_SECRET, AUTH_URL, NEXT_PUBLIC_APP_URL, NODE_ENV, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
- **Optional (4):** AUTH_GOOGLE_ID/SECRET, AUTH_GITHUB_ID/SECRET, UPSTASH_REDIS_REST_URL/TOKEN, SENTRY_*
- **Defined in .env.example:** ✅ All required vars documented

## Build Status
- **TypeScript:** `tsc --noEmit` passes (reports show some previous issues have been fixed)
- **Prisma Generate:** Configured in postinstall + vercel-build script
- **Next.js Build:** Standard `npm run build` pipeline
- **Vercel config:** `vercel.json` sets 30s timeout, 1024MB memory, BOM1 region

## Deployment Readiness
- ✅ Vercel auto-deploy from GitHub configured
- ✅ `vercel-build` script handles Prisma generate + Next build
- ✅ Health check endpoint exists
- ✅ Deployment scripts provided (bash + PowerShell)
- ✅ Environment variable validation script
- ⚠️ Several reports indicate previous CI failures (GitHub CI, final release verification)
- ⚠️ MongoDB connection in serverless cold starts could be slow without proper warmup

---

# CURRENT DEVELOPMENT PROGRESS

## Estimated Completion: 65%

| Phase | Status | Notes |
|---|---|---|
| Project Setup & Tooling | ✅ 100% | Next.js, TypeScript, Tailwind, Prisma all wired |
| Auth System | ✅ 85% | Credentials works, OAuth not configured |
| Property Management | ✅ 90% | CRUD complete, analytics complete |
| Tenant Management | ✅ 75% | CRUD exists but update/delete API incomplete |
| Maintenance System | ✅ 90% | Full CRUD, real-time events |
| Amenities & Bookings | ✅ 80% | CRUD exists, but amenity-specific booking optimization |
| Payment Infrastructure | ✅ 60% | Stripe wired, but tenant-facing payment flow missing |
| Subscription System | ✅ 70% | Tiers + checkout + webhooks work, gating incomplete |
| Dashboard & Analytics | ✅ 85% | KPI cards, charts, aggregate stats |
| UI Polish | 🟡 40% | Loading states partial, error boundaries partial |
| Testing | ❌ 20% | Only auth.service + logger tests |

## What Is Currently Being Worked On
Based on commit history and reports: recent work focused on fixing CI failures, TypeScript compilation errors, and subscription enforcement bugs. The project appears to be in a stabilization phase after core feature implementation.

## What Remains Unfinished
1. **Critical:** Tenant-facing rent payment flow (UI + full Stripe integration)
2. **High:** Feature-level subscription gating enforcement
3. **High:** Invoice auto-generation and late fee automation
4. **Medium:** Missing tenant API endpoints (GET/PATCH/DELETE by ID)
5. **Medium:** OAuth provider configuration
6. **Medium:** Comprehensive test suite
7. **Low:** Email templates, multi-language, advanced search

---

# BUGS & RISKS

## Discovered Bugs
1. **Debug endpoints unprotected** — `/api/debug/auth`, `/api/debug/session`, `/api/debug/db` expose sensitive data if left in production. Should be behind feature flag or protected.
2. **`session.user.role` type casting** — `(session.user as any).role` pattern used throughout API routes instead of properly extending types.
3. **Tenant update/delete API incomplete** — `tenantService.update()` and `delete()` exist but no corresponding API route handlers in `tenants/route.ts`.
4. **`hasFeature()` unused** — Function exists in `subscription.service.ts` to enforce PRO/BUSINESS features but is **never called** in any API route. FREE tier users can access admin features.
5. **MongoDB `db push` in production** — `db:push:prod` script exists with `--accept-data-loss` flag. Schema drift between Prisma and MongoDB is possible without migration tracking.
6. **`vercel.json` matcher excludes `/api` from middleware** — Debug routes ARE under `/api` and thus bypass ALL security headers and auth checks.
7. **Socket.IO on Vercel** — Will not work on Vercel's serverless functions (no WebSocket support). Client may fail silently or timeout.
8. **`next-auth` v5 beta** — Using `next-auth@5.0.0-beta.31` which is pre-release; API may change.
9. **Payment confirmation double-record** — `handlePaymentSuccess()` in services creates both a `Payment` record and updates the `Invoice`, but no idempotency guard beyond checking `invoice.status`.
10. **Missing `tenants/[id]` API route** — Service methods for single-tenant operations exist but no HTTP handlers.

## Potential Risks
1. **MongoDB Atlas M0 limits** — Free tier has 500 connection limit, 512 MB storage. Could hit limits as users scale.
2. **Prisma connection pooling in serverless** — If Prisma singleton is not cached correctly, could exhaust MongoDB connections.
3. **Stripe webhook secret exposure** — If `STRIPE_WEBHOOK_SECRET` leaks, webhook payloads can be forged.
4. **Cloudinary unsigned uploads** — If upload preset is unsigned, anyone with the preset name can upload. `.env.example` suggests signed mode but doesn't enforce it.
5. **CSP too restrictive** — Current CSP blocks `unsafe-eval` which Next.js may need for some dev tooling; might also block legitimate CDN resources.
6. **No rate limiting on most API routes** — Only auth login POST is rate-limited. Property/tenant/mutation endpoints could be abused.
7. **Bcrypt cost factor** — Default 10 is fine for production but could slow login on cold starts.
8. **No data retention policy** — Activity logs, deleted files accumulate indefinitely.

---

# NEXT DEVELOPMENT ROADMAP

## Priority 1 (Critical) — Must complete for production launch
1. **Implement tenant rent payment flow** — Invoice list, "Pay Now" button, Stripe PaymentIntent, confirmation
2. **Enforce feature-level subscription gating** — Call `hasFeature()` in all protected API routes (admin features for FREE trial)
3. **Fix debug route exposure** — Move behind `NODE_ENV` check or protect with internal auth
4. **Tenant API completeness** — Add `GET /api/tenants/[id]`, `PATCH`, `DELETE` endpoints
5. **Add payment notification emails** — Stripe webhook should trigger email on payment success

## Priority 2 (Important) — High business value
6. **Automatic invoice generation** — Cron/interval to generate monthly invoices from active leases
7. **Late fee automation** — Calculate and apply late fees after due date
8. **OAuth provider configuration** — Wire Google/GitHub providers into NextAuth config
9. **Receipt generation** — PDF receipt for payments + email delivery
10. **Tenant portal enhancements** — Lease document view, payment history UI, profile editing
11. **Test suite expansion** — Integration tests for auth, CRUD workflows, Stripe webhooks

## Priority 3 (Enhancements) — Polish and scale
12. **i18n support** — Multi-language for international properties
13. **Advanced search** — Full-text/faceted search across properties, tenants, maintenance
14. **Data export** — CSV/PDF export for reports
15. **Audit log improvements** — Filtering, retention policy, export
16. **Webhook retry logic** — Stripe webhook handler with retry/backoff
17. **Performance monitoring** — APM integration, slow query detection
18. **Multi-tenant architecture** — Current single-tenant data model could evolve toward true SaaS multi-tenancy
19. **Mobile app** — React Native / PWA wrapper
20. **AI features** — Predictive maintenance, rent pricing suggestions, vacancy forecasting

---

# FINAL SUMMARY

## Overall Project Score: 72/100

| Category | Score | Explanation |
|---|---|---|
| **Architecture** | 85/100 | Clean 4-layer architecture, proper separation of concerns. Some tech debt with `as any` casts. |
| **Feature Completeness** | 65/100 | Core flows work but critical tenant payment gap blocks commercial launch. |
| **Code Quality** | 70/100 | Well-structured, typed, validated. Some duplicate patterns and type safety gaps. |
| **Security** | 75/100 | Good baseline (rate limiting, secure cookies, CSP, HSTS). Debug routes and missing feature gating reduce score. |
| **Deployment Readiness** | 80/100 | CI/CD, Vercel config, env docs all solid. Previous CI failures suggest some friction. |
| **Testing** | 20/100 | Minimal test coverage — only 2 test files. High regression risk. |
| **Documentation** | 90/100 | Extensive inline comments, deployment guide, architecture docs, existing audit reports. |

## Production Readiness Score: 60/100
- Core property management is production-ready
- **Blocking:** No tenant rent payment flow
- **Blocking:** Feature-level subscription gating not enforced
- **Concern:** Debug routes exposed
- **Concern:** Socket.IO won't work on Vercel serverless
- **Ready:** Auth, database, file uploads, dashboard, maintenance

## Security Score: 75/100
- Strong: Rate limiting, password hashing, secure cookies, CSP, security headers
- Weak: Debug endpoints unprotected, missing CORS config, no CSRF tokens
- Missing: Feature gating leaves FREE users with admin access

## Scalability Score: 55/100
- Good: Prisma connection pooling, query optimization with select/projection
- Concern: MongoDB M0 limits, no request caching (Redis only for rate limiting)
- Concern: No CDN strategy beyond Cloudinary for images
- Concern: Single-region Vercel deployment (BOM1)

## Recommended Next Steps
1. **Immediate (Week 1):** Build tenant-facing payment flow — invoice list → Pay Now → Stripe → confirmation. This is the single highest-impact item.
2. **Immediate (Week 1-2):** Enforce `hasFeature()` in all admin-tier API routes.
3. **Short-term (Week 2-3):** Close debug routes, add test suite foundation, wire OAuth.
4. **Medium-term (Month 2):** Auto-invoice generation, late fees, receipt emails.
5. **Long-term (Month 3+):** Multi-language, advanced search, mobile PWA, AI enhancements.

---

*Report generated: June 24, 2026*
*Project: PropertyPro v1.0.0*
*Repository: https://github.com/Masudsk712/propnexus*
*Total files audited: 150+*