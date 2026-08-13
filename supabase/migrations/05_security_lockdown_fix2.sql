-- ============================================================================
-- MotoRent: security lockdown follow-up fix #2 (storage.objects)
--
-- WHY: re-check after fix #1 showed `bookings`/`clients` correctly locked
-- down now, but the storage buckets (mga_id_bucket, resibo, resibo_extension)
-- are STILL fully listable by anon — full file listings, including every
-- government ID photo's filename, still came back with no login at all.
-- Same root cause as fix #1, just on a different table: `storage.objects`
-- almost certainly has an old "allow everyone" policy from before this
-- session that was never dropped (fix #1 only touched policies on
-- clients/bookings/reviews/motorcycles, not storage.objects).
--
-- WHAT THIS DOES: wipes every existing policy on storage.objects, then
-- re-applies exactly the policies from supabase_security_lockdown.sql:
--   - motor_images: public read, admin-only write (unchanged from before)
--   - mga_id_bucket / resibo / resibo_extension: only the uploader (owner)
--     or an admin can read/delete; any logged-in user can upload
-- Does not touch any files — only who is allowed to see/list them.
--
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file ->
-- Run. Then tell Claude so it can re-verify.
-- ============================================================================

begin;

do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end $$;

create policy "Public read motor images" on storage.objects
  for select using (bucket_id = 'motor_images');

create policy "Admin upload motor images" on storage.objects
  for insert with check (bucket_id = 'motor_images' and is_admin());

create policy "Admin delete motor images" on storage.objects
  for delete using (bucket_id = 'motor_images' and is_admin());

create policy "Private uploads read owner or admin" on storage.objects
  for select using (
    bucket_id in ('mga_id_bucket', 'resibo', 'resibo_extension')
    and (owner = auth.uid() or is_admin())
  );

create policy "Private uploads insert authenticated" on storage.objects
  for insert with check (
    bucket_id in ('mga_id_bucket', 'resibo', 'resibo_extension')
    and auth.role() = 'authenticated'
  );

create policy "Private uploads delete owner or admin" on storage.objects
  for delete using (
    bucket_id in ('mga_id_bucket', 'resibo', 'resibo_extension')
    and (owner = auth.uid() or is_admin())
  );

commit;
