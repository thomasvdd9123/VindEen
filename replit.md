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
- **Database**: Supabase (PostgreSQL) - currently using in-memory storage for MVP
- **Auth**: Supabase Auth (planned)
- **Payments**: Mollie (planned)
- **Email**: Resend (planned)

## Key Features (MVP)
- ✅ Homepage with hero, search, featured profiles
- ✅ Dynamic category pages (/zoek/[category])
- ✅ Dynamic location pages (/zoek/[category]/[location])
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
- ✅ 60+ Belgian cities with postcodes for autocomplete search

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

## Seed Data
Includes Belgian categories (Tuinonderhoud, Tuinaanleg) with specializations, major cities (Gent, Antwerpen, Brussel, Brugge, Leuven, Hasselt, Kortrijk) with sample verified profiles.

## Recent Schema Changes (Jan 2026)
- **Universal Naming**: Renamed `gardeners` to `businesses` for easy rebranding to other industries
- **Categories**: Two main categories: `TUINONDERHOUD` (maintenance: grass mowing, pruning) and `TUINAANLEG` (creation: grass laying, paths, wooden walls)
- **Profile Verification**: Added `isVerified` and `verificationStatus` fields with `ProfileStatusHistory` for audit trail
- **Belgian Localization**: Added province/region enums, language enum (NL, FR, DE, EN)
- **Simplified Practicals**: Changed `experience` to `experienceYears` (integer), removed `reachability`
- **Office**: Removed `country` field (hardcoded "België" in UI)
- **ContactRequest**: Simplified to async-only (no status tracking for external emails)
- **SubscriptionItem**: Uses `businessId` only (removed duplicate `profileId`)

## Environment Variables
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Next Steps (Post-MVP)
1. Supabase database integration (replace in-memory storage)
2. Supabase Auth for login/registration
3. Admin panel for managing profiles
4. Company dashboard/portal
5. Mollie payment integration
6. Resend email integration
7. Peppol invoicing (required for Belgium B2B by Jan 2026)
8. Advanced search with geo-filtering
9. Multi-step profile creation wizard

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
