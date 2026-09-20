-- ==============================================================================
-- Lock the FAQ table to signed-in users only.
-- Before this, anyone with the public anon key could read, insert, update, and
-- delete FAQs. Run this in the Supabase SQL Editor AFTER creating your user.
--
-- The faq-ai Edge Function keeps working because it reads with the service role
-- key, which bypasses RLS.
-- ==============================================================================

alter table faqs enable row level security;

-- Remove the open POC policies
drop policy if exists "Public read published FAQs" on faqs;
drop policy if exists "Anon full access for POC testing" on faqs;
drop policy if exists "Anon insert FAQs for POC" on faqs;
drop policy if exists "Anon update FAQs for POC" on faqs;
drop policy if exists "Anon delete FAQs for POC" on faqs;

-- Signed-in users only
drop policy if exists "Authenticated users read FAQs" on faqs;
create policy "Authenticated users read FAQs"
  on faqs for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users insert FAQs" on faqs;
create policy "Authenticated users insert FAQs"
  on faqs for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users update FAQs" on faqs;
create policy "Authenticated users update FAQs"
  on faqs for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users delete FAQs" on faqs;
create policy "Authenticated users delete FAQs"
  on faqs for delete
  to authenticated
  using (true);
