"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Current year without reading the clock during prerender (Cache Components requirement). */
export function CopyrightYear() {
  const year = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => null,
  );
  return <span suppressHydrationWarning>{year ?? ""}</span>;
}
