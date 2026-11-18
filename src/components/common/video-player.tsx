"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { VideoSource } from "@/types/database";
import { resolveVideo } from "@/lib/utils/video";
import { canOptimizeImage } from "@/lib/utils/media";
import { cn } from "@/lib/utils/cn";

type Props = {
  source: VideoSource;
  url: string | null;
  poster: string | null;
  title: string;
  className?: string;
  /** Large centered label on the idle poster. */
  /** @deprecated The idle state now shows a play mark only. */
  idleLabel?: string;
  /** Above-the-fold player: load the poster eagerly (LCP). */
  priority?: boolean;
};

function fmt(t: number) {
  if (!Number.isFinite(t)) return "00:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Cinematic player.
 * - Uploaded / direct files: native <video preload="none"> with custom controls
 *   (play/pause, scrubbable progress, sound toggle, fullscreen, keyboard: Space/K, M, F, ←/→).
 * - YouTube / Vimeo: poster + custom play button; the iframe is only injected on
 *   click (no third-party JS until the visitor asks for it).
 */
export function VideoPlayer({ source, url, poster, title, className, priority = false }: Props) {
  const resolved = resolveVideo(source, url);
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chrome, setChrome] = useState(true);
  const hideTimer = useRef<number | undefined>(undefined);

  const posterSrc = poster ?? (resolved.kind === "youtube" ? resolved.thumbnail : null);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const pokeChrome = useCallback(() => {
    setChrome(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setChrome(false), 2400);
  }, []);
  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const toggle = useCallback(async () => {
    if (resolved.kind !== "file") {
      setStarted(true);
      return;
    }
    const v = video.current;
    if (!v) return;
    setStarted(true);
    try {
      if (v.paused) await v.play();
      else v.pause();
    } catch {
      setError("Playback was blocked or the file could not be loaded.");
    }
  }, [resolved.kind]);

  const toggleMute = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFullscreen = async () => {
    const el = frame.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (el.requestFullscreen) await el.requestFullscreen();
      else {
        // iOS Safari: only the <video> element can go fullscreen.
        const v = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
        v?.webkitEnterFullscreen?.();
      }
    } catch {
      /* fullscreen denied */
    }
  };

  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const v = video.current;
    if (!v || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1) * duration;
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (resolved.kind !== "file") return;
    const v = video.current;
    if (!v) return;
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      void toggle();
    } else if (e.key === "m") toggleMute();
    else if (e.key === "f") void toggleFullscreen();
    else if (e.key === "ArrowRight") v.currentTime = Math.min(v.currentTime + 5, duration);
    else if (e.key === "ArrowLeft") v.currentTime = Math.max(v.currentTime - 5, 0);
  };

  if (resolved.kind === "none") {
    return (
      <div className={cn("relative flex items-center justify-center bg-ink-3", className)}>
        {posterSrc && (
          <Image
            src={posterSrc}
            alt={title}
            fill
            sizes="100vw"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className="object-cover opacity-60"
            unoptimized={!canOptimizeImage(posterSrc)}
          />
        )}
        <span className="relative eyebrow">Video coming soon</span>
      </div>
    );
  }

  const isEmbed = resolved.kind === "youtube" || resolved.kind === "vimeo";

  return (
    <div
      ref={frame}
      className={cn("group/player relative overflow-hidden bg-black", className)}
      onPointerMove={pokeChrome}
      onKeyDown={onKey}
      role="region"
      aria-label={`${title} video player`}
    >
      {isEmbed && started ? (
        <iframe
          src={resolved.embedUrl}
          title={title}
          className="absolute inset-0 size-full"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
        />
      ) : null}

      {resolved.kind === "file" && (
        <video
          ref={video}
          src={resolved.src}
          poster={posterSrc ?? undefined}
          preload="none"
          playsInline
          className="absolute inset-0 size-full object-contain"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onError={() => setError("This video could not be loaded.")}
          onClick={() => void toggle()}
        />
      )}

      {/* Idle poster + big play */}
      <AnimatePresence>
        {!started && (
          <motion.button
            type="button"
            key="idle"
            onClick={() => void toggle()}
            data-cursor="play"
            className="absolute inset-0 z-10 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            aria-label={`Play ${title}`}
          >
            {posterSrc && (
              <Image
                src={posterSrc}
                alt=""
                fill
                sizes="100vw"
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                className="object-cover transition-transform duration-[1.6s] ease-[var(--ease-out-expo)] group-hover/player:scale-105"
                unoptimized={!canOptimizeImage(posterSrc)}
              />
            )}
            <span className="absolute inset-0 bg-ink/30 transition-colors duration-700 group-hover/player:bg-ink/15" />
            <span className="relative flex size-16 items-center justify-center rounded-full border border-paper/50 bg-ink/20 backdrop-blur-sm transition-[transform,border-color] duration-700 ease-[var(--ease-out-expo)] group-hover/player:scale-105 group-hover/player:border-paper sm:size-20">
              <Play className="ml-0.5 size-5 fill-paper text-paper" aria-hidden />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Custom controls (file sources) */}
      {resolved.kind === "file" && started && (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/80 to-transparent px-4 pb-4 pt-12 transition-opacity duration-500 sm:px-6",
            chrome || !playing ? "opacity-100" : "opacity-0",
          )}
        >
          <div
            className="group/bar relative mb-4 h-4 cursor-pointer"
            onPointerDown={seek}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(time)}
            aria-valuetext={`${fmt(time)} of ${fmt(duration)}`}
            tabIndex={0}
          >
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/25 transition-all group-hover/bar:h-[3px]" />
            <div
              className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-paper transition-all group-hover/bar:h-[3px]"
              style={{ width: duration ? `${(time / duration) * 100}%` : "0%" }}
            />
          </div>
          <div className="flex items-center gap-4 text-paper">
            <button type="button" onClick={() => void toggle()} aria-label={playing ? "Pause" : "Play"} className="p-1">
              {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
            </button>
            <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="p-1">
              {muted ? <VolumeX className="size-5" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
            </button>
            <span className="text-xs tabular-nums text-paper/80">
              {fmt(time)}
              {Number.isFinite(duration) && duration > 0 ? ` / ${fmt(duration)}` : ""}
            </span>
            <span className="ml-auto" />
            <button type="button" onClick={() => void toggleFullscreen()} aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"} className="p-1">
              {fullscreen ? <Minimize className="size-5" aria-hidden /> : <Maximize className="size-5" aria-hidden />}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="absolute inset-x-0 top-0 z-30 bg-red-950/80 px-4 py-2 text-sm text-red-100">
          {error}
        </div>
      )}
    </div>
  );
}
