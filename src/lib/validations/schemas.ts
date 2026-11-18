import { z } from "zod";
import { BUDGET_RANGES, PROJECT_TYPES } from "@/config/site";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable();

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Must start with http:// or https://")
  .transform((v) => (v === "" ? null : v))
  .nullable();

const storagePath = z.string().trim().max(512).nullable();

export const videoSourceSchema = z.enum(["none", "upload", "external", "youtube", "vimeo"]);

export const mediaItemSchema = z.object({
  url: z
    .string()
    .trim()
    .max(2048)
    .refine((v) => /^https?:\/\//i.test(v), "Must start with http:// or https://"),
  path: z.string().trim().max(512).nullable(),
  caption: z.string().trim().max(160),
});
export type MediaItemInput = z.input<typeof mediaItemSchema>;

// ---------------------------------------------------------------------------
// Public contact form
// ---------------------------------------------------------------------------
export const contactSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Please enter a valid email").max(254),
  project_type: z.enum(PROJECT_TYPES, { error: "Choose a project type" }),
  budget_range: z.enum(BUDGET_RANGES, { error: "Choose a budget range" }),
  message: z.string().trim().min(10, "Tell me a little more (10+ characters)").max(5000),
  /** Honeypot: must stay empty. */
  company: z.string().max(0).optional(),
});
export type ContactInput = z.input<typeof contactSchema>;

// ---------------------------------------------------------------------------
// Admin auth
// ---------------------------------------------------------------------------
export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password is too short"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export const creditSchema = z.object({
  role: z.string().trim().min(1, "Role required").max(80),
  name: z.string().trim().min(1, "Name required").max(120),
});

export const projectSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(160),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
    summary: z.string().trim().max(300),
    description: z.string().trim().max(8000),
    category_id: z.string().uuid("Choose a category").nullable(),
    thumbnail_url: optionalUrl,
    thumbnail_path: storagePath,
    video_source: videoSourceSchema,
    video_url: optionalUrl,
    video_path: storagePath,
    client_name: optionalText(160),
    production_year: z
      .number()
      .int()
      .min(1950, "Year looks wrong")
      .max(2100, "Year looks wrong")
      .nullable(),
    credits: z.array(creditSchema).max(40),
    preview_url: optionalUrl,
    gallery: z.array(mediaItemSchema).max(24),
    services: z.array(z.string().trim().min(1).max(60)).max(20),
    is_demo: z.boolean(),
    is_featured: z.boolean(),
    is_published: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.video_source !== "none" && !v.video_url) {
      ctx.addIssue({ code: "custom", path: ["video_url"], message: "Add a video URL or upload a file" });
    }
    if (v.video_source === "upload" && !v.video_path) {
      ctx.addIssue({ code: "custom", path: ["video_url"], message: "Upload the video file" });
    }
    if (v.is_published && !v.thumbnail_url) {
      ctx.addIssue({ code: "custom", path: ["thumbnail_url"], message: "A thumbnail is required to publish" });
    }
  });
export type ProjectInput = z.input<typeof projectSchema>;
export type ProjectValues = z.output<typeof projectSchema>;

export const reorderSchema = z.array(z.string().uuid()).min(1).max(1000);

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export const expertiseItemSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(80),
  description: z.string().trim().max(240),
});

const count = z.number().int().min(0, "Must be 0 or more").max(1_000_000);

export const profileSchema = z.object({
  full_name: z.string().trim().max(120),
  professional_title: z.string().trim().min(1, "Required").max(160),
  short_bio: z.string().trim().max(600),
  biography: z.string().trim().max(6000),
  portrait_url: optionalUrl,
  portrait_path: storagePath,
  years_experience: count.max(100),
  projects_completed: count,
  happy_clients: count,
  productions_managed: count,
  clients: z.array(z.string().trim().min(1).max(80)).max(60),
  expertise: z.array(expertiseItemSchema).max(24),
  tagline: z.string().trim().max(200),
  intro: z.string().trim().max(1200),
  philosophy: z.string().trim().max(2000),
  approach: z.string().trim().max(3000),
  workflow: z
    .array(z.object({ title: z.string().trim().min(1, "Title required").max(80), description: z.string().trim().max(300) }))
    .max(12),
  highlights: z
    .array(z.object({ label: z.string().trim().min(1, "Label required").max(40), value: z.string().trim().min(1, "Value required").max(40) }))
    .max(8),
  about_images: z.array(mediaItemSchema).max(12),
  email: z
    .string()
    .trim()
    .max(254)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  phone: optionalText(40),
  location: optionalText(120),
});
export type ProfileInput = z.input<typeof profileSchema>;

// ---------------------------------------------------------------------------
// Showreel
// ---------------------------------------------------------------------------
export const showreelSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    subtitle: z.string().trim().max(300),
    video_source: videoSourceSchema,
    video_url: optionalUrl,
    video_path: storagePath,
    thumbnail_url: optionalUrl,
    thumbnail_path: storagePath,
    is_enabled: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.video_source !== "none" && !v.video_url) {
      ctx.addIssue({ code: "custom", path: ["video_url"], message: "Add a video URL or upload a file" });
    }
    if (v.is_enabled && v.video_source === "none") {
      ctx.addIssue({ code: "custom", path: ["is_enabled"], message: "Add a video before enabling the section" });
    }
  });
export type ShowreelInput = z.input<typeof showreelSchema>;

// ---------------------------------------------------------------------------
// Website settings
// ---------------------------------------------------------------------------
export const settingsSchema = z.object({
  site_name: z.string().trim().min(1, "Required").max(80),
  logo_url: optionalUrl,
  logo_path: storagePath,
  favicon_url: optionalUrl,
  favicon_path: storagePath,
  hero_label: z.string().trim().max(120),
  hero_heading: z.string().trim().min(1, "Required").max(160),
  hero_description: z.string().trim().max(400),
  hero_video_url: optionalUrl,
  hero_video_path: storagePath,
  hero_poster_url: optionalUrl,
  hero_poster_path: storagePath,
  seo_title: z.string().trim().max(120),
  seo_description: z.string().trim().max(320),
  og_image_url: optionalUrl,
  og_image_path: storagePath,
  footer_text: z.string().trim().max(300),
  demo_mode: z.boolean(),
});
export type SettingsInput = z.input<typeof settingsSchema>;

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------
export const socialLinksSchema = z.array(
  z.object({
    id: z.string().uuid(),
    url: z
      .string()
      .trim()
      .max(2048)
      .refine((v) => v === "" || /^https?:\/\//i.test(v), "Must start with http:// or https://"),
    is_visible: z.boolean(),
  }),
);
export type SocialLinksInput = z.input<typeof socialLinksSchema>;
