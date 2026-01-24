import { supabaseAdmin } from "./lib/supabase";
import { BELGIAN_MUNICIPALITIES } from "./data/belgian-municipalities";

async function seed() {
  console.log("🌱 Seeding Supabase database...");

  // ============================================================================
  // SAFETY: ONLY clear reference data (categories, locations)
  // NEVER delete user data (profiles, accounts, practicals, offices, contact_requests)
  // ============================================================================
  console.log("⚠️  Clearing reference data ONLY (categories, locations)...");
  console.log("ℹ️  User data (profiles, accounts, etc.) will NOT be deleted.");
  
  await supabaseAdmin.from("locations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // ============================================================================
  // Seed Categories - All 16 specializations grouped by main category
  // ============================================================================
  const categoriesData = [
    // TUINONDERHOUD specializations (8)
    { name: "Gras maaien", slug: "gras-maaien", main_category: "TUINONDERHOUD", description: "Professioneel gazon maaien en onderhouden", sort_order: 1, is_active: true },
    { name: "Bomen snoeien", slug: "bomen-snoeien", main_category: "TUINONDERHOUD", description: "Vakkundige snoei van bomen", sort_order: 2, is_active: true },
    { name: "Struiken snoeien", slug: "struiken-snoeien", main_category: "TUINONDERHOUD", description: "Professioneel snoeien van struiken", sort_order: 3, is_active: true },
    { name: "Hagen knippen", slug: "hagen-knippen", main_category: "TUINONDERHOUD", description: "Hagen knippen en vormgeven", sort_order: 4, is_active: true },
    { name: "Onkruid verwijderen", slug: "onkruid-verwijderen", main_category: "TUINONDERHOUD", description: "Onkruidbestrijding en -preventie", sort_order: 5, is_active: true },
    { name: "Bladeren ruimen", slug: "bladeren-ruimen", main_category: "TUINONDERHOUD", description: "Bladeren opruimen en composteren", sort_order: 6, is_active: true },
    { name: "Bemesting", slug: "bemesting", main_category: "TUINONDERHOUD", description: "Bemesting van gazon en planten", sort_order: 7, is_active: true },
    { name: "Gazononderhoud", slug: "gazononderhoud", main_category: "TUINONDERHOUD", description: "Volledig gazononderhoud en -verzorging", sort_order: 8, is_active: true },
    // TUINAANLEG specializations (8)
    { name: "Grasaanleg", slug: "grasaanleg", main_category: "TUINAANLEG", description: "Aanleg van gazons en grasmatten", sort_order: 9, is_active: true },
    { name: "Paden & terrassen", slug: "paden-terrassen", main_category: "TUINAANLEG", description: "Aanleg van paden en terrassen", sort_order: 10, is_active: true },
    { name: "Houten constructies", slug: "houten-constructies", main_category: "TUINAANLEG", description: "Houten constructies zoals pergola's en schuttingen", sort_order: 11, is_active: true },
    { name: "Afsluitingen & hekwerk", slug: "afsluitingen", main_category: "TUINAANLEG", description: "Plaatsen van afsluitingen en hekwerk", sort_order: 12, is_active: true },
    { name: "Vijvers & waterpartijen", slug: "vijvers", main_category: "TUINAANLEG", description: "Aanleg van vijvers en waterpartijen", sort_order: 13, is_active: true },
    { name: "Bestrating", slug: "bestrating", main_category: "TUINAANLEG", description: "Bestrating en verharding", sort_order: 14, is_active: true },
    { name: "Beplanting", slug: "beplanting", main_category: "TUINAANLEG", description: "Aanplanten van bomen, struiken en planten", sort_order: 15, is_active: true },
    { name: "Irrigatiesystemen", slug: "irrigatie", main_category: "TUINAANLEG", description: "Aanleg van irrigatie- en beregeningssystemen", sort_order: 16, is_active: true },
  ];

  const { data: insertedCategories, error: catError } = await supabaseAdmin
    .from("categories")
    .insert(categoriesData)
    .select();
  
  if (catError) {
    console.error("Error inserting categories:", catError);
    throw catError;
  }
  console.log(`✅ Inserted ${insertedCategories?.length} categories`);

  // ============================================================================
  // Seed Locations - All 581 Belgian municipalities with postcodes and coordinates
  // ============================================================================
  console.log("📍 Inserting all Belgian municipalities...");
  
  // Map province enum to display name for region field
  const provinceToRegion: Record<string, string> = {
    "ANTWERPEN": "Antwerpen",
    "LIMBURG": "Limburg",
    "OOST_VLAANDEREN": "Oost-Vlaanderen",
    "VLAAMS_BRABANT": "Vlaams-Brabant",
    "WEST_VLAANDEREN": "West-Vlaanderen",
    "BRABANT_WALLON": "Brabant Wallon",
    "HAINAUT": "Henegouwen",
    "LIEGE": "Luik",
    "LUXEMBOURG": "Luxemburg",
    "NAMUR": "Namen",
    "BRUSSEL": "Brussel"
  };

  const locationsData = BELGIAN_MUNICIPALITIES.map(m => ({
    name: m.name,
    slug: m.slug,
    postcode: m.postcode,
    municipality: m.municipality,
    region: provinceToRegion[m.province] || m.province,
    latitude: m.latitude,
    longitude: m.longitude,
    is_active: true,
  }));

  // Insert in batches of 100 to avoid hitting limits
  const batchSize = 100;
  let totalInserted = 0;
  
  for (let i = 0; i < locationsData.length; i += batchSize) {
    const batch = locationsData.slice(i, i + batchSize);
    const { data: insertedBatch, error: locError } = await supabaseAdmin
      .from("locations")
      .insert(batch)
      .select();
    
    if (locError) {
      console.error(`Error inserting locations batch ${i / batchSize + 1}:`, locError);
      throw locError;
    }
    totalInserted += insertedBatch?.length || 0;
    console.log(`  📍 Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(locationsData.length / batchSize)} (${totalInserted} total)`);
  }
  console.log(`✅ Inserted ${totalInserted} Belgian municipalities`);

  // Get all locations for reference
  const { data: allLocations } = await supabaseAdmin.from("locations").select("*");
  
  // Helper functions
  const getCategoryId = (slug: string) => insertedCategories?.find(c => c.slug === slug)?.id;
  const getLocationId = (slug: string) => allLocations?.find(l => l.slug === slug)?.id;

  // ============================================================================
  // Seed Sample Profiles (demo data - these have random auth_user_ids)
  // ============================================================================
  console.log("👤 Creating sample profiles...");
  
  const sampleProfiles = [
    {
      name: "Groene Vingers Tuinen",
      slug: "groene-vingers-tuinen",
      email: "info@groenevingers.be",
      telnr: "+32 9 123 45 67",
      website: "https://groenevingers.be",
      has_website: true,
      title: "Tuinaanleg & Onderhoud Oost-Vlaanderen",
      introduction: "Met meer dan 15 jaar ervaring creëren wij droomtuinen in heel Oost-Vlaanderen.",
      description: "Groene Vingers Tuinen is gespecialiseerd in het ontwerpen en aanleggen van tuinen. Van kleine stadstuinen tot grote landschapsprojecten, wij realiseren uw droomtuin met passie en vakmanschap.",
      specializations: ["GRASAANLEG", "BEPLANTING", "BESTRATING"],
      offered_services: ["Tuinontwerp", "Tuinaanleg", "Terrasaanleg", "Gazonaanleg", "Beplanting"],
      is_featured: true,
      is_verified: true,
      categorySlug: "grasaanleg",
      locationSlug: "gent",
      office: { street: "Korenmarkt", number: "15", town: "Gent", municipality: "Gent", postcode: "9000" },
      practical: { experience_years: 15, languages: ["NL", "FR", "EN"], target_audience: "Particulieren en bedrijven" },
    },
    {
      name: "De Tuinarchitect Antwerpen",
      slug: "de-tuinarchitect-antwerpen",
      email: "contact@detuinarchitect.be",
      telnr: "+32 3 456 78 90",
      website: "https://detuinarchitect.be",
      has_website: true,
      title: "Tuinontwerp & Landschapsarchitectuur",
      introduction: "Innovatieve tuinontwerpen die functionaliteit en esthetiek perfect combineren.",
      description: "Als gediplomeerd tuinarchitect ontwerp ik tuinen die passen bij uw levensstijl. Van modern minimalistisch tot romantisch landelijk, elke tuin wordt op maat gemaakt.",
      specializations: ["BEPLANTING", "PADEN_TERRASSEN", "VIJVERS"],
      offered_services: ["3D Tuinontwerp", "Beplantingsplan", "Verlichtingsplan", "Begeleiding uitvoering"],
      is_featured: true,
      is_verified: true,
      categorySlug: "beplanting",
      locationSlug: "antwerpen",
      office: { street: "Meir", number: "42", town: "Antwerpen", municipality: "Antwerpen", postcode: "2000" },
      practical: { experience_years: 12, languages: ["NL", "EN"], target_audience: "Particulieren" },
    },
    {
      name: "Boomzorg West-Vlaanderen",
      slug: "boomzorg-west-vlaanderen",
      email: "info@boomzorg-wvl.be",
      telnr: "+32 50 123 456",
      has_website: false,
      title: "Gecertificeerd Boomverzorger",
      introduction: "Professionele boomverzorging door gecertificeerde arboristen in West-Vlaanderen.",
      description: "Boomzorg West-Vlaanderen biedt professionele boomverzorging aan. Onze gecertificeerde arboristen zorgen voor uw bomen met respect voor de natuur.",
      specializations: ["BOMEN_SNOEIEN", "STRUIKEN_SNOEIEN"],
      offered_services: ["Snoeien", "Vellen", "Stronkverwijdering", "Boomonderzoek", "ETW-gecertificeerd"],
      is_featured: true,
      is_verified: true,
      categorySlug: "bomen-snoeien",
      locationSlug: "brugge",
      office: { street: "Markt", number: "7", town: "Brugge", municipality: "Brugge", postcode: "8000" },
      practical: { experience_years: 20, languages: ["NL", "FR"], target_audience: "Particulieren, gemeenten en bedrijven" },
    },
    {
      name: "Tuinonderhoud Leuven",
      slug: "tuinonderhoud-leuven",
      email: "hello@tuinonderhoudleuven.be",
      telnr: "+32 16 789 012",
      website: "https://tuinonderhoudleuven.be",
      has_website: true,
      title: "Professioneel Tuinonderhoud Vlaams-Brabant",
      introduction: "Uw tuin in topconditie, het hele jaar door.",
      description: "Wij verzorgen alle aspecten van tuinonderhoud: grasmaaien, snoeien, onkruidbestrijding en seizoensgebonden werkzaamheden.",
      specializations: ["GRAS_MAAIEN", "HAGEN_KNIPPEN", "ONKRUID_VERWIJDEREN"],
      offered_services: ["Grasmaaien", "Hagen knippen", "Onkruidbestrijding", "Bladruimen", "Winterklaar maken"],
      is_featured: false,
      is_verified: true,
      categorySlug: "gras-maaien",
      locationSlug: "leuven",
      office: { street: "Grote Markt", number: "1", town: "Leuven", municipality: "Leuven", postcode: "3000" },
      practical: { experience_years: 8, languages: ["NL"], target_audience: "Particulieren" },
    },
    {
      name: "Bestrating & Terrassen Limburg",
      slug: "bestrating-terrassen-limburg",
      email: "info@bestratinglimburg.be",
      telnr: "+32 11 234 567",
      website: "https://bestratinglimburg.be",
      has_website: true,
      title: "Specialist in Bestrating en Terrassen",
      introduction: "Vakkundige aanleg van opritten, terrassen en tuinpaden in heel Limburg.",
      description: "Met oog voor detail en kwaliteit leggen wij uw terras, oprit of tuinpad aan. Van klinkers tot natuursteen, wij werken met de beste materialen.",
      specializations: ["BESTRATING", "PADEN_TERRASSEN", "AFSLUITINGEN"],
      offered_services: ["Terrasaanleg", "Opritten", "Tuinpaden", "Afsluitingen", "Drainage"],
      is_featured: true,
      is_verified: true,
      categorySlug: "bestrating",
      locationSlug: "hasselt",
      office: { street: "Kolonel Dusartplein", number: "25", town: "Hasselt", municipality: "Hasselt", postcode: "3500" },
      practical: { experience_years: 18, languages: ["NL", "FR"], target_audience: "Particulieren en projectontwikkelaars" },
    },
    {
      name: "Gazonspecialist Kortrijk",
      slug: "gazonspecialist-kortrijk",
      email: "gazon@kortrijk.be",
      telnr: "+32 56 345 678",
      has_website: false,
      title: "Gazonaanleg en -onderhoud",
      introduction: "Voor een perfect gazon het hele jaar door.",
      description: "Gespecialiseerd in gazonaanleg en -onderhoud. Van graszoden tot robotmaaiers, wij zorgen voor een strak en gezond gazon.",
      specializations: ["GRASAANLEG", "GAZONONDERHOUD", "BEMESTING"],
      offered_services: ["Gazonaanleg", "Graszoden", "Robotmaaiers", "Bemesting", "Beluchten", "Doorzaaien"],
      is_featured: false,
      is_verified: true,
      categorySlug: "grasaanleg",
      locationSlug: "kortrijk",
      office: { street: "Grote Markt", number: "54", town: "Kortrijk", municipality: "Kortrijk", postcode: "8500" },
      practical: { experience_years: 10, languages: ["NL"], target_audience: "Particulieren en sportclubs" },
    },
  ];

  for (const profileData of sampleProfiles) {
    // Create account (demo accounts with random auth_user_id)
    const { data: account, error: accountError } = await supabaseAdmin
      .from("accounts")
      .insert({
        auth_user_id: crypto.randomUUID(),
        email: profileData.email,
        role: "GARDENER",
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (accountError) {
      console.error(`Error creating account for ${profileData.name}:`, accountError);
      continue;
    }

    // Create profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        account_id: account.id,
        slug: profileData.slug,
        name: profileData.name,
        email: profileData.email,
        telnr: profileData.telnr || null,
        website: profileData.website || null,
        has_website: profileData.has_website || false,
        description: profileData.description || null,
        introduction: profileData.introduction || null,
        title: profileData.title || null,
        specializations: profileData.specializations,
        offered_services: profileData.offered_services,
        is_active: true,
        is_public: true,
        is_verified: profileData.is_verified,
        verification_status: "APPROVED",
        verified_at: new Date().toISOString(),
        is_featured: profileData.is_featured,
        category_id: getCategoryId(profileData.categorySlug),
        location_id: getLocationId(profileData.locationSlug),
      })
      .select()
      .single();

    if (profileError) {
      console.error(`Error creating profile for ${profileData.name}:`, profileError);
      continue;
    }

    // Create office
    if (profileData.office) {
      const { error: officeError } = await supabaseAdmin
        .from("offices")
        .insert({
          profile_id: profile.id,
          street: profileData.office.street,
          number: profileData.office.number,
          town: profileData.office.town,
          municipality: profileData.office.municipality,
          postcode: profileData.office.postcode,
        });

      if (officeError) console.error(`Error creating office for ${profileData.name}:`, officeError);
    }

    // Create practical
    if (profileData.practical) {
      const { error: practicalError } = await supabaseAdmin
        .from("practicals")
        .insert({
          profile_id: profile.id,
          experience_years: profileData.practical.experience_years,
          languages: profileData.practical.languages,
          target_audience: profileData.practical.target_audience,
        });

      if (practicalError) console.error(`Error creating practical for ${profileData.name}:`, practicalError);
    }

    console.log(`  ✅ Created: ${profileData.name}`);
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   - ${insertedCategories?.length} categories`);
  console.log(`   - ${totalInserted} locations (Belgian municipalities)`);
  console.log(`   - ${sampleProfiles.length} sample profiles with offices and practicals`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
