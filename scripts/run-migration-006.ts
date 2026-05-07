import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const sql = `
create table if not exists public.portfolio_project (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profile(id) on delete cascade,
  title text not null,
  description text,
  duration_days integer,
  price_eur integer,
  work_details text,
  completed_at date,
  image_urls text[] default '{}',
  sort_order integer default 0,
  created_at timestamptz default now()
);

create index if not exists portfolio_project_profile_id_idx
  on public.portfolio_project(profile_id);

alter table public.portfolio_project enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'portfolio_project'
    and policyname = 'portfolio_project_public_read'
  ) then
    create policy portfolio_project_public_read
      on public.portfolio_project for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'portfolio_project'
    and policyname = 'portfolio_project_owner_all'
  ) then
    create policy portfolio_project_owner_all
      on public.portfolio_project for all
      using (
        profile_id in (
          select id from public.profile
          where practitioner_id = auth.uid()
        )
      );
  end if;
end $$;
`;

const { error } = await supabase.rpc("exec_sql", { query: sql }).single();
if (error) {
  // exec_sql RPC may not exist — fall back to raw REST
  console.log("rpc not available, trying direct fetch...");

  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      "Content-Type": "application/json",
    },
  });
  console.log("Response:", res.status);
} else {
  console.log("Migration 006 applied successfully.");
}
