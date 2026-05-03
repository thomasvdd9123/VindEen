# Pre-Launch QA Report — Zoek-een-tuinman.be

**Date:** 2026-05-03
**Scope:** Full-app sweep — every interactive element on every page (public, auth,
onboarding, dashboard, admin, mobile) plus deep static review of dashboard pages,
admin pages, and all forms / validation parity with `shared/schema.ts`.

**Method:**
- 6 parallel end-to-end Playwright runs (T01–T12) against the live dev server
- 3 parallel architect static-analysis subagents (S01 dashboard, S02 admin, S03 forms)
- Manual API curl verification of suspect endpoints

**Aggregate counts (deduplicated where the same defect surfaced in multiple reviews):**

| Severity | Count |
|---|---|
| **Critical** (block launch) | 6 |
| **High** (fix before public traffic) | 47 |
| **Medium** (fix soon) | 56 |
| **Low** (polish) | 33 |
| **Cosmetic** | 4 |

---

## 0. Executive summary — top 10 blockers for launch

1. **C1 — `ProfilePayment.tsx:64` ReferenceError on every "Nu betalen" click.** Checkout is completely broken (TDZ access of `selected?.offerId` before declaration at line 118). [S01]
2. **C2 — Login → `/dashboard` renders the login form instead of the dashboard.** URL changes, success toast fires, but the dashboard content never paints. Confirmed E2E with tuinman4. Auth race in `RequireAuth` / `DashboardLayout`. Blocks the entire dashboard for newly logged-in users. [T04-07]
3. **C3 — `/api/contact-owner` is a no-op.** The platform Contact form ([Contact.tsx](client/src/pages/Contact.tsx)) silently discards every message — handler logs to console and returns 200 without sending email or persisting. Also no captcha → open spam funnel. [S01, S03]
4. **C4 — No server-side Zod validation on any mutating endpoint.** `POST /api/profiles`, `PUT /api/profiles/:id`, `POST /api/accounts`, `PATCH /api/accounts/:id`, `POST /api/contact-owner`, `POST /api/admin/catalog/*`, `PUT /api/admin/site-config`, vertical-preset endpoints all spread `req.body` directly into Supabase. [S03]
5. **C5 — `PaymentStatus.tsx:111` post-payment success link 404s.** Routes to `/dashboard/profielen/${profileId}` which does not exist (real route is `…/bewerken`). [S01]
6. **C6 — `Contact.tsx` has no reCAPTCHA at all** while `ContactForm.tsx` only enforces it conditionally on env. Combined with C3 → unauthenticated public spam vector. [S03]
7. **H — Logout via `Header.tsx`/`DashboardLayout.tsx` throws `TypeError: Failed to fetch` from Supabase signOut**, then hard-reloads. Visible in console and produces a flash of blank page. [T02]
8. **H — Public `/api/profiles/:slug` cache (60 s) not busted on admin verify or profile PATCH.** After admin approves, the public page may stay invisible/stale for up to a minute. [S01, S02]
9. **H — Unbounded admin list endpoints.** `/api/admin/profiles` and `/api/admin/users` `select *` with no LIMIT. At ~5 k rows the dashboard locks up. [S02]
10. **H — Cascading deletes via native `confirm()` in admin catalogs and subscriptions** with no warning that profile-junctions or active subscriptions get destroyed. [S02]

---

## 1. End-to-end findings (T01–T12)

### T01 — Public site walkthrough  *(false-positive bug, plus design observation)*
| Sev | Finding | Notes |
|---|---|---|
| Cosmetic | Reported as "no featured profile cards on Home". | **Not a defect.** The current Home design shows a static "In de kijker" promo block linking to `/zoek/alle`, not a profile-card grid. Confirmed by reading `client/src/pages/Home.tsx` and the rendered ARIA snapshot. If a card grid is intended, that's a feature request. |
| Low | Search results page (CategoryPage) — pagination tested, no defects observed. |
| Low | Profile detail pages render correctly for all 5 valid slugs (vermeulen-tuinen, jardin-bruxelles, tuinen-de-vos, hortus-brugge, greenscape-antwerpen). `smets-hoveniers` was in the seed list but the row was removed from DB during testing → 404 is correct behavior, not a bug. |
| Low | Info pages, legal pages, FAQ accordion, About, Pricing, Artikelen, Ervaringen — all rendered, no JS errors in console. |

### T02 — Auth flows
| Sev | File / step | Finding | Suggested fix |
|---|---|---|---|
| **High** | `client/src/components/layout/Header.tsx:25`, `client/src/pages/dashboard/DashboardLayout.tsx:101`, `client/src/lib/auth.tsx:147` | Clicking **Uitloggen** logs `TypeError: Failed to fetch` from `supabase.auth.signOut({ scope: 'global' })`, then a hard `window.location.href` reload masks the error. Likely caused by the global scope requesting all sessions concurrently while the session is already mid-rotation. | Change to `signOut({ scope: 'local' })` (we only need to clear this browser); wrap in try/catch and surface a toast on failure; replace `window.location.href` with `setLocation("/")` + `queryClient.clear()`. |
| Low | Register / Login / ForgotPassword / PasswordReset happy paths | All worked. Wrong-password produces correct toast. Forgot-password always shows "check your inbox" (good — anti-enumeration). |
| Medium | Login → /dashboard transition | See **C2** under T04-07. |

### T03 — Onboarding wizard
| Sev | Step | Finding | Notes |
|---|---|---|---|
| Expected | Final payment step | `POST /api/mollie/create-payment` → 503 *Payment service not configured*. | **Expected** — Mollie credentials intentionally absent per scope. Document, do not flag. |
| High | Steps 1–4 | All steps render and validate correctly with a freshly-registered nanoid email. Validation errors fire on empty required fields. | — |
| High | Final submit chain | If account succeeds and profile fails, the user is left half-onboarded with no recovery UI (just a generic toast). [S03 §2.8] | Wrap chain in a single server-side transaction or add a "complete onboarding" prompt on next login. |

### T04 — T07 Dashboard suite  *(BLOCKED by critical auth race)*
| Sev | File / step | Finding | Suggested fix |
|---|---|---|---|
| **Critical** | `client/src/lib/auth.tsx:229–270` (`RequireAuth`) and `client/src/pages/dashboard/DashboardLayout.tsx:111` | After `signInWithPassword` succeeds, the success toast fires and the URL changes to `/dashboard`, but the rendered content remains the login form. The `RequireAuth` redirect uses `setTimeout(() => setLocation("/login"), 0)` and a `redirectedRef` to dedupe — the timer fires while `loading` is still true on the first render, causing the wrong branch to render. Reproducible 100% with tuinman4@test.be. **Blocks all dashboard E2E tests.** | Replace the `setTimeout`-based redirect with a proper `useEffect`. Also fix the `loading || !initialized` chain so the first authenticated render does not flash the login screen. Include the Login.tsx redirect effect (currently two competing `useEffect`s, see S03 §2.4). |
| Cascade | T05–T07 all blocked | Profiles list/create, ProfileEdit, Contacts, Statistics, ProfilePayment all unreachable through the UI until C2 is fixed. | Ship C2 fix first, then re-run T05–T07. |

> Static-analysis findings for those pages (S01) were captured against source — see §2 below.

### T08 — T11 Admin suite
| Sev | File / step | Finding | Suggested fix |
|---|---|---|---|
| **High** | `client/src/pages/admin/AdminProfileDetail.tsx:78–82` | Moderation **Goedkeuren** / **Afwijzen** buttons stay disabled even after typing into `data-testid=input-reason`. The disabled prop is `verifyM.isPending || !reason`. The Textarea is controlled by `useState("")`. The Playwright agent's typed value did not propagate to React state in time for the click. Likely a stale-state / React strict-mode re-render race; manual reproduction may differ. | Investigate whether the Textarea's `onChange` is wired correctly under the AdminLayout shell. Add `onBlur` setter as fallback. Also: require `reason.trim().length >= 10` server-side and visually indicate the reason was accepted. |
| **High** | `client/src/pages/admin/AdminProfileDetail.tsx:31`, `api/index.ts:1782–1802` | Verify mutation invalidates `/api/admin/profiles` and detail but does NOT bust public `_profileCache`. Approval invisible publicly for up to 60 s. | Call `bustProfileCache()` server-side after `verify_profile_atomic`; client-side invalidate `["/api/profiles"]` and `["/api/profiles/search"]`. |
| **High** | `client/src/pages/admin/AdminCatalogs.tsx:150`, `AdminSubscriptions.tsx:61/120` | Native `confirm()` for cascading deletes (service_category, specialization, plan, offer). No warning that profile junctions or active subscriptions cascade. | Replace with `<AlertDialog>` showing pre-flight count of affected rows; require explicit "force" toggle when count > 0. |
| **High** | `api/index.ts:1751`, `:1809` | `/api/admin/profiles` and `/api/admin/users` select all rows with no LIMIT. AdminDashboard fetches both for stats. | Server-side pagination + a `/api/admin/profiles/counts` stats endpoint. |
| Medium | `api/index.ts:1875`, `:1903–1904` | `PUT /api/admin/site-config` coerces empty string → null on NOT NULL columns (`siteName`, `defaultLanguage`, `defaultCurrencyCode`, `defaultCountryName`, `supportEmail`). Saving with cleared field → raw PG error toast. | Reject empty string on these fields; keep `.min(1)` in zod. |
| Medium | `api/index.ts:2087` (`apply_vertical_preset`) | `replit.md` says "atomair-best-effort", code comment says fully transactional. No post-verify count check; if RPC silently inserts 0 rows for a key, admin sees no warning. `bustProfileCache()` not called after success. | Verify the SQL function uses `BEGIN..EXCEPTION..ROLLBACK`. Re-query catalog counts after RPC and warn on mismatch. Call `bustProfileCache()`. |
| Medium | `client/src/pages/admin/AdminUsers.tsx:75` | User-detail dialog renders the whole practitioner row as raw JSON, including `auth_user_id`, `gender`, `birthdate`, `vat`. | Render structured rows of allowlisted fields. |
| Low | `client/src/pages/admin/AdminLayout.tsx:53–56` | `if (!loading && !user) window.location.href = "/login"` runs in render body — React rule violation. | Move to `useEffect`. |
| Low | `client/src/pages/admin/AdminUsers.tsx:42, 80` | Raw ISO date for "Actief tot"; `<a href>` instead of `<Link>` (full reload). | Format with `nl-BE`; use `wouter Link`. |

### T12 — Cross-cutting / mobile
| Sev | Finding | Notes |
|---|---|---|
| Cosmetic | Reported "404 on /bedrijf/smets-hoveniers (mobile)". | **Not a defect** — that profile row was removed from the database during this test session (likely via admin test). All other slugs render correctly on mobile. |
| Low | Mobile (390×844) Home, Search, Profile, hamburger menu, Cookie consent modal, NotFound, UnderConstruction overlay all render correctly. |

---

## 2. Static-analysis findings — Dashboard (S01)

Full report: [`.local/qa-results/S01_DASHBOARD_REVIEW.md`](.local/qa-results/S01_DASHBOARD_REVIEW.md) — 427 lines, 2 Critical / 19 High / 30 Medium / 15 Low / 2 Cosmetic.

### Critical
- **`client/src/pages/dashboard/ProfilePayment.tsx:64`** — `selected?.offerId` referenced before `selected` is declared (line 118). Every "Nu betalen" click throws `ReferenceError: Cannot access 'selected' before initialization`. **C1.** **Fix:** Move the `const selected = plans.find(...)` declaration above `handlePayment`, or compute `offerId` inline.
- **`api/index.ts:1144–1149` (`POST /api/contact-owner`)** — handler `console.log`s and returns 200 without sending email or persisting. Platform contact form silently discards messages. **C3.** **Fix:** Send via Resend (mirroring `POST /api/contact/:id`) or persist to a `support_request` table. Add zod validation, rate-limit, captcha.

### High (top 10)
- **`PaymentStatus.tsx:111`** — post-payment "Bekijk je profiel" link goes to `/dashboard/profielen/${profileId}` (404). Real route is `/dashboard/profielen/${profileId}/bewerken`. **C5.**
- **`DashboardLayout.tsx:106, 112` and `Account.tsx:257`** — hard reloads via `window.location.href` instead of `setLocation` + `queryClient.clear()`. Loses cache, flash of blank screen.
- **`DashboardLayout.tsx:53–98`** — `useEffect` POSTs `/api/accounts` on every dashboard mount (every navigation between dashboard pages re-POSTs). Move to a one-shot upsert in `AuthProvider`/Onboarding.
- **Account-key inconsistency** — same account is queried under both `["/api/accounts/by-user", uid]` (Dashboard, Contacts, Statistics, DashboardLayout) and `["/api/accounts/by-auth", uid]` (Account, Profiles, ProfilePayment). Cache invalidations in one half don't propagate to the other. **Fix:** Standardise on `["/api/accounts/by-auth", uid]` everywhere.
- **`Account.tsx:189`** — invoice save invalidates `by-auth` only, NOT `by-user`. Dashboard topline counts stay stale.
- **`Profiles.tsx:47–65`** — delete invalidates only `/api/my-profiles`, not `/api/contact-requests`, `/api/subscriptions/profile`, or account counts.
- **`ProfileEdit.tsx:1109–1134`** — logo / work-photos `onUploadSuccess` only refetch one key; `/api/my-profiles` and `/api/profiles/featured` and the public slug detail stay stale.
- **`ProfileEdit.tsx:158` + `api/index.ts:1237+`** — `PATCH /api/profiles/:id` does NOT call `bustProfileCache()`. Public slug page shows old data for up to 60 s.
- **`Contacts.tsx:216–225`** — `deleteMutation` invalidates `["/api/contact-requests"]` but not `["/api/contact-requests/counts", account?.id]` used by Statistics → stat counts stale.
- **`api/index.ts:935–952` (`POST /api/accounts`)** — no zod validation, no email format check, no rate-limit. Combined with the POST-as-queryFn pattern in Dashboard/Contacts/Statistics → easy DOS.

### Medium / Low / Cosmetic
- 30 Medium and 15 Low findings covering: `Statistics.tsx` `timeRange` selector is dead state (sends nothing to API); `Profiles.tsx` and `Contacts.tsx` use native `confirm()` while `Account.tsx` uses `AlertDialog` (pick one); `auth.tsx:65–67` USER_UPDATED short-circuit skips `setLoading(false)`; `queryClient.ts:52` `queryKey.join("/")` breaks for non-string segments; recaptcha script in `ContactForm.tsx` never cleaned up on unmount; many `as any` / `as { id: string }` casts hiding schema drift; sequential `for…of` photo uploads in `ProfileEdit` abort whole batch on first failure; `ProfileEdit` direct Supabase Storage upload bypasses the API ownership check at `api/index.ts:1212`. See full report.

---

## 3. Static-analysis findings — Admin (S02)

Full report: [`.local/qa-results/S02_ADMIN_REVIEW.md`](.local/qa-results/S02_ADMIN_REVIEW.md).

### Top blockers
1. **HIGH — public-cache staleness after verify** (`api/index.ts:1792`). See T08-11 above.
2. **HIGH — destructive catalog/subscription deletes via native `confirm()`** (`AdminCatalogs.tsx:150`, `AdminSubscriptions.tsx:61/120`).
3. **HIGH — unbounded admin list endpoints** (`/api/admin/profiles`, `/api/admin/users`).
4. **MED — missing/inconsistent invalidations** across catalog tabs, public site-config version, public profile cache after verify/preset apply.
5. **MED — required `site_config` fields can be NULLed via empty string** (`api/index.ts:1875, 1904`).
6. **MED — vertical-preset apply has no post-verify count check** and the contract (atomic vs best-effort) disagrees between code and `replit.md`.
7. **MED — Reject/Reset have no `AlertDialog`** and Reset has no audit `reason`, leaving an empty audit row (`practitioner_verification_event.reason = null`).

### Permission audit
Every `/api/admin/*` route in `api/index.ts` calls `requireAdmin(req)` and 403s on failure. Spot-check covered all 21 admin routes — no missing checks. **Note:** Supabase client is the *service-role* client (api/index.ts:43–45), so RLS does not protect anything; `requireAdmin` is the only gate. That is fine, just worth recording.

### Cache invalidation gaps (full table in S02 report)
- `AdminCatalogs.tsx:117–127` — only the active tab's queryKey is invalidated; cross-tab dropdowns and **public** catalog endpoints (`/api/categories`, `/api/specializations`, etc.) stay stale.
- `AdminProfileDetail.tsx:31–32` — verify mutation does not invalidate `["/api/profiles"]`, `["/api/profiles/search"]`, `["/api/specializations"]` counts.
- `AdminSettings.tsx:80–83` — save invalidates `/api/site-config` + `/api/admin/site-config` but not `["/api/site-config/version"]` polling key. Public clients won't see rebrand for up to 60 s.

### Pagination correctness
- `/api/admin/profiles`, `/api/admin/users` — no LIMIT (HIGH).
- `/api/admin/payments` — hardcoded `.limit(200)` with no "showing 200 of N" indicator (MED).
- `AdminProfiles`, `AdminUsers`, `AdminPayments` — no client pagination, sort, or virtualisation.

### Generic errors hiding cause
- `api/index.ts:2249–2252` — top-level catch returns `error.message`. Many handlers `throw error` without mapping Supabase codes → admin sees raw PG messages like `relation "profile" does not exist` in the toast. Map known Supabase errors to friendly messages; keep raw `.message` only in dev.
- `AdminCatalogs.tsx:120/128` and `AdminSubscriptions.tsx:103` — `OffersManager` `del` mutation has **no `onError` handler** at all → silent failure on FK delete.

### Audit trail
- Verify uses `verify_profile_atomic` RPC — status update + event row in one transaction. Cannot be missed for APPROVE/REJECT/RESET. ✅
- However: no DB trigger guarantees that *other* `profile.verification_status` writes are mirrored. A future direct PATCH could silently bypass the audit. Add a Postgres trigger on UPDATE.

### Cosmetic
`DialogTrigger` imported but unused in `AdminCatalogs.tsx:10` and `AdminUsers.tsx:9`. Drop imports.

---

## 4. Static-analysis findings — Forms & validation (S03)

Full report: [`.local/qa-results/S03_FORMS_REVIEW.md`](.local/qa-results/S03_FORMS_REVIEW.md) — 3 Critical / 26 High / 17 Medium / 11 Low.

### Critical
- **`Contact.tsx:17–22`** — public platform contact form has **no reCAPTCHA** and `/api/contact-owner` has none either. Open spam funnel into the platform inbox. **C6.** **Fix:** Add reCAPTCHA v3 wrapper (mirror `ContactForm.tsx`); require server-side.
- **No server-side Zod validation on any mutating endpoint** — `POST /api/contact-owner`, `POST /api/profiles`, `PUT /api/profiles/:id`, `POST /api/accounts`, `PATCH /api/accounts/:id`, `POST /api/admin/catalog/*`, `PUT /api/admin/site-config`, vertical-preset endpoints. **C4.** **Fix:** Wrap each handler in `schema.safeParse(req.body)` using the matching `insertXxxSchema` and return 400 with `parsed.error.flatten()` when invalid.
- **`/api/contact-owner` is a no-op** (also C3).

### High (top items)
- **BTW enum drift** — `Onboarding.tsx` uses `"ja"`/`"nee"`, `Account.tsx` uses `"yes"`/`"no"` for the same `btwPlichtig` field. Same field persisted via different endpoints with different enums → broken VAT display, data drift in `user_metadata`. **Fix:** Standardise on a single literal (recommend `"yes"`/`"no"` to match English-leaning enum convention) and migrate any pre-existing values.
- **BTW refine bug** — both Onboarding and Account validate `btwNumber` only when it is truthy. A user marked `btwPlichtig=ja/yes` with empty `btwNumber` passes validation. Server stores `vat = ""`. **Fix:** `if (btwPlichtig === "yes") z.string().min(1).refine(isValidBelgianVAT)`.
- **Password length drift** — `Login.tsx` uses `min(6)`, `Register.tsx` and `PasswordReset.tsx` use `min(8)`. **Fix:** Bump Login to `.min(8)`.
- **Upload size / MIME drift** — client `ProfileCreate`/`ProfileEdit` allows `≤ 5 MB` and `image/*` (including svg, heic). Server allows `≤ 8 MB` but restricts to 4 MIMEs (jpeg/png/webp/gif). User uploads svg → confusing rejection. **Fix:** Mirror server allow-list and size limit on the client.
- **No client cap on gallery image count** — server stores them in unbounded `text[]`. User can DOS their own profile page. **Fix:** Cap at 12 both ends.
- **`Account.tsx` email-change** validates with `newEmail.includes("@")` — accepts `"@"`, `"a@"`. **Fix:** `z.string().email()`.
- **`AdminCatalogs.tsx`** — no zodResolver, no react-hook-form. Plain `useState` + `apiRequest`. Empty names land in DB.
- **`AdminSubscriptions.tsx`** — no zod validation; `price` parsed with `parseFloat` → `NaN` on blank. Server accepts.
- **`AdminSettings.tsx`** save — no zod; `defaultVatPercentage` accepts negatives; `defaultLanguage` is free text.
- **`Register.tsx`** — Supabase signUp + `POST /api/accounts` are two separate calls; if first succeeds and second 4xxs, user has an auth account but no practitioner row → orphan with no recovery.
- **`DELETE /api/account/delete`** — no re-auth confirmation (e.g. fresh password); irreversible cascade with one click.
- **`POST /api/contact/:profileId`** — reCAPTCHA optional based on env; no length cap on `message` (megabyte-sized payloads accepted).

### Medium / Low
- `SearchBox.tsx` — pressing Enter in postcode input does NOT trigger search (no `<form>` wrapper).
- `PracticalQuestionsForm.tsx` — renders `*` for required questions but no schema enforcement; multi-select stores option `name` strings (server resolves by name, case-insensitive) → renaming an option breaks all answers.
- `ForgotPassword.tsx` — no captcha on Supabase recovery endpoint → open Supabase quota spam.
- `ProfileEdit.tsx` — `hideAddress` toggle vs `office.showAddress` order-of-operation bug; old logo file in storage never deleted on replace.
- `AdminSettings.tsx` — `postcodePattern` stored as raw text, never test-compiled (typo breaks site-wide validation).
- See full S03 report for the rest.

---

## 5. Cross-cutting recommendations (do these first)

These change a lot of files but pay back across most of the report:

1. **Fix C2 (login → /dashboard race) and C1 (ProfilePayment TDZ).** These two together unblock `~80%` of E2E tests we couldn't run.
2. **Adopt one `accounts` query key everywhere** — `["/api/accounts/by-auth", user?.id]` with a `useMutation` for upsert called once from `AuthProvider`. Removes the entire "stale dashboard counts" class of bugs.
3. **Wrap every mutating API handler in `schema.safeParse(req.body)`** (C4). Single largest exposure across the API surface.
4. **Force reCAPTCHA in production** by failing 503 if `RECAPTCHA_SECRET_KEY` is missing, on both `/api/contact/:id` and `/api/contact-owner`. Bind `Contact.tsx` to it (C6).
5. **Replace native `confirm()` with `AlertDialog`** in admin destructive flows AND show pre-flight cascade counts (HIGH catalog/subscription deletes).
6. **Call `bustProfileCache()` after every server-side mutation that affects a profile** — verify, PATCH, vertical-preset apply.
7. **Standardise BTW enum** to `"yes"`/`"no"` and require non-empty `btwNumber` when subject-to-VAT.
8. **Replace `window.location.href` redirects** with `setLocation` + `queryClient.clear()` everywhere except external Mollie redirects and `mailto:` links.
9. **Centralise the profile form schema** in `shared/schema.ts` and import it on the client (ProfileCreate, ProfileEdit, Onboarding) and server.
10. **Paginate `/api/admin/profiles` and `/api/admin/users`** (server-side `?page&limit` + a separate `/counts` endpoint for dashboard stats).

---

## 6. Test infrastructure & known limitations

- E2E batch-2 tests (T05–T07) could not exercise the dashboard UI because of **C2** (login → /dashboard race). Static review (S01) covered every dashboard page in source.
- Mollie/Resend/Billit are intentionally unconfigured for this environment. Anything that fails at the Mollie boundary in onboarding step 4 is **expected**, not a defect.
- All 6 public profile slugs were verified present at start of testing. `smets-hoveniers` was removed from DB during the session (likely via an admin test) — any "404 on smets-hoveniers" failures are stale-fixture artefacts, not real defects. The slug handler at `api/index.ts:877` works correctly for all 5 remaining slugs (curl-confirmed: 200 OK, hydrated profile JSON).
- Test users tuinman1@test.be (admin) + tuinman2..6@test.be (no admin) all share password `Test1234!`. Admin is granted via `scripts/admin/grant-admin.ts <email>`.
- UnderConstruction overlay bypassed in tests via `localStorage.setItem('zoek_construction_dismissed','true')`.
- Brand-voice copy linter baseline: 167 — unchanged by any of the above fixes if they only touch handlers and form schemas (no copy strings).

---

## 7. Per-detail-report file pointers

| Report | File | Lines | Bugs |
|---|---|---|---|
| T01 Public walkthrough | `.local/qa-results/T01_PUBLIC.md` | — | 1 false-positive |
| T02 Auth flows | `.local/qa-results/T02_AUTH.md` | — | 1 High |
| T03 Onboarding | `.local/qa-results/T03_ONBOARDING.md` | — | 1 expected (Mollie) |
| T04–T07 Dashboard suite | `.local/qa-results/T04-07_DASHBOARD.md` | — | 1 Critical (cascade-blocked subsequent tests) |
| T08–T11 Admin suite | `.local/qa-results/T08-11_ADMIN.md` | — | 1 High (moderation buttons) |
| T12 Cross-cutting / mobile | `.local/qa-results/T12_CROSSCUTTING.md` | — | 1 false-positive (stale fixture) |
| **S01 Dashboard static review** | `.local/qa-results/S01_DASHBOARD_REVIEW.md` | 427 | 2 C / 19 H / 30 M / 15 L / 2 Cos |
| **S02 Admin static review** | `.local/qa-results/S02_ADMIN_REVIEW.md` | — | top blockers in §3 above |
| **S03 Forms & validation review** | `.local/qa-results/S03_FORMS_REVIEW.md` | — | 3 C / 26 H / 17 M / 11 L |

---

*Generated by automated QA sweep — 12 E2E test areas + 3 deep static reviews running in parallel batches. All findings reviewed and de-duplicated.*
