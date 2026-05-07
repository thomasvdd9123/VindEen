-- Portfolio project table
-- Run this in the Supabase SQL editor

create table if not exists portfolio_project (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profile(id) on delete cascade,
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

-- Index for fast profile lookups
create index if not exists idx_portfolio_project_profile_id
  on portfolio_project(profile_id);

-- RLS: public read
alter table portfolio_project enable row level security;

create policy "Public can view portfolio projects"
  on portfolio_project for select using (true);

create policy "Practitioner can manage own portfolio"
  on portfolio_project for all
  using (
    profile_id in (
      select id from profile
      where practitioner_id in (
        select id from practitioner
        where auth_user_id = auth.uid()
      )
    )
  );
