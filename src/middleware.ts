import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * Gate-keeping for the two dashboards. The real role check happens in the layouts
 * (edge middleware only looks at the presence + shape of the session cookie).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get(env.sessionCookie)?.value;
  const protectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/learn") || pathname.startsWith("/admin");

  if (protectedRoute && !session) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
    return NextResponse.redirect(url);
  }
  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/learn/:path*", "/admin/:path*", "/login"],
};
