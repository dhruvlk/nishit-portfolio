import { env } from "@/config/env";

const OPTIMIZABLE_HOSTS = ["i.ytimg.com", "vumbnail.com", "assets.mixkit.co"];

/**
 * next/image only optimizes hosts listed in next.config remotePatterns.
 * Anything else (an arbitrary pasted URL) is rendered unoptimized instead of failing.
 */
export function canOptimizeImage(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    const host = new URL(src).hostname;
    const supabaseHost = env.supabaseUrl ? new URL(env.supabaseUrl).hostname : "";
    return host === supabaseHost || OPTIMIZABLE_HOSTS.includes(host);
  } catch {
    return false;
  }
}
