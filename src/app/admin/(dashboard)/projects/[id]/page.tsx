import { notFound } from "next/navigation";
import { z } from "zod";
import { ProjectForm } from "@/components/admin/project-form";
import { getAdminCategories, getProjectById } from "@/lib/data/admin";

export default async function EditProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [project, categories] = await Promise.all([getProjectById(id), getAdminCategories()]);
  if (!project) notFound();
  return <ProjectForm key={project.updated_at} project={project} categories={categories} />;
}
