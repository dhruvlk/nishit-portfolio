"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { env } from "@/config/env";
import { saveShowreelAction } from "@/lib/actions/content";
import { BUCKETS, IMAGE_TYPES } from "@/lib/storage";
import { showreelSchema, type ShowreelInput } from "@/lib/validations/schemas";
import type { Showreel } from "@/types/content";
import { Card, Field, Input, PageHeader, Switch, Textarea } from "@/components/ui/admin-primitives";
import { VideoPlayer } from "@/components/common/video-player";
import { FileUpload } from "./file-upload";
import { SaveBar } from "./save-bar";
import { VideoSourceField } from "./video-source-field";
import { useSave } from "./use-save";

function toInput(s: Showreel): ShowreelInput {
  return {
    title: s.title,
    subtitle: s.subtitle,
    video_source: s.video_source,
    video_url: s.video_url ?? "",
    video_path: s.video_path,
    thumbnail_url: s.thumbnail_url ?? "",
    thumbnail_path: s.thumbnail_path,
    is_enabled: s.is_enabled,
  };
}

export function ShowreelForm({ showreel }: { showreel: Showreel }) {
  const form = useForm<ShowreelInput>({ resolver: zodResolver(showreelSchema), defaultValues: toInput(showreel) });
  const v = useWatch({ control: form.control });
  const { register, setValue, formState } = form;
  const { errors, isDirty, isSubmitting } = formState;
  const [busy, setBusy] = useState(0);
  const onBusy = (b: boolean) => setBusy((n) => Math.max(0, n + (b ? 1 : -1)));
  const onSubmit = useSave(form, saveShowreelAction);

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader title="Showreel" description="The full-width showreel section on the home page." />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card title="Video">
            <VideoSourceField
              bucket={BUCKETS.showreel}
              folder="reel"
              savedPath={showreel.video_path}
              value={{ source: v.video_source ?? "none", url: v.video_url || null, path: v.video_path ?? null }}
              onChange={(v) => {
                setValue("video_source", v.source, { shouldDirty: true });
                setValue("video_url", v.url ?? "", { shouldDirty: true });
                setValue("video_path", v.path, { shouldDirty: true });
              }}
              error={errors.video_url?.message}
              onBusyChange={onBusy}
            />
          </Card>
          <Card title="Live preview">
            <VideoPlayer
              key={`${v.video_source}:${v.video_url}`}
              source={v.video_source ?? "none"}
              url={v.video_url || null}
              poster={v.thumbnail_url || null}
              title={v.title || "Showreel"}
              className="aspect-video w-full rounded-lg"
            />
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card title="Section">
            <div className="flex flex-col gap-5">
              <Switch
                id="is_enabled"
                checked={v.is_enabled ?? false}
                onChange={(v) => setValue("is_enabled", v, { shouldDirty: true, shouldValidate: true })}
                label="Show on website"
                description="Hide the section without deleting the video."
              />
              {errors.is_enabled && <p className="text-xs text-red-500">{errors.is_enabled.message}</p>}
              <Field label="Title" htmlFor="title" error={errors.title?.message}>
                <Input id="title" {...register("title")} />
              </Field>
              <Field label="Subtitle" htmlFor="subtitle" error={errors.subtitle?.message}>
                <Textarea id="subtitle" rows={3} {...register("subtitle")} />
              </Field>
            </div>
          </Card>
          <Card title="Thumbnail">
            <FileUpload
              label="Poster image"
              bucket={BUCKETS.showreel}
              folder="poster"
              accept={IMAGE_TYPES}
              maxMb={env.maxImageUploadMb}
              kind="image"
              savedPath={showreel.thumbnail_path}
              value={{ url: v.thumbnail_url || null, path: v.thumbnail_path ?? null }}
              onChange={(f) => {
                setValue("thumbnail_url", f.url ?? "", { shouldDirty: true });
                setValue("thumbnail_path", f.path, { shouldDirty: true });
              }}
              error={errors.thumbnail_url?.message}
              onBusyChange={onBusy}
            />
          </Card>
        </div>
      </div>
      <SaveBar dirty={isDirty} saving={isSubmitting} disabled={busy > 0} onReset={() => form.reset(toInput(showreel))} />
    </form>
  );
}
