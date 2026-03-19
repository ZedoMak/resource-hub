import { betterFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "better-auth/types";
import { addSecurityHeaders } from "@/lib/security";

export default async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Get the session
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }
  );

  // 2. Logic: If logged in, DON'T allow /login or /signup
  if (session && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    return addSecurityHeaders(response);
  }

  // 3. Logic: If NOT logged in, DON'T allow /dashboard
  if (!session && pathname.startsWith("/dashboard")) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    return addSecurityHeaders(response);
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  // Run middleware on auth pages and dashboard
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
