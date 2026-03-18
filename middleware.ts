import { betterFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "better-auth/types";

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
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Logic: If NOT logged in, DON'T allow /dashboard
  if (!session && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on auth pages and dashboard
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};