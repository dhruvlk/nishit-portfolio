"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { SocialLinks } from "@/components/common/social-links";
import { lockScroll, unlockScroll } from "@/lib/smooth-scroll";
import type { SocialLink } from "@/types/content";
import { canOptimizeImage } from "@/lib/utils/media";
import { monogram } from "@/lib/utils/monogram";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/work", label: "Work" },
  { href: "/contact", label: "Contact" },
];

const ease = [0.16, 1, 0.3, 1] as const;

function isActive(href: string, pathname: string | null) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Links({ pathname, onNavigate, large = false }: { pathname: string | null; onNavigate?: () => void; large?: boolean }) {
  return (
    <>
      {NAV.map((item) => {
        const active = isActive(item.href, pathname);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "transition-colors duration-300",
                large ? "block py-2 text-4xl font-light tracking-tight" : "-my-3 inline-block py-3 text-sm",
                active ? "text-paper" : large ? "text-paper/55 hover:text-paper" : "text-mute hover:text-paper",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </>
  );
}

/** usePathname lives behind Suspense so the static shell can prerender without it. */
function ActiveLinks(props: { onNavigate?: () => void; large?: boolean }) {
  return <Links pathname={usePathname()} {...props} />;
}

export function SiteHeader({
  siteName,
  logoUrl,
  email,
  socials,
}: {
  siteName: string;
  logoUrl: string | null;
  email: string | null;
  socials: SocialLink[];
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    lockScroll();
    window.addEventListener("keydown", onKey);
    return () => {
      unlockScroll();
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled || open ? "border-line bg-ink/75 backdrop-blur-md" : "border-transparent bg-transparent",
        )}
      >
        <div className="container-cinema flex h-16 items-center justify-between md:h-[4.5rem]">
          <Link href="/" className="flex h-11 items-center gap-3 text-paper" aria-label={`${siteName} — home`}>
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={siteName}
                width={120}
                height={32}
                className="h-6 w-auto object-contain"
                unoptimized={!canOptimizeImage(logoUrl)}
              />
            ) : (
              <>
                <span className="font-display text-[1.375rem] italic leading-none">{monogram(siteName)}</span>
                <span aria-hidden className="h-3.5 w-px bg-paper/25" />
                <span className="text-sm tracking-tight">{siteName}</span>
              </>
            )}
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-9">
              <Suspense fallback={<Links pathname={null} />}>
                <ActiveLinks />
              </Suspense>
            </ul>
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-2 flex size-11 items-center justify-center md:hidden"
          >
            <span className="relative block h-2.5 w-6" aria-hidden>
              <span
                className={cn(
                  "absolute left-0 h-px w-full bg-paper transition-transform duration-500 ease-[var(--ease-out-expo)]",
                  open ? "top-1 rotate-45" : "top-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 h-px w-full bg-paper transition-transform duration-500 ease-[var(--ease-out-expo)]",
                  open ? "top-1 -rotate-45" : "top-2.5",
                )}
              />
            </span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-0 z-40 flex flex-col bg-ink md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease }}
          >
            <motion.nav
              aria-label="Mobile"
              className="container-cinema flex flex-1 flex-col justify-center"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease, delay: 0.08 }}
            >
              <ul className="flex flex-col gap-1">
                <ActiveLinks large onNavigate={() => setOpen(false)} />
              </ul>
            </motion.nav>
            <div className="container-cinema flex flex-col gap-4 border-t border-line py-8">
              {email && (
                <a href={`mailto:${email}`} className="text-sm text-paper/80">
                  {email}
                </a>
              )}
              <SocialLinks links={socials} itemClassName="text-sm text-mute hover:text-paper" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
