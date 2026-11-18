import type { Metadata } from "next";
import { Reveal } from "@/components/animations/reveal";
import { WorkGrid } from "@/components/portfolio/work-grid";
import { getCategories, getPublishedProjects, getSiteSettings } from "@/lib/data/public";
import { shareImage, socialMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const siteName = s.site_name || "Nishit Gundecha";
  const description = "Commercials, brand films, music videos, short films, documentaries and corporate films.";
  return {
    title: "Work",
    description,
    alternates: { canonical: "/work" },
    ...socialMetadata({ path: "/work", title: `Work | ${siteName}`, description, image: shareImage(s), siteName }),
  };
}

export default async function WorkPage() {
  const [projects, categories] = await Promise.all([getPublishedProjects(), getCategories()]);
  return (
    <>
      <header className="container-cinema pb-14 pt-36 sm:pt-44 md:pb-16">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-5">Portfolio</p>
            <h1 className="h-page">Work</h1>
          </div>
          <p className="lead max-w-sm md:text-right">
            Commercials, brand films, music videos, short films and documentaries — {projects.length}{" "}
            {projects.length === 1 ? "project" : "projects"}.
          </p>
        </Reveal>
      </header>
      <WorkGrid projects={projects} categories={categories} />
    </>
  );
}
