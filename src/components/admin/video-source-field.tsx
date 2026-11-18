"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { env } from "@/config/env";
import { discardUploadAction } from "@/lib/actions/uploads";
import type { BucketId } from "@/lib/storage";
import { VIDEO_TYPES } from "@/lib/storage";
import { detectVideoSource, parseVimeoId, parseYouTubeId } from "@/lib/utils/video";
import type { VideoSource } from "@/types/database";
import { Field, Input } from "@/components/ui/admin-primitives";
import { cn } from "@/lib/utils/cn";
import { FileUpload } from "./file-upload";

export type VideoValue = { source: VideoSource; url: string | null; path: string | null };

const TABS: { id: "none" | "upload" | "link"; label: string }[] = [
  { id: "none", label: "No video" },
  { id: "upload", label: "Upload file" },
  { id: "link", label: "YouTube / Vimeo / URL" },
];

export function VideoSourceField({
  value,
  onChange,
  bucket,
  folder,
  savedPath,
  error,
  onBusyChange,
}: {
  value: VideoValue;
  onChange: (v: VideoValue) => void;
  bucket: BucketId;
  folder: string;
  savedPath?: string | null;
  error?: string;
  onBusyChange?: (b: boolean) => void;
}) {
  const initialTab = value.source === "none" ? "none" : value.source === "upload" ? "upload" : "link";
  const [tab, setTab] = useState<"none" | "upload" | "link">(initialTab);
  const [linkDraft, setLinkDraft] = useState(value.source !== "upload" && value.url ? value.url : "");

  // Leaving "upload": an unsaved upload is deleted now; a saved one is removed
  // server-side when the form is saved (path becomes null → replaced()).
  const dropUpload = () => {
    if (value.path && value.path !== savedPath) void discardUploadAction(bucket, value.path);
  };

  const select = (t: typeof tab) => {
    if (t === tab) return;
    setTab(t);
    if (t !== "upload") dropUpload();
    if (t === "none") onChange({ source: "none", url: null, path: null });
    if (t === "link") applyLink(linkDraft);
    if (t === "upload") onChange({ source: "upload", url: null, path: null });
  };

  const applyLink = (raw: string) => {
    const url = raw.trim();
    setLinkDraft(raw);
    if (!url) return onChange({ source: "external", url: null, path: null });
    onChange({ source: detectVideoSource(url), url, path: null });
  };

  const detected =
    tab === "link" && linkDraft
      ? parseYouTubeId(linkDraft)
        ? "YouTube video detected"
        : parseVimeoId(linkDraft)
          ? "Vimeo video detected"
          : /^https?:\/\/.+\.(mp4|webm|mov)(\?.*)?$/i.test(linkDraft)
            ? "Direct video file"
            : "Will be treated as a direct video file URL"
      : null;

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="Video source" className="relative inline-flex w-fit rounded-lg border border-a-line bg-a-raised p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => select(t.id)}
            className={cn("relative rounded-md px-3 py-1.5 text-xs font-medium transition-colors", tab === t.id ? "text-a-fg" : "text-a-mute hover:text-a-fg")}
          >
            {tab === t.id && <motion.span layoutId={`vs-${folder}`} className="absolute inset-0 rounded-md bg-a-panel shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "upload" && (
        <FileUpload
          label="Video file"
          bucket={bucket}
          folder={folder}
          accept={VIDEO_TYPES}
          maxMb={env.maxVideoUploadMb}
          kind="video"
          allowUrl={false}
          savedPath={savedPath}
          value={{ url: value.source === "upload" ? value.url : null, path: value.source === "upload" ? value.path : null }}
          onChange={(f) => onChange({ source: "upload", url: f.url, path: f.path })}
          error={error}
          onBusyChange={onBusyChange}
          hint="MP4 (H.264) plays everywhere. A 1080p export of a few minutes is ideal for the web."
        />
      )}

      {tab === "link" && (
        <Field label="Video URL" htmlFor={`${folder}-video-url`} error={error} hint={detected ?? "Paste a YouTube, Vimeo or direct .mp4 link."}>
          <Input id={`${folder}-video-url`} value={linkDraft} onChange={(e) => applyLink(e.target.value)} placeholder="https://vimeo.com/123456789" aria-invalid={Boolean(error)} />
        </Field>
      )}

      {tab === "none" && error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
