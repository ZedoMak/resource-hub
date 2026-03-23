import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/lib/security";
import { checkRateLimit, rateLimitPolicies, withRateLimitHeaders } from "@/lib/rate-limit";
import { ResourceService } from "@/services/resource.service";

export async function GET(req: NextRequest) {
  try {
    const { state, response } = await checkRateLimit({
      req,
      policy: rateLimitPolicies.search,
    });

    if (response) {
      return response;
    }

    const query = req.nextUrl.searchParams.get("q");

    if (!query || query.length < 2) {
      return withRateLimitHeaders(NextResponse.json({ data: [] }), state);
    }

    if (query.length > 100) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Search query too long" }, { status: 400 }),
        state,
      );
    }

    const results = await ResourceService.searchResources(query);
    return withRateLimitHeaders(NextResponse.json({ data: results }), state);
  } catch (error) {
    return handleApiError(error);
  }
}
