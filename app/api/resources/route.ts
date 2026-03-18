import { NextRequest, NextResponse } from "next/server";
import { ResourceService } from "@/services/resource.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const courseId = searchParams.get("courseId") ?? undefined;
  const type = searchParams.get("type") as any;

  try {
    const data = await ResourceService.findMany({ courseId, type });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
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

    // Extract fileKey from fileUrl (UploadThing provides this in the URL)
    const fileKey = fileUrl.split('/').pop() || '';

    // Create the resource
    const resource = await ResourceService.createResource({
      title,
      type,
      courseId,
      fileUrl,
      fileKey,
      userId: session.user.id,
    });

    return NextResponse.json(resource[0], { status: 201 });
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}