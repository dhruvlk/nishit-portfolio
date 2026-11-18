"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";
import { TextReveal } from "@/components/animations/text-reveal";
import { ButtonLink } from "@/components/ui/button-link";
import { canOptimizeImage } from "@/lib/utils/media";

type Props = {
  name: string;
  label: string;
  heading: string;
  description: string;
  videoUrl: string | null;
  posterUrl: string | null;
};

/** Data-saver visitors (and small screens that prefer reduced motion) get the poster only. */
function useShouldLoadVideo(hasVideo: boolean) {
  const [load, setLoad] = useState(false);
  useEffect(() => {
    if (!hasVideo) return;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const saveData = nav.connection?.saveData === true;
    const small = window.matchMedia("(max-width: 767px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (saveData || (small && reduced)) return;
    const id = requestAnimationFrame(() => setLoad(true));
    return () => cancelAnimationFrame(id);
  }, [hasVideo]);
  return load;
}

export function Hero({ name, label, heading, description, videoUrl, posterUrl }: Props) {
  const root = useRef<HTMLElement>(null);
  const loadVideo = useShouldLoadVideo(Boolean(videoUrl));
  const lines = heading.split(/\n+/).filter(Boolean);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .fromTo("[data-hero-media]", { scale: 1.08 }, { scale: 1, duration: 2.6 }, 0)
          .fromTo("[data-hero-fade]", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 0.55);
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="hero-heading" className="relative flex h-[100svh] min-h-[600px] items-end overflow-hidden">
      <div data-hero-media className="absolute inset-0 -z-10">
        {posterUrl && (
          <Image
            src={posterUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
            unoptimized={!canOptimizeImage(posterUrl)}
          />
        )}
        {videoUrl && loadVideo && (
          <video
            className="absolute inset-0 size-full object-cover"
            src={videoUrl}
            poster={posterUrl ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
          />
        )}
        {!posterUrl && !videoUrl && <div className="absolute inset-0 bg-ink-2" />}
      </div>
      <div className="absolute inset-0 -z-10 bg-ink/50" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-3/4 bg-linear-to-t from-ink via-ink/70 to-transparent" aria-hidden />

      <div className="container-cinema pb-16 sm:pb-20 lg:pb-24">
        <div data-hero-fade className="mb-8 space-y-2 text-xs uppercase tracking-[0.2em] sm:mb-10">
          {name && <p className="text-paper">{name}</p>}
          {label && <p className="text-paper/60">{label}</p>}
        </div>

        <h1 id="hero-heading" aria-label={lines.join(" ")} className="h-hero">
          {lines.map((line, i) => (
            <TextReveal
              key={i}
              as="span"
              mode="lines"
              trigger="manual"
              play
              delay={0.2 + i * 0.12}
              className={i % 2 === 1 ? "block text-paper/55" : "block"}
            >
              {line}
            </TextReveal>
          ))}
        </h1>

        <div className="mt-8 flex flex-col gap-10 sm:mt-10 md:flex-row md:items-end md:justify-between">
          {description && (
            <p data-hero-fade className="lead max-w-md !text-paper/70">
              {description}
            </p>
          )}
          <div data-hero-fade className="flex flex-wrap gap-3">
            <ButtonLink href="/#work">Explore Selected Work</ButtonLink>
            <ButtonLink href="/contact" variant="ghost">
              Get In Touch
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
