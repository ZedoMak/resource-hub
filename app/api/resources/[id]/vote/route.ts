import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimitPolicies, withRateLimitHeaders } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/security";
import { ResourceService } from "@/services/resource.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { state, response } = await checkRateLimit({
      req,
      policy: rateLimitPolicies.votesWrite,
      userId: session.user.id,
    });

    if (response) {
      return response;
    }

    const body = await req.json();
    const { type } = body;

    if (type !== "UP" && type !== "DOWN") {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Invalid vote type" }, { status: 400 }),
        state,
      );
    }

    const resolvedParams = await params;
    const result = await ResourceService.toggleVote(resolvedParams.id, session.user.id, type);

    return withRateLimitHeaders(NextResponse.json(result), state);
  } catch (error) {
    return handleApiError(error);
  }
}
