-- =============================================================================
-- 005 · Demo labelling + richer About / project content (additive only)
-- New columns all have defaults, so existing rows and RLS policies are untouched
-- (table-level policies automatically cover new columns).
-- =============================================================================

-- Projects: demo flag, extra stills, deliverables
alter table public.projects
  add column if not exists is_demo boolean not null default false,
  add column if not exists gallery jsonb not null default '[]'::jsonb,
  add column if not exists services text[] not null default '{}';

do $$ begin
  alter table public.projects add constraint projects_gallery_is_array check (jsonb_typeof(gallery) = 'array');
exception when duplicate_object then null; end $$;

create index if not exists projects_demo_idx on public.projects (is_demo) where is_demo;

-- Profile: About page content
alter table public.profiles
  add column if not exists tagline text not null default '',
  add column if not exists intro text not null default '',
  add column if not exists philosophy text not null default '',
  add column if not exists approach text not null default '',
  add column if not exists workflow jsonb not null default '[]'::jsonb,
  add column if not exists highlights jsonb not null default '[]'::jsonb,
  add column if not exists about_images jsonb not null default '[]'::jsonb;

do $$ begin
  alter table public.profiles add constraint profiles_about_json_arrays check (
    jsonb_typeof(workflow) = 'array' and jsonb_typeof(highlights) = 'array' and jsonb_typeof(about_images) = 'array'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.profiles add constraint profiles_about_text_lengths check (
    char_length(tagline) <= 200 and char_length(intro) <= 1200
    and char_length(philosophy) <= 2000 and char_length(approach) <= 3000
  );
exception when duplicate_object then null; end $$;

-- Site: demo mode shows "demo" labels/footnotes across the public site
alter table public.website_settings
  add column if not exists demo_mode boolean not null default false;
