-- ============================================================================
-- MotoRent: add optional spec fields to `motorcycles`
--
-- WHY: for the new motorcycle detail page. Per your instructions, specs are
-- NEVER invented/guessed by Claude — these columns are nullable and start
-- empty. Only fill them in through the Admin > Fleet panel if you actually
-- know the real spec for that specific unit. Any field left blank shows
-- "Contact us for details" on the site instead of a made-up number.
--
-- SAFE BY DESIGN: purely additive (4 new nullable text columns), no existing
-- data touched, no rows dropped. Wrapped in a transaction.
--
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file ->
-- Run.
-- ============================================================================

begin;

alter table motorcycles add column if not exists engine_size text;
alter table motorcycles add column if not exists transmission text;
alter table motorcycles add column if not exists fuel_capacity text;
alter table motorcycles add column if not exists weight text;

commit;

-- ============================================================================
-- ROLLBACK — only if needed:
-- ============================================================================
-- begin;
--   alter table motorcycles drop column if exists engine_size;
--   alter table motorcycles drop column if exists transmission;
--   alter table motorcycles drop column if exists fuel_capacity;
--   alter table motorcycles drop column if exists weight;
-- commit;
