import type { Metadata, Viewport } from "next";
import { env } from "@/config/env";
import { fontVariables } from "@/fonts";
import { getSiteSettings } from "@/lib/data/public";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const title = s.seo_title || s.site_name;
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: title, template: `%s | ${s.site_name}` },
    description: s.seo_description,
    applicationName: s.site_name,
    icons: s.favicon_url ? { icon: s.favicon_url } : undefined,
    openGraph: {
      type: "website",
      siteName: s.site_name,
      title,
      description: s.seo_description,
      images: s.og_image_url ? [{ url: s.og_image_url }] : s.hero_poster_url ? [{ url: s.hero_poster_url }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description: s.seo_description },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVariables} antialiased`} suppressHydrationWarning>
      <body className="min-h-dvh">
        {/* Lets CSS hide pre-animation states only when JS will run them. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        {children}
      </body>
    </html>
  );
}
