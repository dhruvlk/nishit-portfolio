"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK, ScrollTrigger } from "@/lib/gsap";
import { ProjectCard } from "./project-card";
import type { Project } from "@/types/content";
import { cn } from "@/lib/utils/cn";

/** Two-column editorial grid. Frames fade up in small batches as they enter. */
export function ProjectGrid({
  projects,
  className,
  priorityCount = 0,
}: {
  projects: Project[];
  className?: string;
  priorityCount?: number;
}) {
  const root = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        ScrollTrigger.batch("[data-grid-item]", {
          start: "top 92%",
          once: true,
          onEnter: (els) =>
            gsap.fromTo(els, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.12 }),
        });
      });
    },
    { scope: root, dependencies: [projects], revertOnUpdate: true },
  );

  return (
    <ul ref={root} className={cn("grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:gap-x-12 lg:gap-y-20", className)}>
      {projects.map((p, i) => (
        <li key={p.id} data-grid-item>
          <ProjectCard project={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
