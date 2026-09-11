import { z } from "zod";
import { validateVideoLink } from "@/lib/video";
import { fail, json, readBody, route, withAdmin } from "@/server/api";
import {
  addFaq,
  addResource,
  createLesson,
  createModule,
  deleteFaq,
  deleteLesson,
  deleteModule,
  deleteResource,
  moveLesson,
  moveModule,
  updateFaq,
  updateLesson,
  updateModule,
  updateResource,
} from "@/server/queries";

const videoField = z.string().trim().max(400).optional().nullable();

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("module.create"), courseId: z.string(), title: z.string().trim().min(2), summary: z.string().max(500).optional().nullable() }),
  z.object({ action: z.literal("module.update"), id: z.string(), title: z.string().trim().min(2).optional(), summary: z.string().max(500).optional().nullable() }),
  z.object({ action: z.literal("module.delete"), id: z.string() }),
  z.object({ action: z.literal("module.move"), id: z.string(), dir: z.union([z.literal(-1), z.literal(1)]) }),

  z.object({
    action: z.literal("lesson.create"),
    moduleId: z.string(),
    title: z.string().trim().min(2, "Lesson needs a title"),
    videoUrl: videoField,
    durationMins: z.coerce.number().int().min(0).max(1200).optional(),
    description: z.string().max(2000).optional().nullable(),
    notes: z.string().max(4000).optional().nullable(),
    isPreview: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("lesson.update"),
    id: z.string(),
    title: z.string().trim().min(2).optional(),
    videoUrl: videoField,
    durationMins: z.coerce.number().int().min(0).max(1200).optional(),
    description: z.string().max(2000).optional().nullable(),
    notes: z.string().max(4000).optional().nullable(),
    isPreview: z.boolean().optional(),
    moduleId: z.string().optional(),
  }),
  z.object({ action: z.literal("lesson.delete"), id: z.string() }),
  z.object({ action: z.literal("lesson.move"), id: z.string(), dir: z.union([z.literal(-1), z.literal(1)]), moduleId: z.string().optional() }),

  z.object({
    action: z.literal("resource.create"),
    courseId: z.string().optional().nullable(),
    lessonId: z.string().optional().nullable(),
    title: z.string().trim().min(2),
    url: z.string().trim().url("Resource must be a link (YouTube, Drive, PDF...)"),
    kind: z.string().max(20).optional(),
    sizeText: z.string().max(80).optional().nullable(),
  }),
  z.object({
    action: z.literal("resource.update"),
    id: z.string(),
    title: z.string().trim().min(2).optional(),
    url: z.string().trim().url().optional(),
    kind: z.string().max(20).optional(),
    sizeText: z.string().max(80).optional().nullable(),
  }),
  z.object({ action: z.literal("resource.delete"), id: z.string() }),

  z.object({ action: z.literal("faq.create"), courseId: z.string(), question: z.string().trim().min(4), answer: z.string().trim().min(4) }),
  z.object({ action: z.literal("faq.update"), id: z.string(), question: z.string().trim().min(4).optional(), answer: z.string().trim().min(4).optional() }),
  z.object({ action: z.literal("faq.delete"), id: z.string() }),
]);

/** POST /api/admin/curriculum — everything inside the course builder. */
export const POST = route(async (req) => {
  await withAdmin(req);
  const data = await readBody(req, schema);

  if ((data.action === "lesson.create" || data.action === "lesson.update") && data.videoUrl) {
    const error = validateVideoLink(data.videoUrl);
    if (error) return fail(`Video link: ${error}`, 422);
  }

  switch (data.action) {
    case "module.create":
      return json({ ok: true, module: createModule(data.courseId, data.title, data.summary) });
    case "module.update":
      return json({ ok: true, module: updateModule(data.id, { title: data.title, summary: data.summary }) });
    case "module.delete":
      return json({ ok: true, changes: deleteModule(data.id) });
    case "module.move":
      moveModule(data.id, data.dir);
      return json({ ok: true });

    case "lesson.create": {
      const lesson = createLesson(data.moduleId, {
        title: data.title,
        videoUrl: data.videoUrl ?? null,
        durationMins: data.durationMins ?? 0,
        description: data.description ?? null,
        notes: data.notes ?? null,
        isPreview: data.isPreview ?? false,
      });
      return json({ ok: true, lesson });
    }
    case "lesson.update":
      return json({ ok: true, lesson: updateLesson(data.id, data) });
    case "lesson.delete":
      return json({ ok: true, changes: deleteLesson(data.id) });
    case "lesson.move":
      moveLesson(data.id, data.dir, data.moduleId);
      return json({ ok: true });

    case "resource.create":
      return json({ ok: true, resource: addResource(data) });
    case "resource.update":
      return json({ ok: true, resource: updateResource(data.id, data) });
    case "resource.delete":
      return json({ ok: true, changes: deleteResource(data.id) });

    case "faq.create":
      return json({ ok: true, faq: addFaq(data.courseId, data.question, data.answer) });
    case "faq.update":
      return json({ ok: true, faq: updateFaq(data.id, data) });
    case "faq.delete":
      return json({ ok: true, changes: deleteFaq(data.id) });
  }
});
