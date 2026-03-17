import { NextRequest, NextResponse } from "next/server";
import { ResourceService } from "@/services/resource.service";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");

  if (!query || query.length < 3) {
    return NextResponse.json({ data: [] });
  }

  try {
    const results = await ResourceService.searchResources(query);
    return NextResponse.json({ data: results });
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}