"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, KeyRound, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AIProvider = "OPENAI" | "GEMINI";
type ProviderStatus = "active" | "invalid" | "revoked";

interface SavedProvider {
  id: string;
  provider: AIProvider;
  keyFingerprint: string;
  status: ProviderStatus;
  lastValidatedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SupportedProvider {
  id: AIProvider;
  label: string;
}

interface ProvidersResponse {
  providers: SavedProvider[];
  supportedProviders: SupportedProvider[];
  keyStorageConfigured: boolean;
  configurationError?: string | null;
}

const ERROR_COPY: Record<string, string> = {
  INVALID_KEY: "That key was rejected by the provider. Check that you copied the right secret and that the project still has access.",
  QUOTA_EXCEEDED: "The provider accepted the key, but the account is rate limited or out of quota. Resolve billing or quota limits, then try again.",
  UPSTREAM_UNAVAILABLE: "The provider could not validate the key right now. Please try again shortly.",
  MISSING_API_KEY: "Enter an API key before testing and saving.",
  INVALID_PROVIDER: "Choose a supported AI provider before saving.",
  AI_KEY_STORAGE_NOT_CONFIGURED: "This server cannot store AI keys yet. Add AI_KEY_ENCRYPTION_SECRET with at least 16 characters, then try again.",
};

function formatDate(value: string | null): string {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusVariant(status: ProviderStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "active") return "default";
  if (status === "invalid") return "destructive";
  if (status === "revoked") return "secondary";
  return "outline";
}

export function AIProviderKeysForm() {
  const [providers, setProviders] = useState<SavedProvider[]>([]);
  const [supportedProviders, setSupportedProviders] = useState<SupportedProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>("OPENAI");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingProvider, setDeletingProvider] = useState<AIProvider | null>(null);
  const [isKeyStorageConfigured, setIsKeyStorageConfigured] = useState(true);
  const [configurationError, setConfigurationError] = useState<string | null>(null);
  const [inlineMessage, setInlineMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const selectedProviderConfig = useMemo(() => {
    return supportedProviders.find((provider) => provider.id === selectedProvider) ?? {
      id: selectedProvider,
      label: selectedProvider,
    };
  }, [selectedProvider, supportedProviders]);

  const loadProviders = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/providers", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json()) as Partial<ProvidersResponse> & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load saved AI providers.");
      }

      setProviders(payload.providers ?? []);
      setSupportedProviders(payload.supportedProviders ?? []);
      setIsKeyStorageConfigured(payload.keyStorageConfigured ?? true);
      setConfigurationError(payload.configurationError ?? null);

      const defaultProvider = payload.supportedProviders?.[0]?.id;
      if (defaultProvider) {
        setSelectedProvider((current) => current || defaultProvider);
      }
    } catch {
      toast.error("Unable to load saved AI providers right now.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  const handleSave = async () => {
    if (!isKeyStorageConfigured) {
      const message = configurationError ?? ERROR_COPY.AI_KEY_STORAGE_NOT_CONFIGURED;
      setInlineMessage({ tone: "error", text: message });
      toast.error(message);
      return;
    }

    if (!apiKey.trim()) {
      const message = ERROR_COPY.MISSING_API_KEY;
      setInlineMessage({ tone: "error", text: message });
      toast.error(message);
      return;
    }

    setIsSaving(true);
    setInlineMessage(null);

    try {
      const response = await fetch("/api/ai/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey,
        }),
      });

      const payload = (await response.json()) as { provider?: SavedProvider; error?: string; code?: string };

      if (!response.ok || !payload.provider) {
        const message = payload.code ? ERROR_COPY[payload.code] ?? payload.error ?? "Unable to validate that key." : payload.error ?? "Unable to validate that key.";
        setInlineMessage({ tone: "error", text: message });
        toast.error(message);
        return;
      }

      setProviders((current) => {
        const next = current.filter((provider) => provider.provider !== payload.provider?.provider);
        next.push(payload.provider as SavedProvider);
        return next.sort((a, b) => a.provider.localeCompare(b.provider));
      });
      setApiKey("");
      const successMessage = `${selectedProviderConfig.label} key validated and saved.`;
      setInlineMessage({ tone: "success", text: successMessage });
      toast.success(successMessage);
    } catch {
      const message = "Unable to reach the AI provider validation endpoint right now.";
      setInlineMessage({ tone: "error", text: message });
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (provider: AIProvider) => {
    setDeletingProvider(provider);
    setInlineMessage(null);

    try {
      const response = await fetch("/api/ai/providers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete saved key.");
      }

      setProviders((current) => current.filter((entry) => entry.provider !== provider));
      const providerLabel = supportedProviders.find((entry) => entry.id === provider)?.label ?? provider;
      toast.success(`${providerLabel} key deleted.`);
      setInlineMessage({ tone: "success", text: `${providerLabel} key removed. You can add a replacement at any time.` });
    } catch {
      const message = "Unable to remove the saved provider key right now.";
      setInlineMessage({ tone: "error", text: message });
      toast.error(message);
    } finally {
      setDeletingProvider(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="max-w-3xl space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">AI providers</h2>
        <p className="text-sm text-muted-foreground">
          Save your own provider keys for future AI-powered features. Keys are validated before saving and only masked fingerprints are ever shown back to you.
        </p>
      </div>

      <Card className="border border-zinc-200/80 shadow-sm">
        <CardHeader>
          <CardTitle>Test &amp; save a provider key</CardTitle>
          <CardDescription>
            Pick a provider, paste a key, and we&apos;ll verify it before storing an encrypted copy on the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!isKeyStorageConfigured ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <p>{configurationError ?? ERROR_COPY.AI_KEY_STORAGE_NOT_CONFIGURED}</p>
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label htmlFor="ai-provider">Provider</Label>
              <Select value={selectedProvider} onValueChange={(value) => setSelectedProvider(value as AIProvider)}>
                <SelectTrigger id="ai-provider" className="h-11 w-full">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {supportedProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-provider-key">API key</Label>
              <Input
                id="ai-provider-key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Paste your API key"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                We never return the plaintext key in the UI, API responses, or toast messages.
              </p>
            </div>
          </div>

          {inlineMessage ? (
            <div
              className={[
                "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
                inlineMessage.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200"
                  : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200",
              ].join(" ")}
            >
              {inlineMessage.tone === "success" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
              )}
              <p>{inlineMessage.text}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={isSaving || isLoading || !isKeyStorageConfigured} size="lg" className="h-11 px-6">
              {isSaving ? <Loader2 className="animate-spin" /> : <KeyRound />}
              {isSaving ? "Testing key..." : "Test & Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Saved provider keys</h3>
          <p className="text-sm text-muted-foreground">Replace a saved key by selecting the same provider and saving a new one.</p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">Loading saved providers...</CardContent>
          </Card>
        ) : providers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              You haven&apos;t saved any provider keys yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {providers.map((provider) => {
              const providerConfig = supportedProviders.find((entry) => entry.id === provider.provider);

              return (
                <Card key={provider.id} className="border border-zinc-200/80 shadow-sm">
                  <CardHeader className="gap-2 sm:flex sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <CardTitle>{providerConfig?.label ?? provider.provider}</CardTitle>
                      <CardDescription>Saved key: {provider.keyFingerprint}</CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(provider.status)} className="capitalize">
                      {provider.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                      <div>
                        <p className="font-medium text-foreground">Last validated</p>
                        <p>{formatDate(provider.lastValidatedAt)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Last used</p>
                        <p>{formatDate(provider.lastUsedAt)}</p>
                      </div>
                    </div>

                    {provider.status === "invalid" ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
                        This saved key is marked invalid. Replace it with a fresh key to restore access.
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-11 px-6"
                        onClick={() => setSelectedProvider(provider.provider)}
                      >
                        Replace
                      </Button>
                      <Button
                        variant="destructive"
                        size="lg"
                        className="h-11 px-6"
                        disabled={deletingProvider === provider.provider}
                        onClick={() => void handleDelete(provider.provider)}
                      >
                        {deletingProvider === provider.provider ? <Loader2 className="animate-spin" /> : <Trash2 />}
                        {deletingProvider === provider.provider ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
