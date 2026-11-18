"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, SplitText, useGSAP, MOTION_OK, whenIdle, isBelowFold } from "@/lib/gsap";

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** "lines" = masked line rise (headings). "words" = staggered words. */
  mode?: "lines" | "words" | "chars";
  /** Lighter split for small screens (fewer DOM nodes and tweens). */
  mobileMode?: "lines" | "words";
  /** Start on scroll (default) or when `play` turns true. */
  trigger?: "scroll" | "manual";
  play?: boolean;
  delay?: number;
  stagger?: number;
  start?: string;
};

/**
 * Masked text reveal powered by GSAP SplitText. Re-splits on resize (autoSplit)
 * and reverts automatically on unmount. Reduced motion → text is shown as-is.
 */
export function TextReveal({
  as: Tag = "div",
  children,
  className,
  mode: modeProp = "lines",
  mobileMode,
  trigger = "scroll",
  play = true,
  delay = 0,
  stagger,
  start = "top 85%",
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const el = ref.current;
      if (!el || (trigger === "manual" && !play)) return;
      const mode = mobileMode && window.matchMedia("(max-width: 767px)").matches ? mobileMode : modeProp;
      const setup = () => {
        const mm = gsap.matchMedia();
        mm.add(MOTION_OK, () => {
          const split = SplitText.create(el, {
            type: mode === "lines" ? "lines" : mode === "words" ? "lines,words" : "lines,words,chars",
            mask: "lines",
            linesClass: "split-line",
            autoSplit: true,
            // aria-label is only valid on elements with a naming role (headings).
            aria: typeof Tag === "string" && /^h[1-6]$/.test(Tag) ? "auto" : "none",
            onSplit(self) {
              const targets = mode === "lines" ? self.lines : mode === "words" ? self.words : self.chars;
              return gsap.from(targets, {
                yPercent: 115,
                rotate: 0,
                opacity: mode === "words" ? 0 : 1,
                duration: 1.1,
                ease: "expo.out",
                stagger: stagger ?? (mode === "lines" ? 0.1 : mode === "words" ? 0.035 : 0.018),
                delay,
                scrollTrigger: trigger === "scroll" ? { trigger: el, start, once: true } : undefined,
              });
            },
          });
          gsap.set(el, { visibility: "visible" });
          return () => split.revert();
        });
        mm.add("(prefers-reduced-motion: reduce)", () => {
          gsap.set(el, { visibility: "visible" });
        });
      };
      // Off-screen scroll reveals are built when the main thread is idle, keeping hydration lean.
      if (trigger === "scroll" && isBelowFold(el) && contextSafe) return whenIdle(contextSafe(setup));
      setup();
    },
    { scope: ref, dependencies: [play, trigger], revertOnUpdate: true },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
