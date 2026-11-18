"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

// Register once on the client. useGSAP handles context + automatic cleanup
// (timelines, tweens and ScrollTriggers created inside it are reverted on unmount).
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  gsap.defaults({ ease: "power3.out", duration: 1 });
}

export const EASE = {
  cinema: "expo.inOut",
  out: "expo.out",
  soft: "power3.out",
} as const;

/** Query used with gsap.matchMedia to gate heavy motion. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
export const DESKTOP_MOTION = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

export { gsap, ScrollTrigger, SplitText, useGSAP };

/** Run non-critical setup when the main thread is idle (falls back to a short timeout). */
export function whenIdle(cb: () => void, timeout = 1200): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(cb, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(cb, 1);
  return () => window.clearTimeout(id);
}

/** True when the element starts below the first screen (safe to defer its animation setup). */
export function isBelowFold(el: Element): boolean {
  return el.getBoundingClientRect().top > window.innerHeight;
}
