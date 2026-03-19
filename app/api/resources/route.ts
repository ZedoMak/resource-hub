import { NextRequest, NextResponse } from "next/server";
import { ResourceService } from "@/services/resource.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { handleApiError } from "@/lib/security";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const courseId = searchParams.get("courseId") ?? undefined;
    const typeParam = searchParams.get("type");
    
    // Validate type parameter
    const validTypes = ["EXAM", "NOTE", "SUMMARY", "ASSIGNMENT"] as const;
    const type = validTypes.includes(typeParam as any) ? typeParam as any : undefined;

    const data = await ResourceService.findMany({ courseId, type });
    const response = NextResponse.json(data);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, type, courseId, fileUrl } = body;

    // Validate required fields
    if (!title || !type || !courseId || !fileUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate field formats
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

    // Validate URL format
    try {
      new URL(fileUrl);
    } catch {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    // Extract fileKey from fileUrl (UploadThing provides this in the URL)
    const fileKey = fileUrl.split('/').pop() || '';
    
    if (fileKey.length === 0) {
      return NextResponse.json({ error: "Invalid file URL format" }, { status: 400 });
    }

    // Create the resource
    const resource = await ResourceService.createResource({
      title: title.trim(),
      type,
      courseId,
      fileUrl,
      fileKey,
      userId: session.user.id,
    });

    return NextResponse.json(resource[0], { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}