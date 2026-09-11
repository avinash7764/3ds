import { z } from "zod";
import { fail, json, readBody, route, withAdmin } from "@/server/api";
import { enrollStudentByemail, unenroll, recomputeEnrollment } from "@/server/queries";
import { run } from "@/server/db";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("enroll"), courseId: z.string(), email: z.string().email() }),
  z.object({ action: z.literal("unenroll"), courseId: z.string(), userId: z.string() }),
  z.object({ action: z.literal("reset"), courseId: z.string(), userId: z.string() }),
]);

/** POST /api/admin/students — manage who is on a course. */
export const POST = route(async (req) => {
  await withAdmin(req);
  const data = await readBody(req, schema);

  if (data.action === "enroll") {
    const result = enrollStudentByemail(data.courseId, data.email);
    if (result.error && result.error !== "Already enrolled") return fail(result.error, 422);
    return json({ ok: true, note: result.error ?? null });
  }
  if (data.action === "unenroll") {
    const changes = unenroll(data.userId, data.courseId);
    return json({ ok: true, changes });
  }
  run("DELETE FROM lesson_progress WHERE user_id = ? AND lesson_id IN (SELECT l.id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = ?)", [
    data.userId,
    data.courseId,
  ]);
  run("DELETE FROM certificates WHERE user_id = ? AND course_id = ?", [data.userId, data.courseId]);
  recomputeEnrollment(data.userId, data.courseId);
  return json({ ok: true });
});
