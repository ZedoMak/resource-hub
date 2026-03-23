import { NextResponse, type NextRequest } from "next/server";

const DEFAULT_UPLOADTHING_FILE_HOSTS = ["utfs.io", "*.utfs.io", "*.ufs.sh"];

function normalizeOrigin(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function parseUploadThingToken() {
  const token = process.env.UPLOADTHING_TOKEN;

  if (!token) {
    return null;
  }

  try {
    const parsed = JSON.parse(atob(token)) as {
      regions?: string[];
      ingestHost?: string;
    };

    return {
      ingestHost: parsed.ingestHost ?? "ingest.uploadthing.com",
      regions: parsed.regions ?? [],
    };
  } catch {
    return null;
  }
}

function getConfiguredUploadThingFileHosts() {
  const configuredHosts = (process.env.NEXT_PUBLIC_UPLOADTHING_ALLOWED_HOSTS ?? process.env.UPLOADTHING_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return configuredHosts.length > 0 ? configuredHosts : DEFAULT_UPLOADTHING_FILE_HOSTS;
}

function toHttpsOrigin(hostOrPattern: string) {
  return `https://${hostOrPattern}`;
}

function getAppOrigins(request: NextRequest) {
  return [request.nextUrl.origin, normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL), normalizeOrigin(process.env.BETTER_AUTH_URL)]
    .filter((value): value is string => Boolean(value));
}

function getUploadThingConnectOrigins() {
  const uploadThingToken = parseUploadThingToken();

  if (!uploadThingToken || uploadThingToken.regions.length === 0) {
    return ["https://ingest.uploadthing.com"];
  }

  return uploadThingToken.regions.map((region) => `https://${region}.${uploadThingToken.ingestHost}`);
}

function getUploadThingFrameSources() {
  return getConfiguredUploadThingFileHosts().map(toHttpsOrigin);
}

function buildContentSecurityPolicy(request: NextRequest, nonce: string) {
  const scriptSources = ["'self'", `'nonce-${nonce}'`];

  if (process.env.NODE_ENV === "development") {
    scriptSources.push("'unsafe-eval'");
  }

  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    ["script-src", scriptSources],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", "data:", "blob:", "https:"]],
    ["font-src", ["'self'", "data:"]],
    ["connect-src", [...new Set([...getAppOrigins(request), ...getUploadThingConnectOrigins()])]],
    ["frame-src", [...new Set(getUploadThingFrameSources())]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
  ];

  return directives.map(([name, values]) => `${name} ${values.join(" ")}`).join("; ");
}

export function createSecurityContext(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);

  return {
    nonce,
    requestHeaders,
    contentSecurityPolicy: buildContentSecurityPolicy(request, nonce),
  };
}

export function addSecurityHeaders(response: NextResponse, securityContext: ReturnType<typeof createSecurityContext>): NextResponse {
  /*
   * Final header strategy:
   * - CSP is the primary enforcement layer for scripts, frames, form posts, and UploadThing/file origins.
   * - `frame-ancestors 'none'` is authoritative; `X-Frame-Options` stays as a legacy fallback.
   * - Keep modern hardening headers that still add value, and drop deprecated ones like `X-XSS-Protection`.
   */
  response.headers.set("Content-Security-Policy", securityContext.contentSecurityPolicy);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("x-nonce", securityContext.nonce);

  return response;
}

export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  const isDevelopment = process.env.NODE_ENV === "development";

  if (error instanceof Error) {
    if (error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }

    if (error.message.includes("Unauthorized") || error.message.includes("unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    if (error.message.includes("Invalid") || error.message.includes("validation")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: isDevelopment ? error.message : "Internal server error",
        ...(isDevelopment && { stack: error.stack }),
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 },
  );
}
