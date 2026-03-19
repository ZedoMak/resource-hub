import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter
// In production, you'd want to use Redis or a database
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  maxRequests?: number; // Max requests per window
}

export function createRateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100, // 100 requests per window
  } = options;

  return async function rateLimitMiddleware(req: NextRequest, endpoint: string): Promise<NextResponse | null> {
    // Get client IP
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIp || 'unknown';

    const key = `rate_limit:${ip}:${endpoint}`;
    const now = Date.now();

    // Get existing rate limit data
    let rateLimitData = rateLimitStore.get(key);
    
    if (!rateLimitData || now > rateLimitData.resetTime) {
      // Create or reset rate limit
      rateLimitData = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, rateLimitData);
    } else {
      // Increment counter
      rateLimitData.count++;
      
      // Check if exceeded
      if (rateLimitData.count > maxRequests) {
        return NextResponse.json(
          { 
            error: "Too many requests",
            retryAfter: Math.ceil((rateLimitData.resetTime - now) / 1000)
          }, 
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': Math.max(0, maxRequests - rateLimitData.count).toString(),
              'X-RateLimit-Reset': rateLimitData.resetTime.toString(),
              'Retry-After': Math.ceil((rateLimitData.resetTime - now) / 1000).toString(),
            }
          }
        );
      }
    }

    return null; // No rate limit violation
  };

  return function addRateLimitHeaders(response: NextResponse, req: NextRequest, endpoint: string) {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIp || 'unknown';
    
    const key = `rate_limit:${ip}:${endpoint}`;
    const rateLimitData = rateLimitStore.get(key);
    
    if (rateLimitData) {
      response.headers.set('X-RateLimit-Limit', maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - rateLimitData.count).toString());
      response.headers.set('X-RateLimit-Reset', rateLimitData.resetTime.toString());
    }
    
    return response;
  };
}

// Cleanup function to prevent memory leaks (call this periodically)
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
