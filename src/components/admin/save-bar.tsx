"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/admin-primitives";

/** Sticky "unsaved changes" bar shared by the settings-style forms. */
export function SaveBar({ dirty, saving, disabled, onReset, label = "Save changes" }: { dirty: boolean; saving: boolean; disabled?: boolean; onReset: () => void; label?: string }) {
  return (
    <AnimatePresence>
      {dirty && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="sticky bottom-4 z-30 mt-6 flex items-center justify-between gap-4 rounded-xl border border-a-line bg-a-panel/95 px-4 py-3 shadow-xl shadow-black/10 backdrop-blur"
        >
          <p className="text-sm text-a-mute">{disabled ? "Waiting for upload to finish…" : "You have unsaved changes."}</p>
          <div className="flex gap-2">
            <Button type="button" onClick={onReset} disabled={saving}>Discard</Button>
            <Button type="submit" variant="primary" loading={saving} disabled={disabled}>{label}</Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
