import { SettingsForm } from "@/components/admin/settings-form";
import { getAdminSettings } from "@/lib/data/admin";

export default async function SettingsPage() {
  const settings = await getAdminSettings();
  return <SettingsForm key={settings.updated_at} settings={settings} />;
}
