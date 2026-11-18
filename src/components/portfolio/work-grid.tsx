"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { ProjectGrid } from "./project-grid";
import type { Category, Project } from "@/types/content";
import { cn } from "@/lib/utils/cn";

/** Text filters (All + categories in use) over the two-column grid. */
export function WorkGrid({ projects, categories }: { projects: Project[]; categories: Category[] }) {
  const [filter, setFilter] = useState<string>("all");

  // Read ?category= once on mount (avoids useSearchParams suspending the static shell).
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("category");
    if (c) {
      const id = requestAnimationFrame(() => setFilter(c));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  const choose = (slug: string) => {
    setFilter(slug);
    const url = new URL(window.location.href);
    if (slug === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", slug);
    window.history.replaceState(null, "", url);
  };

  const used = useMemo(() => {
    const slugs = new Set(projects.map((p) => p.category?.slug).filter(Boolean));
    return categories.filter((c) => slugs.has(c.slug));
  }, [projects, categories]);

  const visible = useMemo(
    () => (filter === "all" ? projects : projects.filter((p) => p.category?.slug === filter)),
    [filter, projects],
  );

  const chips = [{ slug: "all", name: "All" }, ...used.map((c) => ({ slug: c.slug, name: c.name }))];

  return (
    <div className="container-cinema pb-28 lg:pb-40">
      {used.length > 1 && (
        <nav aria-label="Filter projects by category" className="-mx-1 mb-14 overflow-x-auto px-1 [scrollbar-width:none] md:mb-20">
          <LayoutGroup id="filters">
            <ul className="flex w-max gap-7 border-b border-line">
              {chips.map((c) => {
                const active = filter === c.slug;
                return (
                  <li key={c.slug}>
                    <button
                      type="button"
                      onClick={() => choose(c.slug)}
                      aria-pressed={active}
                      className={cn(
                        "relative pb-4 pt-2 text-sm transition-colors duration-300",
                        active ? "text-paper" : "text-mute hover:text-paper",
                      )}
                    >
                      {c.name}
                      {active && (
                        <motion.span
                          layoutId="filter-rule"
                          className="absolute inset-x-0 -bottom-px h-px bg-paper"
                          transition={{ type: "spring", stiffness: 420, damping: 38 }}
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </LayoutGroup>
        </nav>
      )}

      <h2 className="sr-only">{filter === "all" ? "All projects" : "Filtered projects"}</h2>
      {visible.length === 0 ? (
        <p className="border-t border-line py-20 text-mute">
          {projects.length === 0 ? "Projects will appear here once published." : "No projects in this category yet."}
        </p>
      ) : (
        <motion.div key={filter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <ProjectGrid projects={visible} priorityCount={2} />
        </motion.div>
      )}
    </div>
  );
}
