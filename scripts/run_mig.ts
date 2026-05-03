import { Client } from "pg";
import { readFileSync } from "fs";

async function main() {
  const raw = process.env.SUPABASE_DATABASE_URL!;
  // Parse with regex to URL-encode the password (which may contain special chars)
  const m = raw.match(/^(postgres(?:ql)?):\/\/([^:]+):(.+)@([^/:]+)(?::(\d+))?\/(.+?)(?:\?(.*))?$/);
  if (!m) throw new Error("Could not parse SUPABASE_DATABASE_URL");
  const [, , user, pw, host, port, db] = m;
  const c = new Client({
    host, user, password: pw,
    port: port ? parseInt(port, 10) : 5432,
    database: db,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  console.log("Connected to", host);

  const file = process.argv[2] || "migrations/004_vertical_presets_and_cache.sql";
  const sql = readFileSync(file, "utf8");
  try {
    await c.query(sql);
    console.log("MIGRATION OK:", file);
  } catch (e: any) {
    console.error("FAIL:", e.message);
    process.exit(1);
  }

  const r = await c.query("SELECT slug,label,is_system_defined FROM vertical_preset ORDER BY sort_order");
  console.log("Presets:", r.rows);
  const r2 = await c.query("SELECT cache_version, theme_copy IS NOT NULL AS has_theme_copy FROM site_config LIMIT 1");
  console.log("site_config:", r2.rows);
  const r3 = await c.query("SELECT apply_vertical_preset('tuinmannen-be') AS result");
  console.log("Apply tuinmannen-be:", r3.rows[0].result);
  const r4 = await c.query("SELECT cache_version FROM site_config LIMIT 1");
  console.log("After apply, site_config cache_version:", r4.rows);
  const r5 = await c.query("SELECT COUNT(*) FROM service_category");
  const r6 = await c.query("SELECT COUNT(*) FROM specialization");
  console.log("Counts after apply: cats=", r5.rows[0].count, " specs=", r6.rows[0].count);
  await c.end();
}

main().catch((e) => {
  console.error("OUTER:", e);
  process.exit(1);
});
