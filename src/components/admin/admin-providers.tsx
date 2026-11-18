"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { ToastProvider } from "@/components/ui/toast";

type Theme = "dark" | "light";
const KEY = "admin-theme";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: "dark", toggle: () => {} });

export function useAdminTheme() {
  return useContext(ThemeContext);
}

export function AdminProviders({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {
      /* storage blocked */
    }
    const initial: Theme =
      stored === "light" || stored === "dark" ? stored : window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    if (initial !== "dark") {
      const id = requestAnimationFrame(() => setTheme(initial));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div data-theme={theme} className="min-h-dvh bg-a-bg font-sans text-a-fg [color-scheme:light] dark:[color-scheme:dark]">
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </div>
    </ThemeContext.Provider>
  );
}
