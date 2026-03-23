const OPENAI_MODELS_URL = "https://api.openai.com/v1/models";

export interface ProviderValidationResult {
  ok: boolean;
  status: "active" | "invalid";
  errorCode?: "INVALID_KEY" | "QUOTA_EXCEEDED" | "UPSTREAM_UNAVAILABLE";
  message: string;
}

export async function validateOpenAIKey(apiKey: string): Promise<ProviderValidationResult> {
  const response = await fetch(OPENAI_MODELS_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (response.ok) {
    return {
      ok: true,
      status: "active",
      message: "OpenAI key validated successfully.",
    };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      status: "invalid",
      errorCode: "INVALID_KEY",
      message: "OpenAI rejected this API key. Double-check the key and project permissions.",
    };
  }

  if (response.status === 429) {
    return {
      ok: false,
      status: "invalid",
      errorCode: "QUOTA_EXCEEDED",
      message: "OpenAI accepted the key, but the account is currently rate limited or out of quota.",
    };
  }

  return {
    ok: false,
    status: "invalid",
    errorCode: "UPSTREAM_UNAVAILABLE",
    message: "OpenAI could not validate the key right now. Please try again in a moment.",
  };
}
