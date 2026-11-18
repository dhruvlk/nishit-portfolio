import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only routes that need an auth session: the admin area.
  // Public pages stay fully static/cached and never touch cookies.
  matcher: ["/admin/:path*"],
};
