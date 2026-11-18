import type { Metadata } from "next";
import { ContactSection } from "@/components/home/contact-section";
import { getProfile, getSiteSettings, getSocialLinks } from "@/lib/data/public";
import { shareImage, socialMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const siteName = s.site_name || "Nishit Gundecha";
  const description = "Have a story worth telling? Start a project or collaboration with Nishit Gundecha.";
  return {
    title: "Contact",
    description,
    alternates: { canonical: "/contact" },
    ...socialMetadata({ path: "/contact", title: `Contact | ${siteName}`, description, image: shareImage(s), siteName }),
  };
}

export default async function ContactPage() {
  const [profile, socials] = await Promise.all([getProfile(), getSocialLinks()]);
  return <ContactSection profile={profile} socials={socials} />;
}
