import type { Metadata } from "next";
import { AboutSection } from "@/components/home/about-section";
import { ContactCta } from "@/components/home/contact-cta";
import { ExpertiseSection } from "@/components/home/expertise-section";
import { FeaturedWorks } from "@/components/home/featured-works";
import { Hero } from "@/components/home/hero";
import { ShowreelSection } from "@/components/home/showreel-section";
import {
  getFeaturedProjects,
  getProfile,
  getShowreel,
  getSiteSettings,
  getSocialLinks,
} from "@/lib/data/public";

/** Title, description, Open Graph and Twitter come from the root layout; this pins the canonical. */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [settings, profile, showreel, featured, socials] = await Promise.all([
    getSiteSettings(),
    getProfile(),
    getShowreel(),
    getFeaturedProjects(4),
    getSocialLinks(),
  ]);

  const showShowreel = showreel.is_enabled && showreel.video_source !== "none" && Boolean(showreel.video_url);

  return (
    <>
      <Hero
        name={profile.full_name}
        label={settings.hero_label}
        heading={settings.hero_heading}
        description={settings.hero_description}
        videoUrl={settings.hero_video_url}
        posterUrl={settings.hero_poster_url}
      />
      <FeaturedWorks projects={featured} />
      <AboutSection profile={profile} />
      <ExpertiseSection items={profile.expertise} limit={8} />
      {showShowreel && <ShowreelSection showreel={showreel} />}
      <ContactCta profile={profile} socials={socials} />
    </>
  );
}
