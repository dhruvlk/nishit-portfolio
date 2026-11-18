import { ProjectsTable } from "@/components/admin/projects-table";
import { getAdminCategories, getAllProjects } from "@/lib/data/admin";

export default async function ProjectsPage() {
  const [projects, categories] = await Promise.all([getAllProjects(), getAdminCategories()]);
  return <ProjectsTable projects={projects} categories={categories} />;
}
