"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { BUDGET_RANGES, PROJECT_TYPES } from "@/config/site";
import { submitContactAction } from "@/lib/actions/contact";
import { contactSchema, type ContactInput } from "@/lib/validations/schemas";
import { cn } from "@/lib/utils/cn";

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-2 text-sm text-red-400"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function ChipGroup({
  name,
  legend,
  options,
  value,
  onChange,
  error,
}: {
  name: string;
  legend: string;
  options: readonly string[];
  value: string | undefined;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="mb-4 text-sm text-mute">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <label
              key={opt}
              className={cn(
                "relative cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-gold",
                selected ? "border-paper bg-paper text-ink" : "border-line text-paper/70 hover:border-paper/40 hover:text-paper",
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt}
                checked={selected}
                onChange={() => onChange(opt)}
                className="sr-only"
              />
              {opt}
            </label>
          );
        })}
      </div>
      <FieldError id={`${name}-error`} message={error} />
    </fieldset>
  );
}

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { full_name: "", email: "", message: "", company: "" },
  });
  const v = useWatch({ control });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const res = await submitContactAction(values).catch(() => null);
    if (!res) {
      setServerError("Network error. Please try again.");
      return;
    }
    if (!res.ok) {
      setServerError(res.error);
      for (const [k, msgs] of Object.entries(res.fieldErrors ?? {})) {
        if (msgs?.[0]) setError(k as keyof ContactInput, { message: msgs[0] });
      }
      return;
    }
    reset();
    setStatus("sent");
  });

  return (
    <AnimatePresence mode="wait">
      {status === "sent" ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex min-h-[420px] flex-col items-start justify-center gap-6"
          role="status"
        >
          <span className="flex size-12 items-center justify-center rounded-full border border-line text-gold">
            <Check className="size-5" aria-hidden />
          </span>
          <p className="h-section">Message received.</p>
          <p className="max-w-md text-mute">Thank you for reaching out — I&apos;ll get back to you within two working days.</p>
          <button type="button" onClick={() => setStatus("idle")} className="link-underline text-sm text-paper">
            Send another
          </button>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={onSubmit}
          noValidate
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col gap-9"
        >
          <div className="grid gap-9 sm:grid-cols-2">
            <div>
              <label htmlFor="full_name" className="text-sm text-mute">Full name</label>
              <input
                id="full_name"
                autoComplete="name"
                placeholder="Your name"
                className="field-cinema"
                aria-invalid={Boolean(errors.full_name)}
                aria-describedby={errors.full_name ? "full_name-error" : undefined}
                {...register("full_name")}
              />
              <FieldError id="full_name-error" message={errors.full_name?.message} />
            </div>
            <div>
              <label htmlFor="email" className="text-sm text-mute">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@studio.com"
                className="field-cinema"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              <FieldError id="email-error" message={errors.email?.message} />
            </div>
          </div>

          <ChipGroup
            name="project_type"
            legend="Project type"
            options={PROJECT_TYPES}
            value={v.project_type}
            onChange={(v) => setValue("project_type", v as ContactInput["project_type"], { shouldValidate: true })}
            error={errors.project_type?.message}
          />

          <ChipGroup
            name="budget_range"
            legend="Budget range"
            options={BUDGET_RANGES}
            value={v.budget_range}
            onChange={(v) => setValue("budget_range", v as ContactInput["budget_range"], { shouldValidate: true })}
            error={errors.budget_range?.message}
          />

          <div>
            <label htmlFor="message" className="text-sm text-mute">Message</label>
            <textarea
              id="message"
              rows={5}
              placeholder="Tell me about the story, timeline and where it will live…"
              className="field-cinema resize-none"
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? "message-error" : undefined}
              {...register("message")}
            />
            <FieldError id="message-error" message={errors.message?.message} />
          </div>

          {/* Honeypot — hidden from people and assistive tech */}
          <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
            <label htmlFor="company">Company</label>
            <input id="company" tabIndex={-1} autoComplete="off" {...register("company")} />
          </div>

          {serverError && (
            <p role="alert" className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {serverError}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full disabled:opacity-60 sm:w-fit">
            {isSubmitting ? "Sending…" : "Send Message"}
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
