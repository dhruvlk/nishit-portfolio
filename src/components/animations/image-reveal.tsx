"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, MOTION_OK, whenIdle, isBelowFold } from "@/lib/gsap";
import { cn } from "@/lib/utils/cn";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Subtle image entrance: the frame fades in while its [data-media] child settles
 * from a slight zoom. Only this wrapper and [data-media] are animated, so CSS
 * hover effects elsewhere never fight GSAP. Reduced motion → static image.
 */
export function ImageReveal({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const el = ref.current;
      if (!el) return;
      const media = el.querySelector<HTMLElement>("[data-media]");
      const setup = () => {
        const mm = gsap.matchMedia();
        mm.add(MOTION_OK, () => {
          const st = { trigger: el, start: "top 88%", once: true };
          gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power2.out", scrollTrigger: st });
          if (media) {
            gsap.fromTo(media, { scale: 1.06 }, { scale: 1, duration: 1.8, ease: "expo.out", scrollTrigger: st });
          }
        });
      };
      if (isBelowFold(el) && contextSafe) return whenIdle(contextSafe(setup));
      setup();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      {children}
    </div>
  );
}
