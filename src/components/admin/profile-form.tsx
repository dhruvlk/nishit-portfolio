"use client";

import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { env } from "@/config/env";
import { saveProfileAction } from "@/lib/actions/content";
import { BUCKETS, IMAGE_TYPES } from "@/lib/storage";
import { profileSchema, type ProfileInput } from "@/lib/validations/schemas";
import type { Profile } from "@/types/content";
import { Button, Card, Field, Input, PageHeader, Textarea } from "@/components/ui/admin-primitives";
import { FileUpload } from "./file-upload";
import { MediaListField } from "./media-list-field";
import { SaveBar } from "./save-bar";
import { useSave } from "./use-save";

function toInput(p: Profile): ProfileInput {
  return {
    full_name: p.full_name,
    professional_title: p.professional_title,
    short_bio: p.short_bio,
    biography: p.biography,
    portrait_url: p.portrait_url ?? "",
    portrait_path: p.portrait_path,
    years_experience: p.years_experience,
    projects_completed: p.projects_completed,
    happy_clients: p.happy_clients,
    productions_managed: p.productions_managed,
    clients: p.clients,
    expertise: p.expertise,
    tagline: p.tagline,
    intro: p.intro,
    philosophy: p.philosophy,
    approach: p.approach,
    workflow: p.workflow,
    highlights: p.highlights,
    about_images: p.about_images,
    email: p.email ?? "",
    phone: p.phone ?? "",
    location: p.location ?? "",
  };
}

const num = { setValueAs: (v: string | number) => (v === "" ? 0 : Number(v)) };

export function ProfileForm({ profile }: { profile: Profile }) {
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: toInput(profile) });
  const v = useWatch({ control: form.control });
  const { register, setValue, control, formState } = form;
  const { errors, isDirty, isSubmitting } = formState;
  const expertise = useFieldArray({ control, name: "expertise" });
  const workflow = useFieldArray({ control, name: "workflow" });
  const highlights = useFieldArray({ control, name: "highlights" });
  const [uploading, setUploading] = useState(false);
  const [clientsText, setClientsText] = useState(profile.clients.join("\n"));
  const onSubmit = useSave(form, saveProfileAction);

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader title="Profile" description="Your public identity: name, biography, numbers and expertise." />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card title="Identity">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message}>
                <Input id="full_name" {...register("full_name")} />
              </Field>
              <Field label="Professional title" htmlFor="professional_title" error={errors.professional_title?.message}>
                <Input id="professional_title" {...register("professional_title")} />
              </Field>
              <Field label="Short bio" htmlFor="short_bio" hint="Used on the home page About section." error={errors.short_bio?.message} className="sm:col-span-2">
                <Textarea id="short_bio" rows={3} {...register("short_bio")} />
              </Field>
              <Field label="Full biography" htmlFor="biography" hint="Used on the About page. Separate paragraphs with a blank line." error={errors.biography?.message} className="sm:col-span-2">
                <Textarea id="biography" rows={9} {...register("biography")} />
              </Field>
            </div>
          </Card>

          <Card title="About page" description="Hero intro, philosophy and production approach on /about.">
            <div className="grid gap-5">
              <Field label="Tagline" htmlFor="tagline" error={errors.tagline?.message}>
                <Input id="tagline" {...register("tagline")} />
              </Field>
              <Field label="Intro" htmlFor="intro" hint="Short opening paragraph on the About page." error={errors.intro?.message}>
                <Textarea id="intro" rows={3} {...register("intro")} />
              </Field>
              <Field label="Creative philosophy" htmlFor="philosophy" hint="Shown as a large editorial quote." error={errors.philosophy?.message}>
                <Textarea id="philosophy" rows={3} {...register("philosophy")} />
              </Field>
              <Field label="Production approach" htmlFor="approach" hint="Separate paragraphs with a blank line." error={errors.approach?.message}>
                <Textarea id="approach" rows={5} {...register("approach")} />
              </Field>
            </div>
          </Card>

          <Card
            title="Editing workflow"
            description="Numbered steps on the About page."
            actions={
              <Button type="button" size="sm" onClick={() => workflow.append({ title: "", description: "" })}>
                <Plus className="size-3.5" /> Add step
              </Button>
            }
          >
            <ul className="flex flex-col gap-3">
              {workflow.fields.map((f, i) => (
                <li key={f.id} className="grid gap-2 rounded-lg border border-a-line p-3 sm:grid-cols-[1fr_2fr_auto]">
                  <Input placeholder="Step" aria-label={`Step ${i + 1} title`} {...register(`workflow.${i}.title`)} aria-invalid={Boolean(errors.workflow?.[i]?.title)} />
                  <Input placeholder="What happens in this step" aria-label={`Step ${i + 1} description`} {...register(`workflow.${i}.description`)} />
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="sm" disabled={i === 0} onClick={() => workflow.move(i, i - 1)} aria-label="Move up"><ArrowUp className="size-3.5" /></Button>
                    <Button type="button" variant="ghost" size="sm" disabled={i === workflow.fields.length - 1} onClick={() => workflow.move(i, i + 1)} aria-label="Move down"><ArrowDown className="size-3.5" /></Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => workflow.remove(i)} aria-label="Remove"><Trash2 className="size-3.5" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title="Highlights"
            description="Text highlights (e.g. Focus · Cinematic Storytelling). When present they replace the number counters."
            actions={
              <Button type="button" size="sm" onClick={() => highlights.append({ label: "", value: "" })} disabled={highlights.fields.length >= 8}>
                <Plus className="size-3.5" /> Add
              </Button>
            }
          >
            <ul className="flex flex-col gap-3">
              {highlights.fields.map((f, i) => (
                <li key={f.id} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                  <Input placeholder="Label" aria-label={`Highlight ${i + 1} label`} {...register(`highlights.${i}.label`)} aria-invalid={Boolean(errors.highlights?.[i]?.label)} />
                  <Input placeholder="Value" aria-label={`Highlight ${i + 1} value`} {...register(`highlights.${i}.value`)} aria-invalid={Boolean(errors.highlights?.[i]?.value)} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => highlights.remove(i)} aria-label="Remove"><Trash2 className="size-3.5" /></Button>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="About photography" description="Editorial images on the About page.">
            <MediaListField
              label="Images"
              bucket={BUCKETS.profile}
              folder="about"
              value={v.about_images?.map((m) => ({ url: m?.url ?? "", path: m?.path ?? null, caption: m?.caption ?? "" })) ?? []}
              savedPaths={profile.about_images.flatMap((m) => (m.path ? [m.path] : []))}
              onChange={(imgs) => setValue("about_images", imgs, { shouldDirty: true })}
              onBusyChange={setUploading}
            />
          </Card>

          <Card title="Numbers" description="Shown as animated counters. Leave at 0 to hide.">
            <div className="grid gap-5 sm:grid-cols-4">
              <Field label="Years of experience" htmlFor="years_experience" error={errors.years_experience?.message}>
                <Input id="years_experience" type="number" min={0} {...register("years_experience", num)} />
              </Field>
              <Field label="Projects completed" htmlFor="projects_completed" error={errors.projects_completed?.message}>
                <Input id="projects_completed" type="number" min={0} {...register("projects_completed", num)} />
              </Field>
              <Field label="Happy clients" htmlFor="happy_clients" error={errors.happy_clients?.message}>
                <Input id="happy_clients" type="number" min={0} {...register("happy_clients", num)} />
              </Field>
              <Field label="Productions managed" htmlFor="productions_managed" error={errors.productions_managed?.message}>
                <Input id="productions_managed" type="number" min={0} {...register("productions_managed", num)} />
              </Field>
            </div>
          </Card>

          <Card
            title="Expertise"
            description="The interactive list on the home page."
            actions={
              <Button type="button" size="sm" onClick={() => expertise.append({ title: "", description: "" })}>
                <Plus className="size-3.5" /> Add
              </Button>
            }
          >
            <ul className="flex flex-col gap-3">
              {expertise.fields.map((f, i) => (
                <li key={f.id} className="grid gap-2 rounded-lg border border-a-line p-3 sm:grid-cols-[1fr_2fr_auto]">
                  <Input placeholder="Title" aria-label={`Expertise ${i + 1} title`} {...register(`expertise.${i}.title`)} aria-invalid={Boolean(errors.expertise?.[i]?.title)} />
                  <Input placeholder="One-line description" aria-label={`Expertise ${i + 1} description`} {...register(`expertise.${i}.description`)} />
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="sm" disabled={i === 0} onClick={() => expertise.move(i, i - 1)} aria-label="Move up"><ArrowUp className="size-3.5" /></Button>
                    <Button type="button" variant="ghost" size="sm" disabled={i === expertise.fields.length - 1} onClick={() => expertise.move(i, i + 1)} aria-label="Move down"><ArrowDown className="size-3.5" /></Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => expertise.remove(i)} aria-label="Remove"><Trash2 className="size-3.5" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Brands & clients" description="One per line. Leave empty to hide.">
            <Textarea
              rows={6}
              aria-label="Brands and clients"
              value={clientsText}
              onChange={(e) => {
                setClientsText(e.target.value);
                setValue(
                  "clients",
                  e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                  { shouldDirty: true },
                );
              }}
            />
            {errors.clients && <p className="mt-1 text-xs text-red-500">Each client name must be 80 characters or fewer.</p>}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Portrait">
            <FileUpload
              label="Profile image"
              bucket={BUCKETS.profile}
              folder="portrait"
              accept={IMAGE_TYPES}
              maxMb={env.maxImageUploadMb}
              kind="image"
              aspect="aspect-[4/5]"
              savedPath={profile.portrait_path}
              value={{ url: v.portrait_url || null, path: v.portrait_path ?? null }}
              onChange={(f) => {
                setValue("portrait_url", f.url ?? "", { shouldDirty: true });
                setValue("portrait_path", f.path, { shouldDirty: true });
              }}
              error={errors.portrait_url?.message}
              onBusyChange={setUploading}
            />
          </Card>
          <Card title="Contact details">
            <div className="flex flex-col gap-5">
              <Field label="Email" htmlFor="email" error={errors.email?.message}>
                <Input id="email" type="email" {...register("email")} />
              </Field>
              <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
                <Input id="phone" type="tel" {...register("phone")} />
              </Field>
              <Field label="Location" htmlFor="location" error={errors.location?.message}>
                <Input id="location" placeholder="City, Country" {...register("location")} />
              </Field>
            </div>
          </Card>
        </div>
      </div>
      <SaveBar
        dirty={isDirty}
        saving={isSubmitting}
        disabled={uploading}
        onReset={() => {
          form.reset(toInput(profile));
          setClientsText(profile.clients.join("\n"));
        }}
      />
    </form>
  );
}
