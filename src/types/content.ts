import type {
  CategoryRow,
  ProfileRow,
  ProjectRow,
  ShowreelRow,
  SocialLinkRow,
  WebsiteSettingsRow,
} from "./database";

export type Credit = { role: string; name: string };
export type ExpertiseItem = { title: string; description: string };
export type WorkflowStep = { title: string; description: string };
export type Highlight = { label: string; value: string };
export type MediaItem = { url: string; path: string | null; caption: string };

export type Category = Pick<CategoryRow, "id" | "name" | "slug" | "sort_order">;

/** Project shape used by the UI (JSON columns parsed, category joined). */
export type Project = Omit<ProjectRow, "credits" | "gallery"> & {
  credits: Credit[];
  gallery: MediaItem[];
  category: Category | null;
};

export type Profile = Omit<ProfileRow, "expertise" | "workflow" | "highlights" | "about_images"> & {
  expertise: ExpertiseItem[];
  workflow: WorkflowStep[];
  highlights: Highlight[];
  about_images: MediaItem[];
};
export type Showreel = ShowreelRow;
export type SiteSettings = WebsiteSettingsRow;
export type SocialLink = SocialLinkRow;

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
