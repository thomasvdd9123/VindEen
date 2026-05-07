/**
 * Creates the profile_payment_reminder table via direct Postgres connection.
 * Usage: tsx scripts/create-reminder-table.ts
 */
import pg from "pg";

const DATABASE_URL = process.env.SUPABASE_DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing env: SUPABASE_DATABASE_URL");
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS profile_payment_reminder (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
      reminder_type text NOT NULL,
      sent_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(profile_id, reminder_type)
    );
    CREATE INDEX IF NOT EXISTS idx_ppr_profile_id ON profile_payment_reminder(profile_id);
  `);
  console.log("✅ Table 'profile_payment_reminder' is ready.");
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
