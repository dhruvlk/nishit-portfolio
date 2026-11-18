import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import { ImageReveal } from "@/components/animations/image-reveal";
import { VideoPlayer } from "@/components/common/video-player";
import { ProjectCard } from "./project-card";
import { ProjectGallery } from "./project-gallery";
import type { Project } from "@/types/content";

/** Shared by the public /work/[slug] page and the admin preview. */
export function ProjectDetail({
  project,
  related = [],
  preview = false,
}: {
  project: Project;
  related?: Project[];
  preview?: boolean;
}) {
  const info = [
    project.category && { k: "Category", v: project.category.name },
    project.production_year && { k: "Year", v: String(project.production_year) },
    project.client_name && { k: "Client", v: project.client_name },
    project.services.length > 0 && { k: "Scope", v: project.services.join(", ") },
  ].filter((m): m is { k: string; v: string } => Boolean(m));

  const paragraphs = project.description.split(/\n{2,}/).filter(Boolean);
  const subline = [project.category?.name, project.production_year].filter(Boolean).join(" · ");

  return (
    <article>
      <header className="container-cinema pb-12 pt-32 sm:pt-40 md:pb-16">
        {!preview && (
          <Link href="/work" className="-my-3 mb-10 flex w-fit items-center gap-2 py-3 text-sm text-mute transition-colors hover:text-paper">
            <ArrowLeft className="size-3.5" aria-hidden /> All work
          </Link>
        )}
        <Reveal>
          <h1 className="h-page max-w-[18ch]">{project.title}</h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-mute">
            {subline && <span>{subline}</span>}
            {project.is_demo && (
              <span className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-gold" aria-hidden />
                Sample project · royalty-free footage, not client work
              </span>
            )}
          </div>
        </Reveal>
      </header>

      <div className="container-cinema">
        <ImageReveal className="aspect-video w-full bg-ink-2">
          <div data-media className="size-full">
            <VideoPlayer
              source={project.video_source}
              url={project.video_url}
              poster={project.thumbnail_url}
              title={project.title}
              className="size-full"
              priority
            />
          </div>
        </ImageReveal>
      </div>

      <div className="container-cinema grid gap-14 py-20 md:py-28 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Reveal className="space-y-6 text-lg leading-relaxed text-paper/80">
            {project.summary && <p className="text-xl font-light leading-snug text-paper md:text-2xl">{project.summary}</p>}
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Reveal>
        </div>

        <Reveal className="lg:col-span-4 lg:col-start-9">
          <dl className="divide-y divide-line border-y border-line">
            {info.map((m) => (
              <div key={m.k} className="flex justify-between gap-6 py-4 text-sm">
                <dt className="text-mute">{m.k}</dt>
                <dd className="text-right">{m.v}</dd>
              </div>
            ))}
          </dl>
          {project.credits.length > 0 && (
            <dl className="mt-10 divide-y divide-line border-y border-line">
              {project.credits.map((c, i) => (
                <div key={`${c.role}-${i}`} className="flex justify-between gap-6 py-4 text-sm">
                  <dt className="text-mute">{c.role}</dt>
                  <dd className="text-right">{c.name}</dd>
                </div>
              ))}
            </dl>
          )}
        </Reveal>
      </div>

      <ProjectGallery items={project.gallery} title={project.title} exclude={project.thumbnail_url} />

      {related.length > 0 && !preview && (
        <section aria-labelledby="related-heading" className="border-t border-line">
          <div className="container-cinema section-y">
            <div className="mb-12 flex items-end justify-between gap-6">
              <h2 id="related-heading" className="h-section">
                More Work
              </h2>
              <Link href="/work" className="link-underline -my-3 inline-flex shrink-0 items-center gap-2 py-3 text-sm">
                View All Projects <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
            <ul className="grid gap-12 md:grid-cols-3 md:gap-8">
              {related.map((p) => (
                <li key={p.id}>
                  <ProjectCard project={p} compact sizes="(min-width: 768px) 33vw, 100vw" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}
