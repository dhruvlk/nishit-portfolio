import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProjectGrid } from "@/components/portfolio/project-grid";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Project } from "@/types/content";

export function FeaturedWorks({ projects }: { projects: Project[] }) {
  return (
    <section id="work" aria-labelledby="work-heading" className="section-y scroll-mt-16">
      <div className="container-cinema">
        <SectionHeading
          id="work-heading"
          label="Portfolio"
          title="Selected Work"
          className="mb-14 md:mb-20"
          aside={
            <Link href="/work" className="link-underline -my-3 inline-flex w-fit items-center gap-2 py-3 text-sm text-paper">
              View All Projects <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          }
        />
        {projects.length === 0 ? (
          <p className="border-t border-line py-20 text-mute">New work is being cut. Check back soon.</p>
        ) : (
          <ProjectGrid projects={projects} />
        )}
      </div>
    </section>
  );
}
