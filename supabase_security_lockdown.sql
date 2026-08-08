-- ============================================================================
-- MotoRent: Security lockdown — Row Level Security + private storage
--
-- WHY: Verified live against the production Supabase project using only the
-- public anon key (the same key that ships in the deployed website's JS
-- bundle — anyone can read it from their browser's Network tab). Confirmed,
-- right now, before this migration:
--   - Anyone can SELECT * from `bookings`  -> every customer's booking,
--     amounts, balance_due, exposed to the whole internet.
--   - Anyone can SELECT * from `clients`   -> every customer's full name,
--     email, phone number, exposed to the whole internet.
--   - Anyone can LIST the government-ID storage bucket -> every uploaded
--     government ID photo's filename (and the photo itself) is fetchable
--     with no login at all.
-- Root cause: this app has no service-role key anywhere (by design — it's
-- a pure frontend + anon key app), so Row Level Security on the tables IS
-- the entire access-control layer. It was never turned on for these tables.
--
-- WHAT THIS DOES:
--   1. Adds an is_admin() helper so policies can check "is the logged-in
--      user an admin" without recursively re-querying `clients` under RLS.
--   2. Turns on RLS for clients / bookings / reviews with "own row, or
--      admin sees everything" policies.
--   3. Blocks a logged-in customer from granting themselves admin via a
--      raw API call (a trigger, not just a policy — policies alone can't
--      stop you from changing a column ON your own row).
--   4. Replaces the fully-open motorcycles WRITE policy (`using(true)`)
--      with admin-only writes. Reads stay public — it's the site's catalog.
--   5. Adds a narrow public VIEW (`booking_activity`) exposing only
--      motorcycle_name/status/has_receipt, so the "is this bike already
--      booked" check on the homepage keeps working for anonymous visitors
--      without exposing full booking rows to them.
--   6. Makes the government-ID and receipt storage buckets private, with
--      access limited to the uploader or an admin (via signed URLs — the
--      matching frontend change is in the same commit as this file).
--
-- HOW TO RUN:
--   Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
--   Wrapped in a transaction: if anything fails, nothing is applied.
--
-- BEFORE YOU RUN THIS: deploy the matching frontend code first (or right
-- after — see the commit this file shipped with). The frontend now reads
-- `clients.is_admin` instead of hardcoding your email, and reads storage
-- via signed URLs instead of public URLs. Running this SQL against the
-- OLD frontend will make the admin panel and ID viewing stop working
-- until the new frontend is live.
-- ============================================================================

begin;

-- ============================================================================
-- STEP 0: make sure is_admin has no nulls, then flag the real admin account(s)
-- ============================================================================
alter table clients alter column is_admin set default false;
update clients set is_admin = false where is_admin is null;
alter table clients alter column is_admin set not null;

update clients set is_admin = true
where email in ('anjhon.hulguin02@gmail.com', 'admin@motorent.local')
   or email like 'admin%';

-- ============================================================================
-- STEP 1: is_admin() helper — SECURITY DEFINER so it can read `clients`
-- to check the CURRENT user's own row, even once RLS is on for that table
-- (without this, a clients policy that calls is_admin() which queries
-- clients would recurse into itself).
-- ============================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from clients where id = auth.uid()), false);
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ============================================================================
-- STEP 2: clients — own row only, admin sees/manages all
-- ============================================================================
alter table clients enable row level security;

drop policy if exists "clients_select_own_or_admin" on clients;
create policy "clients_select_own_or_admin"
  on clients for select
  using (id = auth.uid() or is_admin());

drop policy if exists "clients_insert_own" on clients;
create policy "clients_insert_own"
  on clients for insert
  with check (id = auth.uid());

drop policy if exists "clients_update_own_or_admin" on clients;
create policy "clients_update_own_or_admin"
  on clients for update
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

drop policy if exists "clients_delete_admin_only" on clients;
create policy "clients_delete_admin_only"
  on clients for delete
  using (is_admin());

-- Belt-and-suspenders: even though the UPDATE policy above lets a customer
-- update their own row, don't let them flip their own is_admin flag by
-- hand-crafting an API call. Only an existing admin can change is_admin.
create or replace function public.prevent_self_admin_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and not is_admin() then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists clients_block_admin_escalation on clients;
create trigger clients_block_admin_escalation
  before update on clients
  for each row execute function public.prevent_self_admin_escalation();

-- ============================================================================
-- STEP 3: bookings — own bookings only, admin sees/manages all
-- ============================================================================
alter table bookings enable row level security;

drop policy if exists "bookings_select_own_or_admin" on bookings;
create policy "bookings_select_own_or_admin"
  on bookings for select
  using (client_id = auth.uid() or is_admin());

drop policy if exists "bookings_insert_own" on bookings;
create policy "bookings_insert_own"
  on bookings for insert
  with check (client_id = auth.uid());

drop policy if exists "bookings_update_own_or_admin" on bookings;
create policy "bookings_update_own_or_admin"
  on bookings for update
  using (client_id = auth.uid() or is_admin())
  with check (client_id = auth.uid() or is_admin());

drop policy if exists "bookings_delete_admin_only" on bookings;
create policy "bookings_delete_admin_only"
  on bookings for delete
  using (is_admin());

-- Public, PII-free view so the homepage/catalog can still show "already
-- booked" locks to anonymous visitors without exposing client_id, amounts,
-- or the actual receipt file. Created by the migration-running role (which
-- owns `bookings`), so the view itself can see all rows even though the
-- callers hitting the view are restricted by the GRANT below, not by
-- `bookings`' own RLS.
create or replace view public.booking_activity
  with (security_invoker = false)
as
select
  motorcycle_name,
  status,
  (receipt_url is not null) as has_receipt
from bookings;

grant select on public.booking_activity to anon, authenticated;

-- ============================================================================
-- STEP 4: reviews — public read (they're meant to be shown on the site),
-- but only the review's own author (or admin) can write/edit/delete —
-- previously fully open, so anyone could script fake reviews straight
-- through the API without ever touching the app's own submit form.
-- ============================================================================
alter table reviews enable row level security;

drop policy if exists "reviews_select_public" on reviews;
create policy "reviews_select_public"
  on reviews for select
  using (true);

drop policy if exists "reviews_insert_own" on reviews;
create policy "reviews_insert_own"
  on reviews for insert
  with check (client_id = auth.uid());

drop policy if exists "reviews_update_own_or_admin" on reviews;
create policy "reviews_update_own_or_admin"
  on reviews for update
  using (client_id = auth.uid() or is_admin())
  with check (client_id = auth.uid() or is_admin());

drop policy if exists "reviews_delete_own_or_admin" on reviews;
create policy "reviews_delete_own_or_admin"
  on reviews for delete
  using (client_id = auth.uid() or is_admin());

-- ============================================================================
-- STEP 5: motorcycles — catalog stays publicly readable, but only an admin
-- can add/edit/delete a motor (previously `using(true)` on write meant
-- anyone with the anon key could rewrite your fleet or rates).
-- ============================================================================
drop policy if exists "Public write motorcycles" on motorcycles;

drop policy if exists "motorcycles_write_admin_only" on motorcycles;
create policy "motorcycles_write_admin_only"
  on motorcycles for all
  using (is_admin())
  with check (is_admin());

-- ("Public read motorcycles" policy from supabase_add_motorcycles.sql is
-- left as-is — the catalog is meant to be public.)

-- ============================================================================
-- STEP 6: private storage for government IDs and payment receipts.
-- Access limited to the uploader (storage.objects.owner) or an admin.
-- The frontend switches from getPublicUrl() to createSignedUrl() for these
-- three buckets in the same change as this migration.
-- ============================================================================
update storage.buckets set public = false
where id in ('mga_id_bucket', 'resibo', 'resibo_extension');

drop policy if exists "Private uploads read owner or admin" on storage.objects;
create policy "Private uploads read owner or admin"
  on storage.objects for select
  using (
    bucket_id in ('mga_id_bucket', 'resibo', 'resibo_extension')
    and (owner = auth.uid() or is_admin())
  );

drop policy if exists "Private uploads insert authenticated" on storage.objects;
create policy "Private uploads insert authenticated"
  on storage.objects for insert
  with check (
    bucket_id in ('mga_id_bucket', 'resibo', 'resibo_extension')
    and auth.role() = 'authenticated'
  );

drop policy if exists "Private uploads delete owner or admin" on storage.objects;
create policy "Private uploads delete owner or admin"
  on storage.objects for delete
  using (
    bucket_id in ('mga_id_bucket', 'resibo', 'resibo_extension')
    and (owner = auth.uid() or is_admin())
  );

-- ============================================================================
-- STEP 7: motor_images write access — tighten to admin only (reads stay
-- public; these are the public catalog photos).
-- ============================================================================
drop policy if exists "Public upload motor images" on storage.objects;
create policy "Admin upload motor images"
  on storage.objects for insert
  with check (bucket_id = 'motor_images' and is_admin());

drop policy if exists "Public delete motor images" on storage.objects;
create policy "Admin delete motor images"
  on storage.objects for delete
  using (bucket_id = 'motor_images' and is_admin());

commit;

-- ============================================================================
-- SANITY CHECKS — run after and eyeball the results:
-- ============================================================================
-- select id, email, is_admin from clients where is_admin = true;
--   (should list exactly your real admin account(s) — nobody else)
-- select * from booking_activity limit 5;
--   (should work even when NOT logged in — it's the public view)
-- select id, name from motorcycles limit 5;
--   (should still work when NOT logged in — public catalog read)

-- ============================================================================
-- ROLLBACK — only run this if the lockdown breaks something in production
-- and you need the old (insecure) behavior back immediately while you
-- investigate. This restores full public access, same as before this file.
-- ============================================================================
-- begin;
--   alter table clients disable row level security;
--   alter table bookings disable row level security;
--   alter table reviews disable row level security;
--   drop policy if exists "motorcycles_write_admin_only" on motorcycles;
--   create policy "Public write motorcycles" on motorcycles for all using (true) with check (true);
--   update storage.buckets set public = true where id in ('mga_id_bucket', 'resibo', 'resibo_extension');
--   drop policy if exists "Private uploads read owner or admin" on storage.objects;
--   drop policy if exists "Private uploads insert authenticated" on storage.objects;
--   drop policy if exists "Private uploads delete owner or admin" on storage.objects;
--   drop policy if exists "Admin upload motor images" on storage.objects;
--   drop policy if exists "Admin delete motor images" on storage.objects;
--   create policy "Public upload motor images" on storage.objects for insert with check (bucket_id = 'motor_images');
--   create policy "Public delete motor images" on storage.objects for delete using (bucket_id = 'motor_images');
--   drop view if exists public.booking_activity;
-- commit;
