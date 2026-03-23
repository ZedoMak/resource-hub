import { betterFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "better-auth/types";
import { addSecurityHeaders, createSecurityContext } from "@/lib/security";

const AUTH_ENTRY_MATCHERS = ["/dashboard", "/login", "/signup"];

function shouldCheckSession(pathname: string) {
  return AUTH_ENTRY_MATCHERS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const securityContext = createSecurityContext(request);

  if (!shouldCheckSession(pathname)) {
    const response = NextResponse.next({
      request: {
        headers: securityContext.requestHeaders,
      },
    });

    return addSecurityHeaders(response, securityContext);
  }

  const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
    baseURL: request.nextUrl.origin,
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  });

  if (session && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
    return addSecurityHeaders(
      NextResponse.redirect(new URL("/dashboard", request.url)),
      securityContext,
    );
  }

  if (!session && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);

    return addSecurityHeaders(NextResponse.redirect(loginUrl), securityContext);
  }

  const response = NextResponse.next({
    request: {
      headers: securityContext.requestHeaders,
    },
  });

  return addSecurityHeaders(response, securityContext);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
