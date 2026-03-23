import { createHmac, timingSafeEqual } from "node:crypto";

const TRUSTED_UPLOAD_TOKEN_TTL_MS = 60 * 60 * 1000;

function getTrustedUploadSecret() {
  return process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET ?? process.env.UPLOADTHING_TOKEN ?? null;
}

function signUploadPayload(serializedPayload: string) {
  const secret = getTrustedUploadSecret();

  if (!secret) {
    throw new Error("Missing signing secret for trusted uploads");
  }

  return createHmac("sha256", secret).update(serializedPayload).digest("base64url");
}

export interface TrustedUploadTokenPayload {
  fileKey: string;
  fileUrl: string;
  userId: string;
  issuedAt: number;
}

export function createTrustedUploadToken(payload: Omit<TrustedUploadTokenPayload, "issuedAt">) {
  const fullPayload: TrustedUploadTokenPayload = {
    ...payload,
    issuedAt: Date.now(),
  };

  const serializedPayload = JSON.stringify(fullPayload);
  const payloadSegment = Buffer.from(serializedPayload, "utf8").toString("base64url");
  const signatureSegment = signUploadPayload(serializedPayload);

  return `${payloadSegment}.${signatureSegment}`;
}

export function verifyTrustedUploadToken(token: string, expected: Omit<TrustedUploadTokenPayload, "issuedAt">) {
  const [payloadSegment, signatureSegment] = token.split(".");

  if (!payloadSegment || !signatureSegment) {
    return false;
  }

  try {
    const serializedPayload = Buffer.from(payloadSegment, "base64url").toString("utf8");
    const expectedSignature = signUploadPayload(serializedPayload);
    const providedSignatureBuffer = Buffer.from(signatureSegment, "utf8");
    const expectedSignatureBuffer = Buffer.from(expectedSignature, "utf8");

    if (
      providedSignatureBuffer.length !== expectedSignatureBuffer.length ||
      !timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)
    ) {
      return false;
    }

    const payload = JSON.parse(serializedPayload) as TrustedUploadTokenPayload;

    if (Date.now() - payload.issuedAt > TRUSTED_UPLOAD_TOKEN_TTL_MS) {
      return false;
    }

    return (
      payload.fileKey === expected.fileKey &&
      payload.fileUrl === expected.fileUrl &&
      payload.userId === expected.userId
    );
  } catch {
    return false;
  }
}
