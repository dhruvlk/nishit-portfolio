"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { getLenis, setLenis } from "@/lib/smooth-scroll";

/**
 * Inertial smooth scrolling (Lenis) driven by GSAP's ticker so ScrollTrigger
 * scrubs, pins and parallax stay frame-perfectly in sync. Native scrolling is
 * kept on touch devices and for prefers-reduced-motion. Lenis scrolls the real
 * document, so position: sticky and fixed elements keep working.
 */
export function SmoothScroll() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;
    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
        autoRaf: false,
        anchors: { offset: -80 },
        stopInertiaOnNavigate: true,
      });
      setLenis(lenis);
      const offScroll = lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      cleanup = () => {
        offScroll();
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.destroy();
        setLenis(null);
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <Suspense fallback={null}>
      <RouteSync />
    </Suspense>
  );
}

/** Keeps Lenis' internal position in step with Next.js' scroll reset on navigation. */
function RouteSync() {
  const pathname = usePathname();
  useEffect(() => {
    const lenis = getLenis();
    if (!lenis || window.location.hash) return;
    lenis.scrollTo(0, { immediate: true, force: true });
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);
  return null;
}
