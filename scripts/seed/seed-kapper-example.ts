/**
 * Example seed for the "kapper" (hairdresser) vertical.
 * Mirrors scripts/seed/seed-catalogs.ts but replaces the gardening-specific
 * service_categories + specializations with hairdresser equivalents.
 *
 * To use as the new vertical:
 *   1. Replace client/src/lib/theme.config.ts with theme.config.kapper.example.ts
 *   2. Update App.tsx <Route> paths to match siteConfig.infoRoutes
 *   3. Run: tsx scripts/seed/seed-kapper-example.ts
 *
 * NOTE: This script is illustrative — only the catalog block (service_category +
 * specialization + service_area) needs to change per vertical. All other
 * tables (subscription_plan, billing_cycle, payment_provider, practical_question,
 * etc.) can be reused as-is from seed-catalogs.ts.
 */

const SERVICE_CATEGORIES = [
  { name: "Dames", slug: "dameskapper", description: "Kappersdiensten voor dames", sortOrder: 1 },
  { name: "Heren", slug: "herenkapper", description: "Kappersdiensten voor heren", sortOrder: 2 },
  { name: "Kinderen", slug: "kinderkapper", description: "Kappersdiensten voor kinderen", sortOrder: 3 },
  { name: "Specialisatie", slug: "barbier", description: "Barbierdiensten en baardverzorging", sortOrder: 4 },
];

const SPECIALIZATIONS = [
  // Dames
  { name: "Knippen", slug: "knippen-dames", categorySlug: "dameskapper", description: "Knipbeurt voor dames", sortOrder: 1 },
  { name: "Kleuren", slug: "kleuren", categorySlug: "dameskapper", description: "Haarkleuring", sortOrder: 2 },
  { name: "Highlights", slug: "highlights", categorySlug: "dameskapper", description: "Highlights en balayage", sortOrder: 3 },
  { name: "Föhnen", slug: "fohnen", categorySlug: "dameskapper", description: "Brushing en föhnen", sortOrder: 4 },
  { name: "Bruidskapsel", slug: "bruidskapsel", categorySlug: "dameskapper", description: "Kapsel voor bruiloft", sortOrder: 5 },
  // Heren
  { name: "Knippen", slug: "knippen-heren", categorySlug: "herenkapper", description: "Klassieke herenknipbeurt", sortOrder: 1 },
  { name: "Tondeuse", slug: "tondeuse", categorySlug: "herenkapper", description: "Tondeuse / fade", sortOrder: 2 },
  // Kinderen
  { name: "Kinderknip", slug: "kinderknip", categorySlug: "kinderkapper", description: "Knipbeurt voor kinderen", sortOrder: 1 },
  // Barbier
  { name: "Baard trimmen", slug: "baard-trimmen", categorySlug: "barbier", description: "Baard trimmen en stylen", sortOrder: 1 },
  { name: "Scheren", slug: "scheren", categorySlug: "barbier", description: "Klassiek nat scheren", sortOrder: 2 },
];

console.log("=== KAPPER SEED EXAMPLE ===");
console.log(`Would seed ${SERVICE_CATEGORIES.length} categories and ${SPECIALIZATIONS.length} specializations.`);
console.log("");
console.log("To run for real, copy the catalog/insert logic from scripts/seed/seed-catalogs.ts");
console.log("and replace its SERVICE_CATEGORIES + SPECIALIZATIONS constants with the ones above.");
console.log("");
console.log("Categories:");
SERVICE_CATEGORIES.forEach((c) => console.log(`  - ${c.slug}: ${c.name}`));
console.log("");
console.log("Specializations:");
SPECIALIZATIONS.forEach((s) => console.log(`  - ${s.slug} (${s.categorySlug}): ${s.name}`));

export { SERVICE_CATEGORIES, SPECIALIZATIONS };
