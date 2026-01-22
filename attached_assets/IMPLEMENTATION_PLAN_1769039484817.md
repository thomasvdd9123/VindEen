# Implementation Plan - SEO Directory Platform

## Overview
This plan implements the complete MVP stack with all improvements: Supabase Client (no Prisma), Mollie payments (instead of Stripe), Resend email, Postgres FTS search, and monitoring setup.

## Stack Changes Applied
- ✅ Supabase Client instead of Prisma
- ✅ Mollie instead of Stripe
- ✅ Resend for email
- ✅ Postgres FTS for search (no Algolia/Meilisearch initially)
- ✅ Sentry for error monitoring
- ✅ Vercel Analytics (built-in)
- ✅ Peppol invoicing service (mandatory for Belgium B2B from Jan 2026)

---

## Phase 1: Project Initialization

### 1.1 Next.js Project Setup
**Files to create:**
- `package.json` - Dependencies with all required packages
- `tsconfig.json` - TypeScript configuration
- `next.config.js` - Next.js config with image domains
- `.gitignore` - Git ignore patterns
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS config

**Dependencies to install:**
```json
{
  "next": "^14.2.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "@supabase/supabase-js": "^2.39.0",
  "@supabase/ssr": "^0.1.0",
  "@mollie/api-client": "^4.0.0",
  "resend": "^3.0.0",
  "@sentry/nextjs": "^7.100.0",
  "@vercel/analytics": "^1.1.0",
  "zod": "^3.22.0",
  "date-fns": "^3.0.0",
  "tailwindcss": "^3.4.0",
  "typescript": "^5.3.0"
}
```

### 1.2 Environment Variables Setup
**File: `.env.example`**
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Mollie
MOLLIE_API_KEY=
MOLLIE_WEBHOOK_SECRET=

# Resend
RESEND_API_KEY=

# Peppol Invoicing (mandatory for Belgium B2B)
PEPPOL_API_KEY=
PEPPOL_API_URL=
PEPPOL_WEBHOOK_SECRET=

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Phase 2: Project Structure

### 2.1 Folder Structure
```
/
├── app/                      # Next.js App Router
│   ├── (public)/            # Public routes group
│   │   ├── page.tsx         # Homepage
│   │   ├── vind-een-[category]/[location]/page.tsx
│   │   ├── bedrijf/[slug]/page.tsx
│   │   └── layout.tsx
│   ├── (portal)/            # Customer portal (protected)
│   │   ├── dashboard/
│   │   ├── profiel/
│   │   └── abonnement/
│   ├── (admin)/             # Admin panel (protected)
│   │   ├── dashboard/
│   │   ├── bedrijven/
│   │   └── categorieen/
│   ├── api/                 # API routes
│   │   ├── auth/
│   │   ├── webhooks/
│   │   │   ├── webhooks/
│   │   │   └── mollie/
│   │   ├── invoices/       # Invoice generation & Peppol sending
│   │   ├── profiles/
│   │   ├── subscriptions/
│   │   └── search/
│   ├── sitemap.xml/route.ts
│   ├── robots.txt/route.ts
│   └── layout.tsx
├── components/              # React components
│   ├── ui/                 # Reusable UI components
│   ├── forms/              # Form components
│   ├── layout/             # Layout components
│   └── seo/                # SEO components
├── lib/                     # Utility libraries
│   ├── supabase/           # Supabase clients
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── mollie/             # Mollie integration
│   │   └── client.ts
│   ├── peppol/             # Peppol invoicing
│   │   └── client.ts
│   ├── email/              # Email utilities
│   │   └── resend.ts
│   ├── search/             # Postgres FTS
│   │   └── query.ts
│   ├── validations/        # Zod schemas
│   └── utils/              # General utilities
├── types/                   # TypeScript types
│   ├── database.ts         # Database types (auto-generated)
│   ├── mollie.ts
│   └── peppol.ts
├── supabase/               # Supabase migrations
│   ├── migrations/
│   └── seed.sql
└── public/                  # Static assets
```

---

## Phase 3: Database Setup

### 3.1 Supabase Client Configuration
**File: `lib/supabase/client.ts`**
- Browser client for client components
- Uses `createBrowserClient` from `@supabase/ssr`

**File: `lib/supabase/server.ts`**
- Server client for server components
- Uses `createServerClient` from `@supabase/ssr`

**File: `lib/supabase/middleware.ts`**
- Middleware client for auth
- Handles session refresh

### 3.2 Database Schema Migration
**File: `supabase/migrations/001_initial_schema.sql`**
- Create all tables from DATABASE_SCHEMA.md.txt
- Update PaymentProvider enum to use MOLLIE as primary
- Add all indexes
- Set up Row Level Security (RLS) policies

**Tables to create:**
1. `categories`
2. `locations`
3. `subscription_plans`
4. `gardeners`
5. `profiles`
6. `offices`
7. `practicals`
8. `subscription_items`
9. `payments`
10. `contact_requests`

**Key changes for Mollie:**
- `subscription_items` table: rename `stripe_*` fields to `mollie_*`
  - `mollie_customer_id`
  - `mollie_subscription_id`
  - `mollie_payment_id`
- `payments` table: `provider` enum defaults to MOLLIE
- `subscription_items.mollie_customer_id` stores Mollie customer ID

### 3.3 Type Generation
**File: `types/database.ts`**
- TypeScript types matching database schema
- Generated manually based on schema (or via Supabase CLI `supabase gen types`)

---

## Phase 4: Mollie Integration

### 4.1 Mollie Client Setup
**File: `lib/mollie/client.ts`**
- Initialize Mollie API client
- Helper functions for:
  - Creating customers
  - Creating subscriptions
  - Creating payments
  - Retrieving payment status
  - Webhook verification

### 4.2 Subscription Plans Setup
- Create subscription plans in Mollie dashboard (Bronze, Silver, Gold)
- Store plan IDs in database `subscription_plans.mollie_price_id` field

### 4.3 Payment Flow Implementation
**API Routes:**
- `app/api/subscriptions/create/route.ts` - Create subscription payment
- `app/api/subscriptions/cancel/route.ts` - Cancel subscription
- `app/api/webhooks/mollie/route.ts` - Handle Mollie webhooks

**Webhook Events to handle:**
- `payment.paid` - Activate subscription
- `payment.failed` - Handle failed payment
- `payment.canceled` - Cancel subscription
- `subscription.updated` - Update subscription status

---

## Phase 5: Core Libraries

### 5.1 Email Service (Resend)
**File: `lib/email/resend.ts`**
- Initialize Resend client
- Email templates:
  - Registration confirmation
  - Payment confirmation
  - Subscription expired
  - Subscription renewal reminder

### 5.2 Search (Postgres FTS)
**File: `lib/search/query.ts`**
- Full-text search using `pg_trgm` extension
- Geo search using lat/long
- Filter by category and location
- Pagination support

### 5.3 Peppol Invoicing Service
**File: `lib/peppol/client.ts`**
- Initialize Peppol Access Point client (e.g., Peppol Box, e-invoice.be, or Recommand.eu)
- Functions for:
  - Generating Peppol BIS 3.0 / UBL 2.1 compliant invoices
  - Sending invoices via Peppol network
  - Retrieving invoice status (delivered, rejected, etc.)
  - Registering company Peppol IDs

**Recommended Provider Options:**
1. **Peppol Box (Flexina)** - ~€10/month for send+receive (MVP-friendly) ([peppol-box.be](https://www.peppol-box.be/en/tarifs))
2. **e-invoice.be** - ~€0.25 per invoice (no subscription, pay-per-use) ([e-invoice.be](https://e-invoice.be))
3. **Recommand.eu** - Free tier (25 docs/month), then €29/month for 200 docs ([recommand.eu](https://recommand.eu))

**API Routes:**
- `app/api/invoices/create/route.ts` - Generate and send Peppol invoice
- `app/api/invoices/[id]/route.ts` - Get invoice status

### 5.4 Validation Schemas
**File: `lib/validations/`**
- Zod schemas for:
  - Profile creation/update
  - Subscription creation
  - Contact request
  - Search queries
  - Invoice data (for Peppol compliance)

---

## Phase 6: Monitoring & Analytics

### 6.1 Sentry Setup
**File: `sentry.client.config.ts`**
**File: `sentry.server.config.ts`**
**File: `sentry.edge.config.ts`**
- Error tracking configuration
- Performance monitoring
- Release tracking

### 6.2 Vercel Analytics
**File: `app/layout.tsx`**
- Add `<Analytics />` component from `@vercel/analytics/react`

---

## Phase 7: Configuration Files

### 7.1 Next.js Config
**File: `next.config.js`**
- Image domains: Supabase Storage URLs
- Environment variables
- Sentry integration

### 7.2 Tailwind Config
**File: `tailwind.config.js`**
- Custom theme
- Typography plugin
- Forms plugin

### 7.3 TypeScript Config
**File: `tsconfig.json`**
- Strict mode enabled
- Path aliases (@/components, @/lib, etc.)

---

## Implementation Order

1. **Initialize Next.js project** (Phase 1.1)
2. **Set up folder structure** (Phase 2.1)
3. **Configure environment variables** (Phase 1.2)
4. **Set up Supabase clients** (Phase 3.1)
5. **Create database migration** (Phase 3.2)
6. **Generate TypeScript types** (Phase 3.3)
7. **Implement Mollie integration** (Phase 4)
8. **Set up core libraries** (Phase 5)
9. **Configure monitoring** (Phase 6)
10. **Finalize configuration files** (Phase 7)

---

## Key Differences from Original Plan

### Mollie vs Stripe
- **Mollie API client** instead of Stripe SDK
- **Mollie webhook structure** (different from Stripe)
- **Subscription model**: Mollie subscriptions vs Stripe subscriptions
- **Payment methods**: iDEAL, Bancontact, credit card, etc. (EU-focused)

### Supabase Client vs Prisma
- **No Prisma schema file**
- **Supabase client** for all queries
- **Type generation** from Supabase CLI or manual types
- **RLS policies** in SQL migrations, not in Prisma

### Postgres FTS vs Algolia
- **No Algolia/Meilisearch setup** initially
- **Postgres FTS queries** in `lib/search/query.ts`
- **pg_trgm extension** enabled in migration

---

## Files to Create

### Core Configuration (8 files)
1. `package.json`
2. `tsconfig.json`
3. `next.config.js`
4. `tailwind.config.js`
5. `postcss.config.js`
6. `.gitignore`
7. `.env.example`
8. `README.md`

### Database (3 files)
9. `supabase/migrations/001_initial_schema.sql`
10. `supabase/seed.sql`
11. `types/database.ts`

### Peppol (2 files)
12. `lib/peppol/client.ts`
13. `types/peppol.ts`

### Supabase (3 files)
14. `lib/supabase/client.ts`
15. `lib/supabase/server.ts`
16. `lib/supabase/middleware.ts`

### Mollie (4 files)
17. `lib/mollie/client.ts`
18. `types/mollie.ts`
19. `app/api/subscriptions/create/route.ts`
20. `app/api/webhooks/mollie/route.ts`

### Invoices/Peppol (2 files)
21. `app/api/invoices/create/route.ts`
22. `app/api/invoices/[id]/route.ts`

### Email (1 file)
23. `lib/email/resend.ts`

### Search (1 file)
24. `lib/search/query.ts`

### Monitoring (4 files)
25. `sentry.client.config.ts`
26. `sentry.server.config.ts`
27. `sentry.edge.config.ts`
28. `app/layout.tsx` (update with Analytics)

### Utilities (2 files)
29. `lib/validations/schemas.ts`
30. `lib/utils/index.ts`

**Total: ~30 core files to create**

---

## Next Steps After Implementation

1. Run database migration in Supabase dashboard
2. Seed initial data (categories, locations, subscription plans)
3. Configure Mollie webhook URL in Mollie dashboard
4. Set up Sentry project and add DSN
5. Test payment flow end-to-end
6. Set up Vercel deployment

---

## Notes

- All server-side code uses Supabase Client (no Prisma)
- Mollie subscriptions work differently than Stripe - annual subscriptions with monthly payments supported
- Postgres FTS requires `pg_trgm` extension enabled in Supabase
- RLS policies must be set up before deploying to production
- **Peppol invoicing is mandatory for Belgium B2B transactions from January 1, 2026** - all subscription invoices must be sent via Peppol network ([gep.com](https://www.gep.com/blog/technology/belgium-peppol-e-invoicing-2026-compliance))
- Peppol invoices must be in BIS 3.0 / UBL 2.1 format (not just PDFs)
- Recommended provider for MVP: **Peppol Box** (~€10/month) or **e-invoice.be** (pay-per-invoice, ~€0.25/invoice) for low volume