const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const IMAGE_QUERY_KEYS = new Set([
  "mime",
  "content-type",
  "contenttype",
  "response-content-type",
]);
const IMAGE_FORMAT_QUERY_KEYS = new Set(["format", "ext", "extension"]);

export type SupportAttachmentLike = {
  fileName?: string | null;
  url?: string | null;
};

export function isLikelyImageAttachment(
  attachment: SupportAttachmentLike,
): boolean {
  return (
    looksLikeImageValue(attachment.fileName) || looksLikeImageValue(attachment.url)
  );
}

function looksLikeImageValue(value: string | null | undefined): boolean {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (normalized.startsWith("data:image/")) {
    return true;
  }
  const parsed = parseUrl(normalized);
  if (parsed) {
    for (const [key, rawValue] of parsed.searchParams.entries()) {
      const queryKey = key.trim().toLowerCase();
      const queryValue = rawValue.trim().toLowerCase();
      if (IMAGE_QUERY_KEYS.has(queryKey) && queryValue.startsWith("image/")) {
        return true;
      }
      if (
        IMAGE_FORMAT_QUERY_KEYS.has(queryKey) &&
        IMAGE_EXTENSIONS.has(queryValue)
      ) {
        return true;
      }
    }
  }

  const path = extractPath(normalized, parsed);
  if (path.includes("/image/") || path.includes("/images/")) {
    return true;
  }
  const lastDot = path.lastIndexOf(".");
  if (lastDot < 0 || lastDot === path.length - 1) {
    return false;
  }
  const extension = path.slice(lastDot + 1);
  return IMAGE_EXTENSIONS.has(extension);
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function extractPath(value: string, parsed: URL | null): string {
  if (parsed) {
    return parsed.pathname.toLowerCase();
  }
  return value.split("?")[0]?.split("#")[0] ?? value;
}
