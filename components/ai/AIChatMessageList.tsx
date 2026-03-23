import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AIChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  isPending?: boolean;
  isError?: boolean;
  retryable?: boolean;
}

interface AIChatMessageListProps {
  messages: AIChatMessageItem[];
  onRetry?: () => void;
}

function formatMessageTime(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function AIChatMessageList({ messages, onRetry }: AIChatMessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-8 text-center">
        <p className="text-sm font-medium text-zinc-900">Ask about this resource</p>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Try requesting a summary, study plan, quiz questions, or an explanation tied to this upload.
        </p>
      </div>
    );
  }

  return (
    <div className="flex max-h-[28rem] min-h-56 flex-col gap-3 overflow-y-auto pr-1">
      {messages.map((message) => {
        const timeLabel = formatMessageTime(message.createdAt);
        const isAssistant = message.role === "assistant";

        return (
          <div
            key={message.id}
            className={cn(
              "flex flex-col gap-1",
              isAssistant ? "items-start" : "items-end",
            )}
          >
            <div
              className={cn(
                "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                isAssistant
                  ? "border border-zinc-200 bg-white text-zinc-900"
                  : "bg-zinc-900 text-white",
                message.isError && "border-amber-200 bg-amber-50 text-amber-950",
              )}
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                <span>{isAssistant ? "Assistant" : "You"}</span>
                {message.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {message.isError ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words">{message.content}</p>
            </div>

            <div className="flex items-center gap-2 px-1 text-xs text-zinc-400">
              {timeLabel ? <span>{timeLabel}</span> : null}
              {message.retryable && onRetry ? (
                <Button type="button" variant="ghost" size="sm" className="h-auto px-1 py-0 text-xs text-zinc-500" onClick={onRetry}>
                  <RotateCcw className="h-3 w-3" /> Retry
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
