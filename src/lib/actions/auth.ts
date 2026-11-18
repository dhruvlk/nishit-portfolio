"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "@/lib/validations/schemas";
import type { ActionResult } from "@/types/content";
import { validationError } from "./_shared";

function safeNext(next: string | undefined): string {
  return next && next.startsWith("/admin") && !next.startsWith("//") && !next.startsWith("/admin/login")
    ? next
    : "/admin";
}

export async function signInAction(input: LoginInput, next?: string): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      // Network/5xx failures come back as retryable errors without a 4xx status.
      const unreachable = error.name === "AuthRetryableFetchError" || !error.status || error.status >= 500;
      if (unreachable) console.error("[auth] auth server unreachable", error.message);
      return {
        ok: false,
        error: unreachable ? "Could not reach the authentication server. Try again." : "Invalid email or password.",
      };
    }

    const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
    if (rpcError || isAdmin !== true) {
      await supabase.auth.signOut();
      return { ok: false, error: "This account is not authorized to access the dashboard." };
    }
  } catch (e) {
    console.error("[auth] sign-in failed", e);
    return { ok: false, error: "Could not reach the authentication server. Try again." };
  }

  redirect(safeNext(next));
}

export async function signOutAction(): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (e) {
    console.error("[auth] sign-out failed", e);
  }
  redirect("/admin/login");
}
