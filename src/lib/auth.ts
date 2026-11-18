import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type AdminSession = { user: User; supabase: SupabaseClient<Database> };

/**
 * Data Access Layer: verifies the session with Supabase Auth (getUser hits the
 * auth server, so a forged cookie fails) and then checks the admin_users table
 * via the security-definer is_admin() function. Never trusts user_metadata.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
  if (rpcError || isAdmin !== true) return null;

  return { user: data.user, supabase };
});

/** For pages: redirects to login when not an authorized admin. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** For server actions: returns null instead of redirecting so the action can report an error. */
export async function getAdminForAction(): Promise<AdminSession | null> {
  return getAdminSession();
}
