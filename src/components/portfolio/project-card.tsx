"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Play } from "lucide-react";
import type { Project } from "@/types/content";
import { canOptimizeImage } from "@/lib/utils/media";
import { resolveVideo } from "@/lib/utils/video";
import { cn } from "@/lib/utils/cn";

type Props = {
  project: Project;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Smaller title for compact grids (related projects). */
  compact?: boolean;
};

/**
 * Editorial project tile: a 16:10 frame with the title, category and year below.
 * Hover (CSS only, so it never conflicts with GSAP entrances on parent wrappers):
 * a slow, slight zoom, a small play mark, and a muted preview for direct video files
 * (preload="none", so nothing downloads until hover).
 */
export function ProjectCard({ project, className, sizes, priority, compact = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewSrc =
    project.preview_url ?? (resolveVideo(project.video_source, project.video_url).kind === "file" ? project.video_url : null);

  const play = () => {
    const v = videoRef.current;
    if (!v || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    v.play().catch(() => {
      /* autoplay can be refused; the still stays */
    });
  };
  const stop = () => videoRef.current?.pause();

  return (
    <Link
      href={`/work/${project.slug}`}
      onPointerEnter={play}
      onPointerLeave={stop}
      onFocus={play}
      onBlur={stop}
      className={cn("group block focus-visible:outline-offset-8", className)}
    >
      <div data-card-media className="relative aspect-[16/10] overflow-hidden bg-ink-2">
        <div className="absolute inset-0 transition-transform duration-[1.6s] ease-[var(--ease-out-expo)] group-hover:scale-[1.03]">
          {project.thumbnail_url ? (
            <Image
              src={project.thumbnail_url}
              alt={`${project.title} — still`}
              fill
              sizes={sizes ?? "(min-width: 768px) 50vw, 100vw"}
              priority={priority}
              className="object-cover"
              unoptimized={!canOptimizeImage(project.thumbnail_url)}
            />
          ) : (
            <div className="flex size-full items-center justify-center font-display text-5xl italic text-white/10">
              {project.title.slice(0, 1)}
            </div>
          )}
          {previewSrc && (
            <video
              ref={videoRef}
              src={previewSrc}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
              tabIndex={-1}
              className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          )}
        </div>
        <span
          aria-hidden
          className="absolute bottom-4 left-4 flex size-9 items-center justify-center rounded-full bg-ink/40 opacity-0 backdrop-blur-sm transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <Play className="ml-0.5 size-3 fill-paper text-paper" />
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-1 lg:flex-row lg:items-baseline lg:justify-between lg:gap-6">
        <h3
          className={cn(
            "font-light tracking-tight text-paper/90 transition-colors duration-500 group-hover:text-paper",
            compact ? "text-lg" : "text-xl md:text-2xl",
          )}
        >
          {project.title}
        </h3>
        <p className="shrink-0 text-sm text-mute">
          {[project.category?.name, project.production_year].filter(Boolean).join(" · ")}
        </p>
      </div>
      {project.is_demo && <p className="mt-1.5 text-xs text-mute/60">Sample project</p>}
    </Link>
  );
}
