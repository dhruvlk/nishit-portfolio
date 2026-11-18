import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { assertSupabaseEnv } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * Request-scoped client that acts as the signed-in user (RLS applies).
 * Use in Server Components, Server Actions and Route Handlers.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const { url, key } = assertSupabaseEnv();
  const cookieStore = await cookies();
  // The auth client reads the clock (token expiry). Cookies alone can still be
  // resolved during runtime prefetch, so explicitly wait for a real request.
  await connection();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: cookies are read-only there.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
