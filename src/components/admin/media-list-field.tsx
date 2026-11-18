"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Link2, Trash2 } from "lucide-react";
import { env } from "@/config/env";
import { discardUploadAction } from "@/lib/actions/uploads";
import { IMAGE_TYPES, type BucketId } from "@/lib/storage";
import { canOptimizeImage } from "@/lib/utils/media";
import type { MediaItemInput } from "@/lib/validations/schemas";
import { Button, Input } from "@/components/ui/admin-primitives";
import { FileUpload } from "./file-upload";

/**
 * Ordered list of images (project gallery, About photography). Add by upload or
 * URL, caption, reorder, remove. Uploads removed before saving are deleted right
 * away; saved files are cleaned up server-side when the form is saved.
 */
export function MediaListField({
  label,
  hint,
  bucket,
  folder,
  value,
  onChange,
  savedPaths,
  max = 12,
  error,
  onBusyChange,
}: {
  label: string;
  hint?: string;
  bucket: BucketId;
  folder: string;
  value: MediaItemInput[];
  onChange: (v: MediaItemInput[]) => void;
  savedPaths: string[];
  max?: number;
  error?: string;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [urlDraft, setUrlDraft] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const full = value.length >= max;

  const remove = (i: number) => {
    const item = value[i];
    if (item?.path && !savedPaths.includes(item.path)) void discardUploadAction(bucket, item.path);
    onChange(value.filter((_, j) => j !== i));
  };
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    const [m] = next.splice(i, 1);
    next.splice(i + d, 0, m);
    onChange(next);
  };
  const addUrl = () => {
    const u = urlDraft.trim();
    if (!/^https?:\/\//i.test(u)) return setUrlError("Enter a full URL starting with https://");
    onChange([...value, { url: u, path: null, caption: "" }]);
    setUrlDraft("");
    setUrlError(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium text-a-fg">{label}</p>
        <span className="text-xs text-a-mute">
          {value.length}/{max}
        </span>
      </div>
      {hint && <p className="-mt-2 text-xs text-a-mute">{hint}</p>}

      {value.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {value.map((m, i) => (
              <motion.li
                key={m.path ?? m.url}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="overflow-hidden rounded-lg border border-a-line bg-a-raised"
              >
                <div className="relative aspect-video">
                  <Image src={m.url} alt={m.caption || ""} fill sizes="320px" className="object-cover" unoptimized={!canOptimizeImage(m.url)} />
                  <div className="absolute right-1.5 top-1.5 flex gap-1">
                    <Button type="button" size="sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier">
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button type="button" size="sm" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move later">
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button type="button" size="sm" variant="danger" onClick={() => remove(i)} aria-label="Remove image">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <Input
                  value={m.caption}
                  onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))}
                  placeholder="Caption (optional)"
                  aria-label={`Caption for image ${i + 1}`}
                  className="rounded-none border-0 border-t"
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {!full && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FileUpload
            label="Upload image"
            bucket={bucket}
            folder={folder}
            accept={IMAGE_TYPES}
            maxMb={env.maxImageUploadMb}
            kind="image"
            allowUrl={false}
            aspect="aspect-[16/7]"
            value={{ url: null, path: null }}
            onChange={(f) => f.url && onChange([...value, { url: f.url, path: f.path, caption: "" }])}
            onBusyChange={onBusyChange}
          />
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-a-fg">Or add by URL</p>
            <div className="flex gap-2">
              <Input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://…"
                aria-label="Image URL"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
              />
              <Button type="button" onClick={addUrl}>
                <Link2 className="size-4" /> Add
              </Button>
            </div>
            {urlError && <p className="text-xs text-red-500">{urlError}</p>}
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
