import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ZodError } from "zod";
import type { BucketId } from "@/lib/storage";
import type { ActionResult } from "@/types/content";
import type { Database } from "@/types/database";

export const NOT_AUTHORIZED: ActionResult<never> = {
  ok: false,
  error: "Your session has expired or you are not authorized. Please sign in again.",
};

export function validationError(error: ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
}

export function dbError(error: { message: string; code?: string }): ActionResult<never> {
  if (error.code === "23505") return { ok: false, error: "That slug is already in use. Choose another." };
  if (error.code === "42501") return { ok: false, error: "Permission denied. Is this account an admin?" };
  return { ok: false, error: error.message || "Database error." };
}

/** Best-effort removal of replaced/deleted files. Never fails the parent action. */
export async function removeFiles(
  supabase: SupabaseClient<Database>,
  files: { bucket: BucketId; path: string | null | undefined }[],
): Promise<void> {
  const byBucket = new Map<BucketId, string[]>();
  for (const f of files) {
    if (!f.path) continue;
    byBucket.set(f.bucket, [...(byBucket.get(f.bucket) ?? []), f.path]);
  }
  await Promise.all(
    [...byBucket].map(async ([bucket, paths]) => {
      const { error } = await supabase.storage.from(bucket).remove(paths);
      if (error) console.error(`[storage] failed to remove from ${bucket}:`, error.message);
    }),
  );
}

/** Storage paths present in `before` but not in `after` (for list-type media fields). */
export function droppedPaths(
  before: { path?: string | null }[] | null | undefined,
  after: { path?: string | null }[],
): string[] {
  const keep = new Set(after.map((m) => m.path).filter(Boolean));
  return (before ?? []).map((m) => m.path).filter((p): p is string => Boolean(p) && !keep.has(p));
}

/** Returns old path if it was replaced or cleared. */
export function replaced(oldPath: string | null | undefined, newPath: string | null | undefined): string | null {
  return oldPath && oldPath !== newPath ? oldPath : null;
}
