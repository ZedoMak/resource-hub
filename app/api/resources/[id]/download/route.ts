import { NextRequest, NextResponse } from "next/server";
import { ResourceService } from "@/services/resource.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { handleApiError } from "@/lib/security";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate resource ID format
    if (!params.id || params.id.length < 6) {
      return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 });
    }

    const resource = await ResourceService.trackDownload(params.id);
    
    if (!resource || resource.length === 0) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, score: resource[0].newScore });
  } catch (error) {
    return handleApiError(error);
  }
}