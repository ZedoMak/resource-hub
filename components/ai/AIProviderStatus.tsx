import Link from "next/link";
import { AlertCircle, BadgeAlert, Bot, KeyRound, WifiOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AICompanionAvailability =
  | "ready"
  | "unauthenticated"
  | "no_key"
  | "invalid_key"
  | "quota_exceeded"
  | "provider_offline";

interface AIProviderStatusProps {
  status: AICompanionAvailability;
  providerLabel?: string | null;
  detail?: string | null;
  compact?: boolean;
}

const STATUS_CONTENT: Record<Exclude<AICompanionAvailability, "ready">, {
  title: string;
  description: string;
  tone: string;
  icon: typeof KeyRound;
  ctaLabel?: string;
  ctaHref?: string;
}> = {
  unauthenticated: {
    title: "Sign in to use the study assistant",
    description: "The assistant is only available to signed-in users so conversations can stay attached to your account.",
    tone: "border-zinc-200 bg-zinc-50 text-zinc-700",
    icon: Bot,
    ctaLabel: "Go to login",
    ctaHref: "/login",
  },
  no_key: {
    title: "Add a provider key to get started",
    description: "Save an OpenAI or Gemini key in Settings before opening the assistant for resource-specific help.",
    tone: "border-amber-200 bg-amber-50 text-amber-900",
    icon: KeyRound,
    ctaLabel: "Open settings",
    ctaHref: "/settings",
  },
  invalid_key: {
    title: "Your saved AI key needs attention",
    description: "The provider rejected the saved key. Update it in Settings to re-enable the assistant.",
    tone: "border-rose-200 bg-rose-50 text-rose-900",
    icon: BadgeAlert,
    ctaLabel: "Fix key",
    ctaHref: "/settings",
  },
  quota_exceeded: {
    title: "Provider quota reached",
    description: "The saved key was accepted, but the provider reported rate limits or exhausted quota. Try again later or update billing.",
    tone: "border-amber-200 bg-amber-50 text-amber-900",
    icon: AlertCircle,
    ctaLabel: "Manage key",
    ctaHref: "/settings",
  },
  provider_offline: {
    title: "The AI provider is temporarily unavailable",
    description: "We could not reach the provider just now. You can retry in a moment without changing the rest of the page.",
    tone: "border-blue-200 bg-blue-50 text-blue-900",
    icon: WifiOff,
  },
};

export function AIProviderStatus({ status, providerLabel, detail, compact = false }: AIProviderStatusProps) {
  if (status === "ready") {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <div className="space-y-1">
          <p className="font-semibold">Assistant ready</p>
          <p className="text-xs text-emerald-800/80">
            {providerLabel ? `${providerLabel} is connected and ready for resource-aware questions.` : "A connected provider is ready for resource-aware questions."}
          </p>
        </div>
        <Badge className="border-none bg-emerald-600/10 text-emerald-900 hover:bg-emerald-600/10">
          Connected
        </Badge>
      </div>
    );
  }

  const content = STATUS_CONTENT[status];
  const Icon = content.icon;

  return (
    <div className={cn("rounded-2xl border px-4 py-4", content.tone, compact && "px-3 py-3")}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-white/70 p-2 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 space-y-2">
          <div className="space-y-1">
            <p className="font-semibold leading-5">{content.title}</p>
            <p className="text-sm leading-5 opacity-90">{detail ?? content.description}</p>
          </div>
          {content.ctaHref && content.ctaLabel ? (
            <Button asChild variant="outline" size={compact ? "sm" : "default"} className="bg-white/80">
              <Link href={content.ctaHref}>{content.ctaLabel}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
