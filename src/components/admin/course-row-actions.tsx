"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/utils";

type RowCourse = { id: string; slug: string; title: string; published: boolean; featured: boolean; lessonCount: number };

export function AdminCourseRowActions({ course }: { course: RowCourse }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "publish" | "unpublish" | "feature" | "unfeature" | "delete") {
    if (action === "delete" && !window.confirm(`Delete “${course.title}” with all ${course.lessonCount} lessons, enrolments and certificates? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, id: course.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1.5">
        <Link
          href={`/admin/courses/${course.id}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ink-900 px-2.5 text-[12px] font-bold text-white hover:bg-volt-600"
        >
          <Icon name="settings" className="h-3.5 w-3.5" /> Edit
        </Link>
        <button
          disabled={busy}
          onClick={() => act(course.published ? "unpublish" : "publish")}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-bold transition-colors",
            course.published ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
          )}
          title={course.published ? "Students can see this course" : "Hidden from the catalogue"}
        >
          {course.published ? "Published" : "Draft"}
        </button>
        <button
          disabled={busy}
          onClick={() => act(course.featured ? "unfeature" : "feature")}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
            course.featured ? "border-volt-300 bg-volt-50 text-volt-600" : "border-ink-200 text-ink-400 hover:border-volt-400",
          )}
          title={course.featured ? "Remove from home page" : "Feature on the home page"}
        >
          <Icon name="sparkle" className="h-4 w-4" />
        </button>
        <a
          href={`/courses/${course.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:border-volt-400 hover:text-volt-600"
          title="Open the public page"
        >
          <Icon name="external" className="h-4 w-4" />
        </a>
        <button
          disabled={busy}
          onClick={() => act("delete")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50"
          title="Delete course"
        >
          <Icon name="trash" className="h-4 w-4" />
        </button>
      </div>
      {error ? <p className="text-[11px] font-bold text-rose-600">{error}</p> : null}
    </div>
  );
}
