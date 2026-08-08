-- ============================================================================
-- MotoRent Supabase schema cleanup — v2
-- Verified against the ACTUAL live schema (information_schema.columns dump),
-- not just what the frontend code assumed. Renames mga_arkila/mga_kliyente/
-- mga_review to a single-language, single-name-per-concept schema.
--
-- CHANGED FROM v1:
--   - Dropped the mga_motor step entirely — that table does not exist in
--     this project, so referencing it would error out.
--   - Several "fold N aliases into one column" steps became plain renames,
--     because the alias columns (paraan_ng_pagbabayad, mode_of_payment,
--     estado, halaga, total_price, balance, balanse, petsa_ng_pagkuha,
--     oras_ng_pagkuha, motor_na_arkila, pangalan_ng_motor on reviews,
--     mensahe_ng_review, message, pangalan on clients, contact_number,
--     user_id on clients) never existed as real columns — they were dead
--     fallback reads in the frontend code with nothing behind them.
--   - Folded mga_kliyente's duplicate nilikha_noong / created_at columns.
--
-- HOW TO RUN:
--   Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
--
-- SAFE BY DESIGN:
--   - Step 0 makes a full timestamped backup copy of all 3 tables first.
--   - Wrapped in a single transaction: if ANY statement fails, everything
--     rolls back automatically and the database is left exactly as it was.
--   - Every alias column that DOES exist is COALESCEd into the canonical
--     column BEFORE being dropped, so no historical data is lost.
--   - Table/column renames preserve RLS policies, indexes, and triggers
--     automatically (Postgres tracks these by internal OID, not by name).
-- ============================================================================

begin;

-- ============================================================================
-- STEP 0: BACKUP — keep these tables until you're confident, then drop later
-- ============================================================================
create table if not exists _backup_mga_arkila_20260807 as table mga_arkila;
create table if not exists _backup_mga_kliyente_20260807 as table mga_kliyente;
create table if not exists _backup_mga_review_20260807 as table mga_review;


-- ============================================================================
-- STEP 1: clients (was mga_kliyente)
-- Real columns: id, buong_pangalan, numero_ng_telepono, email_address,
--               nilikha_noong, is_admin, username, created_at
-- ============================================================================
alter table mga_kliyente rename to clients;

alter table clients rename column buong_pangalan to full_name;
alter table clients rename column numero_ng_telepono to phone_number;
alter table clients rename column email_address to email;

-- fold the duplicate "created" timestamp columns into one
update clients set created_at = coalesce(created_at, nilikha_noong);
alter table clients drop column if exists nilikha_noong;

-- id, is_admin, username: already clean, no alias columns existed, no rename needed


-- ============================================================================
-- STEP 2: bookings (was mga_arkila)
-- Real columns: id, created_at, user_id, kliyente_id, pangalan_ng_motor,
--   uri_ng_arkila, tagal_ng_arkila, kabuuang_bayad, paraan_ng_pagbayad,
--   napiling_rate, status, status_ng_renta, resibo_url, payment_type,
--   balance_due, id_gobyerno_url, tunay_na_oras_ng_kuha, is_extended,
--   orihinal_na_tagal, oras_ng_pag_extend, cash_paid, resibo_extension,
--   halaga_ng_extension, bayad_sa_extension, paraan_ng_pagbayad_extension
-- ============================================================================
alter table mga_arkila rename to bookings;

-- status: fold status_ng_renta in (estado never existed)
update bookings set status = coalesce(status, status_ng_renta);
alter table bookings drop column if exists status_ng_renta;

-- payment_method: plain rename — this alone fixes the write/read mismatch
-- bug, since paraan_ng_pagbabayad/mode_of_payment never existed as columns
alter table bookings rename column paraan_ng_pagbayad to payment_method;

-- total_amount: plain rename (halaga/total_price never existed)
alter table bookings rename column kabuuang_bayad to total_amount;

-- balance_due: already the only real column (balance/balanse never existed)

-- client_id: fold user_id / kliyente_id into a single foreign key
alter table bookings add column if not exists client_id uuid;
update bookings set client_id = coalesce(client_id, user_id, kliyente_id);
alter table bookings drop column if exists user_id;
alter table bookings drop column if exists kliyente_id;
-- NOT VALID: enforces the FK for all new/future writes, but doesn't reject
-- the migration over pre-existing orphaned rows (some bookings reference a
-- client_id with no matching clients row — likely a deleted/incomplete
-- signup; those bookings are left alone, not deleted)
alter table bookings
  add constraint bookings_client_id_fkey foreign key (client_id) references clients(id) not valid;

-- plain renames (no aliasing needed — confirmed against real schema)
alter table bookings rename column pangalan_ng_motor to motorcycle_name;
alter table bookings rename column uri_ng_arkila to rental_package;
alter table bookings rename column tagal_ng_arkila to rental_units;
alter table bookings rename column resibo_url to receipt_url;
alter table bookings rename column id_gobyerno_url to government_id_url;
alter table bookings rename column tunay_na_oras_ng_kuha to picked_up_at;
alter table bookings rename column orihinal_na_tagal to original_rental_units;
alter table bookings rename column halaga_ng_extension to extension_amount;
alter table bookings rename column bayad_sa_extension to extension_paid;
alter table bookings rename column paraan_ng_pagbayad_extension to extension_payment_method;
alter table bookings rename column resibo_extension to extension_receipt_url;
alter table bookings rename column oras_ng_pag_extend to extended_at;

-- napiling_rate: kept as-is (renamed only) — currently unused by any
-- frontend code, but real data may exist, so we preserve it rather than drop
alter table bookings rename column napiling_rate to selected_rate_label;

-- payment_type, cash_paid, is_extended: already clean, no rename needed


-- ============================================================================
-- STEP 3: reviews (was mga_review)
-- Real columns: id, created_at, user_id, pangalan_ng_kliyente,
--   motor_na_narkila, rating, komento, arkila_id
-- ============================================================================
alter table mga_review rename to reviews;

alter table reviews rename column arkila_id to booking_id;
alter table reviews
  add constraint reviews_booking_id_fkey foreign key (booking_id) references bookings(id) not valid;

alter table reviews rename column user_id to client_id;
alter table reviews
  add constraint reviews_client_id_fkey foreign key (client_id) references clients(id) not valid;

alter table reviews rename column pangalan_ng_kliyente to client_name;
alter table reviews rename column motor_na_narkila to motorcycle_name;
alter table reviews rename column komento to comment;

-- rating: already clean, no rename needed

commit;

-- ============================================================================
-- DONE. Sanity-check queries — run these after and eyeball the results:
-- ============================================================================
-- select id, client_id, motorcycle_name, status, payment_method, total_amount, balance_due from bookings limit 20;
-- select id, full_name, email, phone_number, is_admin from clients limit 20;
-- select id, booking_id, client_id, client_name, motorcycle_name, rating, comment from reviews limit 20;

-- Find the orphaned booking(s) whose client_id has no matching clients row
-- (worth a manual look — real customer with a missing profile, or test data?):
-- select * from bookings where client_id is not null and client_id not in (select id from clients);
