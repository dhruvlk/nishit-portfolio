"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { signInAction } from "@/lib/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/schemas";
import { isRedirectError } from "@/lib/utils/redirect";
import { Button, Field, Input } from "@/components/ui/admin-primitives";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const next = new URLSearchParams(window.location.search).get("next") ?? undefined;
    try {
      const res = await signInAction(values, next);
      if (res && !res.ok) setError(res.error);
    } catch (e) {
      if (isRedirectError(e)) throw e;
      setError("Could not sign in. Check your connection and try again.");
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm rounded-2xl border border-a-line bg-a-panel p-8 shadow-2xl shadow-black/10"
    >
      <span className="mb-6 flex size-10 items-center justify-center rounded-full bg-a-raised">
        <Lock className="size-4 text-a-accent" aria-hidden />
      </span>
      <h1 className="text-xl font-semibold">Studio Admin</h1>
      <p className="mt-1 text-sm text-a-mute">Sign in to manage your portfolio.</p>
      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="username" {...register("email")} aria-invalid={Boolean(errors.email)} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" {...register("password")} aria-invalid={Boolean(errors.password)} />
        </Field>
        {error && <p role="alert" className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}
        <Button type="submit" variant="primary" loading={isSubmitting} className="mt-2 w-full">
          Sign in
        </Button>
      </form>
    </motion.div>
  );
}
