import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/db";
import { aiConversations, aiMessages, aiProviderKeys, resources } from "@/db/schema";
import { decryptApiKey } from "@/lib/ai/crypto";
import { getAIProvider, type AIProvider } from "@/lib/ai/providers";

export const AI_CHAT_GUARDRAILS = {
  maxInputLength: 4_000,
  maxHistoryMessages: 12,
  maxPromptCharacters: 16_000,
  timeoutMs: 15_000,
  fallbackErrorText: "I ran into a provider issue and couldn’t complete that request right now. Please try again in a moment.",
} as const;

export const AI_CHAT_ERROR_CODES = {
  invalidApiKey: "INVALID_API_KEY",
  quotaExceeded: "QUOTA_EXCEEDED",
  modelUnavailable: "MODEL_UNAVAILABLE",
  providerError: "PROVIDER_ERROR",
  invalidRequest: "INVALID_REQUEST",
  notFound: "NOT_FOUND",
  timeout: "TIMEOUT",
  missingProviderKey: "MISSING_PROVIDER_KEY",
} as const;

export type AppChatErrorCode = (typeof AI_CHAT_ERROR_CODES)[keyof typeof AI_CHAT_ERROR_CODES];
export type ChatMessageRole = "system" | "user" | "assistant";

export interface ChatHistoryMessage {
  role: ChatMessageRole;
  content: string;
}

export interface ResourceContext {
  id: string;
  title: string;
  type: string;
}

export interface ChatCompletionRequest {
  userId: string;
  provider: AIProvider;
  model: string;
  message: string;
  history: ChatHistoryMessage[];
  resourceContext?: ResourceContext | null;
}

export interface ChatCompletionResult {
  reply: string;
  promptMessages: ChatHistoryMessage[];
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

interface ProviderSendRequest {
  apiKey: string;
  model: string;
  messages: ChatHistoryMessage[];
  timeoutMs: number;
}

interface ProviderSendResult {
  text: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

class ChatServiceError extends Error {
  code: AppChatErrorCode;
  status: number;

  constructor(code: AppChatErrorCode, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const providerAdapters: Record<AIProvider, (request: ProviderSendRequest) => Promise<ProviderSendResult>> = {
  OPENAI: sendOpenAIChatCompletion,
  GEMINI: sendGeminiChatCompletion,
};

function normalizeContent(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\u0000/g, "").trim();
}

function trimPromptSegment(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function takeLastMessages(messages: ChatHistoryMessage[], maxMessages: number): ChatHistoryMessage[] {
  return messages.slice(-maxMessages);
}

function trimPromptMessages(messages: ChatHistoryMessage[]): ChatHistoryMessage[] {
  const trimmed = [...messages];

  while (trimmed.reduce((total, message) => total + message.content.length, 0) > AI_CHAT_GUARDRAILS.maxPromptCharacters && trimmed.length > 2) {
    trimmed.splice(1, 1);
  }

  return trimmed.map((message, index) => ({
    ...message,
    content:
      index === trimmed.length - 1
        ? trimPromptSegment(message.content, Math.min(message.content.length, AI_CHAT_GUARDRAILS.maxInputLength))
        : message.content,
  }));
}

function buildSystemPrompt(resourceContext?: ResourceContext | null): string {
  const baseInstruction = "You are the Resource Hub study assistant. Give concise, accurate help grounded in the user request. If you are uncertain, say so instead of making up facts.";

  if (!resourceContext) {
    return baseInstruction;
  }

  return `${baseInstruction}\n\nRelevant resource context:\n- Resource ID: ${resourceContext.id}\n- Title: ${resourceContext.title}\n- Type: ${resourceContext.type}`;
}

function normalizeHistory(history: ChatHistoryMessage[], latestMessage: string, resourceContext?: ResourceContext | null): ChatHistoryMessage[] {
  const normalizedHistory = history
    .map((message) => ({
      role: message.role,
      content: normalizeContent(message.content),
    }))
    .filter((message) => message.content.length > 0);

  const promptMessages = [
    {
      role: "system" as const,
      content: buildSystemPrompt(resourceContext),
    },
    ...takeLastMessages(normalizedHistory, AI_CHAT_GUARDRAILS.maxHistoryMessages),
    {
      role: "user" as const,
      content: trimPromptSegment(normalizeContent(latestMessage), AI_CHAT_GUARDRAILS.maxInputLength),
    },
  ];

  return trimPromptMessages(promptMessages);
}

async function parseProviderError(response: Response): Promise<ChatServiceError> {
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  const message =
    (typeof payload?.error === "string" && payload.error) ||
    (typeof payload?.message === "string" && payload.message) ||
    (payload && typeof payload.error === "object" && payload.error && typeof (payload.error as Record<string, unknown>).message === "string"
      ? ((payload.error as Record<string, unknown>).message as string)
      : null) ||
    "Provider request failed";
  const providerCode =
    (payload && typeof payload.error === "object" && payload.error && typeof (payload.error as Record<string, unknown>).code === "string"
      ? ((payload.error as Record<string, unknown>).code as string)
      : null) ||
    (typeof payload?.status === "string" ? payload.status : null);

  if (response.status === 401 || response.status === 403) {
    return new ChatServiceError(AI_CHAT_ERROR_CODES.invalidApiKey, message, 400);
  }

  if (response.status === 404 || providerCode === "model_not_found") {
    return new ChatServiceError(AI_CHAT_ERROR_CODES.modelUnavailable, message, 400);
  }

  if (response.status === 429 || providerCode === "RESOURCE_EXHAUSTED") {
    return new ChatServiceError(AI_CHAT_ERROR_CODES.quotaExceeded, message, 429);
  }

  if (response.status === 400 && /model/i.test(message)) {
    return new ChatServiceError(AI_CHAT_ERROR_CODES.modelUnavailable, message, 400);
  }

  return new ChatServiceError(AI_CHAT_ERROR_CODES.providerError, message, response.status >= 500 ? 502 : 400);
}

async function sendOpenAIChatCompletion({ apiKey, model, messages, timeoutMs }: ProviderSendRequest): Promise<ProviderSendResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  }).catch((error: unknown) => {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ChatServiceError(AI_CHAT_ERROR_CODES.timeout, "The provider request timed out", 504);
    }

    throw new ChatServiceError(AI_CHAT_ERROR_CODES.providerError, "Unable to reach OpenAI right now", 502);
  });

  if (!response.ok) {
    throw await parseProviderError(response);
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string | null } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const text = normalizeContent(payload.choices?.[0]?.message?.content ?? "");

  if (!text) {
    throw new ChatServiceError(AI_CHAT_ERROR_CODES.providerError, "OpenAI returned an empty response", 502);
  }

  return {
    text,
    usage: {
      inputTokens: payload.usage?.prompt_tokens,
      outputTokens: payload.usage?.completion_tokens,
    },
  };
}

async function sendGeminiChatCompletion({ apiKey, model, messages, timeoutMs }: ProviderSendRequest): Promise<ProviderSendResult> {
  const systemMessage = messages.find((message) => message.role === "system");
  const contents = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...(systemMessage ? { systemInstruction: { parts: [{ text: systemMessage.content }] } } : {}),
      contents,
      generationConfig: {
        temperature: 0.2,
      },
    }),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  }).catch((error: unknown) => {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ChatServiceError(AI_CHAT_ERROR_CODES.timeout, "The provider request timed out", 504);
    }

    throw new ChatServiceError(AI_CHAT_ERROR_CODES.providerError, "Unable to reach Gemini right now", 502);
  });

  if (!response.ok) {
    throw await parseProviderError(response);
  }

  const payload = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
    };
  };

  const text = normalizeContent(
    payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? "",
  );

  if (!text) {
    throw new ChatServiceError(AI_CHAT_ERROR_CODES.providerError, "Gemini returned an empty response", 502);
  }

  return {
    text,
    usage: {
      inputTokens: payload.usageMetadata?.promptTokenCount,
      outputTokens: payload.usageMetadata?.candidatesTokenCount,
    },
  };
}

export function normalizeStoredMessageContent(content: string): string {
  return trimPromptSegment(normalizeContent(content), AI_CHAT_GUARDRAILS.maxInputLength);
}

export async function getConversationForUser(userId: string, conversationId: string) {
  return db.query.aiConversations.findFirst({
    where: and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId)),
  });
}

export async function getResourceContext(resourceId: string) {
  const resource = await db.query.resources.findFirst({
    where: eq(resources.id, resourceId),
    columns: {
      id: true,
      title: true,
      type: true,
    },
  });

  if (!resource) {
    throw new ChatServiceError(AI_CHAT_ERROR_CODES.notFound, "Resource not found", 404);
  }

  return resource;
}

export async function listConversationHistory(conversationId: string): Promise<ChatHistoryMessage[]> {
  const records = await db.query.aiMessages.findMany({
    where: eq(aiMessages.conversationId, conversationId),
    columns: {
      role: true,
      content: true,
    },
    orderBy: desc(aiMessages.createdAt),
    limit: AI_CHAT_GUARDRAILS.maxHistoryMessages,
  });

  return records.reverse().map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export async function persistConversationMessage(params: {
  conversationId: string;
  role: ChatMessageRole;
  content: string;
}) {
  const normalizedContent = normalizeStoredMessageContent(params.content);

  const [message] = await db.insert(aiMessages).values({
    id: nanoid(),
    conversationId: params.conversationId,
    role: params.role,
    content: normalizedContent,
  }).returning();

  await db.update(aiConversations).set({ updatedAt: new Date() }).where(eq(aiConversations.id, params.conversationId));

  return message;
}

export async function upsertConversation(params: {
  conversationId?: string;
  userId: string;
  provider: AIProvider;
  model: string;
  resourceId?: string | null;
}) {
  if (params.conversationId) {
    const existingConversation = await getConversationForUser(params.userId, params.conversationId);

    if (!existingConversation) {
      throw new ChatServiceError(AI_CHAT_ERROR_CODES.notFound, "Conversation not found", 404);
    }

    const [conversation] = await db.update(aiConversations).set({
      provider: params.provider,
      model: params.model.trim(),
      resourceId: params.resourceId ?? existingConversation.resourceId,
      updatedAt: new Date(),
    }).where(eq(aiConversations.id, existingConversation.id)).returning();

    return conversation;
  }

  const [conversation] = await db.insert(aiConversations).values({
    id: nanoid(),
    userId: params.userId,
    provider: params.provider,
    model: params.model.trim(),
    resourceId: params.resourceId ?? null,
  }).returning();

  return conversation;
}

export async function generateChatCompletion({ userId, provider, model, message, history, resourceContext }: ChatCompletionRequest): Promise<ChatCompletionResult> {
  const providerDescriptor = getAIProvider(provider);
  const providerKey = await db.query.aiProviderKeys.findFirst({
    where: and(
      eq(aiProviderKeys.userId, userId),
      eq(aiProviderKeys.provider, providerDescriptor.id),
      eq(aiProviderKeys.status, "active"),
    ),
    orderBy: asc(aiProviderKeys.createdAt),
  });

  if (!providerKey) {
    throw new ChatServiceError(
      AI_CHAT_ERROR_CODES.missingProviderKey,
      `No active ${providerDescriptor.label} API key is saved for this user`,
      400,
    );
  }

  const apiKey = decryptApiKey(providerKey.encryptedKey);
  const promptMessages = normalizeHistory(history, message, resourceContext);
  const adapter = providerAdapters[providerDescriptor.id];
  const completion = await adapter({
    apiKey,
    model: model.trim(),
    messages: promptMessages,
    timeoutMs: AI_CHAT_GUARDRAILS.timeoutMs,
  });

  await db.update(aiProviderKeys).set({ lastUsedAt: new Date(), updatedAt: new Date() }).where(eq(aiProviderKeys.id, providerKey.id));

  return {
    reply: completion.text,
    promptMessages,
    usage: completion.usage,
  };
}

export function isChatServiceError(error: unknown): error is ChatServiceError {
  return error instanceof ChatServiceError;
}

export function toChatErrorResponse(error: unknown) {
  if (isChatServiceError(error)) {
    return {
      code: error.code,
      error: error.message,
      status: error.status,
      fallbackText: AI_CHAT_GUARDRAILS.fallbackErrorText,
    };
  }

  return {
    code: AI_CHAT_ERROR_CODES.providerError,
    error: "Unexpected chat service failure",
    status: 500,
    fallbackText: AI_CHAT_GUARDRAILS.fallbackErrorText,
  };
}
