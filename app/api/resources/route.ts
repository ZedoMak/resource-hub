import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimitPolicies, withRateLimitHeaders } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/security";
import { normalizeTrustedUploadThingFileUrl } from "@/lib/trusted-resource-url";
import { verifyTrustedUploadToken } from "@/lib/trusted-upload-token";
import { ResourceService } from "@/services/resource.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const courseId = searchParams.get("courseId") ?? undefined;
    const typeParam = searchParams.get("type");

    const validTypes = ["EXAM", "NOTE", "SUMMARY", "ASSIGNMENT"] as const;
    const type = validTypes.find((value) => value === typeParam);

    const data = await ResourceService.findMany({ courseId, type });
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

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
      policy: rateLimitPolicies.resourcesCreate,
      userId: session.user.id,
    });

    if (response) {
      return response;
    }

    const body = await req.json();
    const { title, type, courseId, fileUrl, uploadToken } = body;

    if (!title || !type || !courseId || !fileUrl || !uploadToken) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Missing required fields" }, { status: 400 }),
        state,
      );
    }

    const validTypes = ["EXAM", "NOTE", "SUMMARY", "ASSIGNMENT"];
    if (!validTypes.includes(type)) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Invalid resource type" }, { status: 400 }),
        state,
      );
    }

    if (title.length > 255) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Title too long (max 255 characters)" }, { status: 400 }),
        state,
      );
    }

    if (title.trim().length === 0) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Title cannot be empty" }, { status: 400 }),
        state,
      );
    }

    const trustedUpload = normalizeTrustedUploadThingFileUrl(fileUrl);

    if (!trustedUpload) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Invalid file URL" }, { status: 400 }),
        state,
      );
    }

    const isTrustedUpload = verifyTrustedUploadToken(uploadToken, {
      fileKey: trustedUpload.fileKey,
      fileUrl: trustedUpload.fileUrl,
      userId: session.user.id,
    });

    if (!isTrustedUpload) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Upload verification failed" }, { status: 400 }),
        state,
      );
    }

    const resource = await ResourceService.createResource({
      title: title.trim(),
      type,
      courseId,
      fileUrl: trustedUpload.fileUrl,
      fileKey: trustedUpload.fileKey,
      userId: session.user.id,
    });

    return withRateLimitHeaders(NextResponse.json(resource[0], { status: 201 }), state);
  } catch (error) {
    return handleApiError(error);
  }
}
