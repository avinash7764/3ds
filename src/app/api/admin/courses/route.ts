import { z } from "zod";
import { CATEGORIES, LEVELS } from "@/lib/constants";
import { validateVideoLink } from "@/lib/video";
import { fail, json, readBody, route, withAdmin } from "@/server/api";
import {
  adminListCourses,
  createCourse,
  deleteCourse,
  logActivity,
  updateCourse,
  adminGetCourse,
} from "@/server/queries";

const courseFields = {
  title: z.string().trim().min(4, "Title is too short"),
  subtitle: z.string().trim().max(220).optional().nullable(),
  description: z.string().trim().max(20000).optional().nullable(),
  whatYouLearn: z.string().max(6000).optional().nullable(),
  requirements: z.string().max(4000).optional().nullable(),
  level: z.enum(LEVELS as unknown as [string, ...string[]]).optional(),
  category: z.enum(CATEGORIES as unknown as [string, ...string[]]).optional(),
  language: z.string().trim().max(40).optional().nullable(),
  thumbnail: z.string().trim().url("Thumbnail must be a valid URL").optional().or(z.literal("")).nullable(),
  heroVideoUrl: z.string().trim().max(400).optional().nullable(),
  price: z.coerce.number().int().min(0).max(1000000).optional(),
  mrpPrice: z.coerce.number().int().min(0).max(1000000).optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  certificateOn: z.string().trim().max(180).optional().nullable(),
  tags: z.string().trim().max(300).optional().nullable(),
  instructorId: z.string().trim().optional().nullable(),
};

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), ...courseFields }),
  z.object({ action: z.literal("update"), id: z.string().min(1), ...courseFields }),
  z.object({ action: z.literal("delete"), id: z.string().min(1) }),
  z.object({ action: z.enum(["publish", "unpublish", "feature", "unfeature"]), id: z.string().min(1) }),
]);

/** POST /api/admin/courses — create / edit / publish / delete catalogue entries. */
export const POST = route(async (req) => {
  await withAdmin(req);
  const data = await readBody(req, schema);

  if (data.action === "delete") {
    deleteCourse(data.id);
    return json({ ok: true });
  }

  if (data.action === "create") {
    if (data.heroVideoUrl) {
      const error = validateVideoLink(data.heroVideoUrl);
      if (error) return fail(`Trailer: ${error}`, 422);
    }
    const course = createCourse(data);
    logActivity("COURSE_PUBLISHED", `Created course “${course.title}”`);
    return json({ ok: true, course });
  }

  if (data.action === "update") {
    if (data.heroVideoUrl) {
      const error = validateVideoLink(data.heroVideoUrl);
      if (error) return fail(`Trailer: ${error}`, 422);
    }
    const updated = updateCourse(data.id, data);
    if (!updated) return fail("Course not found", 404);
    logActivity("COURSE_UPDATED", `Updated “${updated.title}”`);
    return json({ ok: true, course: updated });
  }

  // publish / feature toggles
  const course = adminGetCourse(data.id);
  if (!course) return fail("Course not found", 404);
  const patch =
    data.action === "publish" ? { published: true } : data.action === "unpublish" ? { published: false } : data.action === "feature" ? { featured: true } : { featured: false };
  const updated = updateCourse(data.id, patch);
  logActivity(
    patch.published ? "COURSE_PUBLISHED" : "COURSE_UPDATED",
    `${patch.published ? "Published" : patch.featured ? "Featured on the home page" : patch.featured === false ? "Removed from home page" : "Unpublished"} “${course.title}”`,
  );
  return json({ ok: true, course: updated });
});

/** GET /api/admin/courses — full list including drafts (admin JSON API). */
export const GET = route(async (req) => {
  await withAdmin(req);
  return json({ courses: adminListCourses() });
});
