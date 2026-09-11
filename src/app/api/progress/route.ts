import { z } from "zod";
import { fail, json, readBody, route, withUser } from "@/server/api";
import { findFlatLesson, isEnrolled, recomputeEnrollment, setLessonProgress } from "@/server/queries";

const schema = z.object({
  lessonId: z.string().min(1),
  completed: z.boolean().optional(),
  watchedSecs: z.number().int().min(0).max(60 * 60 * 12).optional(),
});

/**
 * POST /api/progress — mark a lesson done/undone and heartbeat watched seconds.
 * Returns the recomputed course progress so the UI can update without a refetch.
 */
export const POST = route(async (req) => {
  const user = await withUser(req);
  const data = await readBody(req, schema);
  const lesson = findFlatLesson(data.lessonId);
  if (!lesson) return fail("Lesson not found", 404);
  if (!isEnrolled(user.id, lesson.courseId)) return fail("Enrol in this course to track progress.", 403);

  let result;
  if (data.completed !== undefined) {
    result = setLessonProgress(user.id, lesson.id, data.completed, data.watchedSecs ?? 0);
  } else {
    result = recomputeEnrollment(user.id, lesson.courseId, lesson.id);
  }
  if (!result) return fail("Progress could not be saved", 500);

  return json({
    ok: true,
    progressPct: result.progressPct,
    status: result.status,
    lessonId: lesson.id,
    completed: data.completed ?? false,
    durationMins: lesson.durationMins,
    totalLessons: lesson.lessonCount,
  });
});
