import { asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { aiMessages } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  AI_CHAT_ERROR_CODES,
  AI_CHAT_GUARDRAILS,
  generateChatCompletion,
  getConversationForUser,
  getResourceContext,
  listConversationHistory,
  normalizeStoredMessageContent,
  persistConversationMessage,
  toChatErrorResponse,
  upsertConversation,
} from "@/lib/ai/chat-service";
import { isAIProvider } from "@/lib/ai/providers";
import { checkRateLimit, rateLimitPolicies, withRateLimitHeaders } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/security";

export const maxDuration = 20;

interface ChatRouteBody {
  conversationId?: unknown;
  provider?: unknown;
  model?: unknown;
  resourceId?: unknown;
  message?: unknown;
}

function validateRequest(body: ChatRouteBody) {
  const providerValue = typeof body.provider === "string" ? body.provider.toUpperCase() : "";
  const model = typeof body.model === "string" ? body.model.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const conversationId = typeof body.conversationId === "string" ? body.conversationId.trim() : undefined;
  const resourceId = typeof body.resourceId === "string" ? body.resourceId.trim() : undefined;

  if (!isAIProvider(providerValue)) {
    return { error: "Unsupported AI provider", code: AI_CHAT_ERROR_CODES.invalidRequest, status: 400 };
  }

  if (!model) {
    return { error: "Model is required", code: AI_CHAT_ERROR_CODES.invalidRequest, status: 400 };
  }

  if (!message) {
    return { error: "Message is required", code: AI_CHAT_ERROR_CODES.invalidRequest, status: 400 };
  }

  if (message.length > AI_CHAT_GUARDRAILS.maxInputLength) {
    return {
      error: `Message too long (max ${AI_CHAT_GUARDRAILS.maxInputLength} characters)`,
      code: AI_CHAT_ERROR_CODES.invalidRequest,
      status: 400,
    };
  }

  return {
    provider: providerValue,
    model,
    message,
    conversationId,
    resourceId,
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { state, response } = await checkRateLimit({
      req,
      policy: rateLimitPolicies.aiChat,
      userId: session.user.id,
    });

    if (response) {
      return response;
    }

    const body = await req.json().catch(() => ({}));
    const validation = validateRequest(body);

    if ("error" in validation) {
      return withRateLimitHeaders(
        NextResponse.json({ error: validation.error, code: validation.code }, { status: validation.status }),
        state,
      );
    }

    const existingConversation = validation.conversationId
      ? await getConversationForUser(session.user.id, validation.conversationId)
      : null;

    if (validation.conversationId && !existingConversation) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Conversation not found", code: AI_CHAT_ERROR_CODES.notFound }, { status: 404 }),
        state,
      );
    }

    const resourceId = validation.resourceId ?? existingConversation?.resourceId ?? undefined;
    const resourceContext = resourceId ? await getResourceContext(resourceId) : null;

    const conversation = await upsertConversation({
      conversationId: existingConversation?.id,
      userId: session.user.id,
      provider: validation.provider,
      model: validation.model,
      resourceId: resourceId ?? null,
    });

    const normalizedUserMessage = normalizeStoredMessageContent(validation.message);
    await persistConversationMessage({
      conversationId: conversation.id,
      role: "user",
      content: normalizedUserMessage,
    });

    const history = (await listConversationHistory(conversation.id)).slice(-AI_CHAT_GUARDRAILS.maxHistoryMessages);
    const historyForPrompt = history.slice(0, -1);

    try {
      const completion = await generateChatCompletion({
        userId: session.user.id,
        provider: validation.provider,
        model: validation.model,
        message: normalizedUserMessage,
        history: historyForPrompt,
        resourceContext,
      });

      const assistantMessage = normalizeStoredMessageContent(completion.reply);
      await persistConversationMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: assistantMessage,
      });

      const [messages, freshConversation] = await Promise.all([
        db.query.aiMessages.findMany({
          where: eq(aiMessages.conversationId, conversation.id),
          columns: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
          orderBy: asc(aiMessages.createdAt),
        }),
        getConversationForUser(session.user.id, conversation.id),
      ]);

      return withRateLimitHeaders(
        NextResponse.json({
          conversation: {
            id: conversation.id,
            provider: freshConversation?.provider ?? conversation.provider,
            model: freshConversation?.model ?? conversation.model,
            resourceId: freshConversation?.resourceId ?? conversation.resourceId,
            createdAt: freshConversation?.createdAt ?? conversation.createdAt,
            updatedAt: freshConversation?.updatedAt ?? conversation.updatedAt,
          },
          message: {
            role: "assistant",
            content: assistantMessage,
          },
          usage: completion.usage,
          messages,
        }),
        state,
      );
    } catch (error) {
      const chatError = toChatErrorResponse(error);
      const fallbackMessage = normalizeStoredMessageContent(chatError.fallbackText);

      await persistConversationMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: fallbackMessage,
      });

      return withRateLimitHeaders(
        NextResponse.json(
          {
            error: chatError.error,
            code: chatError.code,
            conversationId: conversation.id,
            fallbackText: fallbackMessage,
          },
          { status: chatError.status },
        ),
        state,
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}
