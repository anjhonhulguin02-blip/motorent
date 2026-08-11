-- ============================================================================
-- MotoRent: security lockdown follow-up fix #4 (reviews must be tied to a
-- real, completed rental — enforced at the database level, not just the UI)
--
-- WHY: the Reviews page tells visitors these are "genuine experiences" and
-- "verified client logs." The app's own submit form only shows a "Review
-- Unit" button for a booking once its status is 'Completed', and the review
-- row is tagged with that booking's id. But the *database* policy that
-- actually accepts the INSERT never checks any of that — it only requires
-- `client_id = auth.uid()`. That means a logged-in user could currently
-- script a direct API call referencing ANY booking_id (their own still-
-- pending booking, or even someone else's booking) and the review would be
-- accepted. The claim of "genuine/verified" reviews is not backed by the
-- database as it stands — this fix closes that gap.
--
-- WHAT THIS DOES: replaces the reviews INSERT policy so a review is only
-- accepted when the referenced booking (a) belongs to the same person
-- submitting the review, and (b) has status = 'Completed'. This matches
-- exactly what the UI already requires, now enforced server-side too.
--
-- SAFE TO RUN: only replaces one policy; does not touch existing review rows.
-- ============================================================================

begin;

drop policy if exists "reviews_insert_own" on reviews;
create policy "reviews_insert_own"
  on reviews for insert
  with check (
    client_id = auth.uid()
    and exists (
      select 1 from bookings b
      where b.id = booking_id
        and b.client_id = auth.uid()
        and b.status = 'Completed'
    )
  );

commit;

-- ============================================================================
-- VERIFICATION (run these yourself after the migration, while logged out /
-- using only the public anon key — e.g. via the browser console or curl):
--
-- 1. Anonymous insert should still be denied outright (no session at all):
--    POST /rest/v1/reviews  ->  expect 401 "new row violates row-level
--    security policy"
--
-- 2. As a real logged-in user, try inserting a review for a booking_id that
--    is NOT yours, or one of yours that is NOT 'Completed' yet — expect the
--    insert to be rejected with the same RLS error. Only a review referencing
--    your own Completed booking should succeed.
-- ============================================================================

-- ROLLBACK (only if you need to revert to the previous, looser policy):
-- begin;
-- drop policy if exists "reviews_insert_own" on reviews;
-- create policy "reviews_insert_own" on reviews for insert with check (client_id = auth.uid());
-- commit;
