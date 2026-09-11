import { NextResponse, type NextRequest } from "next/server";
import type { ZodType } from "zod";
import { ForbiddenError, UnauthorizedError, currentUserFromRequest } from "./auth";
import type { PublicUser } from "@/lib/session";

export const json = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);
export const fail = (error: string, status = 400, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error, ...extra }, { status });

export class ApiValidationError extends Error {
  code = 422;
  constructor(message: string) {
    super(message);
    this.name = "ApiValidationError";
  }
}

export function errorHandler(err: unknown) {
  if (err instanceof UnauthorizedError) return fail(err.message, 401);
  if (err instanceof ForbiddenError) return fail(err.message, 403);
  if (err instanceof ApiValidationError) return fail(err.message, 422);
  const raw = err instanceof Error ? err.message : "Something went wrong";
  // Make the usual SQLite constraint failures readable in the admin UI
  if (/FOREIGN KEY constraint failed/.test(raw)) {
    return fail("That references a record that doesn't exist (check the mentor / course selection).", 422);
  }
  if (/UNIQUE constraint failed: (\w+\.\w+)/.test(raw)) {
    const col = raw.match(/UNIQUE constraint failed: ([\w.]+)/)![1];
    return fail(`That value is already taken (${col}).`, 409);
  }
  console.error("[api]", err);
  return fail(raw, 500);
}

/** Consistent error handling + ctx for route handlers. */
export function route<Args extends unknown[]>(
  handler: (req: NextRequest, ...args: Args) => Promise<Response> | Response,
) {
  return async (req: NextRequest, ...args: Args): Promise<Response> => {
    try {
      return await handler(req, ...args);
    } catch (err) {
      return errorHandler(err);
    }
  };
}

export async function readBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiValidationError(issue ? `${issue.path.join(".") ? issue.path.join(".") + ": " : ""}${issue.message}` : "Invalid request body");
  }
  return parsed.data;
}

export async function withUser(req: NextRequest): Promise<PublicUser> {
  const user = await currentUserFromRequest(req);
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function withAdmin(req: NextRequest): Promise<PublicUser> {
  const user = await withUser(req);
  if (user.role !== "ADMIN") throw new ForbiddenError();
  return user;
}
