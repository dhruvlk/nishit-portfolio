import { notFound } from "next/navigation";
import { z } from "zod";
import { ProjectDetail } from "@/components/portfolio/project-detail";
import { getProjectById } from "@/lib/data/admin";

/** Renders the public project page design for drafts — visible to admins only. */
export default async function PreviewProjectPage({ params }: PageProps<"/admin/projects/[id]/preview">) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const project = await getProjectById(id);
  if (!project) notFound();
  return (
    <div className="-mx-4 -my-8 sm:-mx-8">
      <div className="sticky top-0 z-50 flex items-center justify-between bg-a-accent px-4 py-2 text-xs font-medium text-black">
        <span>Preview — {project.is_published ? "published" : "draft (not visible to the public)"}</span>
      </div>
      <div className="dark bg-ink text-paper" data-theme="dark">
        <ProjectDetail project={project} preview />
      </div>
    </div>
  );
}
