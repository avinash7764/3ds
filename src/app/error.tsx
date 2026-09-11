"use client";

import { useEffect } from "react";
import { Button, Icon } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error("[app error]", error), [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-lg p-8 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <Icon name="shield" className="h-5 w-5" />
        </span>
        <h1 className="mt-5 text-xl font-bold">Something broke while rendering</h1>
        <p className="mt-2 break-words text-[13px] leading-6 text-slate-600">{error.message || "Unknown error"}</p>
        {error.digest ? <p className="mt-1 font-mono text-[11px] text-ink-400">digest: {error.digest}</p> : null}
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset}>
            <Icon name="sparkle" className="h-4 w-4" /> Try again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}
