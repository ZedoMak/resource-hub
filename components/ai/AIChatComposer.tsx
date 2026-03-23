"use client";

import { Loader2, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AIChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isSending?: boolean;
  canSend?: boolean;
}

export function AIChatComposer({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isSending = false,
  canSend = true,
}: AIChatComposerProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (!disabled && canSend && value.trim()) {
              onSubmit();
            }
          }
        }}
        disabled={disabled}
        placeholder="Ask for a summary, key concepts, likely exam questions, or study help for this resource."
        className="min-h-28 resize-none border-none bg-white shadow-sm focus-visible:ring-2"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-2 text-xs leading-5 text-zinc-500">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>Responses may be inaccurate. Verify important details against the original file, course materials, or your instructor.</p>
        </div>

        <Button type="button" onClick={onSubmit} disabled={disabled || isSending || !canSend || !value.trim()} className="min-w-28 self-end">
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isSending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
