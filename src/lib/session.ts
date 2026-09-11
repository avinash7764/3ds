/**
 * Session tokens: a signed HS256 JWT kept in an httpOnly cookie.
 * No third-party auth library — the only external dependency is Google's own ID-token
 * verification endpoint (see src/server/auth.ts).
 */
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";

export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";

export type SessionPayload = {
  sub: string;
  email: string;
  role: Role;
  name: string | null;
  iat: number;
  exp: number;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  headline?: string | null;
};

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const b64urlJson = (obj: unknown) => b64url(Buffer.from(JSON.stringify(obj), "utf8"));

function parseB64urlJson<T>(segment: string): T | null {
  try {
    const json = Buffer.from(segment.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

const sign = (data: string) => b64url(crypto.createHmac("sha256", env.sessionSecret).update(data).digest());

function equal(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function createSessionToken(user: { id: string; email: string; role: string; name: string | null }) {
  const iat = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    role: (user.role as Role) ?? "STUDENT",
    name: user.name,
    iat,
    exp: iat + env.sessionMaxAge,
  };
  const data = `${b64urlJson({ alg: "HS256", typ: "JWT" })}.${b64urlJson(payload)}`;
  return `${data}.${sign(data)}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [head, body, sig] = parts;
  if (!equal(sig, sign(`${head}.${body}`))) return null;
  const payload = parseB64urlJson<SessionPayload>(body);
  if (!payload || typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
  return payload;
}

export function sessionCookieOptions(token: string) {
  return {
    name: env.sessionCookie,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: env.sessionMaxAge,
  };
}

export function clearCookieOptions() {
  return { ...sessionCookieOptions(""), maxAge: 0 };
}

export function readSessionCookie(): SessionPayload | null {
  return verifySessionToken(cookies().get(env.sessionCookie)?.value);
}

/** Cheap check used by middleware (signature is still verified in the layouts / handlers). */
export function hasSessionCookie(req: { cookies: { get(name: string): { value: string } | undefined } }) {
  return Boolean(req.cookies.get(env.sessionCookie)?.value);
}
