# Zoek-een-tuinman.be - Belgian B2B Directory Platform

## Overview
Zoek-een-tuinman.be is an SEO-optimized directory platform designed for Belgian businesses, initially focusing on gardening professionals. Its primary purpose is to allow companies to register, create profiles, and become discoverable by potential customers. The platform aims to be a comprehensive, rebrandable business directory, easily adaptable for various industries, with strong SEO capabilities through dynamic category and location pages. The long-term vision includes expanding to other verticals and providing a robust, export-ready solution for deployment on platforms like Vercel.

## User Preferences
- No Replit-specific features (must export to Vercel)
- Supabase for auth and database
- Skip Mollie and Resend for now (no accounts yet)
- Centralized theming for easy rebranding
- Mobile-first responsive design
- Dutch (Belgian) language

## System Architecture
The platform is built with a modern web stack, emphasizing performance, scalability, and maintainability.

### Frontend
- **Framework**: React 18 with TypeScript and Vite for a fast development experience.
- **Styling**: Tailwind CSS for utility-first styling, complemented by Shadcn UI components for pre-built, accessible UI elements.
- **Routing**: Wouter for client-side navigation.
- **State Management**: TanStack Query for data fetching, caching, and synchronization.
- **UI/UX**: Features a "green tuinman" theme with centralized configuration for easy rebranding. It implements a mobile-first responsive design. Key pages include a homepage with hero section and search, dynamic search results pages, and detailed business profile pages. User authentication includes login, registration, and password reset flows, with a multi-step onboarding wizard for new signups. A map view for search results is integrated using Leaflet.

### Backend
- **Framework**: Express.js with Node.js.
- **API**: Provides RESTful endpoints for categories, locations, profiles (search, featured, individual), contact forms, and account management. The API is designed to be vertical-agnostic and hydrates legacy camelCase shapes for frontend compatibility.

### Database & Schema
- **Database**: PostgreSQL, exclusively managed via Supabase.
- **Schema**: Features a normalized, vertical-agnostic schema with 31 tables, replacing hardcoded enums with data-driven catalogs. Key entities include `practitioner`, `profile`, `service_category`, `specialization`, `offered_service`, `service_area`, `practical_question`, `subscription_plan`, and `payment`. This schema supports a clear hierarchy of Accounts (login, billing) -> Profiles (listings) -> Offices (locations).
- **Localization**: Includes support for 572 Belgian municipalities with postcodes and coordinates for enhanced search and SEO. Belgian B2B fields like VAT number and company details are integrated.

### SEO & Sitemap
- **SEO Optimization**: Features dynamic search pages with a location-first URL structure (e.g., `/zoek/{postcode}-{city}`), SEO-optimized meta tags, and a comprehensive multi-sitemap architecture similar to leading directory platforms. The sitemap structure includes dedicated sitemaps for site pages, info pages, profiles, locations, specializations, and paginated location-specialization combinations.

### Project Structure
Organized into `client/`, `server/`, and `shared/` directories. `client/` contains React components, pages, and utility libraries. `server/` handles API routes and server-side logic. `shared/` defines common TypeScript types and the Drizzle database schema.

### Admin panel
Volledige admin-UI onder `/admin` (alleen toegankelijk voor users die voorkomen in de `admin` tabel). Bevat profiel-moderatie met audit trail (`practitioner_verification_event`), generieke catalog-CRUD voor service-categorieën, specialisaties, diensten, praktische vragen/opties en abonnementsplannen+offers, gebruikersoverzicht, betalingen met Peppol-resend stub (vereist `BILLIT_API_KEY`), Project defaults / Site Settings (volledige `site_config` incl. interne BTW), en een Vertical-preset switcher (hardcoded presets `tuinmannen-be` en `kappers-be`) die catalogi atomair-best-effort vervangt + site-config bijwerkt + post-verify telcheck doet. Eerste admin moet via script worden aangemaakt: `tsx scripts/admin/grant-admin.ts <email>`.

### Rebranding
Designed for easy rebranding with a centralized `theme.config.ts` file in the frontend, allowing for quick changes to business type, country, currency, copy, and more. This is supported by dynamic data fetching for catalogs (e.g., `useSpecializationMap`, `usePracticalQuestions`).

## External Dependencies
- **Supabase**: Used for PostgreSQL database management and authentication.
- **Mollie**: Integrated for payment processing (planned).
- **Resend**: Used for email notifications, specifically payment confirmations (planned).
- **Billit**: Integrated for Peppol e-invoicing, triggered by Mollie webhooks for customer accounts with complete billing information (planned).
- **Leaflet**: Used for displaying maps in search results.