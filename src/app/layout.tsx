import type { Metadata, Viewport } from "next";
import { env } from "@/config/env";
import { fontVariables } from "@/fonts";
import { SEO } from "@/config/site";
import { getSiteSettings } from "@/lib/data/public";
import { shareImage, socialMetadata } from "@/lib/seo";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const title = s.seo_title || SEO.title;
  const description = s.seo_description || SEO.description;
  const siteName = s.site_name || "Nishit Gundecha";
  const image = shareImage(s);
  if (env.siteUrlIsLocal && process.env.NODE_ENV === "production") {
    console.warn("[seo] NEXT_PUBLIC_SITE_URL is not set to your public domain; share previews will not resolve.");
  }
  const social = socialMetadata({ path: "/", title, description: SEO.ogDescription, image, siteName });
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: title, template: `%s | ${siteName}` },
    description,
    applicationName: siteName,
    authors: [{ name: siteName }],
    creator: siteName,
    icons: s.favicon_url ? { icon: s.favicon_url } : undefined,
    openGraph: social.openGraph,
    twitter: { ...social.twitter, description: SEO.twitterDescription },
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
