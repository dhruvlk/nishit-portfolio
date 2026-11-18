"use server";

import { createSupabasePublicClient } from "@/lib/supabase/public";
import { contactSchema, type ContactInput } from "@/lib/validations/schemas";
import type { ActionResult } from "@/types/content";
import { validationError } from "./_shared";

export async function submitContactAction(input: ContactInput): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    // Silently accept honeypot hits so bots get no signal.
    if (parsed.error.issues.some((i) => i.path[0] === "company")) return { ok: true };
    return validationError(parsed.error);
  }

  const { company: _honeypot, ...message } = parsed.data;
  void _honeypot;

  try {
    // Insert as anon; RLS allows insert only (no read-back), so no .select().
    const { error } = await createSupabasePublicClient().from("contact_messages").insert(message);
    if (error) {
      console.error("[contact] insert failed", error);
      return { ok: false, error: "Your message could not be sent. Please try again or email directly." };
    }
    return { ok: true, message: "Thank you — your message is on its way." };
  } catch (e) {
    console.error("[contact] unexpected error", e);
    return { ok: false, error: "Your message could not be sent. Please try again shortly." };
  }
}
