-- ============================================================================
-- MotoRent: security lockdown follow-up fix #3 (real admin flag)
--
-- WHY: after logging in as admin, the site showed the regular Client
-- Dashboard instead of the Admin Dashboard. Cause: supabase_security_
-- lockdown.sql set is_admin=true by matching `clients.email`, but that
-- column can be stale/blank for older accounts (this app has had signup
-- flows that left incomplete client profiles before). The real source of
-- truth for what email you log in with is `auth.users.email`, not
-- `clients.email`. This fix uses that instead.
--
-- STEP 1: run the SELECT first and check the results — see whether your
-- real login email shows up and whether is_admin is true or false for it.
-- STEP 2: if you see your account with is_admin = false, run the UPDATE
-- right after it.
-- ============================================================================

-- STEP 1 — look at your real admin account's current state:
select c.id, u.email as login_email, c.email as client_table_email, c.is_admin
from auth.users u
left join clients c on c.id = u.id
where u.email ilike '%hulguin%' or u.email ilike '%admin%' or u.email ilike '%motorent%';

-- STEP 2 — flip is_admin=true using the REAL login email (auth.users),
-- not the possibly-stale clients.email copy:
update clients c
set is_admin = true
from auth.users u
where c.id = u.id
  and (
    u.email = 'anjhon.hulguin02@gmail.com'
    or u.email = 'admin@motorent.local'
    or u.email ilike 'admin%'
  );

-- STEP 3 — confirm it took:
select id, email, is_admin from clients where is_admin = true;
