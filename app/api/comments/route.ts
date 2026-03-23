import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimitPolicies, withRateLimitHeaders } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/security";
import { CommentService } from "@/services/comment.service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { state, response } = await checkRateLimit({
      req,
      policy: rateLimitPolicies.commentsWrite,
      userId: session.user.id,
    });

    if (response) {
      return response;
    }

    const body = await req.json();
    const { content, resourceId } = body;

    if (!content || !resourceId) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Missing required fields" }, { status: 400 }),
        state,
      );
    }

    if (content.trim().length === 0) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 }),
        state,
      );
    }

    if (content.length > 1000) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Comment too long (max 1000 characters)" }, { status: 400 }),
        state,
      );
    }

    const comment = await CommentService.addComment(session.user.id, resourceId, content.trim());

    return withRateLimitHeaders(NextResponse.json(comment[0], { status: 201 }), state);
  } catch (error) {
    return handleApiError(error);
  }
}
