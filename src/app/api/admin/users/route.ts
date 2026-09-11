import { z } from "zod";
import { fail, json, readBody, route, withAdmin } from "@/server/api";
import { deleteUser, listUsers, logActivity, setUserRole } from "@/server/queries";
import { insert, newId, nowIso } from "@/server/db";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("role"), userId: z.string(), role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]) }),
  z.object({ action: z.literal("delete"), userId: z.string() }),
  z.object({
    action: z.literal("create"),
    email: z.string().email("Enter a valid email"),
    name: z.string().trim().max(80).optional(),
    role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]).default("STUDENT"),
  }),
]);

/** POST /api/admin/users — role management & manual account creation. */
export const POST = route(async (req) => {
  const admin = await withAdmin(req);
  const data = await readBody(req, schema);

  if (data.action === "role") {
    if (data.userId === admin.id && data.role !== "ADMIN") return fail("You cannot remove your own admin access.", 422);
    setUserRole(data.userId, data.role);
    logActivity("USER_ROLE", `Role set to ${data.role}`, data.userId);
    return json({ ok: true });
  }
  if (data.action === "delete") {
    if (data.userId === admin.id) return fail("You cannot delete your own account.", 422);
    const changes = deleteUser(data.userId);
    if (!changes) return fail("User not found", 404);
    return json({ ok: true, changes });
  }

  const email = data.email.trim().toLowerCase();
  if (listUsers(email).some((u) => u.email.toLowerCase() === email)) return fail("That email already has an account.", 422);
  const id = newId();
  insert("users", {
    id,
    email,
    name: data.name || email.split("@")[0],
    role: data.role,
    created_at: nowIso(),
    updated_at: nowIso(),
  });
  logActivity("USER_ADDED", `Account created for ${email}`, admin.id);
  return json({ ok: true, id });
});
