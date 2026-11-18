import { SocialsForm } from "@/components/admin/socials-form";
import { getAdminSocialLinks } from "@/lib/data/admin";

export default async function SocialsPage() {
  const links = await getAdminSocialLinks();
  return <SocialsForm links={links} />;
}
