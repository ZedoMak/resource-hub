import "server-only";

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ENCRYPTION_SECRET = process.env.AI_KEY_ENCRYPTION_SECRET;
const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

function ensureSecret(): string {
  if (!ENCRYPTION_SECRET || ENCRYPTION_SECRET.trim().length < 16) {
    throw new Error("AI_KEY_ENCRYPTION_SECRET must be configured with at least 16 characters");
  }

  return ENCRYPTION_SECRET;
}

function toBase64Url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function deriveKey(salt: Buffer): Buffer {
  return scryptSync(ensureSecret(), salt, 32);
}

export function maskApiKey(secret: string): string {
  const trimmed = secret.trim();
  const visible = trimmed.slice(-4);

  return visible ? `••••${visible}` : "••••";
}

export function encryptApiKey(secret: string): string {
  const normalizedSecret = secret.trim();

  if (!normalizedSecret) {
    throw new Error("API key is required");
  }

  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(salt);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(normalizedSecret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION,
    toBase64Url(salt),
    toBase64Url(iv),
    toBase64Url(authTag),
    toBase64Url(ciphertext),
  ].join(".");
}

export function decryptApiKey(payload: string): string {
  const [version, saltValue, ivValue, authTagValue, ciphertextValue] = payload.split(".");

  if (version !== VERSION || !saltValue || !ivValue || !authTagValue || !ciphertextValue) {
    throw new Error("Invalid encrypted API key payload");
  }

  const salt = fromBase64Url(saltValue);
  const iv = fromBase64Url(ivValue);
  const authTag = fromBase64Url(authTagValue);
  const ciphertext = fromBase64Url(ciphertextValue);
  const key = deriveKey(salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
