-- ============================================================================
-- MotoRent: fix the admin flag for anjhon.hulguin02@gmail.com
--
-- WHY: after the RLS lockdown, logging in as anjhon.hulguin02@gmail.com
-- showed the regular Client Dashboard instead of the Admin Dashboard.
-- supabase_security_lockdown.sql tried to flag this account by matching
-- clients.email, but that column can be blank/stale for accounts that
-- never went through the app's own signup flow (e.g. created directly in
-- the Supabase Auth dashboard) — likely what happened for the admin
-- account, since it may never have made a booking itself, and this app
-- only auto-creates a `clients` row the first time someone books.
--
-- WHAT THIS DOES: an upsert keyed off the REAL login email in
-- auth.users (not the possibly-missing clients.email) — creates the
-- clients row if it doesn't exist yet, or flips is_admin=true if it does.
-- Safe to run more than once.
-- ============================================================================

-- STEP 1 — see the current state before changing anything:
select
  u.id,
  u.email as login_email,
  c.id is not null as has_client_row,
  c.email as client_table_email,
  c.is_admin
from auth.users u
left join clients c on c.id = u.id
where u.email = 'anjhon.hulguin02@gmail.com';

-- STEP 2 — create the profile if missing, or flip is_admin if it exists:
insert into clients (id, full_name, username, email, is_admin, created_at)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'display_name', ''),
  coalesce(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
  u.email,
  true,
  now()
from auth.users u
where u.email = 'anjhon.hulguin02@gmail.com'
on conflict (id) do update
  set is_admin = true,
      email = excluded.email;

-- STEP 3 — confirm:
select id, email, is_admin from clients where email = 'anjhon.hulguin02@gmail.com';
