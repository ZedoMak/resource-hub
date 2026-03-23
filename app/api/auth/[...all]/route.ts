import { NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimitPolicies } from "@/lib/rate-limit";
import { toNextJsHandler } from "better-auth/next-js";

const authHandlers = toNextJsHandler(auth);

async function getAuthRateLimitIdentifier(req: NextRequest): Promise<string | undefined> {
  if (req.method !== "POST") {
    return undefined;
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }

  try {
    const body = await req.clone().json();
    const identifier = body?.email ?? body?.username ?? body?.phone ?? body?.identifier;

    return typeof identifier === "string" ? identifier : undefined;
  } catch {
    return undefined;
  }
}

export async function GET(req: NextRequest) {
  const { response } = await checkRateLimit({
    req,
    policy: rateLimitPolicies.authRead,
  });

  if (response) {
    return response;
  }

  return authHandlers.GET(req);
}

export async function POST(req: NextRequest) {
  const identifier = await getAuthRateLimitIdentifier(req);
  const { response } = await checkRateLimit({
    req,
    policy: rateLimitPolicies.authWrite,
    extraIdentifiers: identifier ? [identifier] : [],
  });

  if (response) {
    return response;
  }

  return authHandlers.POST(req);
}
