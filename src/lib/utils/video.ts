import type { VideoSource } from "@/types/database";

export type ResolvedVideo =
  | { kind: "none" }
  | { kind: "file"; src: string }
  | { kind: "youtube"; id: string; embedUrl: string; thumbnail: string }
  | { kind: "vimeo"; id: string; embedUrl: string };

export function parseYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{6,})/);
      if (m) return m[1];
    }
  } catch {
    /* invalid URL */
  }
  return null;
}

export function parseVimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.replace(/^www\./, "").endsWith("vimeo.com")) return null;
    const m = u.pathname.match(/\/(?:video\/)?(\d{5,})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** Detects the provider of a pasted URL. */
export function detectVideoSource(url: string): Exclude<VideoSource, "none" | "upload"> {
  if (parseYouTubeId(url)) return "youtube";
  if (parseVimeoId(url)) return "vimeo";
  return "external";
}

export function resolveVideo(source: VideoSource, url: string | null): ResolvedVideo {
  if (!url || source === "none") return { kind: "none" };
  if (source === "youtube") {
    const id = parseYouTubeId(url);
    if (!id) return { kind: "none" };
    return {
      kind: "youtube",
      id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
      thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    };
  }
  if (source === "vimeo") {
    const id = parseVimeoId(url);
    if (!id) return { kind: "none" };
    return { kind: "vimeo", id, embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1&title=0&byline=0&portrait=0` };
  }
  return { kind: "file", src: url };
}
