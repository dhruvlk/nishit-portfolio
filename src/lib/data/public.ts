import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { DEFAULT_PROFILE, DEFAULT_SETTINGS, DEFAULT_SHOWREEL, TAGS } from "@/config/site";
import { isSupabaseConfigured } from "@/config/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { Category, Profile, Project, Showreel, SiteSettings, SocialLink } from "@/types/content";
import { PROJECT_SELECT, toProfile, toProject, type ProjectRowWithCategory } from "./mappers";

/*
 * Public, cacheable reads. Every function runs as the anon role (RLS exposes only
 * published/public rows), is cached with `use cache`, tagged for on-demand
 * invalidation from admin actions, and degrades to safe defaults on error so the
 * public site never hard-crashes because of a backend hiccup.
 */

function logError(scope: string, error: unknown) {
  const e = (typeof error === "object" && error !== null ? error : {}) as { message?: string; code?: string; hint?: string };
  const detail = [e.code, e.message ?? String(error), e.hint].filter(Boolean).join(" · ");
  const setupHint = e.code === "42P01" || e.code === "PGRST205" ? " → run the SQL files in supabase/migrations (see README)" : "";
  console.error(`[data:${scope}] ${detail}${setupHint}`);
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(TAGS.settings);
  cacheLife("hours");
  if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;
  try {
    const { data, error } = await createSupabasePublicClient().from("website_settings").select("*").maybeSingle();
    if (error) throw error;
    return data ?? DEFAULT_SETTINGS;
  } catch (e) {
    logError("settings", e);
    cacheLife("minutes");
    return DEFAULT_SETTINGS;
  }
}

export async function getProfile(): Promise<Profile> {
  "use cache";
  cacheTag(TAGS.profile);
  cacheLife("hours");
  if (!isSupabaseConfigured()) return DEFAULT_PROFILE;
  try {
    const { data, error } = await createSupabasePublicClient().from("profiles").select("*").maybeSingle();
    if (error) throw error;
    return data ? toProfile(data) : DEFAULT_PROFILE;
  } catch (e) {
    logError("profile", e);
    cacheLife("minutes");
    return DEFAULT_PROFILE;
  }
}

export async function getShowreel(): Promise<Showreel> {
  "use cache";
  cacheTag(TAGS.showreel);
  cacheLife("hours");
  if (!isSupabaseConfigured()) return DEFAULT_SHOWREEL;
  try {
    const { data, error } = await createSupabasePublicClient().from("showreel").select("*").maybeSingle();
    if (error) throw error;
    return data ?? DEFAULT_SHOWREEL;
  } catch (e) {
    logError("showreel", e);
    cacheLife("minutes");
    return DEFAULT_SHOWREEL;
  }
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  "use cache";
  cacheTag(TAGS.socials);
  cacheLife("hours");
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createSupabasePublicClient()
      .from("social_links")
      .select("*")
      .eq("is_visible", true)
      .neq("url", "")
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    logError("socials", e);
    cacheLife("minutes");
    return [];
  }
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheTag(TAGS.categories);
  cacheLife("days");
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createSupabasePublicClient()
      .from("project_categories")
      .select("id, name, slug, sort_order")
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    logError("categories", e);
    cacheLife("minutes");
    return [];
  }
}

export async function getPublishedProjects(): Promise<Project[]> {
  "use cache";
  cacheTag(TAGS.projects);
  cacheLife("hours");
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createSupabasePublicClient()
      .from("projects")
      .select(PROJECT_SELECT)
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .returns<ProjectRowWithCategory[]>();
    if (error) throw error;
    return (data ?? []).map(toProject);
  } catch (e) {
    logError("projects", e);
    cacheLife("minutes");
    return [];
  }
}

export async function getFeaturedProjects(limit = 6): Promise<Project[]> {
  "use cache";
  cacheTag(TAGS.projects);
  cacheLife("hours");
  const all = await getPublishedProjects();
  const featured = all.filter((p) => p.is_featured);
  return (featured.length > 0 ? featured : all).slice(0, limit);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  "use cache";
  cacheTag(TAGS.projects, `project:${slug}`);
  cacheLife("hours");
  const all = await getPublishedProjects();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getAdjacentProject(slug: string): Promise<Project | null> {
  "use cache";
  cacheTag(TAGS.projects);
  cacheLife("hours");
  const all = await getPublishedProjects();
  if (all.length < 2) return null;
  const i = all.findIndex((p) => p.slug === slug);
  return all[(i + 1) % all.length] ?? null;
}

/** Up to `limit` other published projects, same category first. */
export async function getRelatedProjects(slug: string, limit = 3): Promise<Project[]> {
  "use cache";
  cacheTag(TAGS.projects);
  cacheLife("hours");
  const all = await getPublishedProjects();
  const current = all.find((p) => p.slug === slug);
  const others = all.filter((p) => p.slug !== slug);
  const sameCat = others.filter((p) => current?.category_id && p.category_id === current.category_id);
  const rest = others.filter((p) => !sameCat.includes(p));
  return [...sameCat, ...rest].slice(0, limit);
}
