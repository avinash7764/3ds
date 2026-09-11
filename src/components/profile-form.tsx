"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Icon } from "@/components/ui";

export function ProfileForm({ initial }: { initial: { name: string; headline: string; bio: string } }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save your profile");
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="pf-name">Display name</label>
        <input id="pf-name" className="input" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name (appears on certificates)" />
      </div>
      <div>
        <label className="label" htmlFor="pf-headline">Headline</label>
        <input id="pf-headline" className="input" value={form.headline} maxLength={120} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="B.E. Mechanical, final year" />
      </div>
      <div>
        <label className="label" htmlFor="pf-bio">Short bio</label>
        <textarea id="pf-bio" className="input resize-y" rows={3} maxLength={400} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="What you're building or learning right now" />
      </div>
      {error ? <p className="text-[12px] font-semibold text-rose-600">{error}</p> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save profile"}
        </Button>
        {saved ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600">
            <Icon name="check" className="h-4 w-4" /> Saved
          </span>
        ) : null}
      </div>
    </form>
  );
}
