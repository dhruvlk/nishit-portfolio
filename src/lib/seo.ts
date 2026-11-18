import type { Metadata } from "next";
import { SEO } from "@/config/site";
import type { SiteSettings } from "@/types/content";

type ShareImage = { url: string; width?: number; height?: number; type?: string; alt: string };

/**
 * The site-wide share image: an image uploaded in Admin → Settings (stored in Supabase)
 * wins; otherwise the bundled public/og-image.png. Relative URLs are made absolute by
 * metadataBase in the root layout.
 */
export function shareImage(settings: Pick<SiteSettings, "og_image_url" | "og_image_path">): ShareImage {
  if (settings.og_image_path && settings.og_image_url) {
    return { url: settings.og_image_url, width: 1200, height: 630, alt: SEO.image.alt };
  }
  return { ...SEO.image };
}

/** Open Graph + Twitter block for a page, so every shared URL carries its own url/title. */
export function socialMetadata({
  path,
  title,
  description,
  image,
  siteName,
}: {
  path: string;
  title: string;
  description: string;
  image: ShareImage;
  siteName: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      url: path,
      siteName,
      title,
      description,
      locale: "en_US",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}
