-- ============================================================================
-- MotoRent: Add `motorcycles` table + storage bucket for the new
-- Admin "Add Motor" fleet management feature.
--
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Safe to run once. Wrapped in a transaction: if anything fails, nothing
-- is applied.
-- ============================================================================

begin;

-- ============================================================================
-- STEP 1: The motorcycles table itself
-- ============================================================================
create table if not exists motorcycles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  tagline text,
  image_url text,
  rate_24hr numeric not null,
  rate_12hr numeric not null,
  rate_6hr numeric not null,
  rate_1hr numeric not null,
  status text not null default 'Available',
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Allow public read (the catalog is public-facing on the homepage/Bikes page),
-- and allow inserts/updates/deletes from the app's anon key (matches the
-- existing permissive pattern already used by every other table in this
-- project — there is no service-role key involved anywhere in this app).
alter table motorcycles enable row level security;

drop policy if exists "Public read motorcycles" on motorcycles;
create policy "Public read motorcycles"
  on motorcycles for select
  using (true);

drop policy if exists "Public write motorcycles" on motorcycles;
create policy "Public write motorcycles"
  on motorcycles for all
  using (true)
  with check (true);

-- ============================================================================
-- STEP 2: Storage bucket for admin-uploaded motor photos
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('motor_images', 'motor_images', true)
on conflict (id) do nothing;

drop policy if exists "Public read motor images" on storage.objects;
create policy "Public read motor images"
  on storage.objects for select
  using (bucket_id = 'motor_images');

drop policy if exists "Public upload motor images" on storage.objects;
create policy "Public upload motor images"
  on storage.objects for insert
  with check (bucket_id = 'motor_images');

drop policy if exists "Public delete motor images" on storage.objects;
create policy "Public delete motor images"
  on storage.objects for delete
  using (bucket_id = 'motor_images');

-- ============================================================================
-- STEP 3: Seed the 6 motors that are already live on the site (currently
-- hardcoded in the frontend code). image_url is left NULL for these —
-- the frontend already has their photos bundled locally and will keep
-- using those as a fallback when image_url is empty. Any NEW motor you
-- add through the Admin panel will require an uploaded photo.
-- ============================================================================
insert into motorcycles (name, description, rate_24hr, rate_12hr, rate_6hr, rate_1hr, display_order)
values
  ('Yamaha NMAX V3', 'Comfortable, powerful, and perfect for long distance rides.', 800, 600, 400, 100, 1),
  ('Yamaha Aerox V3', 'Sporty look with high performance racing engine technology.', 750, 550, 400, 100, 2),
  ('Honda Fazzio 125', 'Aesthetic retro classic scooter bringing unique fashion vibes.', 650, 450, 300, 75, 3),
  ('Honda Click 125i V3', 'Modern city commuter featuring supreme fuel savings configuration.', 650, 450, 300, 75, 4),
  ('Yamaha Mio i 125', 'Lightweight easy-ride companion reliable for swift daily operations and city slinging.', 600, 400, 275, 70, 5),
  ('Honda Beat FI', 'Compact agile engineering excellent for heavy metropolitan traffic navigation.', 600, 400, 275, 70, 6)
on conflict (name) do nothing;

commit;

-- ============================================================================
-- Sanity check — run after and eyeball the results:
-- ============================================================================
-- select id, name, rate_24hr, rate_12hr, rate_6hr, rate_1hr, status, display_order from motorcycles order by display_order;
