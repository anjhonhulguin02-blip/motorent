-- ============================================================================
-- MotoRent: correct "Honda Fazzio 125" -> "Yamaha Mio Fazzio 125", and fill
-- in verified manufacturer specs for all 6 motors.
--
-- WHY THE RENAME: verified via web search (Zigwheels PH, MotoDeal, Yamaha
-- Motor Philippines' own product pages) — Honda does not make a "Fazzio."
-- "Fazzio" is a Yamaha-exclusive nameplate; the real model is the
-- "Yamaha Mio Fazzio 125." The unit in the fleet was mislabeled.
--
-- SOURCES (checked before writing this file, not assumed):
--   https://www.zigwheels.ph/new-motorcycles/yamaha/mio-fazzio/specifications
--   https://www.yamaha-motor.com.ph/motorcycles/personal-commuter/mio-series/mio-fazzio
--   https://www.zigwheels.ph/new-motorcycles/yamaha/nmax/specifications
--   https://www.zigwheels.ph/new-motorcycles/yamaha/mio-aerox/specifications
--   https://www.zigwheels.ph/new-motorcycles/honda/click-125i/specifications
--   https://www.zigwheels.ph/new-motorcycles/yamaha/mio-i-125/specifications
--   https://www.zigwheels.ph/new-motorcycles/honda/beat/specifications
--
-- IMPORTANT — this only sets specs Claude could actually verify. Nothing
-- here is guessed. Values that couldn't be confirmed are left NULL, which
-- the site already treats as "hide this field" (see the MotorcycleDetailModal
-- change in the same commit).
--
-- SELF-CONTAINED: adds the engine_size/transmission/fuel_capacity/weight
-- columns itself (safe no-op if supabase_add_motor_specs.sql was already
-- run) — this file no longer depends on remembering to run that one first.
-- The earlier attempt at this file failed and rolled back everything
-- (including the rename) because those columns didn't exist yet; this
-- version fixes that.
--
-- SAFE BY DESIGN: renames + spec fills only, no rows deleted. The rename
-- touches 3 tables so historical bookings and availability-lock matching
-- (which key off motorcycle_name as plain text, not a foreign key) stay
-- consistent. Wrapped in a transaction; rollback block at the bottom.
-- ============================================================================

begin;

-- STEP 0 — make sure the spec columns exist (no-op if they already do):
alter table motorcycles add column if not exists engine_size text;
alter table motorcycles add column if not exists transmission text;
alter table motorcycles add column if not exists fuel_capacity text;
alter table motorcycles add column if not exists weight text;

-- STEP 1 — the brand/name correction, propagated everywhere the old name
-- is stored as text (motorcycles is the catalog; bookings/reviews keep
-- their own copy of the name at the time of booking):
update motorcycles set name = 'Yamaha Mio Fazzio 125' where name = 'Honda Fazzio 125';
update bookings set motorcycle_name = 'Yamaha Mio Fazzio 125' where motorcycle_name = 'Honda Fazzio 125';
update reviews set motorcycle_name = 'Yamaha Mio Fazzio 125' where motorcycle_name = 'Honda Fazzio 125';

-- STEP 2 — verified specs (all from official/dealer spec sheets, cross-
-- checked against at least one other listing before being used here):

update motorcycles set
  engine_size = '155cc, Liquid-Cooled SOHC',
  transmission = 'CVT (Automatic)',
  fuel_capacity = '7.1 L',
  weight = '131 kg'
where name = 'Yamaha NMAX V3';

update motorcycles set
  engine_size = '155cc, Liquid-Cooled SOHC',
  transmission = 'CVT (Automatic)',
  fuel_capacity = '5.5 L',
  weight = '130 kg'
where name = 'Yamaha Aerox V3';

update motorcycles set
  engine_size = '125cc, Air-Cooled SOHC',
  transmission = 'CVT (Automatic)',
  fuel_capacity = '5.1 L',
  weight = '95 kg'
where name = 'Yamaha Mio Fazzio 125';

update motorcycles set
  engine_size = '125cc, Liquid-Cooled SOHC',
  transmission = 'CVT (Automatic)',
  fuel_capacity = '5.5 L',
  weight = '111 kg'
where name = 'Honda Click 125i V3';

update motorcycles set
  engine_size = '125cc, Air-Cooled SOHC',
  transmission = 'CVT (Automatic)',
  fuel_capacity = '4.2 L',
  weight = '92 kg'
where name = 'Yamaha Mio i 125';

update motorcycles set
  engine_size = '110cc, Air-Cooled SOHC',
  transmission = 'CVT (Automatic)',
  fuel_capacity = '4.2 L',
  weight = '89 kg'
where name = 'Honda Beat FI';

commit;

-- ============================================================================
-- SANITY CHECK — run after and eyeball the results:
-- ============================================================================
-- select name, engine_size, transmission, fuel_capacity, weight from motorcycles order by display_order;
-- select id, motorcycle_name from bookings where motorcycle_name ilike '%fazzio%';

-- ============================================================================
-- ROLLBACK — only if needed:
-- ============================================================================
-- begin;
--   update motorcycles set name = 'Honda Fazzio 125' where name = 'Yamaha Mio Fazzio 125';
--   update bookings set motorcycle_name = 'Honda Fazzio 125' where motorcycle_name = 'Yamaha Mio Fazzio 125';
--   update reviews set motorcycle_name = 'Honda Fazzio 125' where motorcycle_name = 'Yamaha Mio Fazzio 125';
--   update motorcycles set engine_size = null, transmission = null, fuel_capacity = null, weight = null
--     where name in ('Yamaha NMAX V3','Yamaha Aerox V3','Yamaha Mio Fazzio 125','Honda Click 125i V3','Yamaha Mio i 125','Honda Beat FI');
-- commit;
