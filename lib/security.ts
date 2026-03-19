import { NextRequest, NextResponse } from "next/server";

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
  );
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }
    
    if (error.message.includes('Unauthorized') || error.message.includes('unauthorized')) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }
    
    if (error.message.includes('Invalid') || error.message.includes('validation')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    // Generic error
    return NextResponse.json(
      { 
        error: isDevelopment ? error.message : "Internal server error",
        ...(isDevelopment && { stack: error.stack })
      },
      { status: 500 }
    );
  }
  
  // Unknown error type
  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  );
}
