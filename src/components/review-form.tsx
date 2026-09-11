"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { cn } from "@/lib/utils";

export function ReviewForm({ courseSlug, initial }: { courseSlug: string; initial?: { rating: number; comment: string } }) {
  const router = useRouter();
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseSlug, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save your review");
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5">
      <h4 className="text-[15px] font-bold text-ink-900">{initial ? "Update your review" : "Rate this course"}</h4>
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} className="p-0.5">
            <svg viewBox="0 0 20 20" className={cn("h-6 w-6 transition-transform hover:scale-110", n <= rating ? "text-amber-400" : "text-ink-200")} fill="currentColor">
              <path d="M10 1.6l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.5 7.8l5.9-.9z" />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-[12px] font-semibold text-slate-500">{rating}.0 / 5</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        required
        minLength={8}
        placeholder="What clicked for you? What should the next lesson cover?"
        className="input mt-3 resize-y"
      />
      {error ? <p className="mt-2 text-[12px] font-semibold text-rose-600">{error}</p> : null}
      <div className="mt-3 flex items-center gap-3">
        <Button size="md" type="submit" disabled={busy}>
          {busy ? "Saving…" : initial ? "Update review" : "Post review"}
        </Button>
        {done ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600">
            <Icon name="check" className="h-4 w-4" /> Thanks — your review is live
          </span>
        ) : null}
      </div>
    </form>
  );
}
