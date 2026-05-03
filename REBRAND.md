# Rebranding to a new vertical

The frontend is fully driven by `client/src/lib/theme.config.ts` + the database
catalog tables. To launch a new vertical (e.g. "kapper", "loodgieter",
"fotograaf") you only need to touch a small set of files. **No component or
route file (`App.tsx`, page components, …) needs to be edited.**

## 1. Swap the theme config

Two files are provided:

- `client/src/lib/theme.config.ts` — current vertical (tuinman)
- `client/src/lib/theme.config.kapper.example.ts` — example for kappers

To switch:

```bash
cp client/src/lib/theme.config.kapper.example.ts client/src/lib/theme.config.ts
```

Then update the values for your specific brand (legal block, social links, etc).
The `infoRoutes` array in `theme.config.ts` declares the vertical-specific info
pages — `App.tsx` reads it at runtime and registers the matching `<Route>`s
automatically via the `INFO_ROUTE_COMPONENTS` registry. To add a brand-new info
page, drop a component in `client/src/pages/info/` and add an entry to the
registry / `EXTRA_INFO_ROUTES` once; subsequent rebrands only edit the config.

## 2. Re-seed the catalog tables

The categories, specializations, plans, practical questions, **and the
`site_config` row (default country, currency, VAT %, phone/postcode patterns)**
all live in the DB. Reseed them with your vertical's data:

```bash
# Tuinman (default — full seed: catalogs + plans + practical questions + 6 test users)
tsx scripts/seed/seed-catalogs.ts

# Kapper example (catalog-only reseed)
tsx scripts/seed/seed-kapper-example.ts
```

The rest of the seed (`subscription_plan`, `billing_cycle`,
`payment_provider`, `practical_question`, …) is vertical-agnostic and can stay
as-is across rebrands.

## 3. Verify

- `npx tsc --noEmit` — no type errors
- Visit `/`, `/zoek/<some-postcode>-<city>`, `/prijzen`, `/faq` and confirm the
  copy reflects the new vertical.
- Pricing comes from `/api/subscription-plans` + `/api/subscription-plans/:id/offers`;
  specializations from `/api/specializations` + `/api/service-categories`
  (the legacy `/api/categories/grouped` endpoint is no longer consumed by
  the frontend); practical questions from `/api/practical-questions`;
  offered services from `/api/offered-services`; site config from
  `/api/site-config`. None of those are hardcoded in the frontend.

## What is NOT hardcoded anymore

- Subscription offers, prices, "popular" badge → DB (`subscription_plan_offer`)
  via `useSubscriptionOffers()`
- Specialization slug ↔ key ↔ label, main-category labels and descriptions →
  DB (`service_category` + `specialization`) via `useSpecializationMap()`.
  This single hook now powers `SearchBox`, `ProfileCard`, `ProfileCreate`,
  `ProfileEdit` and `CategoryPage` — there is no remaining hardcoded slug
  map anywhere in the frontend.
- Currency / VAT % / default country / country-code / phone & postcode
  patterns → DB (`site_config`) via `useSiteConfig()`. Used by `KostenPrijzen`
  (BTW %), `SEO` (`addressCountry`), `Account`/`Onboarding` (default country)
  and the price formatter.
- Practical-questions form *and* the "Praktische informatie" card on the
  profile page render one row per `practical_question` that has an answer.
  Adding/removing/renaming a question in the DB shows up automatically with
  no code change. The same form is reused in `Onboarding` and
  `dashboard/ProfileEdit`.
- Info-page routing → `siteConfig.infoRoutes` + `INFO_ROUTE_COMPONENTS`
  registry in `App.tsx` (no per-vertical `<Route>` edits).
- All copy with `{plural}/{singular}/{country}/{siteName}/...` placeholders →
  resolved at runtime via `fillCopy()` from `theme.config.ts`.
