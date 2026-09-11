"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Icon, LinkButton } from "@/components/ui";
import { priceFmt } from "@/lib/utils";

/**
 * Enrolment CTA. Paid courses run through a clearly-marked demo checkout (no gateway keys
 * are required to demo the full student experience); swap `POST /api/enroll` for your
 * gateway callback when going live.
 */
export function EnrollButton({
  courseSlug,
  price,
  enrolled,
  continueHref,
  signedIn,
  title,
}: {
  courseSlug: string;
  price: number;
  enrolled: boolean;
  continueHref?: string | null;
  signedIn: boolean;
  title: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState(false);

  async function enroll() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseSlug, action: "enroll" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not enrol you right now");
      setCheckout(false);
      router.refresh();
      if (continueHref) router.push(continueHref);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!signedIn) {
    return (
      <LinkButton href={`/login?next=/courses/${courseSlug}`} size="lg" className="w-full">
        <GoogleGlyph /> Sign in with Google to enrol
      </LinkButton>
    );
  }

  if (enrolled) {
    return (
      <div className="space-y-2">
        <LinkButton href={continueHref ?? `/courses/${courseSlug}`} size="lg" variant="volt" className="w-full">
          Continue learning <Icon name="arrowRight" className="h-4 w-4" />
        </LinkButton>
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600">
          <Icon name="check" className="h-3.5 w-3.5" /> You are enrolled in this course
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button size="lg" className="w-full" disabled={busy} onClick={() => (price > 0 ? setCheckout(true) : enroll())}>
        {busy ? "Enrolling…" : price > 0 ? `Enrol — ${priceFmt(price)}` : "Start this free course"}
        <Icon name="arrowRight" className="h-4 w-4" />
      </Button>
      {error ? <p className="text-[12px] font-semibold text-rose-600">{error}</p> : null}
      <p className="text-center text-[11px] text-slate-500">Lifetime access · Certificate on completion · 7-day refund</p>

      {checkout ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink-950/60 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
          <div className="card w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
              <div>
                <p className="text-sm font-bold text-ink-900">Demo checkout</p>
                <p className="text-[11px] text-slate-500">No payment is taken — swap in your gateway later</p>
              </div>
              <button onClick={() => setCheckout(false)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50" aria-label="Close">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-xl bg-ink-50 p-3">
                <p className="line-clamp-2 text-sm font-bold text-ink-900">{title}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {priceFmt(price)} one-time · includes certificate, resources & lifetime updates
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[12px] font-semibold text-ink-700">
                <span className="rounded-xl border border-ink-200 px-3 py-2">UPI / Netbanking</span>
                <span className="rounded-xl border border-ink-200 px-3 py-2">Card</span>
              </div>
              <Button className="w-full" size="lg" onClick={enroll} disabled={busy}>
                {busy ? "Processing…" : `Pay ${priceFmt(price)} & enrol`}
              </Button>
              <p className="text-[11px] leading-5 text-slate-500">
                This button calls <code className="font-mono">POST /api/enroll</code>, which writes the enrolment row and immediately unlocks
                every lesson — wire it to Razorpay/Stripe before production.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 7.5 29.5 5.5 24 5.5 16.3 5.5 9.7 10 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 42.5c5.4 0 10.3-2.1 13.9-5.5l-6.4-5.4C29.6 32.9 26.9 34 24 34c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 37.9 16.2 42.5 24 42.5z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.4 5.4C41.4 35.6 43.5 30.2 43.5 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}
