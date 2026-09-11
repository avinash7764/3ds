"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { VideoLinkField } from "@/components/admin/video-link-field";
import { ErrorNote, Field, Select, TextArea, TextInput, Toggle } from "@/components/admin/fields";
import { Button, Icon } from "@/components/ui";
import { CATEGORIES, LEVELS, slugify } from "@/lib/constants";
import { priceFmt } from "@/lib/utils";

export function CreateCourseForm({ instructors }: { instructors: { id: string; name: string | null; email: string }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    category: "Design" as string,
    level: "Beginner" as string,
    language: "English",
    price: 0,
    mrpPrice: 0,
    thumbnail: "",
    heroVideoUrl: "",
    tags: "",
    description: "",
    whatYouLearn: "",
    requirements: "",
    published: false,
    instructorId: instructors[0]?.id ?? "",
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const slug = useMemo(() => slugify(form.title), [form.title]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "create", ...form, certificateOn: form.title.split(":")[0] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the course");
      router.push(`/admin/courses/${data.course.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the course");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <div className="card space-y-4 p-5">
          <h2 className="text-[15px] font-bold">1 · Basics</h2>
          <Field label="Course title" hint={`Students will see this in the catalogue. URL: /courses/${slug || "…"}`}>
            <TextInput required minLength={4} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="CATIA Assembly Design on 3DEXPERIENCE" />
          </Field>
          <Field label="One-line subtitle" hint="Shown under the title on cards and the course page.">
            <TextInput value={form.subtitle} maxLength={220} onChange={(e) => set("subtitle", e.target.value)} placeholder="Constrain, analyse clashes, then drive the mechanism." />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Track">
              <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Level">
              <Select value={form.level} onChange={(e) => set("level", e.target.value)}>
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </Select>
            </Field>
            <Field label="Language">
              <TextInput value={form.language} onChange={(e) => set("language", e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price (₹)" hint="0 = free course">
              <TextInput type="number" min={0} step={100} value={form.price} onChange={(e) => set("price", Number(e.target.value || 0))} />
            </Field>
            <Field label="Compare-at price (₹)" hint={form.mrpPrice > form.price ? `${priceFmt(form.mrpPrice)} struck through` : "Optional"}>
              <TextInput type="number" min={0} step={100} value={form.mrpPrice} onChange={(e) => set("mrpPrice", Number(e.target.value || 0))} />
            </Field>
            <Field label="Tags" hint="Comma separated">
              <TextInput value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="CATIA, Assembly, DMU" />
            </Field>
          </div>
          <Field label="Mentor">
            <Select value={form.instructorId} onChange={(e) => set("instructorId", e.target.value)}>
              <option value="">Unassigned</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name ?? i.email}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="card space-y-4 p-5">
          <h2 className="text-[15px] font-bold">2 · Description & outcomes</h2>
          <Field label="Long description" hint="Markdown-ish: ## headings, - bullets, **bold**, [links](https://…)">
            <TextArea rows={7} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={"Who is this for?\n\nWhat you will build\n\n- a gearbox housing\n- a bolted joint"} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What you'll learn" hint="One bullet per line">
              <TextArea rows={5} value={form.whatYouLearn} onChange={(e) => set("whatYouLearn", e.target.value)} placeholder={"Product structure\nQuick assembly\nClash studies"} />
            </Field>
            <Field label="Requirements" hint="One per line">
              <TextArea rows={5} value={form.requirements} onChange={(e) => set("requirements", e.target.value)} placeholder={"CATIA V5 R21+\nBasic sketching"} />
            </Field>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="card space-y-4 p-5">
          <h2 className="text-[15px] font-bold">3 · Trailer & thumbnail</h2>
          <VideoLinkField value={form.heroVideoUrl} onChange={(v) => set("heroVideoUrl", v)} label="Trailer link (YouTube or Drive)" />
          <Field label="Thumbnail URL" hint="Leave empty to reuse the YouTube thumbnail automatically.">
            <TextInput value={form.thumbnail} onChange={(e) => set("thumbnail", e.target.value)} placeholder="https://…/cover.jpg" />
          </Field>
          <div className="overflow-hidden rounded-xl border border-ink-100 bg-ink-950">
            {form.thumbnail || form.heroVideoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.thumbnail || `https://i.ytimg.com/vi/${/v=([\w-]{11})/.exec(form.heroVideoUrl)?.[1] ?? ""}/hqdefault.jpg`}
                alt="Card preview"
                className="aspect-video w-full object-cover"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center text-[12px] font-semibold text-ink-400">Card preview appears here</div>
            )}
          </div>
        </div>

        <div className="card space-y-3 p-5">
          <h2 className="text-[15px] font-bold">4 · Publish</h2>
          <Toggle checked={form.published} onChange={(v) => set("published", v)} label="Publish immediately" hint="Otherwise it stays a draft only admins can open." />
          <ErrorNote message={error} />
          <Button type="submit" size="lg" className="w-full" disabled={busy || form.title.trim().length < 4}>
            {busy ? "Creating…" : "Create course & add lessons"} <Icon name="arrowRight" className="h-4 w-4" />
          </Button>
          <button type="button" onClick={() => router.push("/admin/courses")} className="w-full rounded-xl px-3 py-2 text-[13px] font-bold text-ink-500 hover:bg-ink-50">
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
