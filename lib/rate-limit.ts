import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";

export interface RateLimitPolicy {
  id: string;
  windowMs: number;
  maxRequests: number;
}

interface ConsumeRateLimitOptions {
  req: NextRequest;
  policy: RateLimitPolicy;
  userId?: string | null;
  extraIdentifiers?: Array<string | null | undefined>;
}

export interface RateLimitState {
  limit: number;
  remaining: number;
  requestCount: number;
  resetAt: number;
  retryAfter: number;
  policy: RateLimitPolicy;
}

const RATE_LIMIT_RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

/**
 * Safe deployment defaults:
 * - Free-tier/shared Postgres: use narrower windows and lower burst counts so a small instance is not overwhelmed.
 * - Production/dedicated Redis or Postgres: raise limits gradually once you have observability and abuse alerts.
 * Keep auth and write endpoints conservative because they are the most abuse-prone routes.
 */
export const rateLimitPolicies = {
  authRead: {
    id: "auth:read",
    windowMs: 60 * 1000,
    maxRequests: 60,
  },
  authWrite: {
    id: "auth:write",
    windowMs: 10 * 60 * 1000,
    maxRequests: 10,
  },
  commentsWrite: {
    id: "comments:write",
    windowMs: 10 * 60 * 1000,
    maxRequests: 10,
  },
  resourcesCreate: {
    id: "resources:create",
    windowMs: 10 * 60 * 1000,
    maxRequests: 6,
  },
  votesWrite: {
    id: "resources:vote",
    windowMs: 5 * 60 * 1000,
    maxRequests: 30,
  },
  downloadsWrite: {
    id: "resources:download",
    windowMs: 5 * 60 * 1000,
    maxRequests: 20,
  },
  profileWrite: {
    id: "users:profile",
    windowMs: 15 * 60 * 1000,
    maxRequests: 8,
  },
  uploadthing: {
    id: "uploadthing:middleware",
    windowMs: 10 * 60 * 1000,
    maxRequests: 12,
  },
  search: {
    id: "search",
    windowMs: 5 * 60 * 1000,
    maxRequests: 30,
  },
} satisfies Record<string, RateLimitPolicy>;

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");

  return forwarded?.split(",")[0]?.trim() || realIp || cfConnectingIp || "unknown";
}

function sanitizeKeyPart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9:_@.-]/g, "_");
}

function buildBucketKey({ req, policy, userId, extraIdentifiers = [] }: ConsumeRateLimitOptions): string {
  const ip = sanitizeKeyPart(getClientIp(req));
  const identityParts = [
    `ip:${ip}`,
    userId ? `user:${sanitizeKeyPart(userId)}` : "user:anonymous",
    ...extraIdentifiers.filter(Boolean).map((value) => `extra:${sanitizeKeyPart(value as string)}`),
  ];

  return `${policy.id}:${identityParts.join(":")}`;
}

async function consumeRateLimit(options: ConsumeRateLimitOptions): Promise<RateLimitState> {
  const { policy } = options;
  const bucketKey = buildBucketKey(options);
  const windowSeconds = Math.max(1, Math.ceil(policy.windowMs / 1000));

  const result = await db.execute(sql`
    INSERT INTO rate_limit_buckets (bucket_key, policy_id, request_count, reset_at, created_at, updated_at)
    VALUES (
      ${bucketKey},
      ${policy.id},
      1,
      NOW() + (${windowSeconds} * INTERVAL '1 second'),
      NOW(),
      NOW()
    )
    ON CONFLICT (bucket_key) DO UPDATE
    SET
      request_count = CASE
        WHEN rate_limit_buckets.reset_at <= NOW() THEN 1
        ELSE rate_limit_buckets.request_count + 1
      END,
      reset_at = CASE
        WHEN rate_limit_buckets.reset_at <= NOW() THEN NOW() + (${windowSeconds} * INTERVAL '1 second')
        ELSE rate_limit_buckets.reset_at
      END,
      updated_at = NOW()
    RETURNING
      request_count,
      EXTRACT(EPOCH FROM reset_at)::bigint AS reset_at_epoch
  `);

  const row = result.rows[0] as { request_count: number | string; reset_at_epoch: number | string } | undefined;

  if (!row) {
    throw new Error("Failed to record rate limit state");
  }

  const requestCount = Number(row.request_count);
  const resetAt = Number(row.reset_at_epoch) * 1000;
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));

  return {
    limit: policy.maxRequests,
    remaining: Math.max(0, policy.maxRequests - requestCount),
    requestCount,
    resetAt,
    retryAfter,
    policy,
  };
}

function applyRateLimitHeaders(response: NextResponse, state: RateLimitState): NextResponse {
  response.headers.set("X-RateLimit-Limit", state.limit.toString());
  response.headers.set("X-RateLimit-Remaining", state.remaining.toString());
  response.headers.set("X-RateLimit-Reset", Math.floor(state.resetAt / 1000).toString());
  response.headers.set("RateLimit-Limit", state.limit.toString());
  response.headers.set("RateLimit-Remaining", state.remaining.toString());
  response.headers.set("RateLimit-Reset", Math.max(0, Math.ceil((state.resetAt - Date.now()) / 1000)).toString());
  response.headers.set("Retry-After", state.retryAfter.toString());

  for (const [header, value] of Object.entries(RATE_LIMIT_RESPONSE_HEADERS)) {
    response.headers.set(header, value);
  }

  return response;
}

export async function checkRateLimit(options: ConsumeRateLimitOptions): Promise<{
  state: RateLimitState;
  response: NextResponse | null;
}> {
  const state = await consumeRateLimit(options);

  if (state.requestCount > state.limit) {
    return {
      state,
      response: applyRateLimitHeaders(
        NextResponse.json(
          {
            error: "Too many requests",
            code: "RATE_LIMITED",
            retryAfter: state.retryAfter,
          },
          { status: 429 },
        ),
        state,
      ),
    };
  }

  return { state, response: null };
}

export function withRateLimitHeaders(response: NextResponse, state: RateLimitState): NextResponse {
  return applyRateLimitHeaders(response, state);
}
