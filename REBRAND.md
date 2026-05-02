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
# Tuinman (default)
tsx scripts/seed/seed-catalogs.ts

# Kapper example (illustrative — copy logic into seed-catalogs.ts to actually run)
tsx scripts/seed/seed-kapper-example.ts
```

`scripts/seed/seed-kapper-example.ts` shows which arrays
(`SERVICE_CATEGORIES`, `SPECIALIZATIONS`) need to change. The rest of the seed
(`subscription_plan`, `billing_cycle`, `payment_provider`,
`practical_question`, …) can stay as-is.

## 3. Update App.tsx info routes

`siteConfig.infoRoutes` lists the URLs of vertical-specific info pages. Update
the matching `<Route path="...">` entries in `client/src/App.tsx` so the slugs
line up. If you skip this step, footer / homepage links will 404.

## 4. Verify

- `npx tsc --noEmit` — no type errors
- Visit `/`, `/zoek/<some-postcode>-<city>`, `/prijzen`, `/faq` and confirm the
  copy reflects the new vertical.
- Pricing comes from `/api/subscription-plans`; specializations from
  `/api/categories/grouped`; site config from `/api/site-config`. None of those
  are hardcoded in the frontend.

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

- Practical question UI (Languages / PriceHour / YearsExperience) is not yet
  rendered in the onboarding flow. The DB tables (`practical_question`,
  `practical_option`, `practical_answer`) and the API hydration exist; the
  form rendering still needs to be added to `Onboarding.tsx` /
  `dashboard/ProfileEdit.tsx` for full per-vertical practicals.
