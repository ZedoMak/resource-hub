"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bot, MessageSquare, PanelRightOpen } from "lucide-react";

import { AIChatComposer } from "@/components/ai/AIChatComposer";
import { AIChatMessageList, type AIChatMessageItem } from "@/components/ai/AIChatMessageList";
import { AIProviderStatus, type AICompanionAvailability } from "@/components/ai/AIProviderStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AIProvider = "OPENAI" | "GEMINI";
type ProviderStatus = "active" | "invalid" | "revoked";

interface ProviderSnapshot {
  provider: AIProvider;
  status: ProviderStatus;
  keyFingerprint: string;
}

interface ResourceMetadata {
  id: string;
  title: string;
  courseCode: string | null;
  courseName: string | null;
  type: string;
}

interface AICompanionPanelProps {
  isAuthenticated: boolean;
  resource: ResourceMetadata;
  providers: ProviderSnapshot[];
  className?: string;
}

interface ChatApiResponse {
  conversation?: {
    id: string;
  };
  message?: {
    role: "assistant";
    content: string;
  };
  error?: string;
  code?: string;
  fallbackText?: string;
  conversationId?: string;
}

const PROVIDER_LABELS: Record<AIProvider, string> = {
  OPENAI: "OpenAI",
  GEMINI: "Google Gemini",
};

const DEFAULT_MODELS: Record<AIProvider, string> = {
  OPENAI: "gpt-4o-mini",
  GEMINI: "gemini-2.0-flash",
};

function buildAvailability(providers: ProviderSnapshot[], isAuthenticated: boolean): {
  availability: AICompanionAvailability;
  activeProvider: ProviderSnapshot | null;
  detail: string | null;
} {
  if (!isAuthenticated) {
    return {
      availability: "unauthenticated",
      activeProvider: null,
      detail: null,
    };
  }

  const activeProvider = providers.find((provider) => provider.status === "active") ?? null;

  if (activeProvider) {
    return {
      availability: "ready",
      activeProvider,
      detail: `${PROVIDER_LABELS[activeProvider.provider]} key ${activeProvider.keyFingerprint} is available for this conversation.`,
    };
  }

  const invalidProvider = providers.find((provider) => provider.status === "invalid");

  if (invalidProvider) {
    return {
      availability: "invalid_key",
      activeProvider: null,
      detail: `${PROVIDER_LABELS[invalidProvider.provider]} key ${invalidProvider.keyFingerprint} is no longer valid. Update it in Settings to continue.`,
    };
  }

  return {
    availability: "no_key",
    activeProvider: null,
    detail: null,
  };
}

function nextAvailabilityFromError(code?: string): AICompanionAvailability {
  if (code === "MISSING_PROVIDER_KEY") return "no_key";
  if (code === "INVALID_API_KEY") return "invalid_key";
  if (code === "QUOTA_EXCEEDED") return "quota_exceeded";
  if (code === "PROVIDER_ERROR" || code === "TIMEOUT" || code === "MODEL_UNAVAILABLE") return "provider_offline";
  return "provider_offline";
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AICompanionPanel({ isAuthenticated, resource, providers, className }: AICompanionPanelProps) {
  const initialProviderState = useMemo(() => buildAvailability(providers, isAuthenticated), [providers, isAuthenticated]);
  const [availability, setAvailability] = useState<AICompanionAvailability>(initialProviderState.availability);
  const [providerDetail, setProviderDetail] = useState<string | null>(initialProviderState.detail);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIChatMessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [retryDraft, setRetryDraft] = useState("");

  const providerLabel = initialProviderState.activeProvider ? PROVIDER_LABELS[initialProviderState.activeProvider.provider] : null;
  const isReady = availability === "ready" && initialProviderState.activeProvider;

  const metadataItems = [
    resource.title,
    resource.courseCode,
    resource.courseName,
    resource.type,
  ].filter(Boolean) as string[];

  const handleRetry = () => {
    if (retryDraft) {
      setDraft(retryDraft);
    }
  };

  const handleSubmit = async () => {
    const nextMessage = draft.trim();

    if (!nextMessage || !initialProviderState.activeProvider || availability !== "ready" || isSending) {
      return;
    }

    setIsSending(true);
    setRetryDraft(nextMessage);
    setProviderDetail(initialProviderState.detail);

    const userMessageId = createId("user");
    const assistantMessageId = createId("assistant");

    setMessages((current) => [
      ...current,
      {
        id: userMessageId,
        role: "user",
        content: nextMessage,
        createdAt: new Date().toISOString(),
      },
      {
        id: assistantMessageId,
        role: "assistant",
        content: "Thinking through this resource…",
        isPending: true,
      },
    ]);
    setDraft("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          provider: initialProviderState.activeProvider.provider,
          model: DEFAULT_MODELS[initialProviderState.activeProvider.provider],
          resourceId: resource.id,
          message: nextMessage,
        }),
      });

      const payload = (await response.json()) as ChatApiResponse;

      if (!response.ok) {
        const nextAvailability = nextAvailabilityFromError(payload.code);
        setAvailability(nextAvailability);
        setProviderDetail(payload.error ?? initialProviderState.detail);
        if (payload.conversationId) {
          setConversationId(payload.conversationId);
        }

        setMessages((current) => current.map((message) => (
          message.id === assistantMessageId
            ? {
                ...message,
                content: payload.fallbackText ?? payload.error ?? "The assistant couldn’t respond right now.",
                isPending: false,
                isError: true,
                retryable: true,
                createdAt: new Date().toISOString(),
              }
            : message
        )));
        return;
      }

      if (payload.conversation?.id) {
        setConversationId(payload.conversation.id);
      }

      setAvailability(initialProviderState.availability);
      setProviderDetail(initialProviderState.detail);
      setMessages((current) => current.map((message) => (
        message.id === assistantMessageId
          ? {
              ...message,
              content: payload.message?.content ?? "The assistant did not return any text.",
              isPending: false,
              isError: false,
              retryable: false,
              createdAt: new Date().toISOString(),
            }
          : message
      )));
    } catch {
      setAvailability("provider_offline");
      setProviderDetail("We couldn’t reach the assistant service. Check your connection and try again.");
      setMessages((current) => current.map((message) => (
        message.id === assistantMessageId
          ? {
              ...message,
              content: "The assistant is temporarily unavailable. You can retry your prompt in a moment.",
              isPending: false,
              isError: true,
              retryable: true,
              createdAt: new Date().toISOString(),
            }
          : message
      )));
    } finally {
      setIsSending(false);
    }
  };

  const renderPanelBody = () => (
    <div className={cn("flex h-full flex-col rounded-3xl border bg-white shadow-sm", className)}>
      <div className="space-y-4 border-b px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-zinc-900 p-2 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Study assistant</h2>
                <p className="text-sm text-zinc-500">Resource-aware help without crowding the preview.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {metadataItems.map((item) => (
                <Badge key={item} variant="outline" className="rounded-full border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] text-zinc-600">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <AIProviderStatus status={availability} providerLabel={providerLabel} detail={providerDetail} compact />
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        {isReady ? (
          <>
            <AIChatMessageList messages={messages} onRetry={handleRetry} />
            <AIChatComposer
              value={draft}
              onChange={setDraft}
              onSubmit={() => void handleSubmit()}
              disabled={!isReady}
              isSending={isSending}
              canSend={!isSending}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col justify-between gap-4">
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-sm leading-6 text-zinc-600">
              <p className="font-medium text-zinc-900">The page layout stays the same while the assistant is unavailable.</p>
              <p className="mt-2">
                Configure a working provider key to unlock concise summaries, question generation, and study guidance tied to this resource.
              </p>
            </div>
            <Button asChild variant="outline" className="self-start">
              <Link href="/settings">Manage AI provider keys</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">{renderPanelBody()}</div>

      <div className="lg:hidden">
        <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-between rounded-2xl border-zinc-200 bg-white py-6 shadow-sm">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Ask the study assistant
              </span>
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="left-1/2 top-auto bottom-0 max-w-[calc(100%-1rem)] translate-y-0 rounded-b-none rounded-t-3xl p-0 sm:max-w-lg">
            <DialogHeader className="border-b px-5 py-4">
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-4 w-4" /> Study assistant
              </DialogTitle>
              <DialogDescription>
                Ask for help without leaving the preview, comments, or download tools.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[85vh] overflow-y-auto p-4">{renderPanelBody()}</div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
