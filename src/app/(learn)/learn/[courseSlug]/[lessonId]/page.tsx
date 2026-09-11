import { redirect } from "next/navigation";
import { LearnWorkspace } from "@/components/learn-workspace";
import { completedLessonIds, enrollmentCards, findFlatLesson, getCourseDetailBySlug, isEnrolled, lessonsForCourse, resourcesForLesson } from "@/server/queries";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { courseSlug: string; lessonId: string } }) {
  const lesson = findFlatLesson(params.lessonId);
  return { title: lesson ? `${lesson.title} — ${lesson.courseTitle}` : "Lesson" };
}

export default async function LessonPage({ params }: { params: { courseSlug: string; lessonId: string } }) {
  const user = await currentUser();
  if (!user) redirect(`/login?next=/learn/${params.courseSlug}/${params.lessonId}`);

  const course = getCourseDetailBySlug(params.courseSlug);
  const lesson = findFlatLesson(params.lessonId);
  if (!course || !lesson || lesson.courseId !== course.id) redirect(`/courses/${params.courseSlug}`);
  if (!course.published && user.role !== "ADMIN") redirect(`/courses/${params.courseSlug}`);

  const enrolled = isEnrolled(user.id, course.id);
  // locked content: only preview lessons are playable without enrolment
  if (!enrolled && !lesson.isPreview) redirect(`/courses/${params.courseSlug}?locked=${lesson.id}`);

  const enrolment = enrollmentCards(user.id).find((e) => e.courseId === course.id);
  const completed = [...completedLessonIds(user.id, course.id)];

  return (
    <LearnWorkspace
      course={{ id: course.id, slug: course.slug, title: course.title, certificateOn: course.certificateOn }}
      modules={course.modules}
      flatLessons={lessonsForCourse(course.id)}
      lesson={lesson}
      completed={completed}
      progressPct={enrolment?.progressPct ?? 0}
      enrolled={enrolled}
      resources={resourcesForLesson(lesson.id)}
    />
  );
}
