"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SOCIAL_PLATFORMS } from "@/config/site";
import { saveSocialLinksAction } from "@/lib/actions/content";
import { socialLinksSchema } from "@/lib/validations/schemas";
import type { SocialLink } from "@/types/content";
import { Card, Field, Input, PageHeader, Switch } from "@/components/ui/admin-primitives";
import { SaveBar } from "./save-bar";
import { useSave } from "./use-save";

const formSchema = z.object({ links: socialLinksSchema });
type FormValues = z.input<typeof formSchema>;

const LABEL = Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.id, p.label]));

export function SocialsForm({ links }: { links: SocialLink[] }) {
  const defaults: FormValues = { links: links.map((l) => ({ id: l.id, url: l.url, is_visible: l.is_visible })) };
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: defaults });
  const v = useWatch({ control: form.control });
  const { register, setValue, formState } = form;
  const { errors, isDirty, isSubmitting } = formState;
  const onSubmit = useSave(form, (v) => saveSocialLinksAction(v.links));

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader title="Social links" description="Shown in the menu, contact section and footer. Empty links are hidden." />
      <Card>
        {links.length === 0 ? (
          <p className="text-sm text-a-mute">No social platforms found. Run the seed migration (004_seed.sql).</p>
        ) : (
          <ul className="flex flex-col divide-y divide-a-line">
            {links.map((l, i) => (
              <li key={l.id} className="grid gap-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-end">
                <Field label={LABEL[l.platform] ?? l.platform} htmlFor={`url-${l.id}`} error={errors.links?.[i]?.url?.message}>
                  <Input id={`url-${l.id}`} placeholder={`https://${l.platform}.com/…`} {...register(`links.${i}.url`)} aria-invalid={Boolean(errors.links?.[i]?.url)} />
                </Field>
                <div className="sm:w-40 sm:pb-2">
                  <Switch
                    checked={Boolean(v.links?.[i]?.is_visible)}
                    onChange={(v) => setValue(`links.${i}.is_visible`, v, { shouldDirty: true })}
                    label="Visible"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <SaveBar dirty={isDirty} saving={isSubmitting} onReset={() => form.reset(defaults)} />
    </form>
  );
}
