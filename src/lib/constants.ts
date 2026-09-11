import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Role } from "./session";

export const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export const CATEGORIES = [
  "Design",
  "Drafting & Documentation",
  "Simulation",
  "PLM & Collaboration",
  "Manufacturing",
  "Platform & Roles",
] as const;

export const KINDS = ["DRIVE", "PDF", "LINK", "SHEET", "SLIDES"] as const;

export type Level = (typeof LEVELS)[number];
export type Category = (typeof CATEGORIES)[number];

/** Redirect helper for protected server routes (keeps the current host, e.g. preview URLs). */
export function redirectToLogin(req: NextRequest) {
  const url = new URL("/login", req.nextUrl.origin);
  const next = req.nextUrl.pathname + (req.nextUrl.search || "");
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export function unauthorized(req: NextRequest, admin = false) {
  if (req.headers.get("accept")?.includes("application/json") || req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: admin ? "Admin access only" : "Sign in required" }, { status: 401 });
  }
  return redirectToLogin(req);
}

export function roleAtLeast(role: Role | string | undefined, needed: Role) {
  const order: Record<Role, number> = { STUDENT: 0, INSTRUCTOR: 1, ADMIN: 2 };
  return order[(role as Role) ?? "STUDENT"] >= order[needed];
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70);
}

export function inr(paise: number) {
  if (!paise) return "Free";
  return "₹" + paise.toLocaleString("en-IN");
}

export function minutesToHuman(mins: number) {
  if (!mins || mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

/** Split a newline-separated textarea value into clean list items. */
export function toLines(value?: string | null) {
  return (value ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}

export function csv(value?: string | null) {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function pct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
