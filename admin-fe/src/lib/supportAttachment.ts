import { buildApiUrl, resolveBackendAssetUrl } from "./backendApi";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm"]);
const DOCUMENT_EXTENSIONS = new Set(["pdf"]);
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
  id?: number | null;
  fileName?: string | null;
  url?: string | null;
  accessUrl?: string | null;
  mediaType?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  createdAt?: string | null;
};

export type SupportAttachmentMediaType =
  | "image"
  | "video"
  | "document"
  | "other";

export type NormalizedSupportAttachment = {
  id?: number | null;
  url: string;
  resolvedUrl: string;
  accessUrl?: string | null;
  resolvedAccessUrl?: string | null;
  fileName?: string | null;
  mediaType?: SupportAttachmentMediaType;
  contentType?: string | null;
  sizeBytes?: number | null;
  createdAt?: string | null;
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
    stripped.startsWith("/api/v1/media/") ||
    stripped.startsWith("/uploads/support/") ||
    stripped.startsWith("/uploads/payments/") ||
    stripped.startsWith("/uploads/avatars/") ||
    stripped.startsWith("api/v1/media/") ||
    stripped.startsWith("support/") ||
    stripped.startsWith("payments/") ||
    stripped.startsWith("avatars/")
  );
}

export function isLikelyImageAttachment(
  attachment: SupportAttachmentLike,
): boolean {
  if (normalizeMediaType(attachment.mediaType) === "image") {
    return true;
  }
  return (
    looksLikeImageValue(attachment.fileName) || looksLikeImageValue(attachment.url)
  );
}

export function isLikelyVideoAttachment(
  attachment: SupportAttachmentLike,
): boolean {
  if (normalizeMediaType(attachment.mediaType) === "video") {
    return true;
  }
  return looksLikeVideoValue(attachment.contentType) || looksLikeVideoValue(attachment.fileName) || looksLikeVideoValue(attachment.url);
}

export function isLikelyDocumentAttachment(
  attachment: SupportAttachmentLike,
): boolean {
  if (normalizeMediaType(attachment.mediaType) === "document") {
    return true;
  }
  return looksLikeDocumentValue(attachment.contentType) || looksLikeDocumentValue(attachment.fileName) || looksLikeDocumentValue(attachment.url);
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

function looksLikeVideoValue(value: string | null | undefined): boolean {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (normalized.startsWith("video/")) {
    return true;
  }
  const parsed = parseUrl(normalized);
  const path = extractPath(normalized, parsed);
  const lastDot = path.lastIndexOf(".");
  if (lastDot < 0 || lastDot === path.length - 1) {
    return false;
  }
  const extension = path.slice(lastDot + 1);
  return VIDEO_EXTENSIONS.has(extension);
}

function looksLikeDocumentValue(value: string | null | undefined): boolean {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (normalized === "application/pdf") {
    return true;
  }
  const parsed = parseUrl(normalized);
  const path = extractPath(normalized, parsed);
  const lastDot = path.lastIndexOf(".");
  if (lastDot < 0 || lastDot === path.length - 1) {
    return false;
  }
  const extension = path.slice(lastDot + 1);
  return DOCUMENT_EXTENSIONS.has(extension);
}

function normalizeMediaType(value: string | null | undefined): SupportAttachmentMediaType | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === "image" || normalized === "video" || normalized === "document" || normalized === "other") {
    return normalized;
  }
  return null;
}

export function inferSupportAttachmentMediaType(
  attachment: SupportAttachmentLike,
): SupportAttachmentMediaType {
  const explicit = normalizeMediaType(attachment.mediaType);
  if (explicit) {
    return explicit;
  }
  if (isLikelyImageAttachment(attachment)) {
    return "image";
  }
  if (isLikelyVideoAttachment(attachment)) {
    return "video";
  }
  if (isLikelyDocumentAttachment(attachment)) {
    return "document";
  }
  return "other";
}

export function normalizeSupportAttachment(
  attachment: SupportAttachmentLike,
): NormalizedSupportAttachment | null {
  const rawUrl = String(attachment.url ?? "").trim();
  if (!rawUrl) {
    return null;
  }

  const resolvedUrl = resolveSupportAttachmentUrl(rawUrl);
  const rawAccessUrl = String(attachment.accessUrl ?? "").trim();
  const resolvedAccessUrl = rawAccessUrl ? resolveSupportAttachmentUrl(rawAccessUrl) : "";
  const fileName = normalizeSupportAttachmentFileName(attachment.fileName, rawUrl);
  const mediaType = inferSupportAttachmentMediaType(attachment);

  return {
    id: attachment.id ?? null,
    url: rawUrl,
    resolvedUrl,
    accessUrl: rawAccessUrl || undefined,
    resolvedAccessUrl: resolvedAccessUrl || undefined,
    fileName,
    mediaType,
    contentType: attachment.contentType?.trim() || undefined,
    sizeBytes:
      typeof attachment.sizeBytes === "number" && Number.isFinite(attachment.sizeBytes)
        ? attachment.sizeBytes
        : undefined,
    createdAt: attachment.createdAt?.trim() || undefined,
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
  return decodeFileNameSegment(segment);
}

function decodeFileNameSegment(value: string): string | null {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }

  try {
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
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
