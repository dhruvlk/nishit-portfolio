import { ProfileForm } from "@/components/admin/profile-form";
import { getAdminProfile } from "@/lib/data/admin";

export default async function ProfilePage() {
  const profile = await getAdminProfile();
  return <ProfileForm key={profile.updated_at} profile={profile} />;
}
