import { redirect } from "next/navigation";
import { completedLessonIds, enrollmentCards, getCourseDetailBySlug, lessonsForCourse } from "@/server/queries";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

/** /learn/<course> → jump to the first unfinished lesson (or the free preview). */
export default async function CourseLearnIndex({ params }: { params: { courseSlug: string } }) {
  const user = await currentUser();
  const course = getCourseDetailBySlug(params.courseSlug);
  if (!course || !user) redirect(`/courses/${params.courseSlug}`);

  const enrolment = enrollmentCards(user.id).find((e) => e.courseId === course.id);
  const list = lessonsForCourse(course.id);
  if (enrolment?.next) redirect(`/learn/${course.slug}/${enrolment.next.id}`);

  const completed = completedLessonIds(user.id, course.id);
  const target = list.find((l) => !completed.has(l.id)) ?? list.find((l) => l.isPreview) ?? list[0];
  if (!target) redirect(`/courses/${course.slug}`);
  redirect(`/learn/${course.slug}/${target.id}`);
}
