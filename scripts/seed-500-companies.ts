import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const firstNames = [
  "Jan", "Pieter", "Marc", "Tom", "Koen", "Bart", "Luc", "Dirk", "Frank", "Geert",
  "Wim", "Erik", "Patrick", "Kristof", "Raf", "Bert", "Yves", "Joris", "Hans", "Stijn",
  "Stefan", "Wouter", "Bram", "Kevin", "Glenn", "Nick", "Tim", "Jef", "Philip", "Bruno"
];

const lastNames = [
  "Janssens", "Peeters", "Maes", "Jacobs", "Mertens", "Willems", "Claes", "Goossens",
  "Wouters", "De Smedt", "Vermeersch", "Van Damme", "De Meyer", "Van den Berg", "Hermans",
  "Michiels", "Lemmens", "Hendrickx", "De Backer", "Van Acker", "Desmet", "De Wolf",
  "Vandenberghe", "Bogaert", "De Graef", "Cools", "Smeets", "Pauwels", "Stevens", "Coens"
];

const companyPrefixes = [
  "Tuinservice", "Groenwerk", "Hovenier", "Tuinonderhoud", "Groenonderhoud", 
  "Tuinaanleg", "Groenaanleg", "Tuinwerken", "Groenservice", "Tuinbedrijf",
  "Tuincentrum", "Groencentrum", "Tuinspecialist", "Tuinexperts", "Groenexperts"
];

const companySuffixes = [
  "& Zonen", "BVBA", "VOF", "& Co", "Group", "Services", "Pro", "Plus", ""
];

const descriptions = [
  "Vakkundige tuinverzorging met oog voor detail en kwaliteit.",
  "Al meer dan 10 jaar uw partner voor alle tuinwerken in de regio.",
  "Professionele tuinservice voor particulieren en bedrijven.",
  "Wij zorgen voor een prachtige tuin, het hele jaar door.",
  "Betrouwbare tuinman met jarenlange ervaring.",
  "Uw tuin verdient de beste zorgen. Wij leveren kwaliteit.",
  "Van klein onderhoud tot volledige tuinaanleg.",
  "Specialisten in tuinonderhoud en groenvoorziening.",
  "Persoonlijke aanpak en vakmanschap staan centraal.",
  "Flexibel, betrouwbaar en altijd stipt op tijd."
];

const introductions = [
  "Welkom bij ons tuinbedrijf! Wij zijn gepassioneerd door groen.",
  "Met liefde voor de natuur verzorgen wij uw tuin.",
  "Uw droomtuin begint hier. Neem vandaag nog contact op.",
  "Professioneel, persoonlijk en betaalbaar tuinonderhoud.",
  "Al jaren actief in de regio met tevreden klanten.",
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateCompanyName(location: string): string {
  const style = Math.floor(Math.random() * 4);
  const lastName = randomChoice(lastNames);
  const prefix = randomChoice(companyPrefixes);
  const suffix = randomChoice(companySuffixes);
  
  switch (style) {
    case 0: return `${prefix} ${lastName} ${suffix}`.trim();
    case 1: return `${prefix} ${location} ${suffix}`.trim();
    case 2: return `${lastName} ${prefix} ${suffix}`.trim();
    default: return `${prefix} ${lastName}`.trim();
  }
}

function generateSlug(name: string, index: number): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") + `-${index}`;
}

function generatePhone(): string {
  const prefixes = ["0472", "0473", "0474", "0475", "0476", "0477", "0478", "0479", "0486", "0487"];
  const prefix = randomChoice(prefixes);
  const number = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
  return `${prefix} ${number.slice(0, 2)} ${number.slice(2, 4)} ${number.slice(4)}`;
}

function generateEmail(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
  const domains = ["gmail.com", "hotmail.be", "outlook.be", "telenet.be", "proximus.be"];
  return `info@${slug}.be`;
}

async function main() {
  console.log("Fetching categories and locations...");
  
  const { data: categories } = await supabase.from("categories").select("id, name, slug");
  const { data: locations } = await supabase.from("locations").select("id, name, postcode, municipality");
  
  if (!categories || !locations) {
    console.error("Failed to fetch categories or locations");
    return;
  }
  
  console.log(`Found ${categories.length} categories and ${locations.length} locations`);
  
  // Create a seed account for all test profiles
  const seedAccountId = crypto.randomUUID();
  const { error: accountError } = await supabase.from("accounts").insert({
    id: seedAccountId,
    auth_user_id: "seed-user-" + Date.now(),
    email: "seed@zoek-een-tuinman.be",
    company_name: "Seed Data Account",
  });
  
  if (accountError) {
    console.error("Error creating seed account:", accountError.message);
    return;
  }
  console.log("Created seed account:", seedAccountId);
  
  const profiles: any[] = [];
  const offices: any[] = [];
  
  for (let i = 0; i < 500; i++) {
    const location = randomChoice(locations);
    const category = randomChoice(categories);
    const name = generateCompanyName(location.municipality);
    const slug = generateSlug(name, i);
    const specs = randomSubset(categories.map(c => c.slug), 2, 5);
    
    const profileId = crypto.randomUUID();
    
    profiles.push({
      id: profileId,
      account_id: seedAccountId,
      slug,
      name,
      email: generateEmail(name),
      telnr: generatePhone(),
      website: Math.random() > 0.3 ? `https://www.${slug.replace(/-\d+$/, "")}.be` : null,
      has_website: Math.random() > 0.3,
      description: randomChoice(descriptions),
      introduction: randomChoice(introductions),
      title: `${randomChoice(["Tuinman", "Hovenier", "Groenwerker", "Tuinspecialist"])} in ${location.municipality}`,
      specializations: specs,
      is_active: true,
      is_public: true,
      is_verified: Math.random() > 0.2,
      verification_status: Math.random() > 0.2 ? "APPROVED" : "PENDING",
      category_id: category.id,
      location_id: location.id,
      view_count: 0,
      website_clicks: 0,
    });
    
    const streets = ["Kerkstraat", "Dorpsstraat", "Stationsstraat", "Nieuwstraat", "Schoolstraat", 
                     "Molenstraat", "Hoogstraat", "Markt", "Kapelstraat", "Bergstraat"];
    
    offices.push({
      id: crypto.randomUUID(),
      profile_id: profileId,
      street: randomChoice(streets),
      number: Math.floor(Math.random() * 200 + 1).toString(),
      town: location.municipality,
      municipality: location.municipality,
      postcode: location.postcode,
    });
    
    if ((i + 1) % 50 === 0) {
      console.log(`Generated ${i + 1} companies...`);
    }
  }
  
  console.log("Inserting profiles into database...");
  
  const batchSize = 50;
  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize);
    const { error } = await supabase.from("profiles").insert(batch);
    if (error) {
      console.error(`Error inserting profiles batch ${i / batchSize}:`, error.message);
    } else {
      console.log(`Inserted profiles ${i + 1} to ${Math.min(i + batchSize, profiles.length)}`);
    }
  }
  
  console.log("Inserting offices into database...");
  
  for (let i = 0; i < offices.length; i += batchSize) {
    const batch = offices.slice(i, i + batchSize);
    const { error } = await supabase.from("offices").insert(batch);
    if (error) {
      console.error(`Error inserting offices batch ${i / batchSize}:`, error.message);
    } else {
      console.log(`Inserted offices ${i + 1} to ${Math.min(i + batchSize, offices.length)}`);
    }
  }
  
  console.log("Done! Inserted 500 companies with offices.");
}

main().catch(console.error);
