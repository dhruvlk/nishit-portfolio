# Cinematic Portfolio — Senior Video Editor & Production Head

A dark, cinematic portfolio with a fully functional Supabase-backed admin dashboard.

**Stack:** Next.js 16 (App Router, Cache Components, Proxy) · React 19 · TypeScript (strict, no `any`) · Tailwind CSS v4 · GSAP 3.15 (ScrollTrigger + SplitText) · Framer Motion · Supabase (Auth, Postgres + RLS, Storage) · React Hook Form + Zod · Lucide.

---

## 1. Quick start

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + publishable key
npm run dev                        # http://localhost:3000
```

The public site renders with neutral defaults until the database is set up (step 2).

## 2. Set up Supabase (one time)

### a) Run the migrations
Open **Supabase Dashboard → SQL Editor** and run these files **in order** (each is idempotent — safe to re-run):

| File | What it does |
| --- | --- |
| `supabase/migrations/20261116000001_schema.sql` | Tables, constraints, indexes, triggers, `admin_users` + `is_admin()` |
| `supabase/migrations/20261116000002_rls.sql` | Row Level Security policies for every table |
| `supabase/migrations/20261116000003_storage.sql` | 5 storage buckets + admin-only write policies |
| `supabase/migrations/20261116000004_seed.sql` | 8 categories, 10 expertise items, empty profile/settings/showreel rows, 5 social platforms |

Or with the Supabase CLI: `npx supabase link --project-ref <your-project-ref> && npx supabase db push`.

### b) Create your admin account
1. **Authentication → Users → Add user** → enter your email + a strong password (tick *Auto confirm*).
2. In the **SQL Editor**, grant admin rights:
   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'you@example.com';
   ```
3. **Authentication → Providers → Email** → turn **off** "Allow new users to sign up". (Non-admin accounts can't do anything anyway, but there's no reason to allow them.)

Then sign in at **`/admin/login`**.

### c) Upload size limit
**Storage → Settings → Global file size limit.** Free plan max is **50 MB**; Pro can go much higher.
Set `NEXT_PUBLIC_MAX_VIDEO_UPLOAD_MB` in `.env.local` to the same number or lower — the admin UI enforces it before uploading.

## 3. Using the admin

| Page | What you can do |
| --- | --- |
| **Overview** | Totals (projects / published / drafts / featured / messages), recent projects and messages |
| **Projects** | Search + filter, create, edit, delete (also deletes files), publish/unpublish, feature, drag-to-reorder, preview drafts |
| **Showreel** | Upload a video or paste a YouTube/Vimeo/MP4 link, poster image, title, enable/disable the section, live preview |
| **Profile** | Name, title, bios, portrait, the 4 animated numbers, brands/clients, expertise list, email/phone/location |
| **Social links** | Instagram, YouTube, Vimeo, LinkedIn, Behance URLs + visibility |
| **Messages** | Read, mark read/unread, filter, search, delete, reply by email |
| **Website settings** | Site name, logo, favicon, hero label/heading/description, hero video + poster, SEO title/description, share image, footer text |

Every save updates the live site immediately (on-demand cache invalidation with `updateTag`).

## 4. Video: what to upload where

Uploads go **straight from the browser to Supabase Storage** (never through the Next.js server) with a live progress bar, type/size validation, cancel, and automatic clean-up of replaced files.

Public pages never download video eagerly: posters load first, players use `preload="none"`, hover previews only start on desktop hover, YouTube/Vimeo iframes are injected only after the visitor clicks play, and the hero video is skipped on Data-Saver connections.

**When to use an external host instead of uploading:**
- **Files above your Supabase upload limit** (50 MB on Free).
- **Long films / full-length masters (roughly > 300–500 MB).** Supabase serves files as-is: no transcoding and no adaptive (HLS) streaming, so a big 4K file will buffer on mobile. Use **Vimeo** (best for portfolios) or YouTube and paste the link — or Mux/Cloudflare Stream if you want self-branded adaptive streaming.
- **Unreliable connections with large files.** This app uses standard single-request uploads (simple, with real progress). Supabase recommends **resumable (TUS) uploads above ~6 MB** for flaky networks; if you regularly upload big files from the road, add `tus-js-client` against `${SUPABASE_URL}/storage/v1/upload/resumable` in `src/lib/upload.ts`.

Good defaults for uploaded web video: MP4 (H.264 + AAC), 1080p, ~6–10 Mbps, a few minutes max. Hero background loops: 10–30 s, muted, under ~15 MB.

## 5. Security model
- **Authentication:** Supabase Auth (email + password), cookie sessions via `@supabase/ssr`.
- **Authorization:** a dedicated `admin_users` table checked by the `security definer` function `public.is_admin()`. User-editable metadata is never trusted.
- **Three layers:** `src/proxy.ts` (optimistic redirect for `/admin/*`) → `requireAdmin()` on every admin page and server action (verifies the JWT with the Auth server, then `is_admin()`) → **Postgres RLS** (the real gate — even a bypassed UI can't read drafts/messages or write anything).
- **RLS summary:** anon can read published projects and public content, and can **insert** contact messages (but never read them). Only admins can write content, read/manage messages, and upload/replace/delete storage objects. Storage buckets are public-read via CDN URLs but cannot be listed.
- **No service-role key** is used or needed anywhere. Never add one to this project.
- Contact form: Zod validation on client and server, DB-level constraints, and a honeypot field.

Verified with `npm run test:db`: applies all migrations to an embedded Postgres and checks 32 RLS/storage/constraint rules (anon vs. signed-in non-admin vs. admin).

## 6. Scripts

| Command | |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | Generate route types + `tsc --noEmit` |
| `npm run lint` | ESLint (Next + React Compiler rules) |
| `npm run test:db` | Migration + RLS policy tests (no Supabase connection needed) |
| `npm run check` | All three of the above |

## 7. Deploying (Vercel recommended)
1. Import the repo, add the env vars from `.env.example`, and set `NEXT_PUBLIC_SITE_URL` to your real domain (used for canonical URLs, sitemap and Open Graph).
2. In **Supabase → Authentication → URL Configuration**, set the Site URL to the same domain.

## 8. Project structure
```
src/
  app/
    (website)/          public site: /, /work, /work/[slug], /about, /contact (+ template.tsx page transitions)
    admin/login/        sign in
    admin/(dashboard)/  overview, projects (new, [id], [id]/preview), showreel, profile, socials, messages, settings
    sitemap.ts robots.ts not-found.tsx icon.svg
  components/
    animations/  TextReveal (SplitText), Reveal, ImageReveal (GSAP)
    home/        hero, featured works (pinned horizontal scroll), about, expertise, showreel, stats, contact
    portfolio/   project card, work grid (filters), project detail
    layout/      preloader, header + menu, footer, custom cursor, page transition
    admin/       shell, forms, uploader, tables, messages
    common/ ui/  video player, social links, admin primitives, toasts, dialogs, dropdown
  lib/
    supabase/    browser, server (cookies), public (anon, cacheable) clients + proxy session refresh
    data/        public.ts (cached reads) · admin.ts (admin reads) · mappers
    actions/     server actions (auth, contact, projects, content, uploads)
    validations/ Zod schemas shared by client and server
  config/ hooks/ types/ fonts/
supabase/migrations · supabase/tests
```

## 9. Animation notes
- **GSAP** owns scroll and timeline work: preloader, hero char reveal + parallax, masked line reveals, clip-path image reveals, the pinned horizontal "Selected Works" track, the expanding showreel frame, count-up stats. All tweens are created inside `useGSAP` (auto-cleanup on unmount) and `gsap.matchMedia` (heavy effects desktop-only).
- **Framer Motion** owns UI state: page transitions, menu, buttons, dropdowns, dialogs, toasts, filters, admin micro-interactions. The two libraries never animate the same element.
- `prefers-reduced-motion` disables the preloader, parallax, pinning, reveals and the custom cursor; content is always readable without JavaScript.

## 10. Demo mode (Nishit Gundecha preview)
The live database currently holds a **demo** version of the site, so it can be presented before real material exists:
- **Six sample projects** flagged *Demo* (`projects.is_demo = true`). Their footage and stills are royalty-free clips from [Mixkit](https://mixkit.co/license/#videoFree) (Stock Video Free License: commercial use allowed, attribution not required) linked from Mixkit's CDN, not stored in your bucket.
- **Website settings → Demo mode** adds the "Demo preview" footer credit and the note under the highlights. Turn it off when real content is in.
- Highlights are qualitative ("Sample Portfolio", "12 Creative Skills", …); no client counts, years or awards are claimed.
- Social links are blank, so they're hidden.

Replace anything from the admin (upload your own media, edit text, untick *Demo / sample project*). To remove all demo projects at once:
```sql
delete from public.projects where is_demo;
```
