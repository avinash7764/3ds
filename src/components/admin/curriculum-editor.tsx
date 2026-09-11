"use client";

import { useState } from "react";
import { useAdminAction } from "@/components/admin/api";
import { ErrorNote, Field, TextArea, TextInput } from "@/components/admin/fields";
import { VideoLinkField } from "@/components/admin/video-link-field";
import { Button, Icon } from "@/components/ui";
import { minutesToHuman } from "@/lib/constants";
import { parseVideo } from "@/lib/video";
import { cn } from "@/lib/utils";

export type AdminLesson = {
  id: string;
  title: string;
  videoUrl: string | null;
  durationMins: number;
  isPreview: boolean;
  description: string | null;
  notes: string | null;
};
export type AdminModule = { id: string; title: string; summary: string | null; position: number; lessons: AdminLesson[] };

export function CurriculumEditor({ courseId, modules }: { courseId: string; modules: AdminModule[] }) {
  const { run, busy, error } = useAdminAction("/api/admin/curriculum");
  const [showNewModule, setShowNewModule] = useState(false);
  const [newModule, setNewModule] = useState({ title: "", summary: "" });

  const totals = modules.reduce(
    (acc, m) => ({ lessons: acc.lessons + m.lessons.length, minutes: acc.minutes + m.lessons.reduce((x, l) => x + (l.durationMins || 0), 0) }),
    { lessons: 0, minutes: 0 },
  );
  const missing = modules.reduce((n, m) => n + m.lessons.filter((l) => !l.videoUrl?.trim()).length, 0);

  return (
    <div className="card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight">Curriculum & lesson videos</h2>
          <p className="mt-0.5 text-[12.5px] text-slate-500">
            {modules.length} modules · {totals.lessons} lessons · {minutesToHuman(totals.minutes)}
            {missing ? <span className="ml-1.5 font-bold text-amber-600">· {missing} without a link</span> : null}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowNewModule((v) => !v)}>
          <Icon name="plus" className="h-4 w-4" /> Add module
        </Button>
      </header>

      <div className="space-y-4 p-5">
        <ErrorNote message={error} />

        {showNewModule ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await run({ action: "module.create", courseId, title: newModule.title, summary: newModule.summary });
              if (ok) {
                setNewModule({ title: "", summary: "" });
                setShowNewModule(false);
              }
            }}
            className="space-y-3 rounded-2xl border border-dashed border-volt-300 bg-volt-50/50 p-4"
          >
            <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr]">
              <Field label="Module title">
                <TextInput autoFocus required value={newModule.title} onChange={(e) => setNewModule({ ...newModule, title: e.target.value })} placeholder="Product structure done right" />
              </Field>
              <Field label="Summary (optional)">
                <TextInput value={newModule.summary} onChange={(e) => setNewModule({ ...newModule, summary: e.target.value })} placeholder="Naming, anchors, the reviewer questions" />
              </Field>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={busy || newModule.title.trim().length < 2}>
                {busy ? "Adding…" : "Create module"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewModule(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        {modules.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 px-4 py-8 text-center text-[13px] text-slate-500">
            No modules yet. Add one, then paste a YouTube or Drive link for each lesson.
          </p>
        ) : null}

        {modules.map((module, index) => (
          <ModuleEditor key={module.id} courseId={courseId} module={module} first={index === 0} last={index === modules.length - 1} />
        ))}
      </div>
    </div>
  );
}

function ModuleEditor({
  module,
  courseId,
  first,
  last,
}: {
  module: AdminModule;
  courseId: string;
  first: boolean;
  last: boolean;
}) {
  const { run, busy, error } = useAdminAction("/api/admin/curriculum");
  const [title, setTitle] = useState(module.title);
  const [summary, setSummary] = useState(module.summary ?? "");
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);

  const minutes = module.lessons.reduce((n, l) => n + (l.durationMins || 0), 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
      <div className="flex items-start gap-3 border-b border-ink-100 bg-ink-50/60 p-3.5">
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-1 inline-flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:border-volt-400"
          aria-label={open ? "Collapse module" : "Expand module"}
        >
          <Icon name="chevronRight" className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <TextInput
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
              }}
              className="h-9 min-w-[14rem] flex-1 font-bold"
            />
            <div className="flex gap-1">
              <IconBtn label="Move up" disabled={first || busy} onClick={() => run({ action: "module.move", id: module.id, dir: -1 })}>
                <Icon name="chevronDown" className="h-4 w-4 rotate-180" />
              </IconBtn>
              <IconBtn label="Move down" disabled={last || busy} onClick={() => run({ action: "module.move", id: module.id, dir: 1 })}>
                <Icon name="chevronDown" className="h-4 w-4" />
              </IconBtn>
              <IconBtn
                label="Delete module"
                danger
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Delete “${title}” and its ${module.lessons.length} lessons?`)) run({ action: "module.delete", id: module.id });
                }}
              >
                <Icon name="trash" className="h-4 w-4" />
              </IconBtn>
            </div>
          </div>
          <TextArea
            rows={1}
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
              setDirty(true);
            }}
            placeholder="Short summary shown under the module title"
            className="text-[12.5px]"
          />
          <div className="flex flex-wrap items-center gap-2 text-[11.5px] font-semibold text-slate-500">
            <span>
              {module.lessons.length} lessons · {minutesToHuman(minutes)}
            </span>
            {dirty ? (
              <button
                onClick={() =>
                  run({ action: "module.update", id: module.id, title, summary }).then((r) => r && setDirty(false))
                }
                className="inline-flex items-center gap-1 rounded-lg bg-ink-900 px-2.5 py-1 text-[11.5px] font-bold text-white hover:bg-volt-600"
              >
                {busy ? "Saving…" : "Save module"}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <Icon name="check" className="h-3 w-3" /> saved
              </span>
            )}
            <button onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1 font-bold text-ink-700 hover:border-volt-400">
              <Icon name="plus" className="h-3 w-3" /> Add lesson
            </button>
            {error ? <span className="font-bold text-rose-600">{error}</span> : null}
          </div>
        </div>
      </div>

      {open ? (
        <div className="divide-y divide-ink-100">
          {module.lessons.map((lesson, i) => (
            <LessonEditor key={lesson.id} lesson={lesson} index={i} total={module.lessons.length} />
          ))}
          {!module.lessons.length ? (
            <p className="px-4 py-6 text-center text-[12.5px] text-slate-500">This module is empty — add your first lesson.</p>
          ) : null}
          {adding ? <AddLessonForm moduleId={module.id} onDone={() => setAdding(false)} /> : null}
        </div>
      ) : null}
      <input type="hidden" value={courseId} readOnly />
    </section>
  );
}

function AddLessonForm({ moduleId, onDone }: { moduleId: string; onDone: () => void }) {
  const { run, busy, error } = useAdminAction("/api/admin/curriculum");
  const [form, setForm] = useState({ title: "", videoUrl: "", durationMins: 15, isPreview: false, description: "" });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await run({ action: "lesson.create", moduleId, ...form });
        if (res) {
          setForm({ title: "", videoUrl: "", durationMins: 15, isPreview: false, description: "" });
          onDone();
        }
      }}
      className="space-y-3 bg-ink-50/40 p-4"
    >
      <div className="grid gap-3 lg:grid-cols-[1.1fr_.9fr_auto]">
        <Field label="Lesson title">
          <TextInput autoFocus required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Insert new component: product vs part" />
        </Field>
        <div>
          <VideoLinkField value={form.videoUrl} onChange={(v) => setForm({ ...form, videoUrl: v })} compact label="YouTube / Drive link" allowUpload />
        </div>
        <Field label="Minutes" className="w-28">
          <TextInput type="number" min={0} max={1200} value={form.durationMins} onChange={(e) => setForm({ ...form, durationMins: Number(e.target.value || 0) })} />
        </Field>
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] font-semibold text-ink-700">
        <input type="checkbox" className="h-4 w-4 accent-volt-500" checked={form.isPreview} onChange={(e) => setForm({ ...form, isPreview: e.target.checked })} />
        Free preview lesson (playable before enrolling)
      </label>
      <ErrorNote message={error} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy || form.title.trim().length < 2}>
          {busy ? "Uploading…" : "Add lesson"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function LessonEditor({ lesson, index, total }: { lesson: AdminLesson; index: number; total: number }) {
  const { run, busy, error } = useAdminAction("/api/admin/curriculum");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: lesson.title,
    videoUrl: lesson.videoUrl ?? "",
    durationMins: lesson.durationMins,
    isPreview: lesson.isPreview,
    description: lesson.description ?? "",
    notes: lesson.notes ?? "",
  });
  const parsed = parseVideo(form.videoUrl);
  const dirty = JSON.stringify(form) !== JSON.stringify({ ...lesson, videoUrl: lesson.videoUrl ?? "", description: lesson.description ?? "", notes: lesson.notes ?? "" });

  return (
    <div className={cn("px-4 py-3", !lesson.videoUrl?.trim() && "bg-amber-50/40")}>
      <div className="flex items-center gap-3">
        <span className="w-6 flex-none text-right font-mono text-[11px] font-bold text-ink-400">{index + 1}</span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 text-left"
          title={lesson.videoUrl ?? "No link yet"}
        >
          <span className="block truncate text-[13.5px] font-bold text-ink-900">{lesson.title}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-slate-500">
            {lesson.videoUrl?.trim() ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  parsed.provider === "youtube" ? "bg-rose-100 text-rose-700" : parsed.provider === "drive" ? "bg-volt-100 text-volt-800" : "bg-emerald-100 text-emerald-700",
                )}
              >
                {parsed.provider}
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">needs a link</span>
            )}
            {lesson.durationMins} min{lesson.isPreview ? " · preview" : ""}
          </span>
        </button>
        <div className="flex flex-none items-center gap-1">
          <IconBtn label="Move up" disabled={index === 0 || busy} onClick={() => run({ action: "lesson.move", id: lesson.id, dir: -1 })}>
            <Icon name="chevronDown" className="h-3.5 w-3.5 rotate-180" />
          </IconBtn>
          <IconBtn label="Move down" disabled={index === total - 1 || busy} onClick={() => run({ action: "lesson.move", id: lesson.id, dir: 1 })}>
            <Icon name="chevronDown" className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn label="Edit lesson" onClick={() => setOpen((v) => !v)} active={open}>
            <Icon name="settings" className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn
            label="Delete lesson"
            danger
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Delete lesson “${lesson.title}”?`)) run({ action: "lesson.delete", id: lesson.id });
            }}
          >
            <Icon name="trash" className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>

      {open ? (
        <div className="mt-3 space-y-3 rounded-xl border border-ink-100 bg-ink-50/40 p-3.5">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
            <Field label="Title">
              <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Duration (min)">
                <TextInput type="number" min={0} max={1200} value={form.durationMins} onChange={(e) => setForm({ ...form, durationMins: Number(e.target.value || 0) })} />
              </Field>
              <Field label="Preview lesson">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isPreview: !form.isPreview })}
                  className={cn(
                    "input flex h-[42px] items-center justify-between text-[13px] font-bold",
                    form.isPreview ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "text-ink-600",
                  )}
                >
                  {form.isPreview ? "Free preview" : "Members only"}
                  <span className={cn("h-2.5 w-2.5 rounded-full", form.isPreview ? "bg-emerald-500" : "bg-ink-300")} />
                </button>
              </Field>
            </div>
          </div>

          <VideoLinkField value={form.videoUrl} onChange={(v) => setForm({ ...form, videoUrl: v })} label="Video link (YouTube / Google Drive / upload)" allowUpload />

          <Field label="Lesson description" hint="Shown under the player.">
            <TextArea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Notes / practice task" hint="One line per bullet.">
            <TextArea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>

          <ErrorNote message={error} />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={busy || !dirty}
              onClick={() => run({ action: "lesson.update", id: lesson.id, ...form, videoUrl: form.videoUrl.trim() })}
            >
              {busy ? "Saving…" : dirty ? "Save lesson" : "Saved"}
            </Button>
            {parsed.playable && form.videoUrl ? (
              <a
                href={parsed.watchUrl ?? parsed.embedUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-bold text-volt-700 hover:underline"
              >
                <Icon name="external" className="h-3.5 w-3.5" /> Open source
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-colors disabled:opacity-30",
        danger
          ? "border-rose-200 text-rose-500 hover:bg-rose-50"
          : active
            ? "border-volt-400 bg-volt-50 text-volt-700"
            : "border-ink-200 text-ink-500 hover:border-volt-400 hover:text-volt-700",
      )}
    >
      {children}
    </button>
  );
}
