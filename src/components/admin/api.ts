"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

/**
 * One tiny client for the admin mutation endpoints: POST → refresh server components.
 * Errors from zod validation come back as { error } and are surfaced inline.
 */
export function useAdminAction(endpoint: string) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (payload: Record<string, unknown>, opts: { refresh?: boolean } = {}) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
        if (opts.refresh !== false) router.refresh();
        return data as { ok: boolean; [key: string]: unknown };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [endpoint, router],
  );

  return { run, busy, error, setError };
}
