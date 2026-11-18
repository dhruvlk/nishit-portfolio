"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseEnv } from "@/config/env";
import type { Database } from "@/types/database";

let browserClient: SupabaseClient<Database> | undefined;

/** Singleton browser client (cookie-based session shared with the server). */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!browserClient) {
    const { url, key } = assertSupabaseEnv();
    browserClient = createBrowserClient<Database>(url, key);
  }
  return browserClient;
}
