import { betterFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "better-auth/types";

export default async function authMiddleware(request: NextRequest) {
  // We check if the user is trying to access the dashboard
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const { data: session } = await betterFetch<Session>(
      "/api/auth/get-session",
      {
        baseURL: request.nextUrl.origin,
        headers: {
          // We must pass the cookies from the request to the auth API
          cookie: request.headers.get("cookie") || "",
        },
      }
    );

    if (!session) {
      // Not logged in? Redirect to login with a "callback" 
      // so they return here after signing in.
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Only run middleware on these paths to keep the app fast
  matcher: ["/dashboard/:path*"],
};