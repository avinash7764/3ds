"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Icon } from "@/components/ui";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            ux_mode?: string;
            auto_select?: boolean;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; shape?: string; text?: string; logo_alignment?: string; width?: number },
          ) => void;
          prompt: (listener?: unknown) => void;
        };
      };
    };
  }
}

type DemoAccount = { email: string; label: string; role: "ADMIN" | "INSTRUCTOR" | "STUDENT" };

const GSI_SRC = "https://accounts.google.com/gsi/client";

export function GoogleSignIn({
  clientId,
  configured,
  next = "/dashboard",
  allowDemo,
  demoAccounts,
  mode = "signin",
}: {
  clientId: string;
  configured: boolean;
  next?: string;
  allowDemo: boolean;
  demoAccounts: DemoAccount[];
  /** Labels the Google button for the page it sits on; /signup passes "signup". */
  mode?: "signin" | "signup";
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;

    const finish = () => {
      if (cancelled || !window.google?.accounts?.id || !mountRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: "popup",
        callback: async (response) => {
          setBusy("google");
          setError(null);
          try {
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ credential: response.credential }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Sign-in failed");
            window.location.assign(data.user?.role === "ADMIN" && next === "/dashboard" ? "/admin" : next);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Sign-in failed. Try again.");
          } finally {
            setBusy(null);
          }
        },
      });
      mountRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(mountRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: mode === "signup" ? "signup_with" : "continue_with",
        logo_alignment: "left",
        width: Math.min(340, mountRef.current.parentElement?.clientWidth ?? 320),
      });
      setReady(true);
    };

    if (window.google) finish();
    else {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
      const script = existing ?? document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = finish;
      script.onerror = () => setError("Could not load Google's sign-in script (check the network / ad-blocker).");
      if (!existing) document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
    };
  }, [clientId, configured, next, mode]);

  async function demoLogin(email: string) {
    setBusy(email);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Demo sign-in failed");
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo sign-in failed");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {configured ? (
        <div className="space-y-2">
          <div ref={mountRef} className="flex min-h-[44px] items-center justify-center">
            {!ready ? (
              <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                <span className="h-3 w-3 animate-ping rounded-full bg-volt-400" /> Loading Google sign-in…
              </span>
            ) : null}
          </div>
          {busy === "google" ? <p className="text-center text-xs font-semibold text-volt-700">Verifying with Google…</p> : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-bold">
            <Icon name="shield" className="h-4 w-4" /> Google login is not configured yet
          </p>
          <p className="mt-1.5 leading-6">
            Put your OAuth <em>Web client ID</em> in <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[12px]">GOOGLE_CLIENT_ID</code> (
            <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[12px]">.env</code>) and add this site's origin to{" "}
            <strong>Authorized JavaScript origins</strong> in Google Cloud Console. Until then, use a demo account below — it creates a real
            session with the same cookie.
          </p>
        </div>
      )}

      {error ? (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      {allowDemo ? (
        <div>
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-300">
            <span className="h-px flex-1 bg-ink-100" /> or continue with a demo role <span className="h-px flex-1 bg-ink-100" />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                onClick={() => demoLogin(acc.email)}
                disabled={Boolean(busy)}
                className="group flex flex-col items-start gap-1 rounded-xl border border-ink-200 bg-white p-3 text-left transition-colors hover:border-volt-400 hover:bg-volt-50 disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-900">
                  {busy === acc.email ? <Icon name="sparkle" className="h-3.5 w-3.5 animate-spin text-volt-500" /> : <Icon name={acc.role === "ADMIN" ? "settings" : acc.role === "INSTRUCTOR" ? "video" : "book"} className="h-3.5 w-3.5 text-volt-500" />}
                  {acc.label}
                </span>
                <span className="break-all text-[11px] font-medium text-slate-500">{acc.email}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            Demo sign-in is only available while <code className="font-mono">ALLOW_DEMO_LOGIN=true</code>. Set it to false in production.
          </p>
        </div>
      ) : null}
    </div>
  );
}
