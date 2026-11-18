"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { TAGS } from "@/config/site";
import { getAdminForAction } from "@/lib/auth";
import { BUCKETS } from "@/lib/storage";
import { projectSchema, reorderSchema, type ProjectInput } from "@/lib/validations/schemas";
import type { ActionResult } from "@/types/content";
import { NOT_AUTHORIZED, dbError, droppedPaths, removeFiles, replaced, validationError } from "./_shared";
import { parseMedia } from "@/lib/data/mappers";

const idSchema = z.string().uuid();

function invalidate(...slugs: (string | null | undefined)[]) {
  updateTag(TAGS.projects);
  for (const s of slugs) if (s) updateTag(`project:${s}`);
}

export async function createProjectAction(input: ProjectInput): Promise<ActionResult<{ id: string }>> {
  const session = await getAdminForAction();
  if (!session) return NOT_AUTHORIZED;
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase } = session;
  try {
    // New projects go to the top of the order.
    const { data: first } = await supabase
      .from("projects")
      .select("display_order")
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    const display_order = (first?.display_order ?? 1) - 1;

    const { data, error } = await supabase
      .from("projects")
      .insert({ ...parsed.data, display_order })
      .select("id")
      .single();
    if (error) return dbError(error);

    invalidate(parsed.data.slug);
    return { ok: true, data: { id: data.id }, message: "Project created." };
  } catch (e) {
    console.error("[projects] create", e);
    return { ok: false, error: "Could not create the project." };
  }
}

export async function updateProjectAction(id: string, input: ProjectInput): Promise<ActionResult> {
  const session = await getAdminForAction();
  if (!session) return NOT_AUTHORIZED;
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Invalid project id." };
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase } = session;
  try {
    const { data: existing, error: readError } = await supabase
      .from("projects")
      .select("slug, thumbnail_path, video_path, gallery")
      .eq("id", id)
      .maybeSingle();
    if (readError) return dbError(readError);
    if (!existing) return { ok: false, error: "Project not found." };

    const { error } = await supabase.from("projects").update(parsed.data).eq("id", id);
    if (error) return dbError(error);

    await removeFiles(supabase, [
      { bucket: BUCKETS.thumbnails, path: replaced(existing.thumbnail_path, parsed.data.thumbnail_path) },
      { bucket: BUCKETS.videos, path: replaced(existing.video_path, parsed.data.video_path) },
      ...droppedPaths(parseMedia(existing.gallery), parsed.data.gallery).map((path) => ({ bucket: BUCKETS.thumbnails, path })),
    ]);

    invalidate(existing.slug, parsed.data.slug);
    return { ok: true, message: "Project saved." };
  } catch (e) {
    console.error("[projects] update", e);
    return { ok: false, error: "Could not save the project." };
  }
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  const session = await getAdminForAction();
  if (!session) return NOT_AUTHORIZED;
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Invalid project id." };

  const { supabase } = session;
  try {
    const { data: existing, error: readError } = await supabase
      .from("projects")
      .select("slug, thumbnail_path, video_path, gallery")
      .eq("id", id)
      .maybeSingle();
    if (readError) return dbError(readError);
    if (!existing) return { ok: false, error: "Project not found." };

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return dbError(error);

    await removeFiles(supabase, [
      { bucket: BUCKETS.thumbnails, path: existing.thumbnail_path },
      { bucket: BUCKETS.videos, path: existing.video_path },
      ...parseMedia(existing.gallery).map((m) => ({ bucket: BUCKETS.thumbnails, path: m.path })),
    ]);

    invalidate(existing.slug);
    return { ok: true, message: "Project deleted." };
  } catch (e) {
    console.error("[projects] delete", e);
    return { ok: false, error: "Could not delete the project." };
  }
}

const flagsSchema = z
  .object({ is_published: z.boolean().optional(), is_featured: z.boolean().optional() })
  .refine((v) => v.is_published !== undefined || v.is_featured !== undefined);

export async function setProjectFlagsAction(
  id: string,
  flags: { is_published?: boolean; is_featured?: boolean },
): Promise<ActionResult> {
  const session = await getAdminForAction();
  if (!session) return NOT_AUTHORIZED;
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Invalid project id." };
  const parsed = flagsSchema.safeParse(flags);
  if (!parsed.success) return { ok: false, error: "Nothing to update." };

  const { supabase } = session;
  try {
    if (parsed.data.is_published) {
      const { data: p } = await supabase.from("projects").select("thumbnail_url").eq("id", id).maybeSingle();
      if (!p?.thumbnail_url) return { ok: false, error: "Add a thumbnail before publishing." };
    }
    const { data, error } = await supabase.from("projects").update(parsed.data).eq("id", id).select("slug").single();
    if (error) return dbError(error);
    invalidate(data.slug);
    return {
      ok: true,
      message:
        parsed.data.is_published !== undefined
          ? parsed.data.is_published
            ? "Published."
            : "Moved to drafts."
          : parsed.data.is_featured
            ? "Marked as featured."
            : "Removed from featured.",
    };
  } catch (e) {
    console.error("[projects] flags", e);
    return { ok: false, error: "Could not update the project." };
  }
}

export async function reorderProjectsAction(orderedIds: string[]): Promise<ActionResult> {
  const session = await getAdminForAction();
  if (!session) return NOT_AUTHORIZED;
  const parsed = reorderSchema.safeParse(orderedIds);
  if (!parsed.success) return { ok: false, error: "Invalid order." };

  const { supabase } = session;
  try {
    const results = await Promise.all(
      parsed.data.map((id, index) => supabase.from("projects").update({ display_order: index }).eq("id", id)),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) return dbError(failed.error);
    invalidate();
    return { ok: true, message: "Order saved." };
  } catch (e) {
    console.error("[projects] reorder", e);
    return { ok: false, error: "Could not save the new order." };
  }
}
