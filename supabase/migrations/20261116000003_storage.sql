-- =============================================================================
-- 003 · Storage buckets + policies
-- Buckets are public-read (files are served via CDN public URLs), but listing,
-- uploading, replacing and deleting objects is restricted to admins.
--
-- File size limits: images are capped per bucket. Video buckets inherit the
-- project's global upload limit (Dashboard → Storage → Settings). On the Free
-- plan that is 50 MB; Pro plans can raise it (up to 500 GB). See README.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('project-thumbnails', 'project-thumbnails', true, 10485760,
     array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('project-videos', 'project-videos', true, null,
     array['video/mp4', 'video/webm', 'video/quicktime']),
  ('profile-images', 'profile-images', true, 10485760,
     array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('website-assets', 'website-assets', true, null,
     array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml',
           'image/x-icon', 'image/vnd.microsoft.icon', 'video/mp4', 'video/webm']),
  ('showreel', 'showreel', true, null,
     array['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Admin-only management. No anon SELECT policy: public files are served through
-- the public object URL, which does not require one, and this prevents listing.
drop policy if exists "portfolio assets: admin read" on storage.objects;
create policy "portfolio assets: admin read" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('project-thumbnails', 'project-videos', 'profile-images', 'website-assets', 'showreel')
    and (select public.is_admin())
  );

drop policy if exists "portfolio assets: admin insert" on storage.objects;
create policy "portfolio assets: admin insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('project-thumbnails', 'project-videos', 'profile-images', 'website-assets', 'showreel')
    and (select public.is_admin())
  );

drop policy if exists "portfolio assets: admin update" on storage.objects;
create policy "portfolio assets: admin update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('project-thumbnails', 'project-videos', 'profile-images', 'website-assets', 'showreel')
    and (select public.is_admin())
  )
  with check (
    bucket_id in ('project-thumbnails', 'project-videos', 'profile-images', 'website-assets', 'showreel')
    and (select public.is_admin())
  );

drop policy if exists "portfolio assets: admin delete" on storage.objects;
create policy "portfolio assets: admin delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('project-thumbnails', 'project-videos', 'profile-images', 'website-assets', 'showreel')
    and (select public.is_admin())
  );
