-- =============================================================================
-- 002 · Row Level Security
-- Public (anon) can read published/public content and submit contact messages.
-- Only rows in public.admin_users may write content or read messages.
-- =============================================================================

alter table public.admin_users        enable row level security;
alter table public.profiles           enable row level security;
alter table public.project_categories enable row level security;
alter table public.projects           enable row level security;
alter table public.showreel           enable row level security;
alter table public.website_settings   enable row level security;
alter table public.social_links       enable row level security;
alter table public.contact_messages   enable row level security;

-- admin_users: a signed-in user may only see their own row; no API writes.
drop policy if exists "admin_users: read own row" on public.admin_users;
create policy "admin_users: read own row" on public.admin_users
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Public-readable singleton/content tables
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'project_categories', 'showreel', 'website_settings', 'social_links']
  loop
    execute format('drop policy if exists "%s: public read" on public.%I', t, t);
    execute format(
      'create policy "%s: public read" on public.%I for select to anon, authenticated using (true)', t, t);

    execute format('drop policy if exists "%s: admin insert" on public.%I', t, t);
    execute format(
      'create policy "%s: admin insert" on public.%I for insert to authenticated with check ((select public.is_admin()))', t, t);

    execute format('drop policy if exists "%s: admin update" on public.%I', t, t);
    execute format(
      'create policy "%s: admin update" on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t, t);

    execute format('drop policy if exists "%s: admin delete" on public.%I', t, t);
    execute format(
      'create policy "%s: admin delete" on public.%I for delete to authenticated using ((select public.is_admin()))', t, t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- projects: public sees published only; admins see everything.
-- ---------------------------------------------------------------------------
drop policy if exists "projects: read published or admin" on public.projects;
create policy "projects: read published or admin" on public.projects
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));

drop policy if exists "projects: admin insert" on public.projects;
create policy "projects: admin insert" on public.projects
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "projects: admin update" on public.projects;
create policy "projects: admin update" on public.projects
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "projects: admin delete" on public.projects;
create policy "projects: admin delete" on public.projects
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- contact_messages: anyone may insert an unread message; only admins read/manage.
-- ---------------------------------------------------------------------------
drop policy if exists "contact_messages: public insert" on public.contact_messages;
create policy "contact_messages: public insert" on public.contact_messages
  for insert to anon, authenticated
  with check (is_read = false);

drop policy if exists "contact_messages: admin read" on public.contact_messages;
create policy "contact_messages: admin read" on public.contact_messages
  for select to authenticated using ((select public.is_admin()));

drop policy if exists "contact_messages: admin update" on public.contact_messages;
create policy "contact_messages: admin update" on public.contact_messages
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "contact_messages: admin delete" on public.contact_messages;
create policy "contact_messages: admin delete" on public.contact_messages
  for delete to authenticated using ((select public.is_admin()));

-- Belt and braces: anon can never read messages, even if a policy is added later by mistake.
revoke select, update, delete on public.contact_messages from anon;
-- admin_users is managed from the SQL editor only.
revoke insert, update, delete on public.admin_users from anon, authenticated;
