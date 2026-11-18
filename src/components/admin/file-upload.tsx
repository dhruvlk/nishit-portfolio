"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileVideo, ImageIcon, Link2, Trash2, UploadCloud, X } from "lucide-react";
import { discardUploadAction } from "@/lib/actions/uploads";
import type { BucketId } from "@/lib/storage";
import { RESUMABLE_RECOMMENDED_BYTES, uploadWithProgress, validateFile } from "@/lib/upload";
import { canOptimizeImage } from "@/lib/utils/media";
import { errorMessage, formatBytes } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Button, Input } from "@/components/ui/admin-primitives";

export type FileValue = { url: string | null; path: string | null };

type Props = {
  label: string;
  bucket: BucketId;
  folder: string;
  accept: readonly string[];
  maxMb: number;
  kind: "image" | "video";
  value: FileValue;
  onChange: (v: FileValue) => void;
  /** Path that is already saved in the DB (cleaned up server-side on save, not here). */
  savedPath?: string | null;
  allowUrl?: boolean;
  aspect?: string;
  error?: string;
  hint?: string;
  onBusyChange?: (busy: boolean) => void;
};

/**
 * Drag-and-drop uploader with validation, live progress, cancel, and cleanup of
 * files uploaded and then replaced before saving (so storage doesn't fill with orphans).
 */
export function FileUpload({
  label,
  bucket,
  folder,
  accept,
  maxMb,
  kind,
  value,
  onChange,
  savedPath,
  allowUrl = true,
  aspect = "aspect-video",
  error,
  hint,
  onBusyChange,
}: Props) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [lastFile, setLastFile] = useState<{ name: string; size: number } | null>(null);

  const discardIfUnsaved = (path: string | null) => {
    if (path && path !== savedPath) void discardUploadAction(bucket, path);
  };

  const start = async (file: File) => {
    setLocalError(null);
    const problem = validateFile(file, accept, maxMb);
    if (problem) {
      setLocalError(problem);
      return;
    }
    setLastFile({ name: file.name, size: file.size });
    const controller = new AbortController();
    abort.current = controller;
    setProgress(0);
    onBusyChange?.(true);
    try {
      const res = await uploadWithProgress({ bucket, folder, file, onProgress: setProgress, signal: controller.signal });
      discardIfUnsaved(value.path);
      onChange({ url: res.publicUrl, path: res.path });
    } catch (e) {
      setLocalError(errorMessage(e, "Upload failed."));
    } finally {
      setProgress(null);
      abort.current = null;
      onBusyChange?.(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = () => {
    discardIfUnsaved(value.path);
    onChange({ url: null, path: null });
  };

  const applyUrl = () => {
    const v = urlDraft.trim();
    if (!/^https?:\/\//i.test(v)) {
      setLocalError("Enter a full URL starting with https://");
      return;
    }
    discardIfUnsaved(value.path);
    onChange({ url: v, path: null });
    setUrlMode(false);
    setUrlDraft("");
    setLocalError(null);
  };

  const shownError = localError ?? error;
  const uploading = progress !== null;
  const Icon = kind === "image" ? ImageIcon : FileVideo;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-xs font-medium text-a-fg">{label}</label>
        {allowUrl && !uploading && (
          <button type="button" onClick={() => setUrlMode((v) => !v)} className="inline-flex items-center gap-1 text-xs text-a-mute hover:text-a-fg">
            <Link2 className="size-3" /> {urlMode ? "Upload instead" : "Use URL"}
          </button>
        )}
      </div>

      {urlMode ? (
        <div className="flex gap-2">
          <Input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} placeholder="https://…" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyUrl())} />
          <Button type="button" onClick={applyUrl}>Apply</Button>
        </div>
      ) : value.url && !uploading ? (
        <div className={cn("group relative overflow-hidden rounded-lg border border-a-line bg-a-raised", aspect)}>
          {kind === "image" ? (
            <Image src={value.url} alt="" fill sizes="400px" className="object-cover" unoptimized={!canOptimizeImage(value.url)} />
          ) : (
            <video src={value.url} className="size-full object-cover" preload="metadata" muted controls />
          )}
          <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <Button type="button" size="sm" onClick={() => input.current?.click()}>Replace</Button>
            <Button type="button" size="sm" variant="danger" onClick={remove} aria-label="Remove file">
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f && !uploading) void start(f);
          }}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
            drag ? "border-a-accent bg-a-accent/5" : "border-a-line bg-a-raised/40",
            aspect,
          )}
        >
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex w-full max-w-xs flex-col items-center gap-3">
                <p className="truncate text-xs text-a-mute">{lastFile?.name}</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-a-line" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                  <motion.div className="h-full rounded-full bg-a-accent" animate={{ width: `${progress}%` }} transition={{ ease: "linear", duration: 0.2 }} />
                </div>
                <div className="flex items-center gap-3 text-xs text-a-mute">
                  <span className="tabular-nums">{progress}%</span>
                  {lastFile && <span>{formatBytes(lastFile.size)}</span>}
                  <button type="button" onClick={() => abort.current?.abort()} className="inline-flex items-center gap-1 text-red-500">
                    <X className="size-3" /> Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
                <span className="flex size-10 items-center justify-center rounded-full bg-a-panel text-a-mute">
                  {drag ? <UploadCloud className="size-5" /> : <Icon className="size-5" />}
                </span>
                <p className="text-sm text-a-fg">
                  <button type="button" onClick={() => input.current?.click()} className="font-medium text-a-accent underline-offset-2 hover:underline">
                    Choose a file
                  </button>{" "}
                  or drag it here
                </p>
                <p className="text-xs text-a-mute">
                  {accept.map((a) => a.split("/")[1]?.replace("quicktime", "mov").replace("svg+xml", "svg")).join(", ")} · up to {maxMb} MB
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <input
        id={inputId}
        ref={input}
        type="file"
        accept={accept.join(",")}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void start(f);
        }}
      />

      {shownError ? (
        <p role="alert" className="text-xs text-red-500">{shownError}</p>
      ) : lastFile && lastFile.size > RESUMABLE_RECOMMENDED_BYTES && kind === "video" && !uploading ? (
        <p className="text-xs text-a-mute">Large file — on slow connections consider YouTube/Vimeo for masters over a few hundred MB.</p>
      ) : hint ? (
        <p className="text-xs text-a-mute">{hint}</p>
      ) : null}
    </div>
  );
}
