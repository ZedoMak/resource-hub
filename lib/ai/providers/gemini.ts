import type { ProviderValidationResult } from "./openai";

const GEMINI_MODELS_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export async function validateGeminiKey(apiKey: string): Promise<ProviderValidationResult> {
  const url = new URL(GEMINI_MODELS_URL);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (response.ok) {
    return {
      ok: true,
      status: "active",
      message: "Gemini key validated successfully.",
    };
  }

  if (response.status === 400 || response.status === 401 || response.status === 403) {
    return {
      ok: false,
      status: "invalid",
      errorCode: "INVALID_KEY",
      message: "Google AI Studio rejected this API key. Double-check the key and account access.",
    };
  }

  if (response.status === 429) {
    return {
      ok: false,
      status: "invalid",
      errorCode: "QUOTA_EXCEEDED",
      message: "Google AI Studio accepted the key, but the project is currently rate limited or out of quota.",
    };
  }

  return {
    ok: false,
    status: "invalid",
    errorCode: "UPSTREAM_UNAVAILABLE",
    message: "Google AI Studio could not validate the key right now. Please try again in a moment.",
  };
}
