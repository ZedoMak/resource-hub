import { NextRequest, NextResponse } from "next/server";
import { CommentService } from "@/services/comment.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { handleApiError } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content, resourceId } = body;

    // Validate required fields
    if (!content || !resourceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: "Comment too long (max 1000 characters)" }, { status: 400 });
    }

    // Create comment
    const comment = await CommentService.addComment(
      session.user.id,
      resourceId,
      content.trim()
    );

    return NextResponse.json(comment[0], { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
