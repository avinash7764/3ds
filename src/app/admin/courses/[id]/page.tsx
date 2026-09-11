import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseBuilder, CourseDetailsForm, CourseStatusPanel } from "@/components/admin/course-builder";
import { Icon } from "@/components/ui";
import { adminGetCourse, recomputeCourseDuration } from "@/server/queries";
import { all } from "@/server/db";

export const dynamic = "force-dynamic";

export default function AdminCourseEditor({ params }: { params: { id: string } }) {
  const course = adminGetCourse(params.id);
  if (!course) notFound();
  // keep the cached runtime honest (cheap: one aggregate per page view)
  const durationMins = recomputeCourseDuration(course.id);

  const instructors = all<{ id: string; name: string | null; email: string }>(
    "SELECT id, name, email FROM users WHERE role IN ('ADMIN','INSTRUCTOR') ORDER BY role, name",
  );

  const payload = {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    whatYouLearn: course.whatYouLearn,
    requirements: course.requirements,
    level: course.level,
    category: course.category,
    language: course.language,
    thumbnail: course.thumbnail,
    heroVideoUrl: course.heroVideoUrl,
    price: course.price,
    mrpPrice: course.mrpPrice,
    published: course.published,
    featured: course.featured,
    certificateOn: course.certificateOn,
    tags: course.tags,
    instructorId: course.instructorId,
    durationMins,
    lessonCount: course.allLessons?.length ?? course.lessonCount ?? 0,
    studentCount: course.students?.length ?? 0,
    modules: (course.modules ?? []).map((m) => ({
      id: m.id,
      title: m.title,
      summary: m.summary,
      position: m.position,
      lessons: (m.lessons ?? []).map((l) => ({
        id: l.id,
        title: l.title,
        videoUrl: l.videoUrl,
        durationMins: l.durationMins,
        isPreview: l.isPreview,
        description: l.description,
        notes: l.notes,
      })),
    })),
    resources: (course.resources ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      kind: r.kind,
      sizeText: r.sizeText,
      lessonId: r.lessonId,
    })),
    faqs: (course.faqs ?? []).map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
    students: (course.students ?? []).map((s) => ({
      id: s.id,
      userId: s.userId,
      name: s.name,
      email: s.email,
      lessonsDone: s.lessonsDone,
      total: s.total,
      progressPct: s.progressPct,
      status: s.status,
      enrolledAt: s.enrolledAt,
    })),
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-500 hover:text-volt-700">
            <Icon name="chevronRight" className="h-4 w-4 rotate-180" /> All courses
          </Link>
          <h1 className="mt-3 truncate text-2xl font-extrabold tracking-tight">{course.title}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-slate-500">
            <span className="font-mono">/courses/{course.slug}</span>
            <span>·</span>
            <span>{payload.modules.length} modules</span>
            <span>·</span>
            <span>{payload.lessonCount} lessons</span>
            <span>·</span>
            <span>{payload.studentCount} enrolled</span>
            {course.published ? null : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold uppercase text-amber-700">Draft</span>}
          </p>
        </div>
        <a
          href={`/courses/${course.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-[13px] font-bold text-ink-800 hover:border-volt-400"
        >
          <Icon name="external" className="h-4 w-4" /> Open student view
        </a>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <CourseDetailsForm course={payload} instructors={instructors} />
          <CourseBuilder course={payload} instructors={instructors} />
        </div>
        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <CourseStatusPanel course={payload} />
        </div>
      </div>
    </div>
  );
}
