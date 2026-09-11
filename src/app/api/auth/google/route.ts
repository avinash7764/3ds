import { z } from "zod";
import { env } from "@/lib/env";
import { fail, json, readBody, route } from "@/server/api";
import { loginWithGoogle, signInResponse, verifyGoogleIdToken } from "@/server/auth";

const schema = z.object({ credential: z.string().min(20, "Missing Google credential") });

/**
 * POST /api/auth/google
 * Body: { credential }  — the ID token issued by Google Identity Services in the browser.
 * Verified against Google, user created/updated, session cookie set.
 */
export const POST = route(async (req) => {
  if (!env.googleConfigured) {
    return fail("Google sign-in is not configured. Add GOOGLE_CLIENT_ID to .env, or use the demo sign-in.", 503);
  }
  const { credential } = await readBody(req, schema);
  const result = await verifyGoogleIdToken(credential);
  if (!result.ok) return fail(result.error, 401);

  const user = loginWithGoogle(result.claims);
  const res = json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role },
  });
  res.cookies.set(signInResponse(user));
  return res;
});
