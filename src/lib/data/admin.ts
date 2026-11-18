import "server-only";

import { requireAdmin } from "@/lib/auth";
import type { Category, Profile, Project, Showreel, SiteSettings, SocialLink } from "@/types/content";
import type { ContactMessageRow } from "@/types/database";
import { DEFAULT_PROFILE, DEFAULT_SETTINGS, DEFAULT_SHOWREEL } from "@/config/site";
import { PROJECT_SELECT, toProfile, toProject, type ProjectRowWithCategory } from "./mappers";

/*
 * Admin reads. Always dynamic (never cached), always run as the signed-in admin
 * so RLS returns drafts and private rows. Errors are thrown to the nearest
 * error boundary (admin/error.tsx), which shows a retry UI.
 */

export type DashboardStats = {
  total: number;
  published: number;
  drafts: number;
  featured: number;
  messages: number;
  unread: number;
};

export async function getDashboardData(): Promise<{
  stats: DashboardStats;
  recentProjects: Project[];
  recentMessages: ContactMessageRow[];
}> {
  const { supabase } = await requireAdmin();

  const head = { count: "exact" as const, head: true };
  const [total, published, featured, messages, unread, recentProjects, recentMessages] = await Promise.all([
    supabase.from("projects").select("id", head),
    supabase.from("projects").select("id", head).eq("is_published", true),
    supabase.from("projects").select("id", head).eq("is_featured", true),
    supabase.from("contact_messages").select("id", head),
    supabase.from("contact_messages").select("id", head).eq("is_read", false),
    supabase
      .from("projects")
      .select(PROJECT_SELECT)
      .order("updated_at", { ascending: false })
      .limit(5)
      .returns<ProjectRowWithCategory[]>(),
    supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  for (const r of [total, published, featured, messages, unread, recentProjects, recentMessages]) {
    if (r.error) throw new Error(r.error.message);
  }

  const totalCount = total.count ?? 0;
  const publishedCount = published.count ?? 0;
  return {
    stats: {
      total: totalCount,
      published: publishedCount,
      drafts: totalCount - publishedCount,
      featured: featured.count ?? 0,
      messages: messages.count ?? 0,
      unread: unread.count ?? 0,
    },
    recentProjects: (recentProjects.data ?? []).map(toProject),
    recentMessages: recentMessages.data ?? [],
  };
}

export async function getAllProjects(): Promise<Project[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<ProjectRowWithCategory[]>();
  if (error) throw new Error(error.message);
  return (data ?? []).map(toProject);
}

export async function getProjectById(id: string): Promise<Project | null> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("id", id)
    .returns<ProjectRowWithCategory[]>()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProject(data) : null;
}

export async function getAdminCategories(): Promise<Category[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("project_categories")
    .select("id, name, slug, sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAdminMessages(): Promise<ContactMessageRow[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAdminProfile(): Promise<Profile> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProfile(data) : DEFAULT_PROFILE;
}

export async function getAdminShowreel(): Promise<Showreel> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("showreel").select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? DEFAULT_SHOWREEL;
}

export async function getAdminSettings(): Promise<SiteSettings> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("website_settings").select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? DEFAULT_SETTINGS;
}

export async function getAdminSocialLinks(): Promise<SocialLink[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("social_links").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}
