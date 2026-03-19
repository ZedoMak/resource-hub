import { NextRequest, NextResponse } from "next/server";
import { ResourceService } from "@/services/resource.service";
import { handleApiError } from "@/lib/security";

// Simple in-memory rate limiting for this endpoint
const searchRateLimit = new Map<string, { count: number; resetTime: number }>();

async function checkSearchRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  const key = `search:${ip}`;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxRequests = 30;

  let rateLimitData = searchRateLimit.get(key);
  
  if (!rateLimitData || now > rateLimitData.resetTime) {
    searchRateLimit.set(key, { count: 1, resetTime: now + windowMs });
    return null;
  }

  rateLimitData.count++;
  
  if (rateLimitData.count > maxRequests) {
    return NextResponse.json(
      { error: "Too many requests" },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitData.resetTime - now) / 1000).toString(),
        }
      }
    );
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResponse = await checkSearchRateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const query = req.nextUrl.searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ data: [] });
    }

    // Additional validation
    if (query.length > 100) {
      return NextResponse.json({ error: "Search query too long" }, { status: 400 });
    }

    const results = await ResourceService.searchResources(query);
    return NextResponse.json({ data: results });
  } catch (error) {
    return handleApiError(error);
  }
}