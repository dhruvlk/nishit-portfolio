import type { Profile, Showreel, SiteSettings } from "@/types/content";
import type { SocialPlatform } from "@/types/database";

export const CATEGORY_FALLBACK = [
  "Commercials",
  "Brand Films",
  "Music Videos",
  "Short Films",
  "Documentaries",
  "Social Media",
  "Corporate Films",
  "Other",
] as const;

export const PROJECT_TYPES = [
  "Commercial",
  "Brand Film",
  "Music Video",
  "Short Film",
  "Documentary",
  "Social Media Content",
  "Corporate Film",
  "Post Production Only",
  "Other",
] as const;

export const BUDGET_RANGES = [
  "Under ₹1 Lakh",
  "₹1 – 5 Lakh",
  "₹5 – 15 Lakh",
  "₹15 Lakh +",
  "Let's discuss",
] as const;

export const SOCIAL_PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "youtube", label: "YouTube" },
  { id: "vimeo", label: "Vimeo" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "behance", label: "Behance" },
];

const EPOCH = "1970-01-01T00:00:00.000Z";

/** Neutral defaults used when Supabase is unreachable or a row is missing. */
export const DEFAULT_SETTINGS: SiteSettings = {
  id: "default",
  singleton: true,
  site_name: "Nishit Gundecha",
  logo_url: null,
  logo_path: null,
  favicon_url: null,
  favicon_path: null,
  hero_label: "Senior Video Editor & Production Head",
  hero_heading: "Crafting Stories.\nCreating Emotions.",
  hero_description:
    "From creative concepts to the final frame, bringing stories to life through powerful visuals and cinematic storytelling.",
  hero_video_url: null,
  hero_video_path: null,
  hero_poster_url: null,
  hero_poster_path: null,
  seo_title: "Nishit Gundecha | Senior Video Editor & Production Head",
  seo_description:
    "Explore the creative portfolio of Nishit Gundecha, Senior Video Editor & Production Head, specializing in cinematic storytelling, professional video editing, creative direction, and production management.",
  og_image_url: null,
  og_image_path: null,
  footer_text: "",
  demo_mode: false,
  created_at: EPOCH,
  updated_at: EPOCH,
};

export const DEFAULT_PROFILE: Profile = {
  id: "default",
  singleton: true,
  full_name: "Nishit Gundecha",
  professional_title: "Senior Video Editor & Production Head",
  short_bio: "",
  biography: "",
  portrait_url: null,
  portrait_path: null,
  years_experience: 0,
  projects_completed: 0,
  happy_clients: 0,
  productions_managed: 0,
  clients: [],
  expertise: [
    { title: "Film & Video Editing", description: "Narrative and commercial cuts built on rhythm, pacing and intent." },
    { title: "Creative Direction", description: "Shaping tone, look and story from first brief to final frame." },
    { title: "Production Management", description: "Schedules, budgets, crews and deliverables kept on track." },
    { title: "Cinematic Storytelling", description: "Structure and emotion that hold attention from open to close." },
    { title: "Color Grading", description: "Looks that set mood and keep every shot consistent." },
    { title: "Motion Graphics", description: "Titles, typography and graphics that move with the edit." },
    { title: "Commercial Video Production", description: "Campaign films made to perform across every placement." },
    { title: "Post Production", description: "Finishing pipelines: conform, sound, grade and mastering." },
    { title: "Social Media Video Content", description: "Platform-native cutdowns, verticals and series." },
    { title: "Team & Production Management", description: "Leading editors, artists and crews to deliver at scale." },
  ],
  email: null,
  phone: null,
  location: null,
  tagline: "Every Frame Has a Story. Every Story Deserves to Be Seen.",
  intro: "",
  philosophy: "",
  approach: "",
  workflow: [],
  highlights: [],
  about_images: [],
  created_at: EPOCH,
  updated_at: EPOCH,
};

export const DEFAULT_SHOWREEL: Showreel = {
  id: "default",
  singleton: true,
  title: "Watch Showreel",
  subtitle: "",
  video_source: "none",
  video_url: null,
  video_path: null,
  thumbnail_url: null,
  thumbnail_path: null,
  is_enabled: false,
  created_at: EPOCH,
  updated_at: EPOCH,
};

/** Cache tags for on-demand revalidation after admin edits. */
export const TAGS = {
  projects: "projects",
  categories: "categories",
  profile: "profile",
  settings: "settings",
  showreel: "showreel",
  socials: "socials",
} as const;

/** Social sharing defaults (Open Graph + Twitter). The image lives at public/og-image.png. */
export const SEO = {
  title: "Nishit Gundecha | Senior Video Editor & Production Head",
  description:
    "Explore the creative portfolio of Nishit Gundecha, Senior Video Editor & Production Head, specializing in cinematic storytelling, professional video editing, creative direction, and production management.",
  ogDescription: "Explore cinematic storytelling and creative video production by Nishit Gundecha.",
  twitterDescription: "Explore the creative portfolio of Nishit Gundecha.",
  image: {
    url: "/og-image.png",
    width: 1200,
    height: 630,
    type: "image/png",
    alt: "Nishit Gundecha – Senior Video Editor & Production Head",
  },
} as const;
