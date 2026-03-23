import "server-only";

import { validateGeminiKey } from "./gemini";
import { type ProviderValidationResult, validateOpenAIKey } from "./openai";

export const AI_PROVIDERS = ["OPENAI", "GEMINI"] as const;

export type AIProvider = (typeof AI_PROVIDERS)[number];

export interface ProviderDescriptor {
  id: AIProvider;
  label: string;
  validateKey: (apiKey: string) => Promise<ProviderValidationResult>;
}

const providerRegistry: Record<AIProvider, ProviderDescriptor> = {
  OPENAI: {
    id: "OPENAI",
    label: "OpenAI",
    validateKey: validateOpenAIKey,
  },
  GEMINI: {
    id: "GEMINI",
    label: "Google Gemini",
    validateKey: validateGeminiKey,
  },
};

export function isAIProvider(value: string): value is AIProvider {
  return AI_PROVIDERS.includes(value as AIProvider);
}

export function getAIProvider(provider: AIProvider): ProviderDescriptor {
  return providerRegistry[provider];
}

export function listAIProviders(): ProviderDescriptor[] {
  return AI_PROVIDERS.map((provider) => providerRegistry[provider]);
}

export type { ProviderValidationResult };
