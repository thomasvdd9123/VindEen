/**
 * Seed script voor het genormaliseerde schema.
 * Vult catalogi (verticaal-specifieke seed-data) + test-data zodat de app
 * direct bruikbaar is na de migratie. Idempotent: TRUNCATEt eerst.
 *
 * Run via: PGURL=... tsx scripts/seed/seed-catalogs.ts
 *      of: tsx scripts/seed/seed-catalogs.ts  (gebruikt SUPABASE_DATABASE_URL)
 */
import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";
import { BELGIAN_MUNICIPALITIES } from "../../server/data/belgian-municipalities";

const PG_URL = process.env.PGURL || process.env.SUPABASE_DATABASE_URL;
if (!PG_URL) {
  console.error("Missing PGURL or SUPABASE_DATABASE_URL");
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const client = new Client({ connectionString: PG_URL, ssl: { rejectUnauthorized: false } });

// ---------------------------------------------------------------------------
// Catalog data
// ---------------------------------------------------------------------------

const VARIABLE_TYPES = ["INT", "STRING", "DOUBLE", "DATE", "BOOLEAN", "OPTION"];

const PRACTITIONER_TYPES = [
  { key: "Licensed", name: "Erkend", description: "Officieel erkende professional" },
  { key: "Hobbyist", name: "Hobbyist", description: "Hobbyist / bijberoep" },
];

const BILLING_CYCLES = [
  { key: "Yearly", interval: "Yearly", isActive: true },
  { key: "Monthly", interval: "Monthly", isActive: false },
];

const PAYMENT_PROVIDERS = [
  { key: "Mollie", name: "Mollie", isActive: true },
];

// 1 plan + 3 offers (matchend met huidige frontend prijsmodel: BASE=156)
const BASE_YEARLY_PRICE = 156;
const SUBSCRIPTION_PLANS = [
  {
    key: "STANDARD",
    name: "Standaard",
    price: BASE_YEARLY_PRICE,
    description: "Volwaardig profiel met alle features",
    isActive: true,
    sortOrder: 1,
  },
];
const SUBSCRIPTION_OFFERS = [
  { planKey: "STANDARD", durationInYears: 1, discountPercentage: 0, totalPrice: BASE_YEARLY_PRICE * 1, isPopular: false },
  { planKey: "STANDARD", durationInYears: 2, discountPercentage: 5, totalPrice: Math.round(BASE_YEARLY_PRICE * 2 * 0.95 * 100) / 100, isPopular: true },
  { planKey: "STANDARD", durationInYears: 3, discountPercentage: 10, totalPrice: Math.round(BASE_YEARLY_PRICE * 3 * 0.90 * 100) / 100, isPopular: false },
];

const SERVICE_CATEGORIES = [
  { name: "Tuinonderhoud", slug: "tuinonderhoud", description: "Onderhoud van bestaande tuinen", sortOrder: 1 },
  { name: "Tuinaanleg", slug: "tuinaanleg", description: "Aanleg van nieuwe tuinen", sortOrder: 2 },
  { name: "Architect", slug: "architect", description: "Tuinarchitectuur en ontwerp", sortOrder: 3 },
];

// 16 specialisaties — gekoppeld aan service_category slug
const SPECIALIZATIONS = [
  // Tuinonderhoud (8)
  { name: "Gras maaien", slug: "gras-maaien", categorySlug: "tuinonderhoud", description: "Professioneel gazon maaien en onderhouden", sortOrder: 1 },
  { name: "Bomen snoeien", slug: "bomen-snoeien", categorySlug: "tuinonderhoud", description: "Vakkundige snoei van bomen", sortOrder: 2 },
  { name: "Struiken snoeien", slug: "struiken-snoeien", categorySlug: "tuinonderhoud", description: "Professioneel snoeien van struiken", sortOrder: 3 },
  { name: "Hagen knippen", slug: "hagen-knippen", categorySlug: "tuinonderhoud", description: "Hagen knippen en vormgeven", sortOrder: 4 },
  { name: "Onkruid verwijderen", slug: "onkruid-verwijderen", categorySlug: "tuinonderhoud", description: "Onkruidbestrijding en -preventie", sortOrder: 5 },
  { name: "Bladeren ruimen", slug: "bladeren-ruimen", categorySlug: "tuinonderhoud", description: "Bladeren opruimen en composteren", sortOrder: 6 },
  { name: "Bemesting", slug: "bemesting", categorySlug: "tuinonderhoud", description: "Bemesting van gazon en planten", sortOrder: 7 },
  { name: "Gazononderhoud", slug: "gazononderhoud", categorySlug: "tuinonderhoud", description: "Volledig gazononderhoud en -verzorging", sortOrder: 8 },
  // Tuinaanleg (8)
  { name: "Grasaanleg", slug: "grasaanleg", categorySlug: "tuinaanleg", description: "Aanleg van gazons en grasmatten", sortOrder: 9 },
  { name: "Paden & terrassen", slug: "paden-terrassen", categorySlug: "tuinaanleg", description: "Aanleg van paden en terrassen", sortOrder: 10 },
  { name: "Houten constructies", slug: "houten-constructies", categorySlug: "tuinaanleg", description: "Pergola's, schuttingen en houtwerk", sortOrder: 11 },
  { name: "Afsluitingen & hekwerk", slug: "afsluitingen", categorySlug: "tuinaanleg", description: "Plaatsen van afsluitingen en hekwerk", sortOrder: 12 },
  { name: "Vijvers & waterpartijen", slug: "vijvers", categorySlug: "tuinaanleg", description: "Aanleg van vijvers en waterpartijen", sortOrder: 13 },
  { name: "Bestrating", slug: "bestrating", categorySlug: "tuinaanleg", description: "Bestrating en verharding", sortOrder: 14 },
  { name: "Beplanting", slug: "beplanting", categorySlug: "tuinaanleg", description: "Aanplanten van bomen, struiken en planten", sortOrder: 15 },
  { name: "Irrigatiesystemen", slug: "irrigatie", categorySlug: "tuinaanleg", description: "Aanleg van irrigatie- en beregeningssystemen", sortOrder: 16 },
];

const OFFERED_SERVICES = [
  { name: "Snoeien", slug: "snoeien", description: "Snoeiwerk", sortOrder: 1 },
  { name: "Maaien", slug: "maaien", description: "Maaien", sortOrder: 2 },
  { name: "Sportgazon", slug: "sportgazon", description: "Sportgazon", sortOrder: 3 },
  { name: "Schutting", slug: "schutting", description: "Schuttingen", sortOrder: 4 },
  { name: "Belichting", slug: "belichting", description: "Tuinbelichting", sortOrder: 5 },
];

// Practical questions + opties (talen)
const PRACTICAL_QUESTIONS = [
  { key: "Languages", name: "Talen", fieldType: "OPTION", isMulti: true, isRequired: false, sortOrder: 1 },
  { key: "PriceHour", name: "Uurtarief", fieldType: "DOUBLE", isMulti: false, isRequired: false, sortOrder: 2 },
  { key: "YearsExperience", name: "Jaren ervaring", fieldType: "INT", isMulti: false, isRequired: false, sortOrder: 3 },
];

const LANGUAGE_OPTIONS = [
  "Nederlands", "Frans", "Duits", "Engels", "Spaans", "Italiaans", "Pools", "Arabisch", "Turks", "Afrikaans",
];

const SITE_CONFIG = {
  siteName: "Zoek-een-tuinman.be",
  siteTagline: "Vind een professionele tuinman in jouw buurt",
  supportEmail: "info@zoek-een-tuinman.be",
  defaultCountryCode: "BE",
  defaultCountryName: "België",
  defaultRegion: "Vlaanderen",
  defaultLanguage: "NL",
  defaultCurrencyCode: "EUR",
  defaultVatPercentage: 21,
  companyVatNumber: process.env.PEPPOL_SUPPLIER_VAT || null,
  companyLegalName: process.env.PEPPOL_SUPPLIER_NAME || "Zoek-een-tuinman.be",
  postcodePattern: "^[0-9]{4}$",
  phonePattern: "^(\\+32|0)[0-9 ]{8,12}$",
  phoneCountryCode: "+32",
};

// Test practitioners + profielen
const TEST_PRACTITIONERS = [
  {
    email: "tuinman1@test.be", firstname: "Jan", lastname: "De Vos", companyName: "Tuinen De Vos BV",
    vat: "BE0123456789", subjectToVat: true, practitionerTypeKey: "Licensed",
    billing: { street: "Korenmarkt", number: "12", municipality: "Gent", postcode: "9000", province: "Oost-Vlaanderen", region: "Vlaanderen" },
    profiles: [{
      slug: "tuinen-de-vos", companyName: "Tuinen De Vos", title: "Erkende tuinaannemer met 20 jaar ervaring",
      introduction: "Wij verzorgen al meer dan 20 jaar tuinen in Oost-Vlaanderen. Van klein onderhoud tot volledige aanleg.",
      telnr: "+32 9 123 45 67", contactEmail: "info@tuinendevos.be", websiteurl: "https://tuinendevos.be", hasWebsite: true,
      office: { street: "Korenmarkt", number: "12", municipality: "Gent", postcode: "9000", province: "Oost-Vlaanderen", region: "Vlaanderen" },
      specializations: ["gras-maaien", "hagen-knippen", "bomen-snoeien", "gazononderhoud"],
      categories: ["tuinonderhoud"], serviceAreas: ["gent", "merelbeke", "destelbergen"],
      practicals: { Languages: ["Nederlands", "Engels"], PriceHour: 45, YearsExperience: 20 },
    }],
  },
  {
    email: "tuinman2@test.be", firstname: "Marc", lastname: "Peeters", companyName: "GreenScape Antwerpen",
    vat: "BE0987654321", subjectToVat: true, practitionerTypeKey: "Licensed",
    billing: { street: "Meir", number: "45", municipality: "Antwerpen", postcode: "2000", province: "Antwerpen", region: "Vlaanderen" },
    profiles: [{
      slug: "greenscape-antwerpen", companyName: "GreenScape", title: "Volledige tuinaanleg & landscaping",
      introduction: "Specialisten in moderne tuinaanleg, terrassen en pergola's in Antwerpen en omstreken.",
      telnr: "+32 3 234 56 78", contactEmail: "hello@greenscape.be", websiteurl: "https://greenscape.be", hasWebsite: true,
      office: { street: "Meir", number: "45", municipality: "Antwerpen", postcode: "2000", province: "Antwerpen", region: "Vlaanderen" },
      specializations: ["paden-terrassen", "houten-constructies", "beplanting", "bestrating"],
      categories: ["tuinaanleg"], serviceAreas: ["antwerpen", "berchem", "deurne"],
      practicals: { Languages: ["Nederlands", "Engels", "Frans"], PriceHour: 55, YearsExperience: 15 },
    }],
  },
  {
    email: "tuinman3@test.be", firstname: "Sophie", lastname: "Dubois", companyName: "Jardin Bruxelles SPRL",
    vat: "BE0111222333", subjectToVat: true, practitionerTypeKey: "Licensed",
    billing: { street: "Avenue Louise", number: "100", municipality: "Brussel", postcode: "1000", province: "Brussel", region: "Brussel" },
    profiles: [{
      slug: "jardin-bruxelles", companyName: "Jardin Bruxelles", title: "Tuinarchitectuur & ecologisch tuinonderhoud",
      introduction: "Tweetalige tuinarchitect, gespecialiseerd in ecologische tuinen en duurzame aanleg.",
      telnr: "+32 2 345 67 89", contactEmail: "contact@jardinbxl.be", websiteurl: "", hasWebsite: false,
      office: { street: "Avenue Louise", number: "100", municipality: "Brussel", postcode: "1000", province: "Brussel", region: "Brussel" },
      specializations: ["beplanting", "vijvers", "irrigatie"],
      categories: ["tuinaanleg", "tuinonderhoud"], serviceAreas: ["brussel", "elsene", "sint-gillis"],
      practicals: { Languages: ["Nederlands", "Frans", "Engels"], PriceHour: 60, YearsExperience: 12 },
    }],
  },
  {
    email: "tuinman4@test.be", firstname: "Tom", lastname: "Vermeulen", companyName: "Vermeulen Tuinen",
    vat: "BE0444555666", subjectToVat: true, practitionerTypeKey: "Licensed",
    billing: { street: "Bondgenotenlaan", number: "78", municipality: "Leuven", postcode: "3000", province: "Vlaams-Brabant", region: "Vlaanderen" },
    profiles: [{
      slug: "vermeulen-tuinen", companyName: "Vermeulen Tuinen", title: "Onderhoud, snoeiwerk en bemesting",
      introduction: "Familiebedrijf gespecialiseerd in regulier tuinonderhoud rond Leuven.",
      telnr: "+32 16 456 78 90", contactEmail: "info@vermeulen-tuinen.be", websiteurl: "https://vermeulen-tuinen.be", hasWebsite: true,
      office: { street: "Bondgenotenlaan", number: "78", municipality: "Leuven", postcode: "3000", province: "Vlaams-Brabant", region: "Vlaanderen" },
      specializations: ["snoeien-bomen", "bemesting", "onkruid-verwijderen", "bladeren-ruimen", "hagen-knippen"]
        .map(s => s === "snoeien-bomen" ? "bomen-snoeien" : s),
      categories: ["tuinonderhoud"], serviceAreas: ["leuven", "heverlee"],
      practicals: { Languages: ["Nederlands"], PriceHour: 40, YearsExperience: 8 },
    }],
  },
  {
    email: "tuinman5@test.be", firstname: "Lieve", lastname: "Janssens", companyName: "Hortus Brugge",
    vat: "BE0777888999", subjectToVat: true, practitionerTypeKey: "Licensed",
    billing: { street: "Markt", number: "5", municipality: "Brugge", postcode: "8000", province: "West-Vlaanderen", region: "Vlaanderen" },
    profiles: [{
      slug: "hortus-brugge", companyName: "Hortus", title: "Volledige tuinaanleg West-Vlaanderen",
      introduction: "Van vijvers tot bestrating en houten pergola's. Voor klein én groot werk.",
      telnr: "+32 50 567 89 01", contactEmail: "info@hortus-brugge.be", websiteurl: "", hasWebsite: false,
      office: { street: "Markt", number: "5", municipality: "Brugge", postcode: "8000", province: "West-Vlaanderen", region: "Vlaanderen" },
      specializations: ["vijvers", "bestrating", "houten-constructies", "afsluitingen", "grasaanleg"],
      categories: ["tuinaanleg"], serviceAreas: ["brugge", "sint-michiels"],
      practicals: { Languages: ["Nederlands", "Engels"], PriceHour: 50, YearsExperience: 10 },
    }],
  },
  {
    email: "tuinman6@test.be", firstname: "Karel", lastname: "Smets", companyName: "Smets Hoveniers",
    vat: "BE0222333444", subjectToVat: false, practitionerTypeKey: "Hobbyist",
    billing: { street: "Stationsplein", number: "1", municipality: "Hasselt", postcode: "3500", province: "Limburg", region: "Vlaanderen" },
    profiles: [{
      slug: "smets-hoveniers", companyName: "Smets Hoveniers", title: "Tuinaannemer Limburg",
      introduction: "Bijberoep tuinaannemer voor klein onderhoud rond Hasselt.",
      telnr: "+32 11 678 90 12", contactEmail: "smets@hoveniers.be", websiteurl: "", hasWebsite: false,
      office: { street: "Stationsplein", number: "1", municipality: "Hasselt", postcode: "3500", province: "Limburg", region: "Vlaanderen" },
      specializations: ["gras-maaien", "hagen-knippen", "onkruid-verwijderen"],
      categories: ["tuinonderhoud"], serviceAreas: ["hasselt"],
      practicals: { Languages: ["Nederlands", "Duits"], PriceHour: 35, YearsExperience: 5 },
    }],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  await client.connect();
  console.log("Connected to DB");

  // 1. WIPE auth.users (orphans). Service role key kan dat via admin API.
  console.log("\n[1/13] Wipe auth.users (orphans)…");
  try {
    let total = 0;
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      if (!data || data.users.length === 0) break;
      for (const u of data.users) {
        const { error: delErr } = await admin.auth.admin.deleteUser(u.id);
        if (delErr) console.warn(`  could not delete ${u.email}:`, delErr.message);
        else total++;
      }
      if (data.users.length < 1000) break;
      page++;
    }
    console.log(`  Deleted ${total} auth.users`);
  } catch (e: any) {
    console.warn(`  auth.users wipe skipped: ${e.message}`);
  }

  // 2. TRUNCATE alle catalogi en data
  console.log("\n[2/13] Truncate alle tabellen…");
  await client.query(`
    TRUNCATE
      contact_request, payment, profile_subscription, subscription_plan_offer, subscription_plan,
      billing_cycle, payment_provider,
      practical_answer_option, practical_answer_string, practical_answer_int, practical_answer_double, practical_answer_date,
      practical_answer, practical_option, practical_question, variable_type,
      profile_offered_service, profile_specialization, profile_service_category, profile_service_area,
      offered_service, specialization, service_category, service_area,
      practitioner_verification_event, profile, admin, practitioner, practitioner_type,
      address, site_config
    RESTART IDENTITY CASCADE
  `);

  // 3. variable_type
  console.log("[3/13] variable_type…");
  for (const v of VARIABLE_TYPES) {
    await client.query(`INSERT INTO variable_type (key) VALUES ($1)`, [v]);
  }

  // 4. practitioner_type
  console.log("[4/13] practitioner_type…");
  const ptIds: Record<string, string> = {};
  for (const pt of PRACTITIONER_TYPES) {
    const r = await client.query(
      `INSERT INTO practitioner_type (key, name, description) VALUES ($1, $2, $3) RETURNING id`,
      [pt.key, pt.name, pt.description]
    );
    ptIds[pt.key] = r.rows[0].id;
  }

  // 5. billing_cycle
  console.log("[5/13] billing_cycle…");
  const bcIds: Record<string, string> = {};
  for (const bc of BILLING_CYCLES) {
    const r = await client.query(
      `INSERT INTO billing_cycle (key, interval, is_active) VALUES ($1, $2, $3) RETURNING id`,
      [bc.key, bc.interval, bc.isActive]
    );
    bcIds[bc.key] = r.rows[0].id;
  }

  // 6. payment_provider
  console.log("[6/13] payment_provider…");
  const ppIds: Record<string, string> = {};
  for (const pp of PAYMENT_PROVIDERS) {
    const r = await client.query(
      `INSERT INTO payment_provider (key, name, is_active) VALUES ($1, $2, $3) RETURNING id`,
      [pp.key, pp.name, pp.isActive]
    );
    ppIds[pp.key] = r.rows[0].id;
  }

  // 7. subscription_plan + offers
  console.log("[7/13] subscription_plan + offers…");
  const planIds: Record<string, string> = {};
  for (const p of SUBSCRIPTION_PLANS) {
    const r = await client.query(
      `INSERT INTO subscription_plan (key, name, price, description, is_active, sort_order, valid_from)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE) RETURNING id`,
      [p.key, p.name, p.price, p.description, p.isActive, p.sortOrder]
    );
    planIds[p.key] = r.rows[0].id;
  }
  for (const o of SUBSCRIPTION_OFFERS) {
    await client.query(
      `INSERT INTO subscription_plan_offer
        (subscription_plan_id, duration_in_years, discount_percentage, total_price, is_popular, is_active, valid_from)
       VALUES ($1, $2, $3, $4, $5, true, CURRENT_DATE)`,
      [planIds[o.planKey], o.durationInYears, o.discountPercentage, o.totalPrice, o.isPopular]
    );
  }

  // 8. service_category
  console.log("[8/13] service_category…");
  const scIds: Record<string, string> = {};
  for (const c of SERVICE_CATEGORIES) {
    const r = await client.query(
      `INSERT INTO service_category (name, slug, description, sort_order, is_system_defined)
       VALUES ($1, $2, $3, $4, true) RETURNING id`,
      [c.name, c.slug, c.description, c.sortOrder]
    );
    scIds[c.slug] = r.rows[0].id;
  }

  // 9. specialization
  console.log("[9/13] specialization (16)…");
  const specIds: Record<string, string> = {};
  for (const s of SPECIALIZATIONS) {
    const r = await client.query(
      `INSERT INTO specialization (name, slug, description, service_category_id, sort_order, is_system_defined)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
      [s.name, s.slug, s.description, scIds[s.categorySlug], s.sortOrder]
    );
    specIds[s.slug] = r.rows[0].id;
  }

  // 9b. offered_service
  console.log("[9b/13] offered_service…");
  for (const os of OFFERED_SERVICES) {
    await client.query(
      `INSERT INTO offered_service (name, slug, description, sort_order, is_system_defined)
       VALUES ($1, $2, $3, $4, true)`,
      [os.name, os.slug, os.description, os.sortOrder]
    );
  }

  // 10. practical_question + options
  console.log("[10/13] practical_question + practical_option…");
  const pqIds: Record<string, string> = {};
  for (const q of PRACTICAL_QUESTIONS) {
    const r = await client.query(
      `INSERT INTO practical_question (key, name, field_type, is_multi, is_required, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [q.key, q.name, q.fieldType, q.isMulti, q.isRequired, q.sortOrder]
    );
    pqIds[q.key] = r.rows[0].id;
  }
  const langOptIds: Record<string, string> = {};
  for (let i = 0; i < LANGUAGE_OPTIONS.length; i++) {
    const lang = LANGUAGE_OPTIONS[i];
    const r = await client.query(
      `INSERT INTO practical_option (practical_question_id, key, name, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [pqIds["Languages"], lang, lang, i]
    );
    langOptIds[lang] = r.rows[0].id;
  }

  // 11. service_area (572 BE gemeentes) — bulk insert
  console.log(`[11/13] service_area (${BELGIAN_MUNICIPALITIES.length} gemeentes)…`);
  const values: string[] = [];
  const params: any[] = [];
  let idx = 1;
  for (const m of BELGIAN_MUNICIPALITIES) {
    values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, true)`);
    params.push(m.municipality, m.postcode, m.province, m.region, "België", m.slug, m.longitude, m.latitude);
  }
  const bulkRes = await client.query(
    `INSERT INTO service_area (municipality, postcode, province, region, country, slug, longitude, latitude, is_system_defined)
     VALUES ${values.join(",")} RETURNING id, postcode, slug`,
    params
  );
  const saIds: Record<string, string> = {};
  for (const row of bulkRes.rows) {
    // key by slug (first occurrence wins — duplicates get postcode-prefixed key for tests)
    if (!saIds[row.slug]) saIds[row.slug] = row.id;
    saIds[`${row.postcode}-${row.slug}`] = row.id;
  }

  // 12. site_config (1 row)
  console.log("[12/13] site_config…");
  await client.query(
    `INSERT INTO site_config
      (site_name, site_tagline, support_email, default_country_code, default_country_name,
       default_region, default_language, default_currency_code, default_vat_percentage,
       company_vat_number, company_legal_name, default_practitioner_type_id,
       default_subscription_plan_id, postcode_pattern, phone_pattern, phone_country_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [
      SITE_CONFIG.siteName, SITE_CONFIG.siteTagline, SITE_CONFIG.supportEmail,
      SITE_CONFIG.defaultCountryCode, SITE_CONFIG.defaultCountryName,
      SITE_CONFIG.defaultRegion, SITE_CONFIG.defaultLanguage,
      SITE_CONFIG.defaultCurrencyCode, SITE_CONFIG.defaultVatPercentage,
      SITE_CONFIG.companyVatNumber, SITE_CONFIG.companyLegalName,
      ptIds["Licensed"], planIds["STANDARD"],
      SITE_CONFIG.postcodePattern, SITE_CONFIG.phonePattern, SITE_CONFIG.phoneCountryCode,
    ]
  );

  // 13. test practitioners + profielen + addresses + auth.users
  console.log("[13/13] test practitioners + profielen…");
  for (const tp of TEST_PRACTITIONERS) {
    // create auth.user
    const { data: user, error: userErr } = await admin.auth.admin.createUser({
      email: tp.email,
      password: "Test1234!",
      email_confirm: true,
    });
    if (userErr) {
      console.warn(`  could not create auth.user ${tp.email}: ${userErr.message}`);
      continue;
    }
    const authUserId = user!.user!.id;

    // billing address
    const billingRes = await client.query(
      `INSERT INTO address (street, number, municipality, postcode, province, region, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [tp.billing.street, tp.billing.number, tp.billing.municipality, tp.billing.postcode,
       tp.billing.province, tp.billing.region, "België"]
    );
    const billingAddressId = billingRes.rows[0].id;

    // practitioner
    const pracRes = await client.query(
      `INSERT INTO practitioner
        (auth_user_id, practitioner_type_id, billing_address_id, email, firstname, lastname,
         subject_to_vat, vat, company_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [authUserId, ptIds[tp.practitionerTypeKey], billingAddressId, tp.email, tp.firstname, tp.lastname,
       tp.subjectToVat, tp.vat, tp.companyName]
    );
    const practitionerId = pracRes.rows[0].id;

    for (const pf of tp.profiles) {
      // office address
      const officeRes = await client.query(
        `INSERT INTO address (street, number, municipality, postcode, province, region, country)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [pf.office.street, pf.office.number, pf.office.municipality, pf.office.postcode,
         pf.office.province, pf.office.region, "België"]
      );
      const officeAddressId = officeRes.rows[0].id;

      // profile
      const prof = await client.query(
        `INSERT INTO profile
          (practitioner_id, office_address_id, company_name, telnr, contact_email, title, introduction,
           websiteurl, has_website, is_active, is_public, is_verified, verification_status, slug, view_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, true, true, 'APPROVED', $10, $11) RETURNING id`,
        [practitionerId, officeAddressId, pf.companyName, pf.telnr, pf.contactEmail, pf.title,
         pf.introduction, pf.websiteurl, pf.hasWebsite, pf.slug, Math.floor(Math.random() * 100)]
      );
      const profileId = prof.rows[0].id;

      // junction: specializations
      for (const slug of pf.specializations) {
        if (!specIds[slug]) continue;
        await client.query(
          `INSERT INTO profile_specialization (profile_id, specialization_id, is_main)
           VALUES ($1, $2, false) ON CONFLICT DO NOTHING`,
          [profileId, specIds[slug]]
        );
      }
      // junction: service_categories
      for (const slug of pf.categories) {
        if (!scIds[slug]) continue;
        await client.query(
          `INSERT INTO profile_service_category (profile_id, service_category_id, is_main)
           VALUES ($1, $2, true) ON CONFLICT DO NOTHING`,
          [profileId, scIds[slug]]
        );
      }
      // junction: service_areas
      for (const slug of pf.serviceAreas) {
        if (!saIds[slug]) continue;
        await client.query(
          `INSERT INTO profile_service_area (profile_id, service_area_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [profileId, saIds[slug]]
        );
      }

      // practical answers
      // Languages (multi option)
      if (pf.practicals.Languages?.length) {
        const ans = await client.query(
          `INSERT INTO practical_answer (profile_id, practical_question_id) VALUES ($1, $2) RETURNING id`,
          [profileId, pqIds["Languages"]]
        );
        for (const lang of pf.practicals.Languages) {
          if (!langOptIds[lang]) continue;
          await client.query(
            `INSERT INTO practical_answer_option (practical_answer_id, practical_option_id) VALUES ($1, $2)`,
            [ans.rows[0].id, langOptIds[lang]]
          );
        }
      }
      // PriceHour (double)
      if (pf.practicals.PriceHour != null) {
        const ans = await client.query(
          `INSERT INTO practical_answer (profile_id, practical_question_id) VALUES ($1, $2) RETURNING id`,
          [profileId, pqIds["PriceHour"]]
        );
        await client.query(
          `INSERT INTO practical_answer_double (practical_answer_id, value) VALUES ($1, $2)`,
          [ans.rows[0].id, pf.practicals.PriceHour]
        );
      }
      // YearsExperience (int)
      if (pf.practicals.YearsExperience != null) {
        const ans = await client.query(
          `INSERT INTO practical_answer (profile_id, practical_question_id) VALUES ($1, $2) RETURNING id`,
          [profileId, pqIds["YearsExperience"]]
        );
        await client.query(
          `INSERT INTO practical_answer_int (practical_answer_id, value) VALUES ($1, $2)`,
          [ans.rows[0].id, pf.practicals.YearsExperience]
        );
      }
    }
    console.log(`  ✓ ${tp.email}`);
  }

  // verify
  const counts = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM practitioner) AS practitioners,
      (SELECT COUNT(*) FROM profile) AS profiles,
      (SELECT COUNT(*) FROM specialization) AS specializations,
      (SELECT COUNT(*) FROM service_category) AS categories,
      (SELECT COUNT(*) FROM service_area) AS service_areas,
      (SELECT COUNT(*) FROM subscription_plan_offer) AS offers,
      (SELECT COUNT(*) FROM practical_question) AS questions,
      (SELECT COUNT(*) FROM practical_option) AS options
  `);
  console.log("\n=== SEED COMPLETE ===");
  console.log(counts.rows[0]);

  await client.end();
}

main().catch(e => {
  console.error("SEED FAILED:", e);
  process.exit(1);
});
