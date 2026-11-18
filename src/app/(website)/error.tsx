"use client";

import { useEffect } from "react";

export default function WebsiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-cinema flex min-h-[70vh] flex-col items-start justify-center gap-6 pt-24">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="h-section">This page couldn&apos;t be loaded.</h1>
      <button type="button" onClick={reset} className="btn btn-ghost">
        Try again
      </button>
    </div>
  );
}
