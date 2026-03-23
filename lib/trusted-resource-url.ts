const EXPLICITLY_BLOCKED_PROTOCOLS = new Set(["javascript:", "data:", "blob:"]);

function getConfiguredUploadThingHosts() {
  const configuredHosts = (process.env.NEXT_PUBLIC_UPLOADTHING_ALLOWED_HOSTS ?? process.env.UPLOADTHING_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return new Set(configuredHosts);
}

function isUploadThingHostname(hostname: string) {
  const normalizedHostname = hostname.toLowerCase();
  const configuredHosts = getConfiguredUploadThingHosts();

  if (configuredHosts.has(normalizedHostname)) {
    return true;
  }

  return (
    normalizedHostname === "utfs.io" ||
    normalizedHostname.endsWith(".utfs.io") ||
    normalizedHostname.endsWith(".ufs.sh")
  );
}

export interface TrustedUploadFile {
  fileKey: string;
  fileUrl: string;
  hostname: string;
}

export function normalizeTrustedUploadThingFileUrl(fileUrl: string): TrustedUploadFile | null {
  try {
    const parsedUrl = new URL(fileUrl);
    const protocol = parsedUrl.protocol.toLowerCase();

    if (EXPLICITLY_BLOCKED_PROTOCOLS.has(protocol) || protocol !== "https:") {
      return null;
    }

    if (!isUploadThingHostname(parsedUrl.hostname)) {
      return null;
    }

    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);

    if (pathSegments[0] !== "f" || !pathSegments[1]) {
      return null;
    }

    const fileKey = pathSegments[1];

    if (!fileKey) {
      return null;
    }

    parsedUrl.hash = "";

    return {
      fileKey: decodeURIComponent(fileKey),
      fileUrl: parsedUrl.toString(),
      hostname: parsedUrl.hostname.toLowerCase(),
    };
  } catch {
    return null;
  }
}

export function isTrustedUploadThingFileUrl(fileUrl: string) {
  return normalizeTrustedUploadThingFileUrl(fileUrl) !== null;
}
