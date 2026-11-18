import type { Metadata } from "next";
import { ContactSection } from "@/components/home/contact-section";
import { getProfile, getSocialLinks } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Contact",
  description: "Have a story worth telling? Start a project or collaboration.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [profile, socials] = await Promise.all([getProfile(), getSocialLinks()]);
  return <ContactSection profile={profile} socials={socials} />;
}
