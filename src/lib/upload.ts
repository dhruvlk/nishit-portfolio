"use client";

import { env } from "@/config/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BucketId } from "@/lib/storage";
import { formatBytes } from "@/lib/utils/format";

export type UploadResult = { path: string; publicUrl: string };

export class UploadError extends Error {}

/** Supabase recommends resumable (TUS) uploads above ~6 MB for flaky networks. */
export const RESUMABLE_RECOMMENDED_BYTES = 6 * 1024 * 1024;

export function validateFile(file: File, accept: readonly string[], maxMb: number): string | null {
  if (!accept.includes(file.type)) {
    return `Unsupported file type (${file.type || "unknown"}). Allowed: ${accept.map((a) => a.split("/")[1]).join(", ")}.`;
  }
  const max = maxMb * 1024 * 1024;
  if (file.size > max) {
    return `File is ${formatBytes(file.size)}; the limit is ${maxMb} MB. For larger masters use YouTube/Vimeo or raise the limit (see README).`;
  }
  return null;
}

function extensionFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return file.type.split("/")[1]?.replace("quicktime", "mov").replace("svg+xml", "svg") ?? "bin";
}

/**
 * Uploads straight from the browser to Supabase Storage (the file never passes
 * through the Next.js server) using XHR so we get real upload progress.
 * Authorization is the admin's own JWT; storage RLS rejects non-admins.
 */
export async function uploadWithProgress(opts: {
  bucket: BucketId;
  folder: string;
  file: File;
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
}): Promise<UploadResult> {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new UploadError("Your session expired. Sign in again to upload.");

  const path = `${opts.folder.replace(/[^\w-]/g, "")}/${crypto.randomUUID()}.${extensionFor(opts.file)}`;
  const url = `${env.supabaseUrl}/storage/v1/object/${opts.bucket}/${path}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", env.supabasePublishableKey);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.setRequestHeader("Content-Type", opts.file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = `Upload failed (${xhr.status}).`;
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string; error?: string };
        message = body.message || body.error || message;
      } catch {
        /* non-JSON body */
      }
      if (xhr.status === 413 || /maximum allowed size|too large/i.test(message)) {
        message = "The file exceeds your Supabase project's upload limit. Raise it in Storage settings or use YouTube/Vimeo.";
      }
      if (xhr.status === 403 || /row-level security/i.test(message)) {
        message = "Upload rejected: this account is not an admin.";
      }
      reject(new UploadError(message));
    };
    xhr.onerror = () => reject(new UploadError("Network error during upload."));
    xhr.onabort = () => reject(new UploadError("Upload cancelled."));
    opts.signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(opts.file);
  });

  const { data: pub } = supabase.storage.from(opts.bucket).getPublicUrl(path);
  return { path, publicUrl: pub.publicUrl };
}
