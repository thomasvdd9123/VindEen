# Zoek-een-tuinman.be - Belgian B2B Directory Platform

## Overview
A SEO-optimized directory platform for Belgian businesses (inspired by vind-een-psycholoog.be), starting with gardening professionals. The platform allows companies to register, create profiles, and be discoverable by potential customers.

## Project Goals
- Create a comprehensive business directory platform
- SEO-optimized with dynamic category/location pages
- Easy to rebrand for different industries
- Export-ready for Vercel deployment

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn UI components
- **Routing**: Wouter
- **State Management**: TanStack Query
- **Backend**: Express.js + Node.js
- **Database**: Supabase (PostgreSQL) exclusively - no Replit in-house database
- **Auth**: Supabase Auth (implemented)
- **Payments**: Mollie (planned)
- **Email**: Resend (planned)

## Key Features (MVP)
- ✅ Homepage with hero, search, featured profiles
- ✅ Dynamic search pages with new URL structure (location-first like competitor)
- ✅ Profile detail pages (/bedrijf/[slug])
- ✅ Contact form for profiles
- ✅ Search and filtering with specialization filters
- ✅ SEO-optimized meta tags
- ✅ Mobile-first responsive design
- ✅ Green tuinman theme with centralized configuration
- ✅ Supabase authentication (login, register, password reset)
- ✅ Dashboard with Shadcn Sidebar navigation
- ✅ Account & Billing page (Belgian business settings)
- ✅ Profile management for businesses
- ✅ Password reset flow (/wachtwoord-reset)
- ✅ Multi-step onboarding wizard for new signups (/onboarding)
- ✅ Map view for search results with Leaflet
- ✅ 572 Belgian municipalities with postcodes, coordinates for autocomplete search and SEO
- ✅ Multi-sitemap structure for SEO (like competitor vind-een-psycholoog.be)

## URL Structure (SEO-optimized, competitor-matching)
```
/zoek/{postcode}-{city}                    → Location only (e.g., /zoek/9000-gent)
/zoek/{postcode}-{city}/{specialization}   → Location + Specialization (e.g., /zoek/9000-gent/gras-maaien)
/zoek/{specialization}                     → Specialization only (e.g., /zoek/gras-maaien)
/bedrijf/{slug}                            → Profile detail page
```

## Sitemap Structure
Multi-sitemap architecture following competitor pattern:
- `/sitemap.xml` - Main sitemap index (lists all sub-sitemaps)
- `/sitemaps/site/sitemap.xml` - Homepage and auth pages
- `/sitemaps/info/sitemap.xml` - Static info pages (FAQ, contact, pricing, etc.)
- `/sitemaps/profiles/sitemap.xml` - All business profile pages
- `/sitemaps/locations/sitemap.xml` - All 572 Belgian postcodes/cities
- `/sitemaps/specializations/sitemap.xml` - All 16 specializations
- `/sitemaps/location-specs/sitemap-{n}.xml` - Location × Specialization combos (9000+ URLs, paginated)

### Google Search Console Setup
1. Go to https://search.google.com/search-console
2. Add property: `https://www.zoek-een-tuinman.be`
3. Verify ownership (HTML file method is already set up: `/googlec82c9dc9a541d03e.html`)
4. Go to "Sitemaps" in left menu
5. Submit sitemap URL: `https://www.zoek-een-tuinman.be/sitemap.xml`
6. Google will automatically discover all sub-sitemaps from the index

## Configuration

### Theme Configuration
All branding is centralized in `client/src/lib/theme.config.ts`:
- Site name, tagline, description
- URL patterns
- Contact info
- Business type (easily changeable for rebranding)

### Colors
Defined in `client/src/index.css`:
- Primary: Green (#1B7340 / hsl(142, 72%, 29%))
- Light mode and dark mode support
- Based on vind-een-psycholoog.be design

### Fonts
- Sans: Open Sans, Inter
- Serif: Merriweather
- Mono: JetBrains Mono

## Project Structure
```
client/
├── src/
│   ├── components/
│   │   ├── layout/          # Header, Footer, Layout
│   │   ├── ui/              # Shadcn components
│   │   ├── ContactForm.tsx
│   │   ├── ProfileCard.tsx
│   │   └── SearchBox.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── CategoryPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   └── lib/
│       ├── theme.config.ts  # Centralized branding
│       ├── supabase.ts      # Supabase client
│       └── queryClient.ts   # TanStack Query
server/
├── routes.ts                # API endpoints
├── storage.ts               # Data layer with seed data
└── lib/
    └── supabase.ts          # Server Supabase client
shared/
└── schema.ts                # TypeScript types & Drizzle schema
```

## API Endpoints
- `GET /api/categories` - List all categories
- `GET /api/categories/:slug` - Get category by slug
- `GET /api/locations` - List all locations
- `GET /api/locations/:slug` - Get location by slug
- `GET /api/profiles/featured` - Get featured profiles
- `GET /api/profiles/search` - Search profiles with filters
- `GET /api/profiles/:slug` - Get profile by slug
- `POST /api/contact/:profileId` - Submit contact form
- `POST /api/accounts` - Get or create account for user (dashboard auth, uses authUserId)
- `POST /api/businesses` - Legacy endpoint (redirects to /api/accounts)
- `GET /api/my-profiles/:accountId` - Get profiles owned by account

## Seed Data
Includes Belgian categories (Tuinonderhoud, Tuinaanleg) with specializations, major cities (Gent, Antwerpen, Brussel, Brugge, Leuven, Hasselt, Kortrijk) with sample verified profiles.

## Recent Schema Changes (Jan 2026)
- **Accounts Naming**: Renamed `businesses` table to `accounts` with clear hierarchy: **Accounts** (login, VAT, billing) → **Profiles** (service listings) → **Offices** (locations)
- **Belgian B2B Fields**: Added VAT number (BE0123456789 format), company name, and billing address fields to accounts table
- **Auth User ID**: Changed `accountId` to `authUserId` in accounts table to clearly reference Supabase Auth UUID
- **Categories**: Two main categories: `TUINONDERHOUD` (maintenance: grass mowing, pruning) and `TUINAANLEG` (creation: grass laying, paths, wooden walls)
- **Profile Verification**: Added `isVerified` and `verificationStatus` fields with `ProfileStatusHistory` for audit trail
- **Belgian Localization**: Added province/region enums, language enum (NL, FR, DE, EN)
- **Simplified Practicals**: Changed `experience` to `experienceYears` (integer), removed `reachability`
- **Office**: Removed `country` field (hardcoded "België" in UI)
- **ContactRequest**: Simplified to async-only (no status tracking for external emails)
- **SubscriptionItem**: Uses `accountId` only (removed duplicate `profileId`)

## Environment Variables
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
MOLLIE_API_KEY=           # Payment processing
RESEND_API_KEY=           # Email notifications
SESSION_SECRET=           # Session encryption
BILLIT_API_KEY=           # Peppol invoicing via Billit (from MyBillit Profile)
BILLIT_PARTY_ID=          # PartyID/RegistrationID from Billit (e.g., 1037520)
BILLIT_SANDBOX=true       # Set to false for production
```

## Email (Resend)
- **Note**: Using Resend directly (not via Replit integration) for Vercel compatibility
- Sends payment confirmation emails when subscriptions are activated
- **Domain verification required**: Add `zoek-een-tuinman.be` in Resend dashboard and configure DNS records
- Sender address: `noreply@zoek-een-tuinman.be`

## Peppol Invoicing (Billit)
- **Provider**: Billit (https://docs.billit.be/)
- **Authentication**: `ApiKey` header + `PartyID` header
- **Endpoints** (different per environment):
  - **Production**: `POST /v1/peppol/sendOrder` - sends order directly
  - **Sandbox**: `POST /v1/einvoices/registrations/{partyId}/commands/send` - uses Accesspoint API
- **Environment URLs**:
  - Sandbox: https://api.sandbox.billit.be (set BILLIT_SANDBOX=true)
  - Production: https://api.billit.be (set BILLIT_SANDBOX=false)
- Automatically sends Peppol invoice when:
  1. Payment succeeds via Mollie webhook
  2. Customer account has VAT number and billing address filled in
- Invoice includes profile subscription details, VAT calculation (21%)
- Supplier info is configured in the Billit account (PartyID), not via environment variables
- Invoices arrive in customer's "Snelle Invoer" (Fast Input) if they're Peppol-registered

## Next Steps (Post-MVP)
1. ~~Supabase database integration~~ (DONE - using production Supabase)
2. ~~Supabase Auth for login/registration~~ (DONE)
3. Admin panel for managing profiles
4. ~~Company dashboard/portal~~ (DONE)
5. ~~Mollie payment integration~~ (DONE)
6. ~~Resend email integration~~ (DONE)
7. ~~Peppol invoicing~~ (DONE - via Billit)
8. Advanced search with geo-filtering
9. ~~Multi-step profile creation wizard~~ (DONE - onboarding flow)

## User Preferences
- No Replit-specific features (must export to Vercel)
- Supabase for auth and database
- Skip Mollie and Resend for now (no accounts yet)
- Centralized theming for easy rebranding
- Mobile-first responsive design
- Dutch (Belgian) language

## Vercel Deployment

The project is configured for Vercel serverless deployment.

### Files
- `vercel.json` - Vercel configuration with rewrites and function settings
- `api/index.ts` - Serverless function entry point (wraps Express)

### Deployment Steps
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET`
4. Deploy

### Cron Jobs
Add crons to `vercel.json` like this:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-task",
      "schedule": "0 0 * * *"
    }
  ]
}
```
Then create the endpoint in your Express routes.

### Notes
- The same Express routes work on both Replit and Vercel
- On Replit: Uses `npm run dev` with Express server
- On Vercel: Uses serverless adapter wrapping Express
