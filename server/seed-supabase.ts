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
  
  // First set profiles' category_id and location_id to null to avoid FK violations
  await supabaseAdmin.from("profiles").update({ category_id: null, location_id: null }).neq("id", "00000000-0000-0000-0000-000000000000");
  
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
  // 12 profiles spread across different categories and major Belgian cities
  // ============================================================================
  console.log("👤 Creating 12 sample profiles...");
  
  const sampleProfiles = [
    // TUINAANLEG profiles (6)
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
      is_featured: true,
      is_verified: true,
      categorySlug: "grasaanleg",
      locationSlug: "gent",
      office: { street: "Korenmarkt", number: "15", town: "Gent", municipality: "Gent", postcode: "9000" },
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
      is_featured: true,
      is_verified: true,
      categorySlug: "beplanting",
      locationSlug: "antwerpen",
      office: { street: "Meir", number: "42", town: "Antwerpen", municipality: "Antwerpen", postcode: "2000" },
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
      is_featured: true,
      is_verified: true,
      categorySlug: "bestrating",
      locationSlug: "hasselt",
      office: { street: "Kolonel Dusartplein", number: "25", town: "Hasselt", municipality: "Hasselt", postcode: "3500" },
    },
    {
      name: "Vijver & Waterpartijen Mechelen",
      slug: "vijver-waterpartijen-mechelen",
      email: "info@vijvermechelen.be",
      telnr: "+32 15 456 789",
      website: "https://vijvermechelen.be",
      has_website: true,
      title: "Specialist in Vijvers en Waterpartijen",
      introduction: "Breng rust en sereniteit in uw tuin met een prachtige vijver of waterpartij.",
      description: "Wij ontwerpen en installeren vijvers, fonteinen en complete waterpartijen. Van koi-vijvers tot natuurlijke zwemvijvers, wij realiseren uw droomproject.",
      specializations: ["VIJVERS", "BEPLANTING", "IRRIGATIE"],
      is_featured: true,
      is_verified: true,
      categorySlug: "vijvers",
      locationSlug: "mechelen",
      office: { street: "Grote Markt", number: "8", town: "Mechelen", municipality: "Mechelen", postcode: "2800" },
    },
    {
      name: "Houten Tuinconstructies Brugge",
      slug: "houten-tuinconstructies-brugge",
      email: "hout@tuinbrugge.be",
      telnr: "+32 50 234 567",
      website: "https://houtentuinbrugge.be",
      has_website: true,
      title: "Specialist in Houten Tuinconstructies",
      introduction: "Vakkundige bouw van pergola's, carports en tuinhuizen in West-Vlaanderen.",
      description: "Wij bouwen op maat gemaakte houten constructies voor uw tuin. Van pergola's en overkappingen tot tuinhuizen en carports, altijd met duurzaam hout.",
      specializations: ["HOUTEN_CONSTRUCTIES", "AFSLUITINGEN", "PADEN_TERRASSEN"],
      is_featured: false,
      is_verified: true,
      categorySlug: "houten-constructies",
      locationSlug: "brugge",
      office: { street: "Markt", number: "12", town: "Brugge", municipality: "Brugge", postcode: "8000" },
    },
    {
      name: "Irrigatie Systemen Aalst",
      slug: "irrigatie-systemen-aalst",
      email: "water@irrigatiealst.be",
      telnr: "+32 53 123 456",
      has_website: false,
      title: "Automatische Beregeningssystemen",
      introduction: "Nooit meer handmatig sproeien - wij installeren slimme irrigatiesystemen.",
      description: "Professionele installatie van automatische beregeningssystemen voor particuliere tuinen en sportvelden. Bespaar water en tijd met onze slimme oplossingen.",
      specializations: ["IRRIGATIE", "GAZONONDERHOUD", "GRASAANLEG"],
      is_featured: false,
      is_verified: true,
      categorySlug: "irrigatie",
      locationSlug: "aalst",
      office: { street: "Grote Markt", number: "45", town: "Aalst", municipality: "Aalst", postcode: "9300" },
    },
    // TUINONDERHOUD profiles (6)
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
      is_featured: true,
      is_verified: true,
      categorySlug: "bomen-snoeien",
      locationSlug: "kortrijk",
      office: { street: "Grote Markt", number: "7", town: "Kortrijk", municipality: "Kortrijk", postcode: "8500" },
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
      is_featured: false,
      is_verified: true,
      categorySlug: "gras-maaien",
      locationSlug: "leuven",
      office: { street: "Grote Markt", number: "1", town: "Leuven", municipality: "Leuven", postcode: "3000" },
    },
    {
      name: "Gazonspecialist Oostende",
      slug: "gazonspecialist-oostende",
      email: "gazon@oostende.be",
      telnr: "+32 59 345 678",
      has_website: false,
      title: "Gazonaanleg en -onderhoud aan de Kust",
      introduction: "Specialist in gazons die bestand zijn tegen het zeeklimaat.",
      description: "Gespecialiseerd in gazonaanleg en -onderhoud aan de Belgische kust. Wij weten hoe we met wind, zout en zand moeten omgaan voor een perfect gazon.",
      specializations: ["GRASAANLEG", "GAZONONDERHOUD", "BEMESTING"],
      is_featured: false,
      is_verified: true,
      categorySlug: "gazononderhoud",
      locationSlug: "oostende",
      office: { street: "Zeedijk", number: "100", town: "Oostende", municipality: "Oostende", postcode: "8400" },
    },
    {
      name: "Hagenknippers Roeselare",
      slug: "hagenknippers-roeselare",
      email: "hagen@roeselare.be",
      telnr: "+32 51 234 567",
      website: "https://hagenknippers.be",
      has_website: true,
      title: "Specialist in Hagen en Struiken",
      introduction: "Perfecte hagen en struiken door vakkundige snoei.",
      description: "Wij zijn gespecialiseerd in het knippen en onderhouden van hagen en struiken. Van buxus tot beuk, wij zorgen voor strakke lijnen en gezonde planten.",
      specializations: ["HAGEN_KNIPPEN", "STRUIKEN_SNOEIEN", "BOMEN_SNOEIEN"],
      is_featured: true,
      is_verified: true,
      categorySlug: "hagen-knippen",
      locationSlug: "roeselare",
      office: { street: "Grote Markt", number: "22", town: "Roeselare", municipality: "Roeselare", postcode: "8800" },
    },
    {
      name: "Onkruidvrij Genk",
      slug: "onkruidvrij-genk",
      email: "info@onkruidvrijgenk.be",
      telnr: "+32 89 123 456",
      has_website: false,
      title: "Ecologische Onkruidbestrijding",
      introduction: "Duurzame en milieuvriendelijke onkruidbestrijding in Limburg.",
      description: "Wij bestrijden onkruid op een ecologische manier zonder schadelijke chemicaliën. Thermische onkruidbestrijding, handmatige verwijdering en preventieve maatregelen.",
      specializations: ["ONKRUID_VERWIJDEREN", "BLADEREN_RUIMEN", "BEMESTING"],
      is_featured: false,
      is_verified: true,
      categorySlug: "onkruid-verwijderen",
      locationSlug: "genk",
      office: { street: "Stadsplein", number: "5", town: "Genk", municipality: "Genk", postcode: "3600" },
    },
    {
      name: "Bladruimen Brussel",
      slug: "bladruimen-brussel",
      email: "bladeren@brussel.be",
      telnr: "+32 2 123 45 67",
      website: "https://bladruimenbrussel.be",
      has_website: true,
      title: "Seizoensgebonden Tuinonderhoud",
      introduction: "Professioneel bladruimen en seizoensonderhoud in heel Brussel.",
      description: "Wij verzorgen het seizoensgebonden onderhoud van uw tuin. Bladruimen in de herfst, winterklaar maken, en voorjaarsonderhoud. Particulier en zakelijk.",
      specializations: ["BLADEREN_RUIMEN", "BEMESTING", "GAZONONDERHOUD"],
      is_featured: true,
      is_verified: true,
      categorySlug: "bladeren-ruimen",
      locationSlug: "brussel",
      office: { street: "Grote Markt", number: "1", town: "Brussel", municipality: "Brussel", postcode: "1000" },
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
