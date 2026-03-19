import { NextRequest, NextResponse } from "next/server";
import { ResourceService } from "@/services/resource.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { handleApiError } from "@/lib/security";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type } = body; // "UP" or "DOWN"

    if (type !== "UP" && type !== "DOWN") {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
    }

    const resolvedParams = await params;

    const result = await ResourceService.toggleVote(
      resolvedParams.id,
      session.user.id,
      type
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
