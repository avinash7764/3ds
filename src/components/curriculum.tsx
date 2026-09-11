"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui";
import { minutesToHuman } from "@/lib/constants";
import { parseVideo } from "@/lib/video";
import { cn } from "@/lib/utils";
import type { CourseDetail } from "@/server/types";

type Lesson = CourseDetail["modules"][number]["lessons"][number];

/** Collapsible module list used on the sales page and in the learn sidebar. */
export function Curriculum({
  modules,
  enrolled,
  completed,
  activeLessonId,
  courseSlug,
  showProgress = false,
}: {
  modules: CourseDetail["modules"];
  enrolled: boolean;
  /** plain array (not a Set) so it can cross the server → client boundary */
  completed?: string[];
  activeLessonId?: string | null;
  courseSlug: string;
  showProgress?: boolean;
}) {
  const doneIds = useMemo(() => new Set(completed ?? []), [completed]);
  const total = modules.reduce((n, m) => n + m.lessons.length, 0);
  const [open, setOpen] = useState<Record<number, boolean>>(() => Object.fromEntries(modules.map((_, i) => [i, i === 0])));
  const allOpen = Object.values(open).every(Boolean);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-3">
        <p className="text-[13px] font-semibold text-slate-600">
          {modules.length} sections • {total} lessons • {minutesToHuman(modules.reduce((n, m) => n + m.lessons.reduce((x, l) => x + l.durationMins, 0), 0))}
        </p>
        <button
          onClick={() => setOpen(Object.fromEntries(modules.map((_, i) => [i, !allOpen])))}
          className="text-[13px] font-bold text-volt-700 hover:underline"
        >
          {allOpen ? "Collapse all sections" : "Expand all sections"}
        </button>
      </div>

      <ul className="divide-y divide-ink-100">
        {modules.map((module, index) => {
          const isOpen = open[index];
          const moduleMinutes = module.lessons.reduce((n, l) => n + l.durationMins, 0);
          const doneCount = completed ? module.lessons.filter((l) => doneIds.has(l.id)).length : 0;
          return (
            <li key={module.id} className="py-1">
              <button
                onClick={() => setOpen((prev) => ({ ...prev, [index]: !prev[index] }))}
                className="group flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-ink-50"
                aria-expanded={isOpen}
              >
                <Icon name="chevronRight" className={cn("mt-0.5 h-4 w-4 flex-none text-ink-400 transition-transform", isOpen && "rotate-90")} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold text-ink-900">{module.title}</span>
                  <span className="mt-0.5 block text-[12px] text-slate-500">
                    {module.lessons.length} lessons • {minutesToHuman(moduleMinutes)}
                    {showProgress && completed ? ` • ${doneCount}/${module.lessons.length} done` : ""}
                  </span>
                </span>
              </button>

              {isOpen ? (
                <ol className="mb-3 ml-9 space-y-0.5 border-l border-dashed border-ink-200 pl-0">
                  {module.lessons.map((lesson) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      enrolled={enrolled}
                      done={doneIds.has(lesson.id)}
                      active={activeLessonId === lesson.id}
                      href={`/learn/${courseSlug}/${lesson.id}`}
                      previewAllowed={lesson.isPreview}
                      courseSlug={courseSlug}
                    />
                  ))}
                </ol>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LessonRow({
  lesson,
  enrolled,
  done,
  active,
  href,
  previewAllowed,
  courseSlug,
}: {
  lesson: Lesson;
  enrolled: boolean;
  done?: boolean;
  active?: boolean;
  href: string;
  previewAllowed: boolean;
  courseSlug: string;
}) {
  const unlocked = enrolled || previewAllowed;
  const provider = parseVideo(lesson.videoUrl).provider;
  const inner = (
    <>
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border text-[10px] font-bold",
          done ? "border-emerald-500 bg-emerald-500 text-white" : unlocked ? "border-volt-400 text-volt-600" : "border-ink-200 text-ink-300",
        )}
      >
        {done ? <Icon name="check" className="h-3 w-3" /> : unlocked ? <Icon name="play" className="h-2.5 w-2.5" /> : <Icon name="shield" className="h-2.5 w-2.5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-[13.5px] font-semibold", active ? "text-volt-700" : "text-ink-800")}>{lesson.title}</span>
        {lesson.isPreview && !enrolled ? <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">Free preview</span> : null}
      </span>
      <span className="flex flex-none items-center gap-2 text-[12px] font-semibold text-slate-500">
        {provider === "drive" ? <Badgeish>Drive</Badgeish> : provider === "youtube" ? <Badgeish>YT</Badgeish> : null}
        {lesson.durationMins}m
      </span>
    </>
  );

  if (!unlocked) {
    return (
      <li className="flex cursor-not-allowed items-start gap-3 rounded-lg px-3 py-2 opacity-70" title="Enrol to unlock">
        {inner}
      </li>
    );
  }
  return (
    <li>
      {enrolled || previewAllowed ? (
        <Link href={href} className={cn("flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-ink-50", active && "bg-volt-50 ring-1 ring-volt-200")}>
          {inner}
        </Link>
      ) : (
        <Link href={`/courses/${courseSlug}`} className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-ink-50">
          {inner}
        </Link>
      )}
    </li>
  );
}

function Badgeish({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-500">{children}</span>;
}
