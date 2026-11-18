"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Film, Globe, LayoutDashboard, LogOut, Mail, Menu, Moon, Share2, Sun, UserRound, Clapperboard, X } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils/cn";
import { useAdminTheme } from "./admin-providers";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: Film },
  { href: "/admin/showreel", label: "Showreel", icon: Clapperboard },
  { href: "/admin/profile", label: "Profile", icon: UserRound },
  { href: "/admin/socials", label: "Social links", icon: Share2 },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/settings", label: "Website settings", icon: Globe },
];

function ActiveNavList({ onNavigate }: { onNavigate?: () => void }) {
  return <NavItems onNavigate={onNavigate} pathname={usePathname()} />;
}

/** usePathname is request data under Cache Components, so it streams in behind Suspense. */
function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense fallback={<NavItems onNavigate={onNavigate} pathname={null} />}>
      <ActiveNavList onNavigate={onNavigate} />
    </Suspense>
  );
}

function NavItems({ onNavigate, pathname }: { onNavigate?: () => void; pathname: string | null }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active = pathname !== null && (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn("relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors", active ? "text-a-fg" : "text-a-mute hover:text-a-fg")}
            >
              {active && <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-md bg-a-raised" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <Icon className="relative size-4" aria-hidden />
              <span className="relative">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminShell({ children, email }: { children: ReactNode; email: ReactNode }) {
  const { theme, toggle } = useAdminTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const footer = (
    <div className="mt-auto flex flex-col gap-1 border-t border-a-line pt-4">
      <div className="truncate px-3 pb-2 text-xs text-a-mute">{email}</div>
      <Link href="/" target="_blank" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-a-mute hover:bg-a-raised hover:text-a-fg">
        <ExternalLink className="size-4" /> View website
      </Link>
      <button type="button" onClick={toggle} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-a-mute hover:bg-a-raised hover:text-a-fg">
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </button>
      <form action={signOutAction}>
        <button type="submit" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-a-mute hover:bg-red-500/10 hover:text-red-500">
          <LogOut className="size-4" /> Sign out
        </button>
      </form>
    </div>
  );

  const brand = (
    <Link href="/admin" className="mb-6 flex items-center gap-2 px-3">
      <span className="flex size-7 items-center justify-center rounded-md bg-a-fg font-display text-sm italic text-a-bg">S</span>
      <span className="text-sm font-semibold text-a-fg">Studio Admin</span>
    </Link>
  );

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-a-line bg-a-panel p-4 lg:flex">
        {brand}
        <nav aria-label="Admin"><NavList /></nav>
        {footer}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-a-line bg-a-panel/90 px-4 backdrop-blur lg:hidden">
          <span className="text-sm font-semibold">Studio Admin</span>
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="rounded-md p-2 hover:bg-a-raised">
            <Menu className="size-5" />
          </button>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="relative flex h-full w-72 flex-col bg-a-panel p-4"
            >
              <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 rounded-md p-2 hover:bg-a-raised" aria-label="Close">
                <X className="size-4" />
              </button>
              {brand}
              <nav aria-label="Admin"><NavList onNavigate={() => setMobileOpen(false)} /></nav>
              {footer}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
