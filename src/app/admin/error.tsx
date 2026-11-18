"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="size-8 text-red-500" />
      <h1 className="text-lg font-semibold">Something went wrong loading this page.</h1>
      <p className="max-w-md text-sm text-a-mute">{error.message || "Unexpected error."}</p>
      <button type="button" onClick={reset} className="rounded-md border border-a-line px-4 py-2 text-sm hover:bg-a-raised">Try again</button>
    </div>
  );
}
