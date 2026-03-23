import { NextRequest, NextResponse } from "next/server";
import { ResourceService } from "@/services/resource.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { handleApiError } from "@/lib/security";
import { normalizeTrustedUploadThingFileUrl } from "@/lib/trusted-resource-url";
import { verifyTrustedUploadToken } from "@/lib/trusted-upload-token";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const courseId = searchParams.get("courseId") ?? undefined;
    const typeParam = searchParams.get("type");

    const validTypes = ["EXAM", "NOTE", "SUMMARY", "ASSIGNMENT"] as const;
    const type = validTypes.find((value) => value === typeParam);

    const data = await ResourceService.findMany({ courseId, type });
    const response = NextResponse.json(data);
    return response;
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

    const body = await req.json();
    const { title, type, courseId, fileUrl, uploadToken } = body;

    if (!title || !type || !courseId || !fileUrl || !uploadToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validTypes = ["EXAM", "NOTE", "SUMMARY", "ASSIGNMENT"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid resource type" }, { status: 400 });
    }

    if (title.length > 255) {
      return NextResponse.json({ error: "Title too long (max 255 characters)" }, { status: 400 });
    }

    if (title.trim().length === 0) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }

    const trustedUpload = normalizeTrustedUploadThingFileUrl(fileUrl);

    if (!trustedUpload) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    const isTrustedUpload = verifyTrustedUploadToken(uploadToken, {
      fileKey: trustedUpload.fileKey,
      fileUrl: trustedUpload.fileUrl,
      userId: session.user.id,
    });

    if (!isTrustedUpload) {
      return NextResponse.json({ error: "Upload verification failed" }, { status: 400 });
    }

    const resource = await ResourceService.createResource({
      title: title.trim(),
      type,
      courseId,
      fileUrl: trustedUpload.fileUrl,
      fileKey: trustedUpload.fileKey,
      userId: session.user.id,
    });

    return NextResponse.json(resource[0], { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
