"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Curriculum } from "@/components/curriculum";
import { VideoPlayer } from "@/components/video-player";
import { Button, Icon } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { FlatLesson, Lesson, Resource, Module } from "@/server/types";

export type LearnLesson = FlatLesson;

type Props = {
  course: { id: string; slug: string; title: string; certificateOn: string | null };
  modules: (Module & { lessons: Lesson[] })[];
  flatLessons: LearnLesson[];
  lesson: LearnLesson;
  completed: string[];
  progressPct: number;
  enrolled: boolean;
  resources: Resource[];
};

export function LearnWorkspace({ course, modules, flatLessons, lesson, completed, progressPct, enrolled, resources }: Props) {
  const router = useRouter();
  const [done, setDone] = useState<Set<string>>(() => new Set(completed));
  const [pct, setPct] = useState(progressPct);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const beat = useRef<number | null>(null);

  const index = useMemo(() => flatLessons.findIndex((l) => l.id === lesson.id), [flatLessons, lesson.id]);
  const next = flatLessons[index + 1] ?? null;
  const prev = flatLessons[index - 1] ?? null;

  useEffect(() => {
    setDone(new Set(completed));
    setPct(progressPct);
  }, [completed, progressPct, lesson.id]);

  useEffect(() => {
    const stored = localStorage.getItem("3ds.autoAdvance");
    if (stored) setAutoAdvance(stored === "1");
  }, []);

  useEffect(() => {
    localStorage.setItem("3ds.autoAdvance", autoAdvance ? "1" : "0");
  }, [autoAdvance]);

  const post = useCallback(
    async (payload: Record<string, unknown>) => {
      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not save progress");
        if (typeof data.progressPct === "number") setPct(data.progressPct);
        if (data.status === "COMPLETED") setFlash("Course complete — your certificate is ready in the dashboard 🎉");
        return data;
      } catch (err) {
        setFlash(err instanceof Error ? err.message : "Progress not saved");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const isDone = done.has(lesson.id);

  function toggleComplete(advance = false) {
    if (!enrolled) return;
    const target = !isDone;
    setSaving(true);
    setDone((prevSet) => {
      const copy = new Set(prevSet);
      if (target) copy.add(lesson.id);
      else copy.delete(lesson.id);
      return copy;
    });
    void post({ lessonId: lesson.id, completed: target }).then(() => {
      if (target && advance && next) router.push(`/learn/${course.slug}/${next.id}`);
      else if (target && advance && !next) router.refresh();
      else if (target && autoAdvance && next) router.push(`/learn/${course.slug}/${next.id}`);
    });
  }

  function heartbeat(secs: number) {
    if (!enrolled) return;
    if (beat.current === secs) return;
    beat.current = secs;
    void post({ lessonId: lesson.id, watchedSecs: secs });
  }

  // Keyboard shortcuts: ← previous, → next, c toggle-complete.
  // Deliberately re-bound when the neighbouring lessons / enrolment state change.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      if (e.key === "ArrowRight" && next) router.push(`/learn/${course.slug}/${next.id}`);
      if (e.key === "ArrowLeft" && prev) router.push(`/learn/${course.slug}/${prev.id}`);
      if (e.key.toLowerCase() === "c") toggleComplete(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next, prev, isDone, enrolled, autoAdvance]);

  return (
    <div className="container-x grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-8">
      {/* ------------------------------ player column ------------------------------ */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">
              <Link href="/dashboard" className="inline-flex items-center gap-1 hover:text-volt-700">
                <Icon name="grid" className="h-3.5 w-3.5" /> Dashboard
              </Link>
              <span className="text-ink-200">/</span>
              <Link href={`/courses/${course.slug}`} className="truncate hover:text-volt-700">
                {course.title}
              </Link>
            </p>
            <h1 className="mt-1.5 truncate text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">{lesson.title}</h1>
            <p className="mt-1 text-[13px] text-slate-500">
              {lesson.moduleTitle} · lesson {index + 1} of {flatLessons.length} · {lesson.durationMins} min
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer select-none items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-[12px] font-bold text-ink-700">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="h-3.5 w-3.5 accent-volt-500"
              />
              Auto-advance
            </label>
            <div className="hidden text-right sm:block">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Course</p>
              <p className="text-sm font-extrabold text-ink-900">{Math.round(pct)}%</p>
            </div>
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-100">
          <div className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-emerald-500" : "bg-volt-500")} style={{ width: `${pct}%` }} />
        </div>

        <div className="mt-4">
          <VideoPlayer
            url={lesson.videoUrl}
            title={lesson.title}
            onHeartbeat={heartbeat}
            onEnded={() => {
              if (autoAdvance && !isDone) toggleComplete(true);
            }}
          />
        </div>

        <div className="card mt-4 flex flex-wrap items-center gap-3 p-4">
          {enrolled ? (
            <>
              <Button variant={isDone ? "outline" : "volt"} size="md" onClick={() => toggleComplete(false)} disabled={saving}>
                <Icon name={isDone ? "check" : "check"} className={cn("h-4 w-4", isDone && "text-emerald-600")} />
                {saving ? "Saving…" : isDone ? "Lesson completed" : "Mark as complete"}
              </Button>
              {next ? (
                <Button variant="primary" size="md" onClick={() => toggleComplete(true)} disabled={saving}>
                  {isDone ? "Next lesson" : "Complete & continue"} <Icon name="arrowRight" className="h-4 w-4" />
                </Button>
              ) : (
                <LinkButtonLike href="/dashboard" label="Back to dashboard" />
              )}
            </>
          ) : (
            <p className="flex flex-wrap items-center gap-3 text-[13px] font-semibold text-slate-600">
              This is a free preview lesson.
              <LinkButtonLike href={`/courses/${course.slug}`} label="Enrol to unlock everything" />
            </p>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href={prev ? `/learn/${course.slug}/${prev.id}` : "#"}
              aria-label="Previous lesson"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-700 transition-colors",
                prev ? "hover:border-volt-400" : "cursor-not-allowed opacity-40",
              )}
            >
              <Icon name="chevronRight" className="h-4 w-4 rotate-180" />
            </Link>
            <Link
              href={next ? `/learn/${course.slug}/${next.id}` : "#"}
              aria-label="Next lesson"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-700 transition-colors",
                next ? "hover:border-volt-400" : "cursor-not-allowed opacity-40",
              )}
            >
              <Icon name="chevronRight" className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {flash ? <p className="mt-3 rounded-xl border border-volt-200 bg-volt-50 px-4 py-2.5 text-[13px] font-semibold text-volt-800">{flash}</p> : null}

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <section className="card p-5">
            <h2 className="text-[15px] font-bold text-ink-900">About this lesson</h2>
            {lesson.description ? <p className="mt-2 text-[14px] leading-7 text-slate-600">{lesson.description}</p> : null}
            {lesson.notes ? (
              <>
                <h3 className="mt-4 text-[13px] font-bold uppercase tracking-wide text-ink-400">Notes</h3>
                <ul className="mt-2 space-y-2">
                  {lesson.notes
                    .split(/\n+/)
                    .map((n) => n.trim())
                    .filter(Boolean)
                    .map((n, i) => (
                      <li key={i} className="flex gap-2 text-[13.5px] leading-6 text-slate-600">
                        <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-volt-400" /> {n}
                      </li>
                    ))}
                </ul>
              </>
            ) : null}
            <p className="mt-4 text-[12px] text-slate-400">
              Shortcuts: <kbd className="rounded border border-ink-200 px-1 font-mono">←</kbd>{" "}
              <kbd className="rounded border border-ink-200 px-1 font-mono">→</kbd> move between lessons,{" "}
              <kbd className="rounded border border-ink-200 px-1 font-mono">c</kbd> toggle complete
            </p>
          </section>

          <section className="card p-5">
            <h2 className="text-[15px] font-bold text-ink-900">Lesson files</h2>
            {resources.length ? (
              <ul className="mt-3 space-y-2.5">
                {resources.map((r) => (
                  <li key={r.id}>
                    <a href={r.url} target="_blank" rel="noreferrer" className="group flex items-start gap-3 rounded-xl border border-ink-100 p-3 hover:border-volt-300">
                      <Icon name={r.kind === "DRIVE" ? "layers" : "download"} className="mt-0.5 h-4 w-4 flex-none text-volt-500" />
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-bold text-ink-900 group-hover:text-volt-700">{r.title}</span>
                        <span className="block text-[11.5px] text-slate-500">{r.kind}{r.sizeText ? ` · ${r.sizeText}` : ""}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[13px] leading-6 text-slate-500">
                No files for this lesson yet. Course-level handbooks live on the course page under “Resources & handbooks”.
              </p>
            )}
            {enrolled && pct >= 100 ? (
              <Link href="/dashboard/certificates" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-600 hover:underline">
                <Icon name="award" className="h-4 w-4" /> Certificate unlocked
              </Link>
            ) : null}
          </section>
        </div>

        {next ? (
          <Link
            href={`/learn/${course.slug}/${next.id}`}
            className="card mt-5 flex items-center justify-between gap-4 p-5 transition-colors hover:border-volt-300"
          >
            <span className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">Up next</span>
              <span className="mt-1 block truncate text-[15px] font-bold text-ink-900">{next.title}</span>
              <span className="text-[12px] text-slate-500">{next.moduleTitle} · {next.durationMins} min</span>
            </span>
            <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-ink-900 text-volt-300">
              <Icon name="arrowRight" className="h-4 w-4" />
            </span>
          </Link>
        ) : (
          <div className="card mt-5 border-emerald-200 bg-emerald-50/70 p-5">
            <p className="text-[15px] font-bold text-emerald-900">That's the last lesson 🎉</p>
            <p className="mt-1.5 text-[13.5px] leading-6 text-emerald-800">
              {pct >= 100
                ? "Mark everything complete and your certificate is generated automatically."
                : "Mark the remaining lessons complete to unlock your certificate."}
            </p>
            <Link
              href="/dashboard/certificates"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-emerald-700"
            >
              Go to certificates <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* -------------------------------- sidebar -------------------------------- */}
      <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1 scrollbar-thin">
        <div className="card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">Curriculum</p>
            <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-bold text-ink-600">
              {done.size}/{flatLessons.length}
            </span>
          </div>
          <div className="mt-3">
            <Curriculum
              modules={modules}
              enrolled={enrolled}
              completed={[...done]}
              activeLessonId={lesson.id}
              courseSlug={course.slug}
              showProgress
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

function LinkButtonLike({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-800 hover:border-volt-400">
      {label} <Icon name="arrowRight" className="h-4 w-4" />
    </Link>
  );
}
