import type { Metadata } from "next";
import { Reveal } from "@/components/animations/reveal";
import { WorkGrid } from "@/components/portfolio/work-grid";
import { getCategories, getPublishedProjects } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Work",
  description: "Commercials, brand films, music videos, short films, documentaries and corporate films.",
  alternates: { canonical: "/work" },
};

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
