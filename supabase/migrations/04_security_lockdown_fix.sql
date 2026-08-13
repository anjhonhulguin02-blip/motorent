-- ============================================================================
-- MotoRent: security lockdown follow-up fix
--
-- WHY: after running supabase_security_lockdown.sql, a live re-check showed
-- `clients` correctly locked down (anon sees 0 rows), but `bookings` was
-- STILL fully readable by anon (all 25 rows, including client_id and
-- government_id_url). Cause: `bookings` was renamed from the old
-- `mga_arkila` table, and table renames in Postgres carry their policies
-- over unchanged. There was almost certainly an old, differently-named
-- "allow everyone to read" policy already sitting on it from before any of
-- this session's migrations — since we only ever dropped policies we knew
-- the exact name of, that old one was never removed, and Postgres OR's all
-- matching policies together, so it kept overriding the new restrictive one.
--
-- WHAT THIS DOES: wipes every existing policy (ours and any unknown old
-- ones) on clients/bookings/reviews/motorcycles, then re-applies exactly
-- the policies from supabase_security_lockdown.sql. Safe to run — it does
-- not touch data, only policy definitions.
--
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file ->
-- Run. Then tell Claude so it can re-verify.
-- ============================================================================

begin;

do $$
declare pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('clients', 'bookings', 'reviews', 'motorcycles')
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- clients
create policy "clients_select_own_or_admin" on clients for select using (id = auth.uid() or is_admin());
create policy "clients_insert_own" on clients for insert with check (id = auth.uid());
create policy "clients_update_own_or_admin" on clients for update using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());
create policy "clients_delete_admin_only" on clients for delete using (is_admin());

-- bookings
create policy "bookings_select_own_or_admin" on bookings for select using (client_id = auth.uid() or is_admin());
create policy "bookings_insert_own" on bookings for insert with check (client_id = auth.uid());
create policy "bookings_update_own_or_admin" on bookings for update using (client_id = auth.uid() or is_admin()) with check (client_id = auth.uid() or is_admin());
create policy "bookings_delete_admin_only" on bookings for delete using (is_admin());

-- reviews
create policy "reviews_select_public" on reviews for select using (true);
create policy "reviews_insert_own" on reviews for insert with check (client_id = auth.uid());
create policy "reviews_update_own_or_admin" on reviews for update using (client_id = auth.uid() or is_admin()) with check (client_id = auth.uid() or is_admin());
create policy "reviews_delete_own_or_admin" on reviews for delete using (client_id = auth.uid() or is_admin());

-- motorcycles (public read stays open, write locked to admin)
create policy "Public read motorcycles" on motorcycles for select using (true);
create policy "motorcycles_write_admin_only" on motorcycles for all using (is_admin()) with check (is_admin());

commit;

-- Sanity check after running — should return 0 rows table-wide for bookings/clients when NOT logged in:
-- select count(*) from bookings;
-- select count(*) from clients;
