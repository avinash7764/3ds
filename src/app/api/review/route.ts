import { z } from "zod";
import { fail, json, readBody, route, withUser } from "@/server/api";
import { getCourseDetailBySlug, isEnrolled, upsertReview } from "@/server/queries";

const schema = z.object({
  courseSlug: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(8, "Write at least a sentence").max(1200),
});

/** POST /api/review — enrolled students can rate / update their review of a course. */
export const POST = route(async (req) => {
  const user = await withUser(req);
  const data = await readBody(req, schema);
  const course = getCourseDetailBySlug(data.courseSlug);
  if (!course) return fail("Course not found", 404);
  if (!isEnrolled(user.id, course.id)) return fail("Only enrolled students can review a course.", 403);
  upsertReview(user.id, course.id, data.rating, data.comment);
  return json({ ok: true });
});
