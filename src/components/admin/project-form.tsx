"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, Plus, Trash2 } from "lucide-react";
import { env } from "@/config/env";
import { createProjectAction, updateProjectAction } from "@/lib/actions/projects";
import { BUCKETS, IMAGE_TYPES } from "@/lib/storage";
import { projectSchema, type ProjectInput } from "@/lib/validations/schemas";
import { slugify } from "@/lib/utils/format";
import type { Category, Project } from "@/types/content";
import { Badge, Button, Card, Field, Input, PageHeader, Select, Switch, Textarea } from "@/components/ui/admin-primitives";
import { useToast } from "@/components/ui/toast";
import { FileUpload } from "./file-upload";
import { MediaListField } from "./media-list-field";
import { VideoSourceField } from "./video-source-field";

function toInput(p: Project | null): ProjectInput {
  return {
    title: p?.title ?? "",
    slug: p?.slug ?? "",
    summary: p?.summary ?? "",
    description: p?.description ?? "",
    category_id: p?.category_id ?? null,
    thumbnail_url: p?.thumbnail_url ?? "",
    thumbnail_path: p?.thumbnail_path ?? null,
    video_source: p?.video_source ?? "none",
    video_url: p?.video_url ?? "",
    video_path: p?.video_path ?? null,
    client_name: p?.client_name ?? "",
    production_year: p?.production_year ?? null,
    credits: p?.credits ?? [],
    preview_url: p?.preview_url ?? "",
    gallery: p?.gallery ?? [],
    services: p?.services ?? [],
    is_demo: p?.is_demo ?? false,
    is_featured: p?.is_featured ?? false,
    is_published: p?.is_published ?? false,
  };
}

export function ProjectForm({ project, categories }: { project: Project | null; categories: Category[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busyUploads, setBusyUploads] = useState(0);
  const [slugTouched, setSlugTouched] = useState(Boolean(project));
  const [servicesText, setServicesText] = useState((project?.services ?? []).join(", "));
  const isEdit = Boolean(project);

  const form = useForm<ProjectInput>({ resolver: zodResolver(projectSchema), defaultValues: toInput(project) });
  const v = useWatch({ control: form.control });
  const { register, handleSubmit, setValue, control, setError, formState } = form;
  const { errors, isSubmitting, isDirty } = formState;
  const credits = useFieldArray({ control, name: "credits" });
  const published = v.is_published;

  const onBusy = (b: boolean) => setBusyUploads((n) => Math.max(0, n + (b ? 1 : -1)));

  const submit = (publish: boolean | null) =>
    handleSubmit(async (values) => {
      const payload = { ...values, is_published: publish ?? values.is_published };
      const res = project ? await updateProjectAction(project.id, payload) : await createProjectAction(payload);
      if (!res.ok) {
        for (const [k, msgs] of Object.entries(res.fieldErrors ?? {})) {
          if (msgs?.[0]) setError(k as keyof ProjectInput, { message: msgs[0] });
        }
        toast.error("Not saved", res.error);
        return;
      }
      toast.success(res.message ?? "Saved", payload.is_published ? "Live on the website." : "Saved as draft.");
      setValue("is_published", payload.is_published, { shouldDirty: false });
      form.reset({ ...values, is_published: payload.is_published });
      if (!project && res.data && "id" in res.data) router.replace(`/admin/projects/${res.data.id}`);
      else router.refresh();
    }, () => toast.error("Check the form", "Some fields need attention."));

  const uploading = busyUploads > 0;

  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate>
      <Link href="/admin/projects" className="mb-4 inline-flex items-center gap-1 text-xs text-a-mute hover:text-a-fg">
        <ArrowLeft className="size-3" /> Projects
      </Link>
      <PageHeader
        title={isEdit ? project!.title : "New project"}
        description={isEdit ? `/work/${project!.slug}` : "Add a film to your portfolio."}
        actions={
          <>
            {isEdit && (
              <Badge tone={project!.is_published ? "success" : "warning"}>{project!.is_published ? "Published" : "Draft"}</Badge>
            )}
            {isEdit && (
              <Link
                href={`/admin/projects/${project!.id}/preview`}
                target="_blank"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-a-line bg-a-panel px-4 text-sm text-a-fg hover:bg-a-raised"
              >
                <Eye className="size-4" /> Preview
              </Link>
            )}
            <Button type="button" onClick={submit(false)} loading={isSubmitting} disabled={uploading}>
              {published ? "Unpublish & save" : "Save draft"}
            </Button>
            <Button type="button" variant="primary" onClick={submit(true)} loading={isSubmitting} disabled={uploading}>
              {published && isEdit ? "Save & keep live" : "Publish"}
            </Button>
          </>
        }
      />
      {uploading && <p className="-mt-4 mb-6 text-xs text-a-accent">Upload in progress — saving is paused until it finishes.</p>}
      {isEdit && isDirty && !uploading && <p className="-mt-4 mb-6 text-xs text-a-mute">You have unsaved changes.</p>}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card title="Details">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Title" htmlFor="title" error={errors.title?.message} className="sm:col-span-2">
                <Input
                  id="title"
                  aria-invalid={Boolean(errors.title)}
                  {...register("title", {
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      if (!slugTouched) setValue("slug", slugify(e.target.value), { shouldValidate: true });
                    },
                  })}
                />
              </Field>
              <Field label="Slug" htmlFor="slug" error={errors.slug?.message} hint="Used in the URL: /work/your-slug" className="sm:col-span-2">
                <Input
                  id="slug"
                  aria-invalid={Boolean(errors.slug)}
                  {...register("slug", {
                    onChange: () => setSlugTouched(true),
                    setValueAs: (v: string) => slugify(v),
                  })}
                />
              </Field>
              <Field label="Category" htmlFor="category_id" error={errors.category_id?.message}>
                <Select id="category_id" {...register("category_id", { setValueAs: (v: string) => (v ? v : null) })}>
                  <option value="">Uncategorised</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Production year" htmlFor="production_year" error={errors.production_year?.message}>
                <Input
                  id="production_year"
                  type="number"
                  inputMode="numeric"
                  placeholder="2026"
                  {...register("production_year", { setValueAs: (v: string | number | null) => (v === "" || v === null ? null : Number(v)) })}
                />
              </Field>
              <Field label="Client" htmlFor="client_name" error={errors.client_name?.message} className="sm:col-span-2">
                <Input id="client_name" {...register("client_name")} />
              </Field>
              <Field label="Short description" htmlFor="summary" error={errors.summary?.message} hint="Shown on project cards (max 300 characters)." className="sm:col-span-2">
                <Textarea id="summary" rows={2} {...register("summary")} />
              </Field>
              <Field label="Full description" htmlFor="description" error={errors.description?.message} hint="Separate paragraphs with a blank line." className="sm:col-span-2">
                <Textarea id="description" rows={8} {...register("description")} />
              </Field>
            </div>
          </Card>

          <Card title="Video" description="Upload a file, or link YouTube / Vimeo / a hosted MP4.">
            <VideoSourceField
              bucket={BUCKETS.videos}
              folder="projects"
              savedPath={project?.video_path}
              value={{ source: v.video_source ?? "none", url: v.video_url || null, path: v.video_path ?? null }}
              onChange={(v) => {
                setValue("video_source", v.source, { shouldDirty: true });
                setValue("video_url", v.url ?? "", { shouldDirty: true, shouldValidate: formState.isSubmitted });
                setValue("video_path", v.path, { shouldDirty: true });
              }}
              error={errors.video_url?.message}
              onBusyChange={onBusy}
            />
          </Card>

          <Card title="Gallery" description="Stills shown on the project page (up to 24).">
            <MediaListField
              label="Project stills"
              bucket={BUCKETS.thumbnails}
              folder="gallery"
              max={24}
              value={v.gallery?.map((m) => ({ url: m?.url ?? "", path: m?.path ?? null, caption: m?.caption ?? "" })) ?? []}
              savedPaths={(project?.gallery ?? []).flatMap((m) => (m.path ? [m.path] : []))}
              onChange={(g) => setValue("gallery", g, { shouldDirty: true })}
              error={errors.gallery?.message}
              onBusyChange={onBusy}
            />
          </Card>

          <Card
            title="Credits"
            actions={
              <Button type="button" size="sm" onClick={() => credits.append({ role: "", name: "" })}>
                <Plus className="size-3.5" /> Add credit
              </Button>
            }
          >
            {credits.fields.length === 0 ? (
              <p className="text-sm text-a-mute">No credits yet — add director, DOP, editor, colourist…</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {credits.fields.map((f, i) => (
                  <li key={f.id} className="grid grid-cols-[1fr_1fr_auto] items-start gap-2">
                    <div>
                      <Input placeholder="Role" aria-label={`Credit ${i + 1} role`} {...register(`credits.${i}.role`)} aria-invalid={Boolean(errors.credits?.[i]?.role)} />
                      {errors.credits?.[i]?.role && <p className="mt-1 text-xs text-red-500">{errors.credits[i]?.role?.message}</p>}
                    </div>
                    <div>
                      <Input placeholder="Name" aria-label={`Credit ${i + 1} name`} {...register(`credits.${i}.name`)} aria-invalid={Boolean(errors.credits?.[i]?.name)} />
                      {errors.credits?.[i]?.name && <p className="mt-1 text-xs text-red-500">{errors.credits[i]?.name?.message}</p>}
                    </div>
                    <Button type="button" variant="ghost" onClick={() => credits.remove(i)} aria-label={`Remove credit ${i + 1}`}>
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Details for the project page">
            <div className="flex flex-col gap-5">
              <Field label="Services / deliverables" htmlFor="services" hint="Comma separated, e.g. Editing, Color grading, Sound design">
                <Input
                  id="services"
                  value={servicesText}
                  onChange={(e) => {
                    setServicesText(e.target.value);
                    setValue(
                      "services",
                      e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      { shouldDirty: true },
                    );
                  }}
                />
              </Field>
              <Field label="Hover preview clip (optional)" htmlFor="preview_url" error={errors.preview_url?.message} hint="Short, light MP4 played on card hover. Defaults to the main video when it is a file.">
                <Input id="preview_url" placeholder="https://…/preview.mp4" {...register("preview_url")} />
              </Field>
            </div>
          </Card>

          <Card title="Thumbnail" description="Poster frame used across the site. 16:10 or 4:5 works best.">
            <FileUpload
              label="Thumbnail image"
              bucket={BUCKETS.thumbnails}
              folder="projects"
              accept={IMAGE_TYPES}
              maxMb={env.maxImageUploadMb}
              kind="image"
              savedPath={project?.thumbnail_path}
              value={{ url: v.thumbnail_url || null, path: v.thumbnail_path ?? null }}
              onChange={(f) => {
                setValue("thumbnail_url", f.url ?? "", { shouldDirty: true, shouldValidate: formState.isSubmitted });
                setValue("thumbnail_path", f.path, { shouldDirty: true });
              }}
              error={errors.thumbnail_url?.message}
              onBusyChange={onBusy}
            />
          </Card>

          <Card title="Visibility">
            <div className="flex flex-col gap-5">
              <Switch
                id="is_demo"
                checked={v.is_demo ?? false}
                onChange={(val) => setValue("is_demo", val, { shouldDirty: true })}
                label="Demo / sample project"
                description="Shows a “Demo project” label on the website. Turn off for real client work."
              />
              <Switch
                id="is_featured"
                checked={v.is_featured ?? false}
                onChange={(v) => setValue("is_featured", v, { shouldDirty: true })}
                label="Featured"
                description="Shown in “Selected Works” on the home page."
              />
              <p className="border-t border-a-line pt-4 text-xs text-a-mute">
                Use <strong className="text-a-fg">Save draft</strong> to keep it private or <strong className="text-a-fg">Publish</strong> to make it live. Drafts can be previewed.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
