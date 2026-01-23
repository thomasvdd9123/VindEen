import { supabaseAdmin } from "./lib/supabase";

async function seed() {
  console.log("🌱 Seeding Supabase database...");

  // Clear existing data in correct order (respect foreign keys)
  console.log("Clearing existing data...");
  await supabaseAdmin.from("practicals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin.from("offices").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin.from("contact_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin.from("profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin.from("businesses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin.from("locations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Seed Categories
  const categoriesData = [
    { name: "Tuinaanlegger", slug: "tuinaanlegger", description: "Specialisten in het aanleggen van tuinen", sort_order: 1, is_active: true },
    { name: "Tuinarchitect", slug: "tuinarchitect", description: "Ontwerpers van tuinen en buitenruimtes", sort_order: 2, is_active: true },
    { name: "Hovenier", slug: "hovenier", description: "Professionals in tuinonderhoud", sort_order: 3, is_active: true },
    { name: "Boomverzorger", slug: "boomverzorger", description: "Experts in boomverzorging en -snoei", sort_order: 4, is_active: true },
    { name: "Gazonspecialist", slug: "gazonspecialist", description: "Specialisten in gazonaanleg en -onderhoud", sort_order: 5, is_active: true },
    { name: "Vijverspecialist", slug: "vijverspecialist", description: "Experts in vijvers en waterpartijen", sort_order: 6, is_active: true },
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

  // Seed Locations
  const locationsData = [
    { name: "Gent", slug: "gent", postcode: "9000", municipality: "Gent", region: "Oost-Vlaanderen", latitude: 51.0543, longitude: 3.7174, is_active: true },
    { name: "Antwerpen", slug: "antwerpen", postcode: "2000", municipality: "Antwerpen", region: "Antwerpen", latitude: 51.2194, longitude: 4.4025, is_active: true },
    { name: "Brussel", slug: "brussel", postcode: "1000", municipality: "Brussel", region: "Brussel", latitude: 50.8503, longitude: 4.3517, is_active: true },
    { name: "Brugge", slug: "brugge", postcode: "8000", municipality: "Brugge", region: "West-Vlaanderen", latitude: 51.2093, longitude: 3.2247, is_active: true },
    { name: "Leuven", slug: "leuven", postcode: "3000", municipality: "Leuven", region: "Vlaams-Brabant", latitude: 50.8798, longitude: 4.7005, is_active: true },
    { name: "Mechelen", slug: "mechelen", postcode: "2800", municipality: "Mechelen", region: "Antwerpen", latitude: 51.0259, longitude: 4.4776, is_active: true },
    { name: "Hasselt", slug: "hasselt", postcode: "3500", municipality: "Hasselt", region: "Limburg", latitude: 50.9307, longitude: 5.3378, is_active: true },
    { name: "Kortrijk", slug: "kortrijk", postcode: "8500", municipality: "Kortrijk", region: "West-Vlaanderen", latitude: 50.8279, longitude: 3.2649, is_active: true },
    { name: "Aalst", slug: "aalst", postcode: "9300", municipality: "Aalst", region: "Oost-Vlaanderen", latitude: 50.9364, longitude: 4.0355, is_active: true },
    { name: "Oostende", slug: "oostende", postcode: "8400", municipality: "Oostende", region: "West-Vlaanderen", latitude: 51.2154, longitude: 2.9286, is_active: true },
    { name: "Sint-Niklaas", slug: "sint-niklaas", postcode: "9100", municipality: "Sint-Niklaas", region: "Oost-Vlaanderen", latitude: 51.1562, longitude: 4.1437, is_active: true },
    { name: "Roeselare", slug: "roeselare", postcode: "8800", municipality: "Roeselare", region: "West-Vlaanderen", latitude: 50.9444, longitude: 3.1257, is_active: true },
    { name: "Genk", slug: "genk", postcode: "3600", municipality: "Genk", region: "Limburg", latitude: 50.9654, longitude: 5.5002, is_active: true },
  ];

  const { data: insertedLocations, error: locError } = await supabaseAdmin
    .from("locations")
    .insert(locationsData)
    .select();
  
  if (locError) {
    console.error("Error inserting locations:", locError);
    throw locError;
  }
  console.log(`✅ Inserted ${insertedLocations?.length} locations`);

  // Helper functions
  const getCategoryId = (slug: string) => insertedCategories?.find(c => c.slug === slug)?.id;
  const getLocationId = (slug: string) => insertedLocations?.find(l => l.slug === slug)?.id;

  // Sample profiles
  const sampleProfiles = [
    {
      name: "Groene Vingers Tuinen",
      slug: "groene-vingers-tuinen",
      email: "info@groenevingers.be",
      telnr: "+32 9 123 45 67",
      website: "https://groenevingers.be",
      has_website: true,
      title: "Tuinaanleg & Onderhoud",
      introduction: "Met meer dan 15 jaar ervaring creëren wij droomtuinen.",
      description: "Groene Vingers Tuinen is gespecialiseerd in het ontwerpen en aanleggen van tuinen.",
      specializations: ["TUINAANLEG", "ONDERHOUD", "BESTRATING"],
      offered_services: ["Tuinontwerp", "Tuinaanleg", "Terrasaanleg", "Gazonaanleg"],
      is_featured: true,
      is_verified: true,
      categorySlug: "tuinaanlegger",
      locationSlug: "gent",
      office: { street: "Korenmarkt", number: "15", town: "Gent", municipality: "Gent", postcode: "9000" },
      practical: { reachability: "Oost-Vlaanderen", experience: "15+ jaar", languages: ["Nederlands", "Frans", "Engels"], tariff: "Op aanvraag" },
    },
    {
      name: "De Tuinarchitect",
      slug: "de-tuinarchitect",
      email: "contact@detuinarchitect.be",
      telnr: "+32 3 456 78 90",
      website: "https://detuinarchitect.be",
      has_website: true,
      title: "Tuinontwerp & Landschapsarchitectuur",
      introduction: "Innovatieve tuinontwerpen die functionaliteit en esthetiek combineren.",
      specializations: ["TUINAANLEG", "STIJLSPECIALIST", "ECOLOGISCH_TUINIEREN"],
      offered_services: ["3D Tuinontwerp", "Beplantingsplan", "Verlichtingsplan"],
      is_featured: true,
      is_verified: true,
      categorySlug: "tuinarchitect",
      locationSlug: "antwerpen",
      office: { street: "Meir", number: "42", town: "Antwerpen", municipality: "Antwerpen", postcode: "2000" },
      practical: { reachability: "Heel Vlaanderen", experience: "12 jaar", languages: ["Nederlands", "Engels"], tariff: "€75-125/uur" },
    },
    {
      name: "Boomzorg Vlaanderen",
      slug: "boomzorg-vlaanderen",
      email: "info@boomzorg.be",
      telnr: "+32 50 123 456",
      has_website: false,
      title: "Gecertificeerd Boomverzorger",
      introduction: "Professionele boomverzorging door gecertificeerde arboristen.",
      specializations: ["BOOMVERZORGING", "SNOEIEN"],
      offered_services: ["Snoeien", "Vellen", "Stronkverwijdering", "Boomonderzoek"],
      is_featured: true,
      is_verified: true,
      categorySlug: "boomverzorger",
      locationSlug: "brugge",
      office: { street: "Markt", number: "7", town: "Brugge", municipality: "Brugge", postcode: "8000" },
      practical: { reachability: "West-Vlaanderen", experience: "20 jaar", languages: ["Nederlands", "Frans"], tariff: "Op basis van offerte" },
    },
    {
      name: "Tuinonderhoud Plus",
      slug: "tuinonderhoud-plus",
      email: "hello@tuinonderhoudplus.be",
      telnr: "+32 16 789 012",
      website: "https://tuinonderhoudplus.be",
      has_website: true,
      title: "Hovenier",
      introduction: "Betrouwbaar tuinonderhoud het hele jaar door.",
      specializations: ["ONDERHOUD", "GAZONSPECIALIST", "SNOEIEN"],
      offered_services: ["Grasmaaien", "Hagen knippen", "Onkruid verwijderen"],
      is_featured: false,
      is_verified: true,
      categorySlug: "hovenier",
      locationSlug: "leuven",
      office: { street: "Bondgenotenlaan", number: "88", town: "Leuven", municipality: "Leuven", postcode: "3000" },
      practical: { reachability: "Vlaams-Brabant", experience: "8 jaar", languages: ["Nederlands"], tariff: "€35/uur" },
    },
    {
      name: "Eco Tuinen",
      slug: "eco-tuinen",
      email: "info@ecotuinen.be",
      telnr: "+32 11 234 567",
      website: "https://ecotuinen.be",
      has_website: true,
      title: "Ecologische Tuinaanleg",
      introduction: "Duurzame tuinen die bijdragen aan de biodiversiteit.",
      specializations: ["ECOLOGISCH_TUINIEREN", "TUINAANLEG", "VIJVERS"],
      offered_services: ["Ecologische tuinaanleg", "Insectenhotels", "Natuurlijke vijvers"],
      is_featured: true,
      is_verified: true,
      categorySlug: "tuinaanlegger",
      locationSlug: "hasselt",
      office: { street: "Kolonel Dusartplein", number: "12", town: "Hasselt", municipality: "Hasselt", postcode: "3500" },
      practical: { reachability: "Limburg", experience: "10 jaar", languages: ["Nederlands", "Duits"], tariff: "Op aanvraag" },
    },
    {
      name: "Gazon Expert",
      slug: "gazon-expert",
      email: "contact@gazonexpert.be",
      telnr: "+32 56 345 678",
      has_website: false,
      title: "Gazonspecialist",
      introduction: "Het perfecte gazon begint hier.",
      specializations: ["GAZONSPECIALIST", "ONDERHOUD"],
      offered_services: ["Gazonaanleg", "Gazonrenovatie", "Verticuteren", "Bemesting"],
      is_featured: false,
      is_verified: true,
      categorySlug: "gazonspecialist",
      locationSlug: "kortrijk",
      office: { street: "Grote Markt", number: "1", town: "Kortrijk", municipality: "Kortrijk", postcode: "8500" },
      practical: { reachability: "West-Vlaanderen", experience: "6 jaar", languages: ["Nederlands", "Frans"], tariff: "€40/uur" },
    },
    {
      name: "Waterwereld Vijvers",
      slug: "waterwereld-vijvers",
      email: "info@waterwereldvijvers.be",
      telnr: "+32 9 876 543",
      website: "https://waterwereldvijvers.be",
      has_website: true,
      title: "Vijverspecialist",
      introduction: "Complete vijveraanleg en -onderhoud.",
      specializations: ["VIJVERS", "TUINAANLEG"],
      offered_services: ["Vijveraanleg", "Vijveronderhoud", "Zwemvijvers"],
      is_featured: true,
      is_verified: true,
      categorySlug: "vijverspecialist",
      locationSlug: "aalst",
      office: { street: "Hopmarkt", number: "22", town: "Aalst", municipality: "Aalst", postcode: "9300" },
      practical: { reachability: "Oost-Vlaanderen", experience: "18 jaar", languages: ["Nederlands"], tariff: "Op offerte" },
    },
    {
      name: "Hekwerk & Meer",
      slug: "hekwerk-en-meer",
      email: "contact@hekwerkmeer.be",
      telnr: "+32 3 111 222",
      has_website: false,
      title: "Afsluitingen specialist",
      introduction: "Professionele plaatsing van hekwerk en afsluitingen.",
      specializations: ["AFSLUITINGEN", "BESTRATING"],
      offered_services: ["Houten afsluitingen", "Metalen hekwerk", "Poorten"],
      is_featured: false,
      is_verified: true,
      categorySlug: "tuinaanlegger",
      locationSlug: "mechelen",
      office: { street: "Bruul", number: "55", town: "Mechelen", municipality: "Mechelen", postcode: "2800" },
      practical: { reachability: "Antwerpen", experience: "14 jaar", languages: ["Nederlands"], tariff: "Op basis van offerte" },
    },
    {
      name: "Snoei Service",
      slug: "snoei-service",
      email: "info@snoeiservice.be",
      telnr: "+32 59 444 555",
      has_website: false,
      title: "Snoeiwerk specialist",
      introduction: "Vakkundig snoeien van hagen, struiken en fruitbomen.",
      specializations: ["SNOEIEN", "ONDERHOUD", "BOOMVERZORGING"],
      offered_services: ["Hagen snoeien", "Fruitbomen snoeien", "Struiken snoeien"],
      is_featured: false,
      is_verified: true,
      categorySlug: "hovenier",
      locationSlug: "oostende",
      office: { street: "Kapellestraat", number: "10", town: "Oostende", municipality: "Oostende", postcode: "8400" },
      practical: { reachability: "West-Vlaanderen", experience: "11 jaar", languages: ["Nederlands", "Frans"], tariff: "€45/uur" },
    },
    {
      name: "Bestratingen Van Damme",
      slug: "bestratingen-van-damme",
      email: "info@bestratingenvandamme.be",
      telnr: "+32 3 666 777",
      website: "https://bestratingenvandamme.be",
      has_website: true,
      title: "Bestratingsspecialist",
      introduction: "Professionele terrassen, opritten en tuinpaden.",
      specializations: ["BESTRATING", "TUINAANLEG"],
      offered_services: ["Terrassen", "Opritten", "Tuinpaden"],
      is_featured: true,
      is_verified: true,
      categorySlug: "tuinaanlegger",
      locationSlug: "sint-niklaas",
      office: { street: "Stationsstraat", number: "100", town: "Sint-Niklaas", municipality: "Sint-Niklaas", postcode: "9100" },
      practical: { reachability: "Oost-Vlaanderen", experience: "25 jaar", languages: ["Nederlands"], tariff: "Op offerte" },
    },
    {
      name: "Groene Dromen",
      slug: "groene-dromen",
      email: "hello@groenedromen.be",
      telnr: "+32 51 888 999",
      website: "https://groenedromen.be",
      has_website: true,
      title: "Tuinarchitect & Designer",
      introduction: "Creatieve tuinontwerpen die uw dromen werkelijkheid maken.",
      specializations: ["STIJLSPECIALIST", "TUINAANLEG", "ECOLOGISCH_TUINIEREN"],
      offered_services: ["Tuinontwerp", "3D visualisatie", "Beplantingsadvies"],
      is_featured: false,
      is_verified: true,
      categorySlug: "tuinarchitect",
      locationSlug: "roeselare",
      office: { street: "Ooststraat", number: "33", town: "Roeselare", municipality: "Roeselare", postcode: "8800" },
      practical: { reachability: "West-Vlaanderen", experience: "9 jaar", languages: ["Nederlands", "Engels"], tariff: "€85/uur" },
    },
    {
      name: "Limburgse Tuinen",
      slug: "limburgse-tuinen",
      email: "info@limburgsetuinen.be",
      telnr: "+32 89 123 456",
      has_website: false,
      title: "Tuinaanleg & Onderhoud Limburg",
      introduction: "Uw lokale partner voor alle tuinwerken in Limburg.",
      specializations: ["TUINAANLEG", "ONDERHOUD", "GAZONSPECIALIST"],
      offered_services: ["Tuinaanleg", "Tuinonderhoud", "Gazonaanleg"],
      is_featured: false,
      is_verified: true,
      categorySlug: "tuinaanlegger",
      locationSlug: "genk",
      office: { street: "Europalaan", number: "5", town: "Genk", municipality: "Genk", postcode: "3600" },
      practical: { reachability: "Limburg", experience: "7 jaar", languages: ["Nederlands"], tariff: "€38/uur" },
    },
  ];

  for (const profileData of sampleProfiles) {
    // Create business
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .insert({
        account_id: crypto.randomUUID(),
        email: profileData.email,
        role: "BUSINESS",
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (businessError) {
      console.error(`Error creating business for ${profileData.name}:`, businessError);
      continue;
    }

    // Create profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        business_id: business.id,
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
          country: "België",
        });

      if (officeError) console.error(`Error creating office for ${profileData.name}:`, officeError);
    }

    // Create practical
    if (profileData.practical) {
      const { error: practicalError } = await supabaseAdmin
        .from("practicals")
        .insert({
          profile_id: profile.id,
          reachability: profileData.practical.reachability,
          experience: profileData.practical.experience,
          languages: profileData.practical.languages,
          tariff: profileData.practical.tariff,
        });

      if (practicalError) console.error(`Error creating practical for ${profileData.name}:`, practicalError);
    }

    console.log(`  ✅ Created: ${profileData.name}`);
  }

  console.log(`\n✅ Seeding complete!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
