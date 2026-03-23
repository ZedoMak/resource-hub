import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { db } from "@/db";
import { aiProviderKeys } from "@/db/schema";
import { auth } from "@/lib/auth";
import { encryptApiKey, getAIEncryptionConfigurationError, maskApiKey } from "@/lib/ai/crypto";
import { getAIProvider, isAIProvider, listAIProviders } from "@/lib/ai/providers";
import { checkRateLimit, rateLimitPolicies, withRateLimitHeaders } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/security";

export const maxDuration = 15;

function toSafeProviderResponse(record: typeof aiProviderKeys.$inferSelect) {
  return {
    id: record.id,
    provider: record.provider,
    keyFingerprint: record.keyFingerprint,
    status: record.status,
    lastValidatedAt: record.lastValidatedAt,
    lastUsedAt: record.lastUsedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { state, response } = await checkRateLimit({
      req,
      policy: rateLimitPolicies.authRead,
      userId: user.id,
    });

    if (response) {
      return response;
    }

    const savedProviders = await db.query.aiProviderKeys.findMany({
      where: eq(aiProviderKeys.userId, user.id),
      orderBy: asc(aiProviderKeys.provider),
    });

    return withRateLimitHeaders(
      NextResponse.json({
        providers: savedProviders.map(toSafeProviderResponse),
        supportedProviders: listAIProviders().map(({ id, label }) => ({ id, label })),
        keyStorageConfigured: !getAIEncryptionConfigurationError(),
        configurationError: getAIEncryptionConfigurationError(),
      }),
      state,
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { state, response } = await checkRateLimit({
      req,
      policy: rateLimitPolicies.authWrite,
      userId: user.id,
    });

    if (response) {
      return response;
    }

    const body = await req.json();
    const providerValue = typeof body?.provider === "string" ? body.provider.toUpperCase() : "";
    const apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";

    if (!isAIProvider(providerValue)) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Unsupported AI provider", code: "INVALID_PROVIDER" }, { status: 400 }),
        state,
      );
    }

    if (!apiKey) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "API key is required", code: "MISSING_API_KEY" }, { status: 400 }),
        state,
      );
    }

    const configurationError = getAIEncryptionConfigurationError();

    if (configurationError) {
      return withRateLimitHeaders(
        NextResponse.json(
          {
            error: configurationError,
            code: "AI_KEY_STORAGE_NOT_CONFIGURED",
          },
          { status: 503 },
        ),
        state,
      );
    }

    const provider = getAIProvider(providerValue);
    const validation = await provider.validateKey(apiKey);

    if (!validation.ok) {
      return withRateLimitHeaders(
        NextResponse.json(
          {
            error: validation.message,
            code: validation.errorCode ?? "PROVIDER_VALIDATION_FAILED",
            provider: provider.id,
          },
          { status: validation.errorCode === "UPSTREAM_UNAVAILABLE" ? 502 : 400 },
        ),
        state,
      );
    }

    const now = new Date();
    const encryptedKey = encryptApiKey(apiKey);
    const keyFingerprint = maskApiKey(apiKey);

    const [savedProvider] = await db
      .insert(aiProviderKeys)
      .values({
        id: nanoid(),
        userId: user.id,
        provider: provider.id,
        encryptedKey,
        keyFingerprint,
        status: "active",
        lastValidatedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [aiProviderKeys.userId, aiProviderKeys.provider],
        set: {
          encryptedKey,
          keyFingerprint,
          status: "active",
          lastValidatedAt: now,
          updatedAt: now,
        },
      })
      .returning();

    return withRateLimitHeaders(
      NextResponse.json({ provider: toSafeProviderResponse(savedProvider) }, { status: 201 }),
      state,
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { state, response } = await checkRateLimit({
      req,
      policy: rateLimitPolicies.authWrite,
      userId: user.id,
    });

    if (response) {
      return response;
    }

    const body = await req.json().catch(() => ({}));
    const providerValue = typeof body?.provider === "string" ? body.provider.toUpperCase() : "";

    if (!isAIProvider(providerValue)) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Unsupported AI provider", code: "INVALID_PROVIDER" }, { status: 400 }),
        state,
      );
    }

    const deletedProviders = await db
      .delete(aiProviderKeys)
      .where(and(eq(aiProviderKeys.userId, user.id), eq(aiProviderKeys.provider, providerValue)))
      .returning({ id: aiProviderKeys.id });

    if (deletedProviders.length === 0) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Saved provider key not found", code: "NOT_FOUND" }, { status: 404 }),
        state,
      );
    }

    return withRateLimitHeaders(
      NextResponse.json({ success: true, provider: providerValue }),
      state,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
