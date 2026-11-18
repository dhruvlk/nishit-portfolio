import type { Category, Credit, ExpertiseItem, Highlight, MediaItem, Profile, Project, WorkflowStep } from "@/types/content";
import type { Json, ProfileRow, ProjectRow } from "@/types/database";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

function parseArray<T>(value: Json, pick: (item: Record<string, unknown>) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const v = pick(item);
    return v ? [v] : [];
  });
}

export const parseCredits = (v: Json): Credit[] =>
  parseArray(v, (i) => (typeof i.role === "string" && typeof i.name === "string" ? { role: i.role, name: i.name } : null));

export const parseExpertise = (v: Json): ExpertiseItem[] =>
  parseArray(v, (i) => (typeof i.title === "string" ? { title: i.title, description: str(i.description) } : null));

export const parseWorkflow = (v: Json): WorkflowStep[] =>
  parseArray(v, (i) => (typeof i.title === "string" ? { title: i.title, description: str(i.description) } : null));

export const parseHighlights = (v: Json): Highlight[] =>
  parseArray(v, (i) => (typeof i.label === "string" && typeof i.value === "string" ? { label: i.label, value: i.value } : null));

export const parseMedia = (v: Json): MediaItem[] =>
  parseArray(v, (i) =>
    typeof i.url === "string" && i.url
      ? { url: i.url, path: typeof i.path === "string" ? i.path : null, caption: str(i.caption) }
      : null,
  );

export type ProjectRowWithCategory = ProjectRow & { category: Category | null };

export function toProject(row: ProjectRowWithCategory): Project {
  return {
    ...row,
    credits: parseCredits(row.credits),
    gallery: parseMedia(row.gallery),
    services: row.services ?? [],
    is_demo: row.is_demo ?? false,
    category: row.category ?? null,
  };
}

export function toProfile(row: ProfileRow): Profile {
  return {
    ...row,
    tagline: row.tagline ?? "",
    intro: row.intro ?? "",
    philosophy: row.philosophy ?? "",
    approach: row.approach ?? "",
    expertise: parseExpertise(row.expertise),
    workflow: parseWorkflow(row.workflow ?? []),
    highlights: parseHighlights(row.highlights ?? []),
    about_images: parseMedia(row.about_images ?? []),
  };
}

export const PROJECT_SELECT = "*, category:project_categories(id, name, slug, sort_order)" as const;
