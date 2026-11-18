"use client";

import type Lenis from "lenis";

/*
 * Single place to reach the smooth-scroll instance. Lenis is only created on
 * desktop (fine pointer, motion allowed); everywhere else these helpers fall
 * back to native scrolling so callers never need to care.
 */
let instance: Lenis | null = null;
let locks = 0;

export function setLenis(l: Lenis | null) {
  instance = l;
}

export function getLenis(): Lenis | null {
  return instance;
}

/** Freeze page scroll (menus, intro). Reference-counted so overlaps are safe. */
export function lockScroll() {
  locks += 1;
  if (locks === 1) {
    instance?.stop();
    document.documentElement.style.overflow = "hidden";
  }
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) {
    instance?.start();
    document.documentElement.style.removeProperty("overflow");
  }
}

export function scrollToTop() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (instance) instance.scrollTo(0, { duration: 1.6, immediate: reduced });
  else window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
}
