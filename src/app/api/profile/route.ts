import { z } from "zod";
import { json, readBody, route, withUser } from "@/server/api";
import { update } from "@/server/db";
import { nowIso } from "@/server/db";

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  headline: z.string().trim().max(120).optional().nullable(),
  bio: z.string().trim().max(400).optional().nullable(),
});

/** POST /api/profile — students can fix the name that appears on their certificate. */
export const POST = route(async (req) => {
  const user = await withUser(req);
  const data = await readBody(req, schema);
  update("users", user.id, { name: data.name, headline: data.headline ?? "", bio: data.bio ?? "", updated_at: nowIso() });
  return json({ ok: true });
});
