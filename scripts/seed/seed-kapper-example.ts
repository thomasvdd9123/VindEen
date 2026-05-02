/**
 * Real, runnable example seed for the "kapper" (hairdresser) vertical.
 *
 * What it does:
 *   - Connects to SUPABASE_DATABASE_URL (or PGURL)
 *   - TRUNCATEs only the catalog tables that change per vertical:
 *     service_category, specialization, profile_service_category,
 *     profile_specialization (and dependent profile_offered_service /
 *     offered_service if you want to fully reset)
 *   - Inserts kapper categories + specializations
 *
 * It does NOT touch subscription_plan, billing_cycle, payment_provider,
 * practical_question, service_area or site_config — those are vertical-
 * agnostic. Reuse `seed-catalogs.ts` for those (or run that script first).
 *
 * Run:  tsx scripts/seed/seed-kapper-example.ts
 */
import { Client } from "pg";

const PG_URL = process.env.PGURL || process.env.SUPABASE_DATABASE_URL;
if (!PG_URL) {
  console.error("Missing PGURL or SUPABASE_DATABASE_URL");
  process.exit(1);
}

const SERVICE_CATEGORIES = [
  { name: "Dames", slug: "dameskapper", description: "Kappersdiensten voor dames", sortOrder: 1 },
  { name: "Heren", slug: "herenkapper", description: "Kappersdiensten voor heren", sortOrder: 2 },
  { name: "Kinderen", slug: "kinderkapper", description: "Kappersdiensten voor kinderen", sortOrder: 3 },
  { name: "Specialisatie", slug: "barbier", description: "Barbierdiensten en baardverzorging", sortOrder: 4 },
];

const SPECIALIZATIONS = [
  { name: "Knippen", slug: "knippen-dames", categorySlug: "dameskapper", description: "Knipbeurt voor dames", sortOrder: 1 },
  { name: "Kleuren", slug: "kleuren", categorySlug: "dameskapper", description: "Haarkleuring", sortOrder: 2 },
  { name: "Highlights", slug: "highlights", categorySlug: "dameskapper", description: "Highlights en balayage", sortOrder: 3 },
  { name: "Föhnen", slug: "fohnen", categorySlug: "dameskapper", description: "Brushing en föhnen", sortOrder: 4 },
  { name: "Bruidskapsel", slug: "bruidskapsel", categorySlug: "dameskapper", description: "Kapsel voor bruiloft", sortOrder: 5 },
  { name: "Knippen", slug: "knippen-heren", categorySlug: "herenkapper", description: "Klassieke herenknipbeurt", sortOrder: 1 },
  { name: "Tondeuse", slug: "tondeuse", categorySlug: "herenkapper", description: "Tondeuse / fade", sortOrder: 2 },
  { name: "Kinderknip", slug: "kinderknip", categorySlug: "kinderkapper", description: "Knipbeurt voor kinderen", sortOrder: 1 },
  { name: "Baard trimmen", slug: "baard-trimmen", categorySlug: "barbier", description: "Baard trimmen en stylen", sortOrder: 1 },
  { name: "Scheren", slug: "scheren", categorySlug: "barbier", description: "Klassiek nat scheren", sortOrder: 2 },
];

async function main() {
  const client = new Client({ connectionString: PG_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to DB");

  console.log("Truncating catalog tables (specialization, service_category + their junctions)…");
  await client.query(`
    TRUNCATE
      profile_specialization, profile_service_category,
      specialization, service_category
    RESTART IDENTITY CASCADE
  `);

  console.log(`Inserting ${SERVICE_CATEGORIES.length} service_category rows…`);
  const scIds: Record<string, string> = {};
  for (const c of SERVICE_CATEGORIES) {
    const r = await client.query(
      `INSERT INTO service_category (name, slug, description, sort_order, is_system_defined)
       VALUES ($1, $2, $3, $4, true) RETURNING id`,
      [c.name, c.slug, c.description, c.sortOrder],
    );
    scIds[c.slug] = r.rows[0].id;
  }

  console.log(`Inserting ${SPECIALIZATIONS.length} specialization rows…`);
  for (const s of SPECIALIZATIONS) {
    if (!scIds[s.categorySlug]) {
      console.warn(`  skip ${s.slug}: missing parent category ${s.categorySlug}`);
      continue;
    }
    await client.query(
      `INSERT INTO specialization (name, slug, description, service_category_id, sort_order, is_system_defined)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [s.name, s.slug, s.description, scIds[s.categorySlug], s.sortOrder],
    );
  }

  const counts = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM service_category) AS categories,
      (SELECT COUNT(*) FROM specialization) AS specializations
  `);
  console.log("=== KAPPER CATALOG SEED COMPLETE ===");
  console.log(counts.rows[0]);

  await client.end();
}

main().catch((e) => {
  console.error("SEED FAILED:", e);
  process.exit(1);
});
