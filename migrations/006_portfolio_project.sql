-- Migration 006: portfolio_project table
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

create index if not exists portfolio_project_profile_id_idx on public.portfolio_project(profile_id);

alter table public.portfolio_project enable row level security;

-- Allow public read
create policy "portfolio_project_public_read"
  on public.portfolio_project for select
  using (true);

-- Allow profile owner to manage their own projects
create policy "portfolio_project_owner_all"
  on public.portfolio_project for all
  using (
    profile_id in (
      select id from public.profile
      where practitioner_id = auth.uid()
    )
  );
