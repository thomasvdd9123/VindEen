import { db } from "./db";
import { categories, locations, accounts, profiles, offices, practicals } from "@shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await db.delete(practicals);
  await db.delete(offices);
  await db.delete(profiles);
  await db.delete(accounts);
  await db.delete(locations);
  await db.delete(categories);

  // Seed Categories
  const categoriesData = [
    { name: "Tuinaanlegger", slug: "tuinaanlegger", description: "Specialisten in het aanleggen van tuinen", sortOrder: 1 },
    { name: "Tuinarchitect", slug: "tuinarchitect", description: "Ontwerpers van tuinen en buitenruimtes", sortOrder: 2 },
    { name: "Hovenier", slug: "hovenier", description: "Professionals in tuinonderhoud", sortOrder: 3 },
    { name: "Boomverzorger", slug: "boomverzorger", description: "Experts in boomverzorging en -snoei", sortOrder: 4 },
    { name: "Gazonspecialist", slug: "gazonspecialist", description: "Specialisten in gazonaanleg en -onderhoud", sortOrder: 5 },
    { name: "Vijverspecialist", slug: "vijverspecialist", description: "Experts in vijvers en waterpartijen", sortOrder: 6 },
  ];

  const insertedCategories = await db.insert(categories).values(categoriesData).returning();
  console.log(`✅ Inserted ${insertedCategories.length} categories`);

  // Seed Locations (Belgian cities)
  const locationsData = [
    { name: "Gent", slug: "gent", postcode: "9000", municipality: "Gent", region: "Oost-Vlaanderen", latitude: 51.0543, longitude: 3.7174 },
    { name: "Antwerpen", slug: "antwerpen", postcode: "2000", municipality: "Antwerpen", region: "Antwerpen", latitude: 51.2194, longitude: 4.4025 },
    { name: "Brussel", slug: "brussel", postcode: "1000", municipality: "Brussel", region: "Brussel", latitude: 50.8503, longitude: 4.3517 },
    { name: "Brugge", slug: "brugge", postcode: "8000", municipality: "Brugge", region: "West-Vlaanderen", latitude: 51.2093, longitude: 3.2247 },
    { name: "Leuven", slug: "leuven", postcode: "3000", municipality: "Leuven", region: "Vlaams-Brabant", latitude: 50.8798, longitude: 4.7005 },
    { name: "Mechelen", slug: "mechelen", postcode: "2800", municipality: "Mechelen", region: "Antwerpen", latitude: 51.0259, longitude: 4.4776 },
    { name: "Hasselt", slug: "hasselt", postcode: "3500", municipality: "Hasselt", region: "Limburg", latitude: 50.9307, longitude: 5.3378 },
    { name: "Kortrijk", slug: "kortrijk", postcode: "8500", municipality: "Kortrijk", region: "West-Vlaanderen", latitude: 50.8279, longitude: 3.2649 },
    { name: "Aalst", slug: "aalst", postcode: "9300", municipality: "Aalst", region: "Oost-Vlaanderen", latitude: 50.9364, longitude: 4.0355 },
    { name: "Oostende", slug: "oostende", postcode: "8400", municipality: "Oostende", region: "West-Vlaanderen", latitude: 51.2154, longitude: 2.9286 },
    { name: "Sint-Niklaas", slug: "sint-niklaas", postcode: "9100", municipality: "Sint-Niklaas", region: "Oost-Vlaanderen", latitude: 51.1562, longitude: 4.1437 },
    { name: "Roeselare", slug: "roeselare", postcode: "8800", municipality: "Roeselare", region: "West-Vlaanderen", latitude: 50.9444, longitude: 3.1257 },
    { name: "Dendermonde", slug: "dendermonde", postcode: "9200", municipality: "Dendermonde", region: "Oost-Vlaanderen", latitude: 51.0281, longitude: 4.1014 },
    { name: "Turnhout", slug: "turnhout", postcode: "2300", municipality: "Turnhout", region: "Antwerpen", latitude: 51.3227, longitude: 4.9444 },
    { name: "Genk", slug: "genk", postcode: "3600", municipality: "Genk", region: "Limburg", latitude: 50.9654, longitude: 5.5002 },
  ];

  const insertedLocations = await db.insert(locations).values(locationsData).returning();
  console.log(`✅ Inserted ${insertedLocations.length} locations`);

  // Helper to find category and location by slug
  const getCategoryId = (slug: string) => insertedCategories.find(c => c.slug === slug)?.id;
  const getLocationId = (slug: string) => insertedLocations.find(l => l.slug === slug)?.id;

  // Sample profiles with diverse specializations for filter testing
  const sampleProfiles = [
    {
      name: "Groene Vingers Tuinen",
      slug: "groene-vingers-tuinen",
      email: "info@groenevingers.be",
      telnr: "+32 9 123 45 67",
      website: "https://groenevingers.be",
      hasWebsite: true,
      title: "Tuinaanleg & Onderhoud",
      introduction: "Met meer dan 15 jaar ervaring creëren wij droomtuinen. Van kleine stadstuinen tot grote landschapsprojecten.",
      description: "Groene Vingers Tuinen is gespecialiseerd in het ontwerpen en aanleggen van tuinen die perfect passen bij uw woning en levensstijl.",
      specializations: ["TUINAANLEG", "ONDERHOUD", "BESTRATING"],
      offeredServices: ["Tuinontwerp", "Tuinaanleg", "Terrasaanleg", "Gazonaanleg"],
      isFeatured: true,
      isVerified: true,
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
      hasWebsite: true,
      title: "Tuinontwerp & Landschapsarchitectuur",
      introduction: "Innovatieve tuinontwerpen die functionaliteit en esthetiek combineren.",
      description: "Als ervaren tuinarchitect ontwerp ik tuinen die niet alleen mooi zijn, maar ook praktisch en duurzaam.",
      specializations: ["TUINAANLEG", "STIJLSPECIALIST", "ECOLOGISCH_TUINIEREN"],
      offeredServices: ["3D Tuinontwerp", "Beplantingsplan", "Verlichtingsplan", "Begeleiding aanleg"],
      isFeatured: true,
      isVerified: true,
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
      hasWebsite: false,
      title: "Gecertificeerd Boomverzorger",
      introduction: "Professionele boomverzorging door gecertificeerde arboristen. Veilig en vakkundig.",
      description: "Boomzorg Vlaanderen biedt complete boomverzorging aan: van snoeien en vellen tot stronkverwijdering.",
      specializations: ["BOOMVERZORGING", "SNOEIEN"],
      offeredServices: ["Snoeien", "Vellen", "Stronkverwijdering", "Boomonderzoek"],
      isFeatured: true,
      isVerified: true,
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
      hasWebsite: true,
      title: "Hovenier",
      introduction: "Betrouwbaar tuinonderhoud het hele jaar door. Van grasmaaien tot complete seizoensklussen.",
      specializations: ["ONDERHOUD", "GAZONSPECIALIST", "SNOEIEN"],
      offeredServices: ["Grasmaaien", "Hagen knippen", "Onkruid verwijderen", "Bladruimen"],
      isFeatured: false,
      isVerified: true,
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
      hasWebsite: true,
      title: "Ecologische Tuinaanleg",
      introduction: "Duurzame tuinen die bijdragen aan de biodiversiteit.",
      description: "Eco Tuinen is gespecialiseerd in ecologische tuinaanleg met inheemse plantensoorten.",
      specializations: ["ECOLOGISCH_TUINIEREN", "TUINAANLEG", "VIJVERS"],
      offeredServices: ["Ecologische tuinaanleg", "Insectenhotels", "Natuurlijke vijvers", "Bloemenweiden"],
      isFeatured: true,
      isVerified: true,
      categorySlug: "tuinaanlegger",
      locationSlug: "hasselt",
      office: { street: "Kolonel Dusartplein", number: "12", town: "Hasselt", municipality: "Hasselt", postcode: "3500" },
      practical: { reachability: "Limburg & Vlaams-Brabant", experience: "10 jaar", languages: ["Nederlands", "Duits"], tariff: "Op aanvraag" },
    },
    {
      name: "Gazon Expert",
      slug: "gazon-expert",
      email: "contact@gazonexpert.be",
      telnr: "+32 56 345 678",
      hasWebsite: false,
      title: "Gazonspecialist",
      introduction: "Het perfecte gazon begint hier. Aanleg, renovatie en professioneel onderhoud.",
      specializations: ["GAZONSPECIALIST", "ONDERHOUD"],
      offeredServices: ["Gazonaanleg", "Gazonrenovatie", "Verticuteren", "Bemesting"],
      isFeatured: false,
      isVerified: true,
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
      hasWebsite: true,
      title: "Vijverspecialist",
      introduction: "Complete vijveraanleg en -onderhoud. Van koivijvers tot natuurlijke zwemvijvers.",
      description: "Waterwereld Vijvers is uw partner voor alles wat met water in de tuin te maken heeft.",
      specializations: ["VIJVERS", "TUINAANLEG"],
      offeredServices: ["Vijveraanleg", "Vijveronderhoud", "Zwemvijvers", "Watervallen", "Fonteinen"],
      isFeatured: true,
      isVerified: true,
      categorySlug: "vijverspecialist",
      locationSlug: "aalst",
      office: { street: "Hopmarkt", number: "22", town: "Aalst", municipality: "Aalst", postcode: "9300" },
      practical: { reachability: "Oost-Vlaanderen & Vlaams-Brabant", experience: "18 jaar", languages: ["Nederlands"], tariff: "Op offerte" },
    },
    {
      name: "Hekwerk & Meer",
      slug: "hekwerk-en-meer",
      email: "contact@hekwerkmeer.be",
      telnr: "+32 3 111 222",
      hasWebsite: false,
      title: "Afsluitingen specialist",
      introduction: "Professionele plaatsing van hekwerk, poorten en afsluitingen.",
      specializations: ["AFSLUITINGEN", "BESTRATING"],
      offeredServices: ["Houten afsluitingen", "Metalen hekwerk", "Poorten", "Toegangscontrole"],
      isFeatured: false,
      isVerified: true,
      categorySlug: "tuinaanlegger",
      locationSlug: "mechelen",
      office: { street: "Bruul", number: "55", town: "Mechelen", municipality: "Mechelen", postcode: "2800" },
      practical: { reachability: "Antwerpen & Vlaams-Brabant", experience: "14 jaar", languages: ["Nederlands"], tariff: "Op basis van offerte" },
    },
    {
      name: "Snoei Service",
      slug: "snoei-service",
      email: "info@snoeiservice.be",
      telnr: "+32 59 444 555",
      hasWebsite: false,
      title: "Snoeiwerk specialist",
      introduction: "Vakkundig snoeien van hagen, struiken en fruitbomen.",
      specializations: ["SNOEIEN", "ONDERHOUD", "BOOMVERZORGING"],
      offeredServices: ["Hagen snoeien", "Fruitbomen snoeien", "Struiken snoeien", "Vormsnoei"],
      isFeatured: false,
      isVerified: true,
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
      hasWebsite: true,
      title: "Bestratingsspecialist",
      introduction: "Professionele terrassen, opritten en tuinpaden. Kwaliteit die blijft.",
      description: "Bestratingen Van Damme plaatst alle soorten verharding: klinkers, natuursteen, beton en porselein tegels.",
      specializations: ["BESTRATING", "TUINAANLEG"],
      offeredServices: ["Terrassen", "Opritten", "Tuinpaden", "Afwatering"],
      isFeatured: true,
      isVerified: true,
      categorySlug: "tuinaanlegger",
      locationSlug: "sint-niklaas",
      office: { street: "Stationsstraat", number: "100", town: "Sint-Niklaas", municipality: "Sint-Niklaas", postcode: "9100" },
      practical: { reachability: "Oost-Vlaanderen & Antwerpen", experience: "25 jaar", languages: ["Nederlands"], tariff: "Op offerte" },
    },
    {
      name: "Groene Dromen",
      slug: "groene-dromen",
      email: "hello@groenedromen.be",
      telnr: "+32 51 888 999",
      website: "https://groenedromen.be",
      hasWebsite: true,
      title: "Tuinarchitect & Designer",
      introduction: "Creatieve tuinontwerpen die uw dromen werkelijkheid maken.",
      specializations: ["STIJLSPECIALIST", "TUINAANLEG", "ECOLOGISCH_TUINIEREN"],
      offeredServices: ["Tuinontwerp", "3D visualisatie", "Beplantingsadvies", "Kleuradvies"],
      isFeatured: false,
      isVerified: true,
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
      hasWebsite: false,
      title: "Tuinaanleg & Onderhoud Limburg",
      introduction: "Uw lokale partner voor alle tuinwerken in Limburg.",
      specializations: ["TUINAANLEG", "ONDERHOUD", "GAZONSPECIALIST"],
      offeredServices: ["Tuinaanleg", "Tuinonderhoud", "Gazonaanleg", "Seizoenswerk"],
      isFeatured: false,
      isVerified: true,
      categorySlug: "tuinaanlegger",
      locationSlug: "genk",
      office: { street: "Europalaan", number: "5", town: "Genk", municipality: "Genk", postcode: "3600" },
      practical: { reachability: "Limburg", experience: "7 jaar", languages: ["Nederlands"], tariff: "€38/uur" },
    },
  ];

  for (const profileData of sampleProfiles) {
    // Create account first
    const [account] = await db.insert(accounts).values({
      authUserId: crypto.randomUUID(),
      email: profileData.email,
      role: "BUSINESS",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    }).returning();

    // Create profile
    const [profile] = await db.insert(profiles).values({
      accountId: account.id,
      slug: profileData.slug,
      name: profileData.name,
      email: profileData.email,
      telnr: profileData.telnr || null,
      website: profileData.website || null,
      hasWebsite: profileData.hasWebsite || false,
      description: profileData.description || null,
      introduction: profileData.introduction || null,
      title: profileData.title || null,
      specializations: profileData.specializations,
      offeredServices: profileData.offeredServices,
      isActive: true,
      isPublic: true,
      isVerified: profileData.isVerified,
      verificationStatus: "APPROVED",
      verifiedAt: new Date(),
      isFeatured: profileData.isFeatured,
      categoryId: getCategoryId(profileData.categorySlug),
      locationId: getLocationId(profileData.locationSlug),
    }).returning();

    // Create office
    if (profileData.office) {
      await db.insert(offices).values({
        profileId: profile.id,
        street: profileData.office.street,
        number: profileData.office.number,
        town: profileData.office.town,
        municipality: profileData.office.municipality,
        postcode: profileData.office.postcode,
        country: "België",
      });
    }

    // Create practical
    if (profileData.practical) {
      await db.insert(practicals).values({
        profileId: profile.id,
        reachability: profileData.practical.reachability || null,
        experience: profileData.practical.experience || null,
        languages: profileData.practical.languages || null,
        tariff: profileData.practical.tariff || null,
      });
    }

    console.log(`  ✅ Created profile: ${profileData.name}`);
  }

  console.log(`\n✅ Seeding complete! Created ${sampleProfiles.length} profiles`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
