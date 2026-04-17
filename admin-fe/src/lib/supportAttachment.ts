import { buildApiUrl, resolveBackendAssetUrl } from "./backendApi";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const IMAGE_QUERY_KEYS = new Set([
  "mime",
  "content-type",
  "contenttype",
  "response-content-type",
]);
const IMAGE_FORMAT_QUERY_KEYS = new Set(["format", "ext", "extension"]);
const PUBLIC_UPLOAD_PREFIXES = ["products/", "blogs/"];
const PRIVATE_UPLOAD_PREFIXES = ["avatars/", "payments/", "support/"];

export type SupportAttachmentLike = {
  fileName?: string | null;
  url?: string | null;
};

export type NormalizedSupportAttachment = {
  url: string;
  resolvedUrl: string;
  fileName?: string | null;
};

export function isPrivateSupportAttachmentUrl(value: string | null | undefined): boolean {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  const stripped = normalized.replace(/^https?:\/\/[^/]+/i, "");
  return (
    stripped.startsWith("/api/v1/upload/support/") ||
    stripped.startsWith("/api/v1/upload/payments/") ||
    stripped.startsWith("/api/v1/upload/avatars/") ||
    stripped.startsWith("/uploads/support/") ||
    stripped.startsWith("/uploads/payments/") ||
    stripped.startsWith("/uploads/avatars/") ||
    stripped.startsWith("support/") ||
    stripped.startsWith("payments/") ||
    stripped.startsWith("avatars/")
  );
}

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

export function normalizeSupportAttachment(
  attachment: SupportAttachmentLike,
): NormalizedSupportAttachment | null {
  const rawUrl = String(attachment.url ?? "").trim();
  if (!rawUrl) {
    return null;
  }

  const resolvedUrl = resolveSupportAttachmentUrl(rawUrl);
  const fileName = normalizeSupportAttachmentFileName(attachment.fileName, rawUrl);

  return {
    url: rawUrl,
    resolvedUrl,
    fileName,
  };
}

export function resolveSupportAttachmentUrl(rawUrl: string): string {
  const normalized = rawUrl.trim();
  if (!normalized) {
    return "";
  }

  const lowered = normalized.toLowerCase();
  if (
    lowered.startsWith("http://") ||
    lowered.startsWith("https://") ||
    lowered.startsWith("data:") ||
    lowered.startsWith("blob:")
  ) {
    return resolveBackendAssetUrl(normalized);
  }

  const withoutLeadingSlash = normalized.replace(/^\/+/, "");
  const privateUploadPrefix = findPrivateUploadPrefix(withoutLeadingSlash);
  if (privateUploadPrefix) {
    const stripped = withoutLeadingSlash.startsWith("uploads/")
      ? withoutLeadingSlash.slice("uploads/".length)
      : withoutLeadingSlash;
    return resolveBackendAssetUrl(buildApiUrl(`/upload/${stripped}`));
  }
  if (withoutLeadingSlash.startsWith("api/") || withoutLeadingSlash.startsWith("uploads/")) {
    return resolveBackendAssetUrl(`/${withoutLeadingSlash}`);
  }

  if (PUBLIC_UPLOAD_PREFIXES.some((prefix) => withoutLeadingSlash.startsWith(prefix))) {
    return resolveBackendAssetUrl(`/uploads/${withoutLeadingSlash}`);
  }

  if (PRIVATE_UPLOAD_PREFIXES.some((prefix) => withoutLeadingSlash.startsWith(prefix))) {
    return resolveBackendAssetUrl(buildApiUrl(`/upload/${withoutLeadingSlash}`));
  }

  return resolveBackendAssetUrl(normalized);
}

export function normalizeSupportAttachmentFileName(
  value: string | null | undefined,
  rawUrl?: string,
): string | null {
  const normalized = String(value ?? "").trim();
  if (normalized) {
    const extracted = extractLastSegment(normalized);
    if (extracted) {
      return extracted;
    }
  }
  if (!rawUrl) {
    return null;
  }
  return extractLastSegment(rawUrl);
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

function extractLastSegment(value: string): string | null {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = parseUrl(normalized);
  const path = extractPath(normalized, parsed).replace(/\\/g, "/").replace(/\/+$/, "");
  const segment = path.slice(path.lastIndexOf("/") + 1).trim();
  return segment || null;
}

function findPrivateUploadPrefix(value: string): string | null {
  for (const prefix of PRIVATE_UPLOAD_PREFIXES) {
    if (value.startsWith(prefix)) {
      return prefix;
    }
    if (value.startsWith(`uploads/${prefix}`)) {
      return `uploads/${prefix}`;
    }
  }
  return null;
}
