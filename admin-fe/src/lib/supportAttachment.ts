const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

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
  if (
    normalized.includes("mime=image/") ||
    normalized.includes("content-type=image/") ||
    normalized.includes("format=jpg") ||
    normalized.includes("format=jpeg") ||
    normalized.includes("format=png") ||
    normalized.includes("format=webp") ||
    normalized.includes("format=gif") ||
    normalized.includes("/image/") ||
    normalized.includes("/images/")
  ) {
    return true;
  }

  const path = extractPath(normalized);
  const lastDot = path.lastIndexOf(".");
  if (lastDot < 0 || lastDot === path.length - 1) {
    return false;
  }
  const extension = path.slice(lastDot + 1);
  return IMAGE_EXTENSIONS.has(extension);
}

function extractPath(value: string): string {
  try {
    const parsed = new URL(value);
    return parsed.pathname.toLowerCase();
  } catch {
    return value.split("?")[0]?.split("#")[0] ?? value;
  }
}
