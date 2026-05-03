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

  // BELANGRIJK: alleen schema-wijzigingen toepassen. NOOIT business-data muteren
  // (bv. apply_vertical_preset aanroepen) — dat is destructief en moet expliciet
  // door een admin via /admin/verticalen worden geïnitieerd.
  await c.end();
}

main().catch((e) => {
  console.error("OUTER:", e);
  process.exit(1);
});
