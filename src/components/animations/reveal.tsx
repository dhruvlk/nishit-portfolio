"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, MOTION_OK, whenIdle, isBelowFold } from "@/lib/gsap";

type Props = {
  children: ReactNode;
  className?: string;
  y?: number;
  delay?: number;
  /** Stagger direct children marked with [data-reveal-item]. */
  stagger?: number;
};

/** Fades + lifts content into view on scroll. No-op with reduced motion. */
export function Reveal({ children, className, y = 24, delay = 0, stagger = 0.08 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const el = ref.current;
      if (!el) return;
      const setup = () => {
        const mm = gsap.matchMedia();
        mm.add(MOTION_OK, () => {
          const items = el.querySelectorAll("[data-reveal-item]");
          gsap.from(items.length ? items : el, {
            y,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            delay,
            stagger,
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        });
      };
      if (isBelowFold(el) && contextSafe) return whenIdle(contextSafe(setup));
      setup();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
