import { ShowreelForm } from "@/components/admin/showreel-form";
import { getAdminShowreel } from "@/lib/data/admin";

export default async function ShowreelPage() {
  const showreel = await getAdminShowreel();
  return <ShowreelForm key={showreel.updated_at} showreel={showreel} />;
}
