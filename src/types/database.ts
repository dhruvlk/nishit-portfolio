/**
 * Hand-maintained Supabase types matching supabase/migrations.
 * Regenerate with: npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type VideoSource = "none" | "upload" | "external" | "youtube" | "vimeo";
export type SocialPlatform = "instagram" | "youtube" | "vimeo" | "linkedin" | "behance";

type Timestamps = { created_at: string; updated_at: string };

export type ProfileRow = {
  id: string;
  singleton: boolean;
  full_name: string;
  professional_title: string;
  short_bio: string;
  biography: string;
  portrait_url: string | null;
  portrait_path: string | null;
  years_experience: number;
  projects_completed: number;
  happy_clients: number;
  productions_managed: number;
  clients: string[];
  expertise: Json;
  email: string | null;
  phone: string | null;
  location: string | null;
  tagline: string;
  intro: string;
  philosophy: string;
  approach: string;
  workflow: Json;
  highlights: Json;
  about_images: Json;
} & Timestamps;

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
} & Timestamps;

export type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  category_id: string | null;
  thumbnail_url: string | null;
  thumbnail_path: string | null;
  video_source: VideoSource;
  video_url: string | null;
  video_path: string | null;
  preview_url: string | null;
  client_name: string | null;
  production_year: number | null;
  credits: Json;
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  published_at: string | null;
  is_demo: boolean;
  gallery: Json;
  services: string[];
} & Timestamps;

export type ShowreelRow = {
  id: string;
  singleton: boolean;
  title: string;
  subtitle: string;
  video_source: VideoSource;
  video_url: string | null;
  video_path: string | null;
  thumbnail_url: string | null;
  thumbnail_path: string | null;
  is_enabled: boolean;
} & Timestamps;

export type WebsiteSettingsRow = {
  id: string;
  singleton: boolean;
  site_name: string;
  logo_url: string | null;
  logo_path: string | null;
  favicon_url: string | null;
  favicon_path: string | null;
  hero_label: string;
  hero_heading: string;
  hero_description: string;
  hero_video_url: string | null;
  hero_video_path: string | null;
  hero_poster_url: string | null;
  hero_poster_path: string | null;
  seo_title: string;
  seo_description: string;
  og_image_url: string | null;
  og_image_path: string | null;
  footer_text: string;
  demo_mode: boolean;
} & Timestamps;

export type SocialLinkRow = {
  id: string;
  platform: SocialPlatform;
  url: string;
  is_visible: boolean;
  sort_order: number;
} & Timestamps;

export type ContactMessageRow = {
  id: string;
  full_name: string;
  email: string;
  project_type: string;
  budget_range: string;
  message: string;
  is_read: boolean;
} & Timestamps;

export type AdminUserRow = { user_id: string; created_at: string };

/** Insert type: keys with DB defaults become optional. */
type InsertOf<Row, Required extends keyof Row> = Pick<Row, Required> & Partial<Omit<Row, Required>>;

type Table<Row, Required extends keyof Row, Rels = []> = {
  Row: Row;
  Insert: InsertOf<Row, Required>;
  Update: Partial<Row>;
  Relationships: Rels;
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      admin_users: Table<AdminUserRow, "user_id">;
      profiles: Table<ProfileRow, never>;
      project_categories: Table<CategoryRow, "name" | "slug">;
      projects: Table<
        ProjectRow,
        "title" | "slug",
        [
          {
            foreignKeyName: "projects_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "project_categories";
            referencedColumns: ["id"];
          },
        ]
      >;
      showreel: Table<ShowreelRow, never>;
      website_settings: Table<WebsiteSettingsRow, never>;
      social_links: Table<SocialLinkRow, "platform">;
      contact_messages: Table<
        ContactMessageRow,
        "full_name" | "email" | "project_type" | "budget_range" | "message"
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
