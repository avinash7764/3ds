import Link from "next/link";
import { CreateCourseForm } from "@/components/admin/create-course-form";
import { Icon } from "@/components/ui";
import { all } from "@/server/db";

export const dynamic = "force-dynamic";

export default function NewCoursePage() {
  const instructors = all<{ id: string; name: string | null; email: string }>(
    "SELECT id, name, email FROM users WHERE role IN ('ADMIN','INSTRUCTOR') ORDER BY role, name",
  );

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-500 hover:text-volt-700">
          <Icon name="chevronRight" className="h-4 w-4 rotate-180" /> All courses
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">New course</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-slate-600">
          Create the shell first — you'll add modules and paste the YouTube / Google Drive links for each lesson on the next screen. Nothing
          is visible to students until you flip it to Published.
        </p>
      </header>
      <CreateCourseForm instructors={instructors} />
    </div>
  );
}
