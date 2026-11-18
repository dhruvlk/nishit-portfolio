"use server";

import { z } from "zod";
import { getAdminForAction } from "@/lib/auth";
import { isBucketId } from "@/lib/storage";
import type { ActionResult } from "@/types/content";
import { NOT_AUTHORIZED, removeFiles } from "./_shared";

const schema = z.object({
  bucket: z.string().refine(isBucketId, "Unknown bucket"),
  path: z.string().min(1).max(512).regex(/^[\w\-./]+$/).refine((p) => !p.includes(".."), "Invalid path"),
});

/** Deletes an upload that was replaced or discarded before the form was saved. */
export async function discardUploadAction(bucket: string, path: string): Promise<ActionResult> {
  const session = await getAdminForAction();
  if (!session) return NOT_AUTHORIZED;
  const parsed = schema.safeParse({ bucket, path });
  if (!parsed.success || !isBucketId(parsed.data.bucket)) return { ok: false, error: "Invalid file reference." };
  await removeFiles(session.supabase, [{ bucket: parsed.data.bucket, path: parsed.data.path }]);
  return { ok: true };
}
