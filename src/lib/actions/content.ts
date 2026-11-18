"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { TAGS } from "@/config/site";
import { getAdminForAction } from "@/lib/auth";
import { BUCKETS } from "@/lib/storage";
import {
  profileSchema,
  settingsSchema,
  showreelSchema,
  socialLinksSchema,
  type ProfileInput,
  type SettingsInput,
  type ShowreelInput,
  type SocialLinksInput,
} from "@/lib/validations/schemas";
import type { ActionResult } from "@/types/content";
import { NOT_AUTHORIZED, dbError, droppedPaths, removeFiles, replaced, validationError } from "./_shared";
import { parseMedia } from "@/lib/data/mappers";

export async function saveProfileAction(input: ProfileInput): Promise<ActionResult> {
  const session = await getAdminForAction();
  if (!session) return NOT_AUTHORIZED;
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase } = session;
  try {
    const { data: existing } = await supabase.from("profiles").select("portrait_path, about_images").maybeSingle();
    const { error } = await supabase
      .from("profiles")
      .upsert({ ...parsed.data, singleton: true }, { onConflict: "singleton" });
    if (error) return dbError(error);
    await removeFiles(supabase, [
      { bucket: BUCKETS.profile, path: replaced(existing?.portrait_path, parsed.data.portrait_path) },
      ...droppedPaths(existing ? parseMedia(existing.about_images) : [], parsed.data.about_images).map((path) => ({
        bucket: BUCKETS.profile,
        path,
      })),
    ]);
    updateTag(TAGS.profile);
    return { ok: true, message: "Profile saved." };
  } catch (e) {
    console.error("[profile] save", e);
    return { ok: false, error: "Could not save the profile." };
  }
}

export async function saveShowreelAction(input: ShowreelInput): Promise<ActionResult> {
  const session = await getAdminForAction();
  if (!session) return NOT_AUTHORIZED;
  const parsed = showreelSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase } = session;
  try {
    const { data: existing } = await supabase.from("showreel").select("video_path, thumbnail_path").maybeSingle();
    const { error } = await supabase
      .from("showreel")
      .upsert({ ...parsed.data, singleton: true }, { onConflict: "singleton" });
    if (error) return dbError(error);
    await removeFiles(supabase, [
      { bucket: BUCKETS.showreel, path: replaced(existing?.video_path, parsed.data.video_path) },
      { bucket: BUCKETS.showreel, path: replaced(existing?.thumbnail_path, parsed.data.thumbnail_path) },
    ]);
    updateTag(TAGS.showreel);
    return { ok: true, message: "Showreel saved." };
  } catch (e) {
    console.error("[showreel] save", e);
    return { ok: false, error: "Could not save the showreel." };
  }
}

export async function saveSettingsAction(input: SettingsInput): Promise<ActionResult> {
  const session = await getAdminForAction();
  if (!session) return NOT_AUTHORIZED;
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase } = session;
  try {
    const { data: existing } = await supabase
      .from("website_settings")
      .select("logo_path, favicon_path, hero_video_path, hero_poster_path, og_image_path")
      .maybeSingle();
    const { error } = await supabase
      .from("website_settings")
      .upsert({ ...parsed.data, singleton: true }, { onConflict: "singleton" });
    if (error) return dbError(error);
    const d = parsed.data;
    await removeFiles(supabase, [
      { bucket: BUCKETS.assets, path: replaced(existing?.logo_path, d.logo_path) },
      { bucket: BUCKETS.assets, path: replaced(existing?.favicon_path, d.favicon_path) },
      { bucket: BUCKETS.assets, path: replaced(existing?.hero_video_path, d.hero_video_path) },
      { bucket: BUCKETS.assets, path: replaced(existing?.hero_poster_path, d.hero_poster_path) },
      { bucket: BUCKETS.assets, path: replaced(existing?.og_image_path, d.og_image_path) },
    ]);
    updateTag(TAGS.settings);
    return { ok: true, message: "Settings saved." };
  } catch (e) {
    console.error("[settings] save", e);
    return { ok: false, error: "Could not save settings." };
  }
}

export async function saveSocialLinksAction(input: SocialLinksInput): Promise<ActionResult> {
  const session = await getAdminForAction();
  if (!session) return NOT_AUTHORIZED;
  const parsed = socialLinksSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase } = session;
  try {
    const results = await Promise.all(
      parsed.data.map(({ id, url, is_visible }) =>
        supabase.from("social_links").update({ url, is_visible }).eq("id", id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) return dbError(failed.error);
    updateTag(TAGS.socials);
    return { ok: true, message: "Social links saved." };
  } catch (e) {
    console.error("[socials] save", e);
    return { ok: false, error: "Could not save social links." };
  }
}

const messageId = z.string().uuid();

export async function setMessageReadAction(id: string, isRead: boolean): Promise<ActionResult> {
  const session = await getAdminForAction();
  if (!session) return NOT_AUTHORIZED;
  if (!messageId.safeParse(id).success) return { ok: false, error: "Invalid message id." };
  try {
    const { error } = await session.supabase.from("contact_messages").update({ is_read: isRead }).eq("id", id);
    if (error) return dbError(error);
    return { ok: true };
  } catch (e) {
    console.error("[messages] read", e);
    return { ok: false, error: "Could not update the message." };
  }
}

export async function deleteMessageAction(id: string): Promise<ActionResult> {
  const session = await getAdminForAction();
  if (!session) return NOT_AUTHORIZED;
  if (!messageId.safeParse(id).success) return { ok: false, error: "Invalid message id." };
  try {
    const { error } = await session.supabase.from("contact_messages").delete().eq("id", id);
    if (error) return dbError(error);
    return { ok: true, message: "Message deleted." };
  } catch (e) {
    console.error("[messages] delete", e);
    return { ok: false, error: "Could not delete the message." };
  }
}
