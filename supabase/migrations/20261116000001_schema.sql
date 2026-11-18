-- =============================================================================
-- 001 · Core schema
-- Cinematic portfolio: profiles, projects, categories, showreel, settings,
-- contact messages, social links + a dedicated admin authorization table.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Admin authorization
-- Rows can only be inserted from the SQL editor / service role. The app never
-- trusts user-editable metadata (user_metadata) for authorization.
-- -----------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users au where au.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- profiles (singleton: the creator's public profile)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key default gen_random_uuid(),
  singleton           boolean not null default true unique check (singleton),
  full_name           text not null default '' check (char_length(full_name) <= 120),
  professional_title  text not null default 'Senior Video Editor & Production Head'
                        check (char_length(professional_title) <= 160),
  short_bio           text not null default '' check (char_length(short_bio) <= 600),
  biography           text not null default '' check (char_length(biography) <= 6000),
  portrait_url        text,
  portrait_path       text,
  years_experience    integer not null default 0 check (years_experience between 0 and 100),
  projects_completed  integer not null default 0 check (projects_completed >= 0),
  happy_clients       integer not null default 0 check (happy_clients >= 0),
  productions_managed integer not null default 0 check (productions_managed >= 0),
  clients             text[] not null default '{}',
  expertise           jsonb not null default '[]'::jsonb check (jsonb_typeof(expertise) = 'array'),
  email               text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone               text check (phone is null or char_length(phone) <= 40),
  location            text check (location is null or char_length(location) <= 120),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- project_categories
-- -----------------------------------------------------------------------------
create table if not exists public.project_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 1 and 60),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists project_categories_sort_idx on public.project_categories (sort_order);

-- -----------------------------------------------------------------------------
-- projects
-- -----------------------------------------------------------------------------
create table if not exists public.projects (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(title) between 1 and 160),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 120),
  summary          text not null default '' check (char_length(summary) <= 300),
  description      text not null default '' check (char_length(description) <= 8000),
  category_id      uuid references public.project_categories (id) on delete set null,
  thumbnail_url    text,
  thumbnail_path   text,
  video_source     text not null default 'none'
                     check (video_source in ('none', 'upload', 'external', 'youtube', 'vimeo')),
  video_url        text,
  video_path       text,
  preview_url      text,
  client_name      text check (client_name is null or char_length(client_name) <= 160),
  production_year  integer check (production_year is null or production_year between 1950 and 2100),
  credits          jsonb not null default '[]'::jsonb check (jsonb_typeof(credits) = 'array'),
  is_featured      boolean not null default false,
  is_published     boolean not null default false,
  display_order    integer not null default 0,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint projects_video_consistency check (
    (video_source = 'none')
    or (video_source = 'upload' and video_path is not null and video_url is not null)
    or (video_source in ('external', 'youtube', 'vimeo') and video_url is not null)
  )
);

create index if not exists projects_public_listing_idx
  on public.projects (is_published, display_order, created_at desc);
create index if not exists projects_featured_idx
  on public.projects (display_order) where is_featured and is_published;
create index if not exists projects_category_idx on public.projects (category_id);

-- Keep published_at in sync with is_published.
create or replace function public.projects_set_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.is_published and (tg_op = 'INSERT' or not old.is_published) then
    new.published_at = coalesce(new.published_at, now());
  elsif not new.is_published then
    new.published_at = null;
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- showreel (singleton)
-- -----------------------------------------------------------------------------
create table if not exists public.showreel (
  id              uuid primary key default gen_random_uuid(),
  singleton       boolean not null default true unique check (singleton),
  title           text not null default 'Watch Showreel' check (char_length(title) <= 120),
  subtitle        text not null default '' check (char_length(subtitle) <= 300),
  video_source    text not null default 'none'
                    check (video_source in ('none', 'upload', 'external', 'youtube', 'vimeo')),
  video_url       text,
  video_path      text,
  thumbnail_url   text,
  thumbnail_path  text,
  is_enabled      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- website_settings (singleton)
-- -----------------------------------------------------------------------------
create table if not exists public.website_settings (
  id                 uuid primary key default gen_random_uuid(),
  singleton          boolean not null default true unique check (singleton),
  site_name          text not null default 'Studio' check (char_length(site_name) <= 80),
  logo_url           text,
  logo_path          text,
  favicon_url        text,
  favicon_path       text,
  hero_label         text not null default 'Senior Video Editor & Production Head' check (char_length(hero_label) <= 120),
  hero_heading       text not null default 'Crafting Stories.
Creating Emotions.' check (char_length(hero_heading) <= 160),
  hero_description   text not null default '' check (char_length(hero_description) <= 400),
  hero_video_url     text,
  hero_video_path    text,
  hero_poster_url    text,
  hero_poster_path   text,
  seo_title          text not null default '' check (char_length(seo_title) <= 120),
  seo_description    text not null default '' check (char_length(seo_description) <= 320),
  og_image_url       text,
  og_image_path      text,
  footer_text        text not null default '' check (char_length(footer_text) <= 300),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- social_links
-- -----------------------------------------------------------------------------
create table if not exists public.social_links (
  id          uuid primary key default gen_random_uuid(),
  platform    text not null unique
                check (platform in ('instagram', 'youtube', 'vimeo', 'linkedin', 'behance')),
  url         text not null default '' check (url = '' or url ~* '^https?://'),
  is_visible  boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- contact_messages
-- -----------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null check (char_length(full_name) between 2 and 120),
  email         text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  project_type  text not null check (char_length(project_type) between 1 and 80),
  budget_range  text not null check (char_length(budget_range) between 1 and 80),
  message       text not null check (char_length(message) between 10 and 5000),
  is_read       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);
create index if not exists contact_messages_unread_idx on public.contact_messages (is_read, created_at desc);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'project_categories', 'projects', 'showreel',
    'website_settings', 'social_links', 'contact_messages'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

drop trigger if exists projects_set_published_at on public.projects;
create trigger projects_set_published_at
  before insert or update of is_published on public.projects
  for each row execute function public.projects_set_published_at();
