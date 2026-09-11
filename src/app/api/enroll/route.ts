import { z } from "zod";
import { fail, json, readBody, route, withUser } from "@/server/api";
import { enroll, unenroll, isEnrolled, getCourseDetailBySlug } from "@/server/queries";

const schema = z.object({ courseSlug: z.string().min(1), action: z.enum(["enroll", "unenroll"]).default("enroll") });

/** POST /api/enroll — enrol the signed-in student in a course (or leave it). */
export const POST = route(async (req) => {
  const user = await withUser(req);
  const { courseSlug, action } = await readBody(req, schema);
  const course = getCourseDetailBySlug(courseSlug);
  if (!course) return fail("Course not found", 404);
  if (!course.published && user.role !== "ADMIN") return fail("This course is not published yet.", 403);

  if (action === "unenroll") {
    const changes = unenroll(user.id, course.id);
    return json({ ok: true, changes });
  }
  const already = isEnrolled(user.id, course.id);
  const { enrollment } = enroll(user.id, course.id);
  return json({ ok: true, already, enrollment });
});
