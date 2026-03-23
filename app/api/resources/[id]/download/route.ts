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

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { state, response } = await checkRateLimit({
      req,
      policy: rateLimitPolicies.downloadsWrite,
      userId: session.user.id,
    });

    if (response) {
      return response;
    }

    const resolvedParams = await params;

    if (!resolvedParams.id || resolvedParams.id.length < 6) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Invalid resource ID" }, { status: 400 }),
        state,
      );
    }

    const resource = await ResourceService.trackDownload(resolvedParams.id);

    if (!resource || resource.length === 0) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Resource not found" }, { status: 404 }),
        state,
      );
    }

    return withRateLimitHeaders(
      NextResponse.json({ success: true, score: resource[0].newScore }),
      state,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
