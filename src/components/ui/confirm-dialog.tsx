"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "./admin-primitives";

type ConfirmOptions = { title: string; description?: string; confirmLabel?: string; tone?: "danger" | "default" };
type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

const ConfirmContext = createContext<((o: ConfirmOptions) => Promise<boolean>) | null>(null);

/** Promise-based confirmation dialog: `if (await confirm({...})) { ... }` */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const confirmBtn = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const confirm = useCallback((o: ConfirmOptions) => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    return new Promise<boolean>((resolve) => setPending({ ...o, resolve }));
  }, []);

  const close = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
      lastFocus.current?.focus();
    },
    [pending],
  );

  useEffect(() => {
    if (!pending) return;
    confirmBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {pending && (
          <motion.div className="fixed inset-0 z-[150] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Cancel" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => close(false)} />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-desc"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 6 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="relative w-full max-w-md rounded-xl border border-a-line bg-a-panel p-6 text-a-fg shadow-2xl"
            >
              <div className="flex gap-4">
                {pending.tone === "danger" && (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                    <AlertTriangle className="size-5" aria-hidden />
                  </span>
                )}
                <div>
                  <h2 id="confirm-title" className="text-base font-semibold">{pending.title}</h2>
                  {pending.description && <p id="confirm-desc" className="mt-1 text-sm text-a-mute">{pending.description}</p>}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button onClick={() => close(false)}>Cancel</Button>
                <Button ref={confirmBtn} variant={pending.tone === "danger" ? "danger" : "primary"} onClick={() => close(true)}>
                  {pending.confirmLabel ?? "Confirm"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}
