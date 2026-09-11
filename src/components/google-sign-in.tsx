"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";

type DemoAccount = { email: string; label: string; role: "ADMIN" | "INSTRUCTOR" | "STUDENT" };

export function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

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
  mode?: "signin" | "signup";
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [simEmail, setSimEmail] = useState("avinashkumarsingh078@gmail.com");
  const [showConfigHelp, setShowConfigHelp] = useState(false);
  const [isPopupWaiting, setIsPopupWaiting] = useState(false);
  const popupRef = useRef<Window | null>(null);

  // Listen for message events from the OAuth callback popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin: accept from same origin, run.app preview, or localhost
      const origin = event.origin;
      if (
        !origin.endsWith(".run.app") &&
        !origin.includes("localhost") &&
        !origin.includes("127.0.0.1") &&
        origin !== window.location.origin
      ) {
        return;
      }

      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        setIsPopupWaiting(false);
        setBusy("redirecting");
        const target = event.data.next || next;
        window.location.assign(target);
      } else if (event.data?.type === "OAUTH_AUTH_ERROR") {
        setIsPopupWaiting(false);
        setBusy(null);
        setError(event.data.error || "Google authentication failed. Please try again.");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [next]);

  // Handle Google OAuth Popup click
  const handleGoogleConnect = async () => {
    setError(null);
    setBusy("google");

    try {
      // 1. Fetch OAuth URL from server endpoint
      const res = await fetch(`/api/auth/url?next=${encodeURIComponent(next)}`);
      const data = await res.json();

      if (!res.ok || !data.configured || !data.url) {
        // If not configured, explain setup and show quick simulated Google sign in
        setShowConfigHelp(true);
        setBusy(null);
        return;
      }

      // 2. Open provider URL directly in popup (iframe constraint rule)
      const width = 560;
      const height = 660;
      const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
      const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

      const authWindow = window.open(
        data.url,
        "google_oauth_popup",
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
      );

      if (!authWindow) {
        setError("Popup was blocked by your browser. Please allow popups for this site to sign in with Google.");
        setBusy(null);
        return;
      }

      popupRef.current = authWindow;
      setIsPopupWaiting(true);
    } catch (err) {
      console.error("OAuth error:", err);
      setError(err instanceof Error ? err.message : "Failed to initiate Google sign in.");
      setBusy(null);
    }
  };

  // Immediate simulated Google sign in for dev preview
  const handleSimulatedGoogle = async (emailToUse: string) => {
    setError(null);
    setBusy("simulated-google");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          simulated: true,
          email: emailToUse,
          name: emailToUse.split("@")[0].replace(/[._-]/g, " "),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Google authentication failed");
      window.location.assign(data.user?.role === "ADMIN" && next === "/dashboard" ? "/admin" : next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed.");
      setBusy(null);
    }
  };

  // Demo role logins
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

  const actionText = mode === "signup" ? "Sign up with Google" : "Sign in with Google";

  return (
    <div className="space-y-5">
      {/* Primary Google Auth Button */}
      <div>
        <button
          type="button"
          onClick={handleGoogleConnect}
          disabled={Boolean(busy)}
          id="google-auth-button"
          className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-ink-200 bg-white px-5 py-3.5 text-[14.5px] font-bold text-ink-900 shadow-sm transition-all hover:border-ink-300 hover:bg-ink-50/80 hover:shadow active:scale-[0.99] disabled:opacity-60"
        >
          {busy === "google" || busy === "redirecting" || isPopupWaiting ? (
            <span className="inline-flex items-center gap-2 text-ink-600">
              <Icon name="sparkle" className="h-4 w-4 animate-spin text-volt-600" />
              {isPopupWaiting ? "Completing Google sign in in popup…" : "Connecting with Google…"}
            </span>
          ) : (
            <>
              <GoogleIcon className="h-5 w-5 flex-none" />
              <span>{actionText}</span>
            </>
          )}
        </button>

        <p className="mt-2 text-center text-[12px] text-ink-500">
          {mode === "signup"
            ? "New students automatically get access to the 3DS catalog."
            : "Use your personal or university Google Account."}
        </p>
      </div>

      {/* Error Banner */}
      {error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">
          <Icon name="shield" className="mt-0.5 h-4 w-4 flex-none text-rose-600" />
          <div className="flex-1">
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      ) : null}

      {/* If Google OAuth client is not yet configured or user toggles help */}
      {(!configured || showConfigHelp) && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sky-950">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-[13.5px] text-sky-900">
              <GoogleIcon className="h-4 w-4" />
              <span>Google Account Sign-In (Preview & Dev Mode)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowConfigHelp((v) => !v)}
              className="text-[11px] font-bold text-sky-700 underline hover:text-sky-900"
            >
              {showConfigHelp ? "Hide setup info" : "OAuth Setup Guide"}
            </button>
          </div>

          <p className="mt-1.5 text-[12.5px] leading-5 text-sky-800">
            {configured
              ? "Google OAuth client is configured. You can also test instant sign-in with your Google account below."
              : "To test Google sign-in/signup immediately in this preview without configuring Google Cloud Console, click below with your Google email:"}
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={simEmail}
              onChange={(e) => setSimEmail(e.target.value)}
              placeholder="you@gmail.com"
              className="h-9 flex-1 rounded-lg border border-sky-300 bg-white px-3 text-[13px] font-medium text-ink-900 focus:border-sky-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleSimulatedGoogle(simEmail)}
              disabled={Boolean(busy) || !simEmail}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3.5 text-[12.5px] font-bold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
            >
              <GoogleIcon className="h-3.5 w-3.5" />
              {busy === "simulated-google" ? "Authenticating…" : `Sign ${mode === "signup" ? "up" : "in"} as Google User`}
            </button>
          </div>

          {showConfigHelp && (
            <div className="mt-3.5 rounded-xl border border-sky-200 bg-white/90 p-3 text-[12px] leading-5 text-sky-900">
              <p className="font-bold text-sky-950">OAuth Setup - Required Steps:</p>
              <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                <li>
                  Open Google Cloud Console:{" "}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold underline"
                  >
                    Google Credentials
                  </a>
                </li>
                <li>Create an OAuth 2.0 Client ID (Web Application).</li>
                <li>
                  Add this callback URL to <strong>Authorized redirect URIs</strong>:
                  <code className="mt-0.5 block break-all rounded bg-sky-100 px-1.5 py-0.5 font-mono text-[11px] text-sky-900">
                    {typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "https://<app-url>/auth/callback"}
                  </code>
                </li>
                <li>
                  Set environment variables: <code className="font-mono font-bold">GOOGLE_CLIENT_ID</code> and{" "}
                  <code className="font-mono font-bold">GOOGLE_CLIENT_SECRET</code>.
                </li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Demo Roles Section */}
      {allowDemo ? (
        <div>
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-300">
            <span className="h-px flex-1 bg-ink-100" /> or explore with a demo role <span className="h-px flex-1 bg-ink-100" />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => demoLogin(acc.email)}
                disabled={Boolean(busy)}
                className="group flex flex-col items-start gap-1 rounded-xl border border-ink-200 bg-white p-3 text-left transition-colors hover:border-volt-400 hover:bg-volt-50 disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-900">
                  {busy === acc.email ? (
                    <Icon name="sparkle" className="h-3.5 w-3.5 animate-spin text-volt-500" />
                  ) : (
                    <Icon
                      name={acc.role === "ADMIN" ? "settings" : acc.role === "INSTRUCTOR" ? "video" : "book"}
                      className="h-3.5 w-3.5 text-volt-500"
                    />
                  )}
                  {acc.label}
                </span>
                <span className="break-all text-[11px] font-medium text-slate-500">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
