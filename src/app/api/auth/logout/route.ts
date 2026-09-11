import { env } from "@/lib/env";
import { json, route } from "@/server/api";
import { clearCookieOptions } from "@/lib/session";

export const POST = route(async () => {
  const res = json({ ok: true });
  res.cookies.set({ ...clearCookieOptions(), name: env.sessionCookie });
  return res;
});
