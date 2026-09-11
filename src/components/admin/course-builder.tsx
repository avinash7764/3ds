"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminAction } from "@/components/admin/api";
import { CurriculumEditor, type AdminModule } from "@/components/admin/curriculum-editor";
import { ErrorNote, Field, Panel, Select, TextArea, TextInput, Toggle } from "@/components/admin/fields";
import { UploadButton } from "@/components/admin/upload-button";
import { VideoLinkField } from "@/components/admin/video-link-field";
import { Badge, Button, Icon, ProgressBar } from "@/components/ui";
import { CATEGORIES, KINDS, LEVELS, formatDate, minutesToHuman } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type BuilderCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  whatYouLearn: string | null;
  requirements: string | null;
  level: string;
  category: string;
  language: string;
  thumbnail: string | null;
  heroVideoUrl: string | null;
  price: number;
  mrpPrice: number;
  published: boolean;
  featured: boolean;
  certificateOn: string | null;
  tags: string | null;
  instructorId: string | null;
  durationMins: number;
  lessonCount: number;
  studentCount: number;
  modules: AdminModule[];
  resources: { id: string; title: string; url: string; kind: string; sizeText: string | null; lessonId: string | null }[];
  faqs: { id: string; question: string; answer: string }[];
  students: {
    id: string;
    userId: string;
    name: string | null;
    email: string;
    lessonsDone: number;
    total: number;
    progressPct: number;
    status: string;
    enrolledAt: string;
  }[];
};

export function CourseBuilder({ course, instructors }: { course: BuilderCourse; instructors: { id: string; name: string | null; email: string }[] }) {
  return (
    <div className="space-y-6">
      <CurriculumEditor courseId={course.id} modules={course.modules} />
      <div className="grid gap-6 xl:grid-cols-2">
        <ResourcesPanel courseId={course.id} resources={course.resources} />
        <FaqPanel courseId={course.id} faqs={course.faqs} />
      </div>
      <StudentsPanel courseId={course.id} students={course.students} lessonCount={course.lessonCount} />
      <span className="hidden">{course.durationMins}</span>
    </div>
  );
}

/* ----------------------------- details (exported) ----------------------------- */

export function CourseDetailsForm({ course, instructors }: { course: BuilderCourse; instructors: { id: string; name: string | null; email: string }[] }) {
  const { run, busy, error, setError } = useAdminAction("/api/admin/courses");
  const [form, setForm] = useState({
    title: course.title,
    subtitle: course.subtitle ?? "",
    description: course.description,
    whatYouLearn: course.whatYouLearn ?? "",
    requirements: course.requirements ?? "",
    level: course.level,
    category: course.category,
    language: course.language,
    thumbnail: course.thumbnail ?? "",
    heroVideoUrl: course.heroVideoUrl ?? "",
    price: course.price,
    mrpPrice: course.mrpPrice,
    certificateOn: course.certificateOn ?? "",
    tags: course.tags ?? "",
    instructorId: course.instructorId ?? "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const [saved, setSaved] = useState(false);

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const res = await run({ action: "update", id: course.id, ...form, published: course.published, featured: course.featured });
    if (res) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <Panel
        title="Course details"
        lead="Catalogue card, sales page and certificate text."
        actions={
          <div className="flex items-center gap-2">
            {saved ? (
              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-600">
                <Icon name="check" className="h-3.5 w-3.5" /> Saved
              </span>
            ) : null}
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Saving…" : "Save details"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <ErrorNote message={error} />
          <Field label="Title">
            <TextInput value={form.title} onChange={(e) => set("title", e.target.value)} required minLength={4} />
          </Field>
          <Field label="Subtitle">
            <TextInput value={form.subtitle} maxLength={220} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-4">
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
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Price (₹)">
              <TextInput type="number" min={0} step={100} value={form.price} onChange={(e) => set("price", Number(e.target.value || 0))} />
            </Field>
            <Field label="Compare-at (₹)">
              <TextInput type="number" min={0} step={100} value={form.mrpPrice} onChange={(e) => set("mrpPrice", Number(e.target.value || 0))} />
            </Field>
            <Field label="Tags" className="sm:col-span-2">
              <TextInput value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="CATIA, Assembly" />
            </Field>
          </div>
          <Field label="Certificate line" hint="Printed on the certificate as “completed …”.">
            <TextInput value={form.certificateOn} onChange={(e) => set("certificateOn", e.target.value)} />
          </Field>
          <Field label="Thumbnail URL" hint="Empty = YouTube thumbnail from the trailer link.">
            <TextInput value={form.thumbnail} onChange={(e) => set("thumbnail", e.target.value)} placeholder="https://…" />
          </Field>
          <VideoLinkField value={form.heroVideoUrl} onChange={(v) => set("heroVideoUrl", v)} label="Trailer link (YouTube / Drive)" allowUpload courseId={course.id} />
        </div>
      </Panel>

      <Panel title="Description & outcomes" lead="Markdown-ish text; bullets become checkmarked cards.">
        <div className="space-y-4">
          <Field label="Long description">
            <TextArea rows={9} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What you'll learn (one per line)">
              <TextArea rows={6} value={form.whatYouLearn} onChange={(e) => set("whatYouLearn", e.target.value)} />
            </Field>
            <Field label="Requirements (one per line)">
              <TextArea rows={6} value={form.requirements} onChange={(e) => set("requirements", e.target.value)} />
            </Field>
          </div>
        </div>
      </Panel>
    </form>
  );
}

/* ------------------------------- status panel ------------------------------- */

export function CourseStatusPanel({ course }: { course: BuilderCourse }) {
  const router = useRouter();
  const { run, busy, error } = useAdminAction("/api/admin/courses");

  return (
    <Panel title="Status" lead="Controls who can see this course.">
      <div className="space-y-3">
        <Toggle
          checked={course.published}
          onChange={(v) => run({ action: v ? "publish" : "unpublish", id: course.id }).then(() => router.refresh())}
          label={course.published ? "Published to the catalogue" : "Draft — admin only"}
          hint="Students see only published courses."
        />
        <Toggle
          checked={course.featured}
          onChange={(v) => run({ action: v ? "feature" : "unfeature", id: course.id }).then(() => router.refresh())}
          label="Featured on the home page"
          hint="Featured courses get the ★ badge and lead the grid."
        />
        <ErrorNote message={error} />

        <div className="rounded-xl bg-ink-50 p-3.5 text-[12.5px] leading-6 text-slate-600">
          <p className="flex items-center justify-between">
            <span>Lessons</span>
            <strong className="text-ink-900">{course.lessonCount}</strong>
          </p>
          <p className="flex items-center justify-between">
            <span>Total runtime</span>
            <strong className="text-ink-900">{minutesToHuman(course.durationMins)}</strong>
          </p>
          <p className="flex items-center justify-between">
            <span>Enrolled learners</span>
            <strong className="text-ink-900">{course.studentCount}</strong>
          </p>
          <p className="flex items-center justify-between">
            <span>URL</span>
            <code className="font-mono text-[11.5px] text-ink-700">/courses/{course.slug}</code>
          </p>
        </div>

        <div className="grid gap-2">
          <Link
            href={`/courses/${course.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white text-[13px] font-bold text-ink-800 hover:border-volt-400"
          >
            <Icon name="eye" className="h-4 w-4" /> Preview public page
          </Link>
          <button
            disabled={busy}
            onClick={async () => {
              if (!window.confirm(`Delete “${course.title}” permanently? Lessons, enrolments and certificates go with it.`)) return;
              const ok = await run({ action: "delete", id: course.id }, { refresh: false });
              if (ok) router.push("/admin/courses");
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-[13px] font-bold text-rose-700 hover:bg-rose-100"
          >
            <Icon name="trash" className="h-4 w-4" /> Delete course
          </button>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------ resources panel ------------------------------ */

function ResourcesPanel({ courseId, resources }: { courseId: string; resources: BuilderCourse["resources"] }) {
  const { run, busy, error } = useAdminAction("/api/admin/curriculum");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", url: "", kind: "DRIVE", sizeText: "" });

  return (
    <Panel
      title={`Resources (${resources.length})`}
      lead="Handbooks, practice files, Drive folders — links only, so nothing to host."
      actions={
        <Button variant="outline" size="sm" onClick={() => setAdding((v) => !v)}>
          <Icon name="plus" className="h-4 w-4" /> Add link
        </Button>
      }
    >
      <div className="space-y-3">
        {adding ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await run({ action: "resource.create", courseId, ...form });
              if (ok) {
                setForm({ title: "", url: "", kind: "DRIVE", sizeText: "" });
                setAdding(false);
              }
            }}
            className="space-y-3 rounded-xl border border-dashed border-volt-300 bg-volt-50/50 p-3.5"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title">
                <TextInput autoFocus required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Lesson 4 workbook (PDF)" />
              </Field>
              <Field label="Kind">
                <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                  {KINDS.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Link" hint="Google Drive share link, PDF URL, playlist…">
              <TextInput required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://drive.google.com/file/d/…/view?usp=sharing" />
            </Field>
            <Field label="Note (optional)">
              <TextInput value={form.sizeText} onChange={(e) => setForm({ ...form, sizeText: e.target.value })} placeholder="ZIP · 84 MB" />
            </Field>
            <UploadButton
              accept=".pdf,.zip,.png,.jpg,.webp,.csv,.docx,.pptx,video/mp4"
              label="Upload a file and use its link"
              hint="stored in public/uploads — swap the route for S3/GCS in production"
              onUploaded={({ url, name, sizeText }) => setForm({ title: name.replace(/\.[a-z0-9]+$/i, "").replace(/-/g, " "), url, kind: url.endsWith(".pdf") ? "PDF" : "DRIVE", sizeText })}
            />
            <ErrorNote message={error} />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={busy}>
                {busy ? "Saving…" : "Attach resource"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        {resources.length ? (
          <ul className="divide-y divide-ink-100">
            {resources.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2.5">
                <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-ink-50 text-ink-500">
                  <Icon name={r.kind === "DRIVE" ? "layers" : r.kind === "PDF" ? "download" : "external"} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-ink-900">{r.title}</p>
                  <p className="truncate text-[11.5px] text-slate-500">
                    {r.kind}
                    {r.sizeText ? ` · ${r.sizeText}` : ""} · {r.url.replace(/^https?:\/\//, "").slice(0, 60)}
                  </p>
                </div>
                <a href={r.url} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-volt-700" title="Open">
                  <Icon name="external" className="h-4 w-4" />
                </a>
                <button
                  onClick={() => run({ action: "resource.delete", id: r.id })}
                  className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                  title="Delete"
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-[13px] text-slate-500">No attachments yet.</p>
        )}
      </div>
    </Panel>
  );
}

/* --------------------------------- faq panel -------------------------------- */

function FaqPanel({ courseId, faqs }: { courseId: string; faqs: BuilderCourse["faqs"] }) {
  const { run, busy, error } = useAdminAction("/api/admin/curriculum");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ question: "", answer: "" });

  return (
    <Panel
      title={`FAQ (${faqs.length})`}
      lead="Answer the questions that stop students from enrolling."
      actions={
        <Button variant="outline" size="sm" onClick={() => setAdding((v) => !v)}>
          <Icon name="plus" className="h-4 w-4" /> Add question
        </Button>
      }
    >
      <div className="space-y-3">
        {adding ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await run({ action: "faq.create", courseId, ...form });
              if (ok) {
                setForm({ question: "", answer: "" });
                setAdding(false);
              }
            }}
            className="space-y-3 rounded-xl border border-dashed border-volt-300 bg-volt-50/50 p-3.5"
          >
            <Field label="Question">
              <TextInput autoFocus required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Do I need a CATIA licence?" />
            </Field>
            <Field label="Answer">
              <TextArea rows={3} required value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
            </Field>
            <ErrorNote message={error} />
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Saving…" : "Add FAQ"}
            </Button>
          </form>
        ) : null}

        {faqs.length ? (
          <ul className="space-y-2">
            {faqs.map((f) => (
              <li key={f.id} className="flex items-start gap-3 rounded-xl border border-ink-100 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-ink-900">{f.question}</p>
                  <p className="mt-1 text-[12.5px] leading-6 text-slate-600">{f.answer}</p>
                </div>
                <button onClick={() => run({ action: "faq.delete", id: f.id })} className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-50" title="Delete">
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-[13px] text-slate-500">No FAQs yet.</p>
        )}
      </div>
    </Panel>
  );
}

/* ------------------------------- students panel ------------------------------ */

function StudentsPanel({ courseId, students, lessonCount }: { courseId: string; students: BuilderCourse["students"]; lessonCount: number }) {
  const { run, busy, error } = useAdminAction("/api/admin/students");
  const [email, setEmail] = useState("");
  const [q, setQ] = useState("");

  const filtered = students.filter((s) => !q || `${s.name ?? ""} ${s.email}`.toLowerCase().includes(q.toLowerCase()));
  const avg = students.length ? students.reduce((n, s) => n + s.progressPct, 0) / students.length : 0;

  return (
    <Panel
      title={`Enrolled learners (${students.length})`}
      lead="Enrol someone by email, reset their progress, or remove them — certificates follow automatically."
      actions={<Badge tone="volt">avg {Math.round(avg)}% · {lessonCount} lessons each</Badge>}
    >
      <div className="space-y-4">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await run({ action: "enroll", courseId, email });
            if (ok) setEmail("");
          }}
          className="flex flex-wrap gap-2"
        >
          <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@gmail.com — creates the account if new" className="max-w-sm flex-1" />
          <Button type="submit" size="md" disabled={busy}>
            <Icon name="plus" className="h-4 w-4" /> Enrol learner
          </Button>
        </form>
        {error ? <p className="text-[12px] font-bold text-rose-600">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-2">
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name or email…" className="max-w-xs" />
          <p className="text-[12px] text-slate-500">{filtered.length} shown</p>
        </div>

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-[13px]">
              <thead className="text-[11px] uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="py-2 font-bold">Learner</th>
                  <th className="py-2 font-bold">Progress</th>
                  <th className="py-2 font-bold">Enrolled</th>
                  <th className="py-2 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5">
                      <p className="font-bold text-ink-900">{s.name ?? "—"}</p>
                      <p className="text-[11.5px] text-slate-500">{s.email}</p>
                    </td>
                    <td className="w-48 py-2.5">
                      <ProgressBar value={s.progressPct} showLabel />
                      <p className="mt-1 text-[11px] text-slate-500">
                        {s.lessonsDone}/{s.total} lessons {s.status === "COMPLETED" ? "· certified" : ""}
                      </p>
                    </td>
                    <td className="py-2.5 text-[12px] text-slate-500">{formatDate(s.enrolledAt)}</td>
                    <td className="py-2.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => window.confirm(`Reset all lesson progress for ${s.email}?`) && run({ action: "reset", courseId, userId: s.userId })}
                          className="rounded-lg border border-ink-200 px-2 py-1 text-[11.5px] font-bold text-ink-600 hover:border-volt-400"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => window.confirm(`Remove ${s.email} from this course?`) && run({ action: "unenroll", courseId, userId: s.userId })}
                          className="rounded-lg border border-rose-200 px-2 py-1 text-[11.5px] font-bold text-rose-600 hover:bg-rose-50"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={cn("py-6 text-center text-[13px] text-slate-500", !students.length && "py-10")}>
            {students.length ? "No learner matches that filter." : "Nobody enrolled yet — add your class email list above."}
          </p>
        )}
      </div>
    </Panel>
  );
}
