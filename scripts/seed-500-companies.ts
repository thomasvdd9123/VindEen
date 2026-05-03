/**
 * Seed script: 500 realistic test company profiles for load & latency testing.
 *
 * All profiles are owned by one dedicated seed practitioner:
 *   email : seed-batch@test.be
 *   pass  : Test1234!
 *
 * Every profile slug starts with "seed-" so seed data is trivially identifiable
 * and purgeable without touching real profiles.
 *
 * Usage:
 *   tsx scripts/seed-500-companies.ts            # insert (skips if already done)
 *   tsx scripts/seed-500-companies.ts --purge    # remove all seed-* profiles + auth user
 *   tsx scripts/seed-500-companies.ts --check    # count existing seed profiles
 *
 * Manual SQL purge:
 *   DELETE FROM profile WHERE slug LIKE 'seed-%';
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SEED_EMAIL = "seed-batch@test.be";
const SEED_PASSWORD = "Test1234!";
const TOTAL = 500;

// ---------------------------------------------------------------------------
// Static copy pools
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  "Jan","Pieter","Marc","Tom","Koen","Bart","Luc","Dirk","Frank","Geert",
  "Wim","Erik","Patrick","Kristof","Raf","Bert","Yves","Joris","Hans","Stijn",
  "Stefan","Wouter","Bram","Kevin","Glenn","Lieve","Sophie","Els","Ann","Nathalie",
];
const LAST_NAMES = [
  "Janssens","Peeters","Maes","Jacobs","Mertens","Willems","Claes","Goossens",
  "Wouters","De Smedt","Vermeersch","Van Damme","De Meyer","Van den Berg","Hermans",
  "Michiels","Lemmens","Hendrickx","De Backer","Van Acker","Desmet","De Wolf",
  "Vandenberghe","Bogaert","De Graef","Cools","Smeets","Pauwels","Stevens","Coens",
];
const COMPANY_WORDS = [
  "Tuinservice","Groenwerk","Hovenier","Tuinonderhoud","Groenonderhoud",
  "Tuinaanleg","Groenaanleg","Tuinwerken","Groenservice","Tuinbedrijf",
  "Tuinspecialist","Tuinexperts","Groenexperts","Tuincentrum","Groenplus",
];
const LEGAL_FORMS = ["BV","VOF","BVBA","& Zonen","Group","Services","Pro","& Co",""];
const STREETS = [
  "Kerkstraat","Dorpsstraat","Stationsstraat","Nieuwstraat","Schoolstraat",
  "Molenstraat","Hoogstraat","Marktplein","Kapelstraat","Bergstraat",
  "Lindelaan","Lindenlaan","Bosweg","Tuinlaan","Groenstraat",
  "Veldweg","Keizerslaan","Ringlaan","Steenweg","Handelslaan",
];
const TITLES = [
  "Erkende tuinaannemer – vakwerk gegarandeerd",
  "Professioneel tuinonderhoud & groenwerken",
  "Van gazon tot volledige tuinaanleg",
  "Uw tuinspecialist voor onderhoud & aanleg",
  "Betrouwbaar groenwerk in uw regio",
  "Volledige tuinverzorging – heel het jaar door",
  "Tuinman met oog voor detail en kwaliteit",
  "Hoveniersbedrijf – vakkundig en stipt",
  "Specialist in tuinaanleg en groenonderhoud",
  "Persoonlijk tuinadvies & uitvoering op maat",
];
const INTRODUCTIONS = [
  "Al meer dan 10 jaar zorgen wij voor prachtige tuinen in de regio. Van eenvoudig onderhoud tot complete heraanleg – bij ons bent u aan het juiste adres.",
  "Passie voor groen staat bij ons centraal. Wij werken nauwgezet, stipt en met oog voor uw persoonlijke wensen.",
  "Ons ervaren team verzorgt particuliere en bedrijfstuinen met evenveel toewijding. Kwaliteit en betrouwbaarheid zijn onze kernwaarden.",
  "Wij zijn een familiebedrijf dat al generaties lang actief is in de tuinsector. U kunt rekenen op vakmanschap en eerlijke prijzen.",
  "Van het eerste gesprek tot de afwerking begeleiden wij u volledig. Uw droomtuin realiseren – dat is onze missie.",
  "Flexibel, betrouwbaar en altijd bereikbaar. Of u nu een kleine tuin heeft of een groot park, wij passen ons aan uw noden aan.",
  "Wij combineren traditioneel vakmanschap met moderne technieken voor een optimaal resultaat. Tevreden klanten zijn onze beste referentie.",
  "Met ons uitgebreide dienstenpakket zijn wij uw totaalpartner voor alle tuinwerken. Vraag vrijblijvend een afspraak aan.",
  "Reeds honderden klanten gingen u voor. Ontdek waarom zij ons elk jaar opnieuw contacteren voor hun tuin.",
  "Duurzaamheid en kwaliteit staan bij ons hoog in het vaandel. Wij kiezen bewust voor streekeigen planten en ecologische methoden.",
];

// Curated Unsplash garden/landscape photo IDs — reliable, permanent URLs
const GARDEN_PHOTO_IDS = [
  "1416879595882-3373a0480b5b",
  "1585320806297-9794b3e4f3b2",
  "1558618666-fcd25c85cd64",
  "1497366216548-37526070297c",
  "1574610421569-9780248463f2",
  "1591857177580-dc82b9ac4e1e",
  "1466027397211-20d0f3b6b8a3",
  "1518709268805-4e9042af9f23",
  "1544161513-0179fe746fd5",
  "1561841482-4fb33f11bc36",
  "1501854140801-50d01698950b",
  "1598300042247-d088f8ab3a91",
  "1590856723047-b14b18cffde3",
  "1622201350644-5d03a3fc2bbb",
  "1488330941038-79b0f9f0f7d3",
  "1587334168158-4a2df7024f73",
  "1604762524889-3e2fcc145559",
  "1416406980668-cf18e00e9def",
  "1531058020387-3be344556be6",
  "1508193638397-1c4234db14d8",
];

function unsplashUrl(id: string): string {
  return `https://images.unsplash.com/photo-${id}?w=800&q=80&fit=crop&auto=format`;
}
function picsumLogo(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/200/200`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
function toSlug(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function makeCompanyName(city: string): string {
  const last = pick(LAST_NAMES);
  const word = pick(COMPANY_WORDS);
  const legal = pick(LEGAL_FORMS);
  switch (randInt(0, 3)) {
    case 0: return `${word} ${last} ${legal}`.trim();
    case 1: return `${word} ${city} ${legal}`.trim();
    case 2: return `${last} ${word} ${legal}`.trim();
    default: return `${word} ${last}`.trim();
  }
}
function makePhone(): string {
  const prefix = pick(["0472","0473","0474","0476","0477","0479","0486","0487","0489","0495"]);
  const n = randInt(100000, 999999).toString();
  return `${prefix} ${n.slice(0,2)} ${n.slice(2,4)} ${n.slice(4)}`;
}

async function sbInsert(table: string, rows: object[]): Promise<void> {
  const { error } = await sb.from(table).insert(rows);
  if (error) throw new Error(`Insert into ${table} failed: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);

  // --check
  if (args.includes("--check")) {
    const { count } = await sb.from("profile").select("*", { count: "exact", head: true })
      .like("slug", "seed-%");
    console.log(`Existing seed profiles: ${count ?? 0}`);
    return;
  }

  // --purge
  if (args.includes("--purge")) {
    console.log("Purging all seed-* profiles…");
    const { error } = await sb.from("profile").delete().like("slug", "seed-%");
    if (error) console.error("Delete error:", error.message);
    else console.log("Deleted seed profiles (cascade removes junctions + answers).");

    const { data: users } = await sb.auth.admin.listUsers();
    const seedUser = users?.users.find(u => u.email === SEED_EMAIL);
    if (seedUser) {
      await sb.auth.admin.deleteUser(seedUser.id);
      console.log("Deleted seed auth user.");
      const { error: pe } = await sb.from("practitioner").delete().eq("email", SEED_EMAIL);
      if (pe) console.error("Practitioner delete error:", pe.message);
      else console.log("Deleted seed practitioner.");
    } else {
      console.log("No seed auth user found (already clean).");
    }
    return;
  }

  // idempotency check
  const { count: existing } = await sb.from("profile").select("*", { count: "exact", head: true })
    .like("slug", "seed-%");
  if ((existing ?? 0) >= TOTAL) {
    console.log(`Already have ${existing} seed profiles. Run with --purge to re-seed.`);
    return;
  }

  // -------------------------------------------------------------------------
  // 1. Load catalogs
  // -------------------------------------------------------------------------
  console.log("[1/7] Loading catalogs…");

  const { data: specRows, error: specErr } = await sb.from("specialization")
    .select("id, slug, service_category_id");
  const { data: saRows, error: saErr } = await sb.from("service_area")
    .select("id, slug, municipality, postcode, province, region");
  const { data: pqRows, error: pqErr } = await sb.from("practical_question")
    .select("id, key, field_type");
  const { data: poRows, error: poErr } = await sb.from("practical_option")
    .select("id, name").order("sort_order");
  const { data: ptRows, error: ptErr } = await sb.from("practitioner_type")
    .select("id").eq("key", "Licensed").limit(1);

  if (specErr || saErr || pqErr || poErr || ptErr) {
    console.error("Catalog fetch error:", specErr?.message || saErr?.message || pqErr?.message);
    return;
  }
  if (!specRows?.length || !saRows?.length || !pqRows?.length) {
    console.error("Catalogs empty — run seed-catalogs.ts first.");
    return;
  }

  const pqLangs = pqRows.find(q => q.key === "Languages")!;
  const pqPrice = pqRows.find(q => q.key === "PriceHour")!;
  const pqYears = pqRows.find(q => q.key === "YearsExperience")!;
  const ptId = ptRows![0].id;
  const langOptMap = new Map((poRows ?? []).map(o => [o.name, o.id]));
  const langNames = (poRows ?? []).map(o => o.name);

  console.log(`  specs=${specRows.length}  areas=${saRows.length}  langOpts=${langNames.length}`);

  // -------------------------------------------------------------------------
  // 2. Ensure seed practitioner
  // -------------------------------------------------------------------------
  console.log("[2/7] Ensuring seed practitioner…");

  let practitionerId: string;
  const { data: existingPrac } = await sb.from("practitioner").select("id").eq("email", SEED_EMAIL).limit(1);
  if (existingPrac?.length) {
    practitionerId = existingPrac[0].id;
    console.log(`  Reusing practitioner ${practitionerId}`);
  } else {
    const { data: authData, error: authErr } = await sb.auth.admin.createUser({
      email: SEED_EMAIL, password: SEED_PASSWORD, email_confirm: true,
    });
    if (authErr) { console.error("Auth user creation failed:", authErr.message); return; }
    const authUserId = authData.user!.id;

    const { data: addrData, error: addrErr } = await sb.from("address").insert({
      street: "Seedstraat", number: "1", municipality: "Brussel",
      postcode: "1000", province: "BRUSSEL", region: "BRUSSEL", country: "België",
    }).select("id").single();
    if (addrErr) { console.error("Address insert failed:", addrErr.message); return; }

    const { data: pracData, error: pracErr } = await sb.from("practitioner").insert({
      auth_user_id: authUserId, practitioner_type_id: ptId,
      billing_address_id: addrData.id, email: SEED_EMAIL,
      firstname: "Seed", lastname: "Batch", subject_to_vat: false,
      company_name: "Seed Batch Tuiniers",
    }).select("id").single();
    if (pracErr) { console.error("Practitioner insert failed:", pracErr.message); return; }
    practitionerId = pracData.id;
    console.log(`  Created practitioner ${practitionerId}`);
  }

  // -------------------------------------------------------------------------
  // 3. Generate profile data in memory
  // -------------------------------------------------------------------------
  console.log("[3/7] Generating data…");

  type GenProfile = {
    id: string;
    slug: string; companyName: string; title: string; introduction: string;
    telnr: string; contactEmail: string; websiteurl: string | null; hasWebsite: boolean;
    logourl: string; imageurls: string[];
    isVerified: boolean; verificationStatus: string; viewCount: number;
    area: NonNullable<typeof saRows>[0];
    specIds: string[]; catIds: string[]; serviceAreaIds: string[];
    langOptIds: string[]; priceHour: number; yearsExp: number;
  };

  const gen: GenProfile[] = [];
  const slugsSeen = new Set<string>();

  for (let i = 0; i < TOTAL; i++) {
    const area = pick(saRows);
    const name = makeCompanyName(area.municipality);
    let baseSlug = toSlug(name);
    const slug = `seed-${String(i + 1).padStart(4, "0")}-${baseSlug}`;
    slugsSeen.add(slug);

    const specs = pickN(specRows, randInt(2, 4));
    const catIdSet = new Set(specs.map(s => s.service_category_id as string));
    const extraAreas = pickN(saRows.filter(a => a.id !== area.id), randInt(1, 5));
    const serviceAreaIds = [...new Set([area.id, ...extraAreas.map(a => a.id)])];

    const photoIds = pickN(GARDEN_PHOTO_IDS, randInt(2, 4));
    const imageurls = photoIds.map(id => unsplashUrl(id));
    const hasWebsite = Math.random() > 0.35;
    const domainSlug = baseSlug.slice(0, 22);
    const langs = pickN(langNames, randInt(1, 3));

    gen.push({
      id: crypto.randomUUID(),
      slug,
      companyName: name,
      title: pick(TITLES),
      introduction: pick(INTRODUCTIONS),
      telnr: makePhone(),
      contactEmail: `info@${domainSlug}.be`,
      websiteurl: hasWebsite ? `https://www.${domainSlug}.be` : null,
      hasWebsite,
      logourl: picsumLogo(slug),
      imageurls,
      isVerified: Math.random() > 0.25,
      verificationStatus: Math.random() > 0.25 ? "APPROVED" : "PENDING",
      viewCount: randInt(0, 500),
      area,
      specIds: specs.map(s => s.id as string),
      catIds: [...catIdSet],
      serviceAreaIds,
      langOptIds: langs.map(l => langOptMap.get(l)!).filter(Boolean),
      priceHour: pick([30, 35, 38, 40, 42, 45, 48, 50, 55, 60, 65, 70]),
      yearsExp: randInt(2, 25),
    });
  }
  console.log(`  Generated ${gen.length} profiles in memory`);

  // -------------------------------------------------------------------------
  // 4. Bulk-insert addresses, get back IDs
  // -------------------------------------------------------------------------
  console.log("[4/7] Inserting addresses…");
  const addrIdByIndex: string[] = new Array(gen.length);

  for (const [ci, chunk] of chunks(gen, 100).entries()) {
    const rows = chunk.map(g => ({
      street: pick(STREETS),
      number: String(randInt(1, 250)),
      municipality: g.area.municipality,
      postcode: g.area.postcode,
      province: g.area.province,
      region: g.area.region,
      country: "België",
    }));
    const { data, error } = await sb.from("address").insert(rows).select("id");
    if (error) { console.error("Address insert error:", error.message); return; }
    data!.forEach((row, i) => { addrIdByIndex[ci * 100 + i] = row.id; });
    process.stdout.write(`  addresses ${Math.min((ci + 1) * 100, gen.length)}/${gen.length}\r`);
  }
  console.log(`\n  ✓ ${gen.length} addresses`);

  // -------------------------------------------------------------------------
  // 5. Bulk-insert profiles
  // -------------------------------------------------------------------------
  console.log("[5/7] Inserting profiles…");

  for (const [ci, chunk] of chunks(gen, 50).entries()) {
    const rows = chunk.map((g, i) => ({
      id: g.id,
      practitioner_id: practitionerId,
      office_address_id: addrIdByIndex[ci * 50 + i],
      company_name: g.companyName,
      telnr: g.telnr,
      contact_email: g.contactEmail,
      title: g.title,
      introduction: g.introduction,
      websiteurl: g.websiteurl,
      has_website: g.hasWebsite,
      logourl: g.logourl,
      imageurls: g.imageurls,
      is_active: true,
      is_public: true,
      is_verified: g.isVerified,
      verification_status: g.verificationStatus,
      slug: g.slug,
      view_count: g.viewCount,
    }));
    const { error } = await sb.from("profile").insert(rows);
    if (error) { console.error(`Profile batch ${ci} error:`, error.message); return; }
    process.stdout.write(`  profiles ${Math.min((ci + 1) * 50, gen.length)}/${gen.length}\r`);
  }
  console.log(`\n  ✓ ${gen.length} profiles`);

  // -------------------------------------------------------------------------
  // 6. Junction rows
  // -------------------------------------------------------------------------
  console.log("[6/7] Inserting junction rows…");

  // profile_specialization
  const specJunctions = gen.flatMap(g =>
    g.specIds.map((sid, i) => ({ profile_id: g.id, specialization_id: sid, is_main: i === 0 }))
  );
  for (const chunk of chunks(specJunctions, 500)) {
    const { error } = await sb.from("profile_specialization").insert(chunk);
    if (error) console.error("spec junction error:", error.message);
  }
  console.log(`  ✓ ${specJunctions.length} profile_specialization`);

  // profile_service_category
  const catJunctions = gen.flatMap(g =>
    g.catIds.map((cid, i) => ({ profile_id: g.id, service_category_id: cid, is_main: i === 0 }))
  );
  for (const chunk of chunks(catJunctions, 500)) {
    const { error } = await sb.from("profile_service_category").insert(chunk);
    if (error) console.error("cat junction error:", error.message);
  }
  console.log(`  ✓ ${catJunctions.length} profile_service_category`);

  // profile_service_area
  const areaJunctions = gen.flatMap(g =>
    g.serviceAreaIds.map(aid => ({ profile_id: g.id, service_area_id: aid }))
  );
  for (const chunk of chunks(areaJunctions, 500)) {
    const { error } = await sb.from("profile_service_area").insert(chunk);
    if (error) console.error("area junction error:", error.message);
  }
  console.log(`  ✓ ${areaJunctions.length} profile_service_area`);

  // -------------------------------------------------------------------------
  // 7. Practical answers
  // -------------------------------------------------------------------------
  console.log("[7/7] Inserting practical answers…");

  // Insert parent practical_answer rows in batches, collect returned IDs
  const allAnswerInputs = gen.flatMap(g => [
    { profile_id: g.id, practical_question_id: pqLangs.id, _type: "langs" as const, _idx: gen.indexOf(g) },
    { profile_id: g.id, practical_question_id: pqPrice.id, _type: "price" as const, _idx: gen.indexOf(g) },
    { profile_id: g.id, practical_question_id: pqYears.id, _type: "years" as const, _idx: gen.indexOf(g) },
  ]);

  const answerMeta: { id: string; type: "langs"|"price"|"years"; profileIdx: number }[] = [];

  for (const chunk of chunks(allAnswerInputs, 200)) {
    const rows = chunk.map(a => ({ profile_id: a.profile_id, practical_question_id: a.practical_question_id }));
    const { data, error } = await sb.from("practical_answer").insert(rows).select("id");
    if (error) { console.error("practical_answer insert error:", error.message); return; }
    data!.forEach((row, i) => {
      answerMeta.push({ id: row.id, type: chunk[i]._type, profileIdx: chunk[i]._idx });
    });
  }

  // practical_answer_double (PriceHour)
  const priceRows = answerMeta
    .filter(a => a.type === "price")
    .map(a => ({ practical_answer_id: a.id, value: gen[a.profileIdx].priceHour }));
  for (const chunk of chunks(priceRows, 400)) {
    const { error } = await sb.from("practical_answer_double").insert(chunk);
    if (error) console.error("price answer error:", error.message);
  }
  console.log(`  ✓ ${priceRows.length} PriceHour (double)`);

  // practical_answer_int (YearsExperience)
  const yearsRows = answerMeta
    .filter(a => a.type === "years")
    .map(a => ({ practical_answer_id: a.id, value: gen[a.profileIdx].yearsExp }));
  for (const chunk of chunks(yearsRows, 400)) {
    const { error } = await sb.from("practical_answer_int").insert(chunk);
    if (error) console.error("years answer error:", error.message);
  }
  console.log(`  ✓ ${yearsRows.length} YearsExperience (int)`);

  // practical_answer_option (Languages — multi-select)
  const langAnswerRows = answerMeta
    .filter(a => a.type === "langs")
    .flatMap(a => gen[a.profileIdx].langOptIds.map(optId => ({
      practical_answer_id: a.id,
      practical_option_id: optId,
    })));
  for (const chunk of chunks(langAnswerRows, 500)) {
    const { error } = await sb.from("practical_answer_option").insert(chunk);
    if (error) console.error("lang option answer error:", error.message);
  }
  console.log(`  ✓ ${langAnswerRows.length} language option rows`);

  // -------------------------------------------------------------------------
  const { count: finalCount } = await sb.from("profile").select("*", { count: "exact", head: true })
    .like("slug", "seed-%");
  console.log(`\nDone! ${finalCount} seed profiles now in DB.`);
  console.log(`  Login  : ${SEED_EMAIL} / ${SEED_PASSWORD}`);
  console.log(`  Purge  : tsx scripts/seed-500-companies.ts --purge`);
  console.log(`  Check  : tsx scripts/seed-500-companies.ts --check`);
}

main().catch(e => { console.error(e); process.exit(1); });
