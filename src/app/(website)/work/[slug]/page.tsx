import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProjectDetail } from "@/components/portfolio/project-detail";
import { env } from "@/config/env";
import { shareImage, socialMetadata } from "@/lib/seo";
import { getProjectBySlug, getPublishedProjects, getRelatedProjects, getSiteSettings } from "@/lib/data/public";

/** Cache Components requires at least one param; a placeholder resolves to 404. */
const PLACEHOLDER = "__none__";

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return projects.length ? projects.map((p) => ({ slug: p.slug })) : [{ slug: PLACEHOLDER }];
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [project, settings] = await Promise.all([getProjectBySlug(slug), getSiteSettings()]);
  if (!project) return { title: "Project not found", robots: { index: false } };
  const description = project.summary || project.description.slice(0, 160) || settings.seo_description;
  const siteName = settings.site_name || "Nishit Gundecha";
  const image = project.thumbnail_url
    ? { url: project.thumbnail_url, alt: `${project.title} — ${siteName}` }
    : shareImage(settings);
  const social = socialMetadata({
    path: `/work/${project.slug}`,
    title: `${project.title} | ${siteName}`,
    description,
    image,
    siteName,
  });
  return {
    title: project.title,
    description,
    alternates: { canonical: `/work/${project.slug}` },
    ...social,
    openGraph: { ...social.openGraph, type: "video.other" },
  };
}

async function ProjectContent({ params }: { params: PageProps<"/work/[slug]">["params"] }) {
  const { slug } = await params;
  const [project, related] = await Promise.all([getProjectBySlug(slug), getRelatedProjects(slug, 3)]);
  if (!project) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: project.title,
    description: project.summary || project.description || project.title,
    thumbnailUrl: project.thumbnail_url ?? undefined,
    uploadDate: project.published_at ?? project.created_at,
    contentUrl: project.video_source === "upload" || project.video_source === "external" ? project.video_url ?? undefined : undefined,
    embedUrl: project.video_source === "youtube" || project.video_source === "vimeo" ? project.video_url ?? undefined : undefined,
    url: `${env.siteUrl}/work/${project.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ProjectDetail project={project} related={related} />
    </>
  );
}

function ProjectSkeleton() {
  return (
    <div className="container-cinema pb-24 pt-40" aria-busy="true" aria-label="Loading project">
      <div className="h-16 w-2/3 animate-pulse bg-ink-2" />
      <div className="mt-12 aspect-video w-full animate-pulse bg-ink-2" />
    </div>
  );
}

export default function ProjectPage(props: PageProps<"/work/[slug]">) {
  return (
    <Suspense fallback={<ProjectSkeleton />}>
      <ProjectContent params={props.params} />
    </Suspense>
  );
}
