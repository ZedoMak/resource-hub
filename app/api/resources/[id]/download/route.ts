import { NextRequest, NextResponse } from "next/server";
import { ResourceService } from "@/services/resource.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resource = await ResourceService.trackDownload(params.id);
    return NextResponse.json({ success: true, score: resource[0].newScore });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}