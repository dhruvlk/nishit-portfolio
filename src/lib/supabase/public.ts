import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseEnv } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * Cookie-less anonymous client for public, cacheable reads.
 * Runs as the `anon` role, so RLS only exposes published/public rows.
 */
export function createSupabasePublicClient(): SupabaseClient<Database> {
  const { url, key } = assertSupabaseEnv();
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
