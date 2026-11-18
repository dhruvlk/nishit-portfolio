"use client";

import { useState } from "react";
import { useForm, useWatch, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { env } from "@/config/env";
import { saveSettingsAction } from "@/lib/actions/content";
import { BUCKETS, ICON_TYPES, IMAGE_TYPES, VIDEO_TYPES } from "@/lib/storage";
import { settingsSchema, type SettingsInput } from "@/lib/validations/schemas";
import type { SiteSettings } from "@/types/content";
import { Card, Field, Input, PageHeader, Switch, Textarea } from "@/components/ui/admin-primitives";
import { FileUpload } from "./file-upload";
import { SaveBar } from "./save-bar";
import { useSave } from "./use-save";

function toInput(s: SiteSettings): SettingsInput {
  return {
    site_name: s.site_name,
    logo_url: s.logo_url ?? "",
    logo_path: s.logo_path,
    favicon_url: s.favicon_url ?? "",
    favicon_path: s.favicon_path,
    hero_label: s.hero_label,
    hero_heading: s.hero_heading,
    hero_description: s.hero_description,
    hero_video_url: s.hero_video_url ?? "",
    hero_video_path: s.hero_video_path,
    hero_poster_url: s.hero_poster_url ?? "",
    hero_poster_path: s.hero_poster_path,
    seo_title: s.seo_title,
    seo_description: s.seo_description,
    og_image_url: s.og_image_url ?? "",
    og_image_path: s.og_image_path,
    footer_text: s.footer_text,
    demo_mode: s.demo_mode,
  };
}

type AssetKey = "logo" | "favicon" | "hero_video" | "hero_poster" | "og_image";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const form = useForm<SettingsInput>({ resolver: zodResolver(settingsSchema), defaultValues: toInput(settings) });
  const v = useWatch({ control: form.control });
  const { register, setValue, formState } = form;
  const { errors, isDirty, isSubmitting } = formState;
  const [busy, setBusy] = useState(0);
  const onBusy = (b: boolean) => setBusy((n) => Math.max(0, n + (b ? 1 : -1)));
  const onSubmit = useSave(form, saveSettingsAction);

  const asset = (key: AssetKey, label: string, kind: "image" | "video", accept: readonly string[], aspect: string, hint?: string) => {
    const urlKey = `${key}_url` as Path<SettingsInput>;
    const pathKey = `${key}_path` as Path<SettingsInput>;
    return (
      <FileUpload
        label={label}
        bucket={BUCKETS.assets}
        folder={key}
        accept={accept}
        maxMb={kind === "video" ? env.maxVideoUploadMb : env.maxImageUploadMb}
        kind={kind}
        aspect={aspect}
        hint={hint}
        savedPath={settings[`${key}_path`]}
        value={{ url: (v[`${key}_url`] as string | null | undefined) || null, path: (v[`${key}_path`] as string | null | undefined) ?? null }}
        onChange={(f) => {
          setValue(urlKey, f.url ?? "", { shouldDirty: true });
          setValue(pathKey, f.path, { shouldDirty: true });
        }}
        error={errors[`${key}_url`]?.message}
        onBusyChange={onBusy}
      />
    );
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader title="Website settings" description="Brand, hero, SEO and footer content." />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card title="Hero">
            <div className="grid gap-5">
              <Field label="Label" htmlFor="hero_label" error={errors.hero_label?.message}>
                <Input id="hero_label" {...register("hero_label")} />
              </Field>
              <Field label="Heading" htmlFor="hero_heading" hint="Each line break becomes a separate animated line." error={errors.hero_heading?.message}>
                <Textarea id="hero_heading" rows={2} {...register("hero_heading")} />
              </Field>
              <Field label="Description" htmlFor="hero_description" error={errors.hero_description?.message}>
                <Textarea id="hero_description" rows={3} {...register("hero_description")} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                {asset("hero_video", "Background video", "video", VIDEO_TYPES, "aspect-video", "Muted loop. Keep it short (10–30s) and under ~15 MB for fast loading.")}
                {asset("hero_poster", "Poster image", "image", IMAGE_TYPES, "aspect-video", "Shown instantly and on mobile/data-saver.")}
              </div>
            </div>
          </Card>
          <Card title="SEO">
            <div className="grid gap-5">
              <Field label="SEO title" htmlFor="seo_title" error={errors.seo_title?.message}>
                <Input id="seo_title" {...register("seo_title")} />
              </Field>
              <Field label="SEO description" htmlFor="seo_description" hint="~150 characters is ideal." error={errors.seo_description?.message}>
                <Textarea id="seo_description" rows={3} {...register("seo_description")} />
              </Field>
              {asset("og_image", "Social share image (1200×630)", "image", IMAGE_TYPES, "aspect-[1200/630]")}
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card title="Brand">
            <div className="flex flex-col gap-5">
              <Field label="Site name" htmlFor="site_name" error={errors.site_name?.message}>
                <Input id="site_name" {...register("site_name")} />
              </Field>
              {asset("logo", "Logo", "image", ICON_TYPES, "aspect-[3/1]", "SVG or transparent PNG. Text is used if empty.")}
              {asset("favicon", "Favicon", "image", ICON_TYPES, "aspect-square", "Square PNG, SVG or ICO.")}
            </div>
          </Card>
          <Card title="Demo mode">
            <Switch
              id="demo_mode"
              checked={v.demo_mode ?? false}
              onChange={(val) => setValue("demo_mode", val, { shouldDirty: true })}
              label="Show demo labels"
              description="Adds demo notices and footage credits across the site. Turn off once real content is in."
            />
          </Card>
          <Card title="Footer">
            <Field label="Footer text" htmlFor="footer_text" error={errors.footer_text?.message}>
              <Textarea id="footer_text" rows={3} {...register("footer_text")} />
            </Field>
          </Card>
        </div>
      </div>
      <SaveBar dirty={isDirty} saving={isSubmitting} disabled={busy > 0} onReset={() => form.reset(toInput(settings))} />
    </form>
  );
}
