import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getProfile, getSiteSettings, getSocialLinks } from "@/lib/data/public";

export default async function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, profile, socials] = await Promise.all([getSiteSettings(), getProfile(), getSocialLinks()]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-paper focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <SiteHeader
        siteName={profile.full_name || settings.site_name}
        logoUrl={settings.logo_url}
        email={profile.email}
        socials={socials}
      />
      <main id="main">{children}</main>
      <SiteFooter settings={settings} profile={profile} socials={socials} />
      <SmoothScroll />
    </>
  );
}
