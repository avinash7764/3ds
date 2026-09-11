import { z } from "zod";
import { env } from "@/lib/env";
import { fail, json, readBody, route } from "@/server/api";
import { loginWithEmail, signInResponse } from "@/server/auth";

const schema = z.object({ email: z.string().email("Enter a valid Gmail-style address") });

/**
 * POST /api/auth/demo — development shortcut.
 * Signs straight into an existing (or newly created) account so the student/admin
 * dashboards can be explored before Google OAuth is wired up. Disabled when
 * ALLOW_DEMO_LOGIN=false.
 */
export const POST = route(async (req) => {
  if (!env.allowDemoLogin) return fail("Demo sign-in is disabled on this server.", 403);
  const { email } = await readBody(req, schema);
  const user = loginWithEmail(email.toLowerCase());
  const res = json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role },
  });
  res.cookies.set(signInResponse(user));
  return res;
});
