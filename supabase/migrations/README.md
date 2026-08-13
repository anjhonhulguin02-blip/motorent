# Supabase migrations

Numbered in the order they were actually run against the live database.
These are historical records, not a repeatable migration runner — every
file here has **already been applied** to production via the Supabase
Dashboard SQL Editor. Re-running an old one is not necessary and, for the
security-lockdown files in particular, could error out since they mostly
use `drop policy if exists` / `create policy` pairs meant to run once.

If you need to change the schema or RLS policies going forward, write a
new numbered file (`12_...sql`) rather than editing one of these — that
way this folder stays an accurate record of what happened, in order.
