-- =============================================================================
-- 004 · Seed data
-- Neutral defaults only. The creator's name, bio, clients and numbers are left
-- empty/zero on purpose — fill them in from /admin.
-- =============================================================================

insert into public.project_categories (name, slug, sort_order) values
  ('Commercials',     'commercials',     1),
  ('Brand Films',     'brand-films',     2),
  ('Music Videos',    'music-videos',    3),
  ('Short Films',     'short-films',     4),
  ('Documentaries',   'documentaries',   5),
  ('Social Media',    'social-media',    6),
  ('Corporate Films', 'corporate-films', 7),
  ('Other',           'other',           8)
on conflict (slug) do nothing;

insert into public.profiles (singleton, expertise) values (
  true,
  '[
    {"title": "Film & Video Editing", "description": "Narrative and commercial cuts built on rhythm, pacing and intent."},
    {"title": "Creative Direction", "description": "Shaping tone, look and story from first brief to final frame."},
    {"title": "Production Management", "description": "Schedules, budgets, crews and deliverables kept on track."},
    {"title": "Cinematic Storytelling", "description": "Structure and emotion that hold attention from open to close."},
    {"title": "Color Grading", "description": "Looks that set mood and keep every shot consistent."},
    {"title": "Motion Graphics", "description": "Titles, typography and graphics that move with the edit."},
    {"title": "Commercial Video Production", "description": "Campaign films made to perform across every placement."},
    {"title": "Post Production", "description": "Finishing pipelines: conform, sound, grade and mastering."},
    {"title": "Social Media Video Content", "description": "Platform-native cutdowns, verticals and series."},
    {"title": "Team & Production Management", "description": "Leading editors, artists and crews to deliver at scale."}
  ]'::jsonb
) on conflict (singleton) do nothing;

insert into public.showreel (singleton, title) values (true, 'Watch Showreel')
on conflict (singleton) do nothing;

insert into public.website_settings (singleton, hero_description, seo_title, seo_description)
values (
  true,
  'Turning creative visions into powerful visual experiences through storytelling, editing, and production.',
  'Senior Video Editor & Production Head',
  'Portfolio of a Senior Video Editor & Production Head — commercials, brand films, music videos, documentaries and more.'
) on conflict (singleton) do nothing;

insert into public.social_links (platform, sort_order) values
  ('instagram', 1), ('youtube', 2), ('vimeo', 3), ('linkedin', 4), ('behance', 5)
on conflict (platform) do nothing;
