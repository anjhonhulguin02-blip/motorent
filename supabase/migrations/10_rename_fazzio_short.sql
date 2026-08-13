-- ============================================================================
-- MotoRent: shorten "Yamaha Mio Fazzio 125" -> "Yamaha Fazzio"
--
-- WHY: per the business owner — "Yamaha Fazzio" is the name Filipino
-- customers actually search for and recognize, consistent with how the
-- catalog already drops "Mio" from the Aerox listing ("Yamaha Aerox V3",
-- not "Yamaha Mio Aerox V3"). The underlying fact from the last migration
-- still holds (it's a Yamaha, not a Honda) — this is just the shorter,
-- locally-recognized name for the same real unit.
--
-- SAFE BY DESIGN: same pattern as before — updates all 3 tables that carry
-- this name as text, so booking history and availability-lock matching
-- stay consistent. Wrapped in a transaction; rollback block at the bottom.
-- ============================================================================

begin;

update motorcycles set name = 'Yamaha Fazzio' where name = 'Yamaha Mio Fazzio 125';
update bookings set motorcycle_name = 'Yamaha Fazzio' where motorcycle_name = 'Yamaha Mio Fazzio 125';
update reviews set motorcycle_name = 'Yamaha Fazzio' where motorcycle_name = 'Yamaha Mio Fazzio 125';

commit;

-- ============================================================================
-- SANITY CHECK:
-- ============================================================================
-- select name from motorcycles order by display_order;
-- select id, motorcycle_name from bookings where motorcycle_name ilike '%fazzio%';

-- ============================================================================
-- ROLLBACK — only if needed:
-- ============================================================================
-- begin;
--   update motorcycles set name = 'Yamaha Mio Fazzio 125' where name = 'Yamaha Fazzio';
--   update bookings set motorcycle_name = 'Yamaha Mio Fazzio 125' where motorcycle_name = 'Yamaha Fazzio';
--   update reviews set motorcycle_name = 'Yamaha Mio Fazzio 125' where motorcycle_name = 'Yamaha Fazzio';
-- commit;
