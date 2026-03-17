import { NextRequest, NextResponse } from "next/server";
import { ResourceService } from "@/services/resource.service";

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