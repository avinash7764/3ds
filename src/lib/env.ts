/** Central place for all runtime configuration + sensible dev defaults. */

function str(name: string, fallback = ""): string {
  const v = process.env[name];
  return v === undefined || v === "" ? fallback : v;
}

function bool(name: string, fallback = false): boolean {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

export const env = {
  siteName: str("NEXT_PUBLIC_SITE_NAME", "3DS Academy"),
  siteUrl: str("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
  tagline: "Master the 3DEXPERIENCE® platform",
  googleClientId: str("GOOGLE_CLIENT_ID"),
  googleConfigured: str("GOOGLE_CLIENT_ID").length > 0,
  sessionSecret: str("SESSION_SECRET", "insecure-development-secret-0123456789"),
  sessionCookie: "three_ds_session",
  sessionMaxAge: 60 * 60 * 24 * 30, // 30 days
  adminEmails: str("ADMIN_EMAILS", "admin@3dsacademy.dev")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  // Dev convenience login so the app is explorable without Google credentials.
  allowDemoLogin: bool("ALLOW_DEMO_LOGIN", process.env.NODE_ENV !== "production"),
  googleTokenInfoUrl: "https://oauth2.googleapis.com/tokeninfo",
} as const;

export type Env = typeof env;
