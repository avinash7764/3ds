import { z } from "zod";
import { env } from "@/lib/env";
import { fail, json, readBody, route } from "@/server/api";
import { loginWithGoogle, signInResponse, verifyGoogleIdToken } from "@/server/auth";

const schema = z.object({
  credential: z.string().optional(),
  simulated: z.boolean().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
});

/**
 * POST /api/auth/google
 * Handles Google credential verification or simulated dev Google login.
 */
export const POST = route(async (req) => {
  const body = await readBody(req, schema);

  if (body.credential) {
    if (!env.googleConfigured) {
      return fail("Google sign-in is not configured. Add GOOGLE_CLIENT_ID to .env, or use the quick sign-in below.", 503);
    }
    const result = await verifyGoogleIdToken(body.credential);
    if (!result.ok) return fail(result.error, 401);

    const user = loginWithGoogle(result.claims);
    const res = json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role },
    });
    res.cookies.set(signInResponse(user));
    return res;
  }

  if (body.simulated && env.allowDemoLogin) {
    const email = (body.email || "student@gmail.com").trim().toLowerCase();
    const name = body.name || email.split("@")[0];
    const user = loginWithGoogle({
      sub: `google-sim-${email}`,
      email,
      name,
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      email_verified: true,
    });
    const res = json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role },
    });
    res.cookies.set(signInResponse(user));
    return res;
  }

  return fail("Missing Google credential or simulation parameters", 400);
});
