import { ProjectForm } from "@/components/admin/project-form";
import { getAdminCategories } from "@/lib/data/admin";

export default async function NewProjectPage() {
  const categories = await getAdminCategories();
  return <ProjectForm project={null} categories={categories} />;
}
