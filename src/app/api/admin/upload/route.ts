import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { fail, json, route, withAdmin } from "@/server/api";
import { insert, newId, nowIso } from "@/server/db";
import { logActivity } from "@/server/queries";

/**
 * POST /api/admin/upload  (multipart/form-data: file, optional courseId, optional autoAttach)
 *
 * Stores the file in `public/uploads/<yyyy-mm>/` and returns a site-relative URL that can be
 * pasted straight into a lesson's video field (mp4/webm play in the native player) or attached
 * as a course resource. Swap this route for S3/Cloudinary/GCS in production — the response shape
 * is all the UI depends on.
 */
const VIDEO_EXT = new Set(["mp4", "webm", "ogv", "m4v"]);
const DOC_EXT = new Set(["pdf", "png", "jpg", "jpeg", "webp", "gif", "zip", "csv", "txt", "docx", "pptx"]);
const MAX_BYTES = 200 * 1024 * 1024;

export const POST = route(async (req) => {
  const admin = await withAdmin(req);
  const form = await req.formData().catch(() => null);
  if (!form) return fail("Expected multipart/form-data with a `file` field", 415);

  const file = form.get("file");
  if (!(file instanceof File)) return fail("No file received", 422);
  if (file.size === 0) return fail("That file is empty", 422);
  if (file.size > MAX_BYTES) return fail(`File is too large (${(file.size / 1048576).toFixed(1)} MB, limit ${MAX_BYTES / 1048576} MB)`, 413);

  const original = file.name || "upload";
  const ext = (original.split(".").pop() ?? "").toLowerCase();
  const isVideo = VIDEO_EXT.has(ext);
  if (!isVideo && !DOC_EXT.has(ext)) {
    return fail(`Unsupported file type “.${ext}”. Allowed: ${[...VIDEO_EXT, ...DOC_EXT].join(", ")}`, 415);
  }

  const stamp = new Date().toISOString().slice(0, 7);
  const safeBase = original.replace(/[^\w.\-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "file";
  const filename = `${crypto.randomBytes(5).toString("hex")}-${safeBase}`;
  const dir = path.join(process.cwd(), "public", "uploads", stamp);
  await fs.mkdir(dir, { recursive: true });
  const absolute = path.join(dir, filename);
  await fs.writeFile(absolute, Buffer.from(await file.arrayBuffer()));

  const url = `/uploads/${stamp}/${filename}`;
  const sizeText = `${(file.size / 1048576).toFixed(file.size > 5 * 1048576 ? 1 : 2)} MB`;
  const courseId = String(form.get("courseId") ?? "");

  let resource = null;
  if (courseId && form.get("autoAttach") === "1") {
    const id = newId();
    insert("resources", {
      id,
      course_id: courseId,
      lesson_id: null,
      title: safeBase.replace(/\.[a-z0-9]+$/i, "").replace(/-/g, " "),
      url,
      kind: isVideo ? "LINK" : ext === "pdf" ? "PDF" : "DRIVE",
      size_text: sizeText,
    });
    resource = { id, url, sizeText };
  }

  logActivity("UPLOAD", `Uploaded ${isVideo ? "video" : "file"} ${safeBase} (${sizeText})`, admin.id, JSON.stringify({ url, courseId: courseId || null }));

  return json({
    ok: true,
    url,
    name: safeBase,
    sizeText,
    kind: isVideo ? "video" : ext === "pdf" ? "pdf" : "file",
    playable: isVideo,
    resource,
  });
});
