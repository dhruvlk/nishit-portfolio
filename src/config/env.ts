/**
 * Public runtime configuration. NEXT_PUBLIC_* values are inlined at build time,
 * so they must be referenced with literal property access.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const isLocalUrl = (u: string) => /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/.test(u);

/**
 * Canonical site origin used for metadataBase, canonical URLs, sitemap and OG images.
 * Order: NEXT_PUBLIC_SITE_URL → Vercel production domain → Vercel deployment URL → localhost.
 * A localhost NEXT_PUBLIC_SITE_URL is ignored on Vercel so production metadata never points at it.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (explicit && !(isLocalUrl(explicit) && vercelHost)) return explicit;
  if (vercelHost) return `https://${vercelHost}`;
  return explicit || "http://localhost:3000";
}

const SITE_URL = resolveSiteUrl();

function toPositiveNumber(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const env = {
  supabaseUrl: SUPABASE_URL,
  supabasePublishableKey: SUPABASE_PUBLISHABLE_KEY,
  siteUrl: SITE_URL.replace(/\/$/, ""),
  /** True when share links would point at a local machine (fine in dev, wrong in production). */
  siteUrlIsLocal: isLocalUrl(SITE_URL),
  /** Upload caps enforced in the admin UI. Must not exceed your Supabase project's global limit. */
  maxVideoUploadMb: toPositiveNumber(process.env.NEXT_PUBLIC_MAX_VIDEO_UPLOAD_MB, 50),
  maxImageUploadMb: toPositiveNumber(process.env.NEXT_PUBLIC_MAX_IMAGE_UPLOAD_MB, 10),
} as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabasePublishableKey);
}

export function assertSupabaseEnv(): { url: string; key: string } {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return { url: env.supabaseUrl, key: env.supabasePublishableKey };
}
