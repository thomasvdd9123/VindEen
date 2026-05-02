# Rebranding to a new vertical

The frontend is fully driven by `client/src/lib/theme.config.ts` + the database
catalog tables. To launch a new vertical (e.g. "kapper", "loodgieter",
"fotograaf") you only need to touch a small set of files.

## 1. Swap the theme config

Two files are provided:

- `client/src/lib/theme.config.ts` — current vertical (tuinman)
- `client/src/lib/theme.config.kapper.example.ts` — example for kappers

To switch:

```bash
cp client/src/lib/theme.config.kapper.example.ts client/src/lib/theme.config.ts
```

Then update the values for your specific brand (legal block, social links, etc).

## 2. Re-seed the catalog tables

The categories, specializations, plans and practical questions live in the DB.
Reseed them with your vertical's data:

```bash
# Tuinman (default — full seed: catalogs + plans + practical questions + 6 test users)
tsx scripts/seed/seed-catalogs.ts

# Kapper example (catalog-only reseed: TRUNCATEs service_category +
# specialization and reinserts the kapper taxonomy. Plans, practical
# questions, service_areas and site_config are left untouched.)
tsx scripts/seed/seed-kapper-example.ts
```

The rest of the seed (`subscription_plan`, `billing_cycle`,
`payment_provider`, `practical_question`, …) is vertical-agnostic and can stay
as-is across rebrands.

## 3. Update App.tsx info routes

`siteConfig.infoRoutes` lists the URLs of vertical-specific info pages. Update
the matching `<Route path="...">` entries in `client/src/App.tsx` so the slugs
line up. If you skip this step, footer / homepage links will 404.

## 4. Verify

- `npx tsc --noEmit` — no type errors
- Visit `/`, `/zoek/<some-postcode>-<city>`, `/prijzen`, `/faq` and confirm the
  copy reflects the new vertical.
- Pricing comes from `/api/subscription-plans`; specializations from
  `/api/categories/grouped` (legacy, grouped) or `/api/specializations` +
  `/api/service-categories` (normalized); practical questions from
  `/api/practical-questions`; site config from `/api/site-config`. None of
  those are hardcoded in the frontend.

## What is NOT hardcoded anymore

- Subscription offers, prices, "popular" badge → DB (`subscription_plan_offer`)
  via `useSubscriptionOffers()`
- Specialization slug ↔ key ↔ label → DB (`service_category` +
  `specialization`) via `useSpecializationMap()`
- Currency / VAT % / default country / phone & postcode patterns → DB
  (`site_config`) via `useSiteConfig()`
- Main category descriptions in profile editor → DB
  (`service_category.description`)
- All copy with `{plural}/{singular}/{country}/{siteName}` placeholders →
  resolved at runtime via `fillCopy()` from `theme.config.ts`

## Known deferred items

- Practical question UI is now rendered dynamically in `Onboarding.tsx` (step 3)
  via `usePracticalQuestions()` against `/api/practical-questions`. Adding,
  removing or renaming a question in the DB is reflected in the UI without
  any code change. The same dynamic block has not yet been added to
  `dashboard/ProfileEdit.tsx` — values can still be persisted via the API but
  there is no edit form yet.
