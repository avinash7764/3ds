/**
 * Authentication: "Sign in with Google" (Google Identity Services ID token) verified
 * server-side, plus an explicit demo-login path for local environments where no
 * Google OAuth client is configured yet.
 */
import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { createSessionToken, readSessionCookie, sessionCookieOptions, verifySessionToken, type PublicUser } from "@/lib/session";
import { findUserByEmail, findUserById, upsertUserFromGoogle, ensureDemoUser } from "./queries";
import type { User } from "./types";

export type GoogleClaims = {
  sub: string;
  email: string;
  email_verified?: boolean | "true" | "false";
  name?: string;
  picture?: string;
  aud?: string;
  exp?: number;
};

/** Decode without trusting — used only for shape/error messages. */
function decodeJwt(part: string) {
  try {
    return JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")) as GoogleClaims;
  } catch {
    return null;
  }
}

/**
 * Verify a Google ID token.
 * 1) online: ask Google's tokeninfo endpoint (authoritative, checks signature + expiry)
 * 2) if Google is unreachable we fail closed — never trust an unverified token.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<{ ok: true; claims: GoogleClaims } | { ok: false; error: string }> {
  const decoded = decodeJwt(idToken.split(".")[1] ?? "");
  if (!decoded || !decoded.email) return { ok: false, error: "That doesn't look like a Google ID token." };
  if (!env.googleConfigured) {
    return { ok: false, error: "Google sign-in is not configured on this server (set GOOGLE_CLIENT_ID in .env)." };
  }
  if (decoded.aud && decoded.aud !== env.googleClientId) {
    return { ok: false, error: "This token was issued for a different Google client." };
  }
  if (decoded.exp && decoded.exp * 1000 < Date.now()) return { ok: false, error: "Google token expired — sign in again." };

  try {
    const res = await fetch(`${env.googleTokenInfoUrl}?id_token=${encodeURIComponent(idToken)}`, { cache: "no-store" });
    if (!res.ok) return { ok: false, error: "Google rejected this token." };
    const info = (await res.json()) as GoogleClaims & { error_description?: string };
    if (info.error_description) return { ok: false, error: info.error_description };
    if (info.aud && info.aud !== env.googleClientId) return { ok: false, error: "Token audience mismatch." };
    const verified = info.email_verified === true || info.email_verified === "true";
    if (!verified) return { ok: false, error: "Google did not mark this email as verified." };
    return { ok: true, claims: { ...decoded, ...info } };
  } catch {
    return {
      ok: false,
      error: "Could not reach Google to verify the token. Check the server's network access, or use the demo sign-in in development.",
    };
  }
}

export function signInResponse(user: User) {
  return sessionCookieOptions(createSessionToken(user));
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    headline: user.headline,
  };
}

export function loginWithGoogle(claims: GoogleClaims) {
  return upsertUserFromGoogle({
    email: claims.email,
    name: claims.name ?? null,
    image: claims.picture ?? null,
    googleId: claims.sub,
  });
}

export const loginWithEmail = (email: string) => ensureDemoUser(email);
export const findByEmail = (email: string) => findUserByEmail(email);
export const findById = (id: string) => findUserById(id);

/* ------------------------------------------------------------------ *
 * Reading the session                                                  *
 * ------------------------------------------------------------------ */

/** Server Components. */
export async function currentUser(): Promise<PublicUser | null> {
  const payload = readSessionCookie();
  if (!payload) return null;
  const user = findUserById(payload.sub);
  return user ? toPublicUser(user) : null;
}

/** Route handlers. */
export async function currentUserFromRequest(req: NextRequest): Promise<PublicUser | null> {
  const payload = verifySessionToken(req.cookies.get(env.sessionCookie)?.value);
  if (!payload) return null;
  const user = findUserById(payload.sub);
  return user ? toPublicUser(user) : null;
}

export async function requireUser(): Promise<PublicUser> {
  const user = await currentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireAdmin(): Promise<PublicUser> {
  const user = await currentUser();
  if (!user) throw new UnauthorizedError();
  if (user.role !== "ADMIN") throw new ForbiddenError();
  return user;
}

export class UnauthorizedError extends Error {
  code = 401;
  constructor() {
    super("Sign in required");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  code = 403;
  constructor() {
    super("Admin access only");
    this.name = "ForbiddenError";
  }
}

export function isAdmin(user: PublicUser | null | undefined) {
  return user?.role === "ADMIN";
}

/** Absolute origin of the current request (works behind the preview proxy). */
export function requestOrigin() {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : env.siteUrl;
}

export function cookieValue() {
  return cookies().get(env.sessionCookie)?.value;
}
