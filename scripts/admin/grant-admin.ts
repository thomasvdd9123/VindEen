/**
 * Grant admin rights to a user by email.
 * Usage: tsx scripts/admin/grant-admin.ts <email>
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: tsx scripts/admin/grant-admin.ts <email>");
  process.exit(1);
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let authUserId: string | null = null;
  let page = 1;
  while (!authUserId) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    if (!data || !data.users.length) break;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) { authUserId = found.id; break; }
    if (data.users.length < 1000) break;
    page++;
  }
  if (!authUserId) {
    console.error(`User with email ${email} not found in auth.users`);
    process.exit(1);
  }

  const { data: existing } = await supabase.from("admin").select("id").eq("auth_user_id", authUserId).maybeSingle();
  if (existing) {
    console.log(`User ${email} (${authUserId}) is al admin (id: ${(existing as any).id}).`);
    return;
  }
  const { data, error } = await supabase.from("admin").insert({ auth_user_id: authUserId }).select("id").single();
  if (error) throw error;
  console.log(`Granted admin: ${email} (${authUserId}) → admin.id=${(data as any).id}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
