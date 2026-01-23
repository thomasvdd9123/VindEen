import { supabaseAdmin } from "../lib/supabase";
import { BELGIAN_MUNICIPALITIES } from "../data/belgian-municipalities";

const REGION_DISPLAY_NAMES: Record<string, string> = {
  "VLAANDEREN": "Vlaanderen",
  "WALLONIE": "Wallonië", 
  "BRUSSEL": "Brussel"
};

async function seedLocations() {
  console.log(`Seeding ${BELGIAN_MUNICIPALITIES.length} Belgian municipalities...`);
  
  let inserted = 0;
  let skipped = 0;
  
  for (const municipality of BELGIAN_MUNICIPALITIES) {
    const { data: existing } = await supabaseAdmin
      .from("locations")
      .select("id")
      .eq("slug", municipality.slug)
      .single();
    
    if (existing) {
      skipped++;
      continue;
    }
    
    const { error } = await supabaseAdmin
      .from("locations")
      .insert({
        name: municipality.name,
        slug: municipality.slug,
        postcode: municipality.postcode,
        municipality: municipality.municipality,
        region: REGION_DISPLAY_NAMES[municipality.region] || municipality.region,
        latitude: municipality.latitude,
        longitude: municipality.longitude,
        is_active: true,
      });
    
    if (error) {
      console.error(`Error inserting ${municipality.name}:`, error.message);
    } else {
      inserted++;
    }
  }
  
  console.log(`Done! Inserted: ${inserted}, Skipped (already exists): ${skipped}`);
}

seedLocations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
