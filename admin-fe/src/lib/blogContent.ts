import type {
  BlogContentBlock,
  BlogGalleryBlock,
  BlogGalleryItem,
  BlogImageBlock,
  BlogParagraphBlock,
  BlogVideoBlock,
} from "../types/blogContent";

const EMPTY_HTML = "";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const isValidRemoteUrl = (value: string) => {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const normalizeInlineText = (value: string) =>
  value.replace(/\u00a0/g, " ").replace(/\s+/g, " ");

export const sanitizeRichTextHtml = (value: string) => {
  if (!value.trim() || typeof window === "undefined") {
    return EMPTY_HTML;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(value, "text/html");
  const allowedTags = new Set([
    "p",
    "br",
    "hr",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "s",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
  ]);

  const sanitizeNode = (node: Node, targetDocument: Document): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      const normalizedText = normalizeInlineText(node.textContent ?? "");
      return normalizedText.trim()
        ? targetDocument.createTextNode(normalizedText)
        : null;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    if (!allowedTags.has(tagName)) {
      const fragment = targetDocument.createDocumentFragment();
      Array.from(element.childNodes).forEach((child) => {
        const sanitizedChild = sanitizeNode(child, targetDocument);
        if (sanitizedChild) {
          fragment.appendChild(sanitizedChild);
        }
      });
      return fragment.childNodes.length > 0 ? fragment : null;
    }

    const normalizedTag =
      tagName === "b" ? "strong" : tagName === "i" ? "em" : tagName;
    const nextElement = targetDocument.createElement(normalizedTag);

    if (normalizedTag === "a") {
      const href = element.getAttribute("href") ?? "";
      if (!isValidRemoteUrl(href) && !/^(mailto:|tel:)/i.test(href.trim())) {
        const fragment = targetDocument.createDocumentFragment();
        Array.from(element.childNodes).forEach((child) => {
          const sanitizedChild = sanitizeNode(child, targetDocument);
          if (sanitizedChild) {
            fragment.appendChild(sanitizedChild);
          }
        });
        return fragment.childNodes.length > 0 ? fragment : null;
      }

      nextElement.setAttribute("href", href.trim());
      nextElement.setAttribute("rel", "noopener noreferrer nofollow");
      if (/^https?:/i.test(href.trim())) {
        nextElement.setAttribute("target", "_blank");
      }
    }

    if (normalizedTag === "hr" || normalizedTag === "br") {
      return nextElement;
    }

    Array.from(element.childNodes).forEach((child) => {
      const sanitizedChild = sanitizeNode(child, targetDocument);
      if (sanitizedChild) {
        nextElement.appendChild(sanitizedChild);
      }
    });

    const textContent = nextElement.textContent?.trim() ?? "";
    if (!textContent && nextElement.childNodes.length === 0) {
      return ["p", "li", "blockquote"].includes(normalizedTag)
        ? null
        : nextElement;
    }

    return nextElement;
  };

  const cleanDocument = document.implementation.createHTMLDocument("");
  const fragment = cleanDocument.createDocumentFragment();

  Array.from(document.body.childNodes).forEach((child) => {
    const sanitizedChild = sanitizeNode(child, cleanDocument);
    if (sanitizedChild) {
      fragment.appendChild(sanitizedChild);
    }
  });

  const container = cleanDocument.createElement("div");
  container.appendChild(fragment);
  const normalizedHtml = container.innerHTML.trim();
  return normalizedHtml === "<p></p>" ? EMPTY_HTML : normalizedHtml;
};

const normalizeParagraphHtml = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return EMPTY_HTML;
  const hasHtmlTag = /<[^>]+>/.test(trimmed);
  if (hasHtmlTag) {
    return sanitizeRichTextHtml(trimmed);
  }

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((segment) =>
      segment
        .split(/\n/)
        .map((line) => escapeHtml(line.trim()))
        .filter(Boolean)
        .join("<br />"),
    )
    .filter(Boolean)
    .map((segment) => `<p>${segment}</p>`);

  return sanitizeRichTextHtml(paragraphs.join(""));
};

const normalizeCaption = (value?: string) => value?.trim() ?? "";

const normalizeGalleryItems = (items: unknown): BlogGalleryItem[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") {
        return { url: item.trim() };
      }
      if (item && typeof item === "object" && "url" in item) {
        const url = String((item as { url?: string }).url ?? "").trim();
        return { url };
      }
      return { url: "" };
    })
    .filter((item) => item.url);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const parseBlock = (value: unknown): BlogContentBlock | null => {
  if (typeof value === "string") {
    const text = normalizeParagraphHtml(value);
    return text ? { type: "paragraph", text } : null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const type = String(value.type ?? "").trim().toLowerCase();

  if (!type || type === "paragraph") {
    const text = normalizeParagraphHtml(String(value.text ?? ""));
    return text ? ({ type: "paragraph", text } satisfies BlogParagraphBlock) : null;
  }

  if (type === "image") {
    const url = String(value.url ?? value.imageUrl ?? "").trim();
    const caption = normalizeCaption(String(value.caption ?? ""));
    if (!url && !caption) return null;
    return { type: "image", url, ...(caption ? { caption } : {}) } satisfies BlogImageBlock;
  }

  if (type === "gallery") {
    const items = normalizeGalleryItems(value.items ?? value.gallery ?? value.urls);
    const caption = normalizeCaption(String(value.caption ?? ""));
    if (items.length === 0 && !caption) return null;
    return {
      type: "gallery",
      items,
      ...(caption ? { caption } : {}),
    } satisfies BlogGalleryBlock;
  }

  if (type === "video") {
    const url = String(value.url ?? value.videoUrl ?? "").trim();
    const caption = normalizeCaption(String(value.caption ?? ""));
    if (!url && !caption) return null;
    return { type: "video", url, ...(caption ? { caption } : {}) } satisfies BlogVideoBlock;
  }

  const fallbackText = normalizeParagraphHtml(
    String(value.text ?? value.content ?? ""),
  );
  return fallbackText ? { type: "paragraph", text: fallbackText } : null;
};

export const createBlogParagraphBlock = (): BlogParagraphBlock => ({
  type: "paragraph",
  text: EMPTY_HTML,
});

export const createBlogImageBlock = (): BlogImageBlock => ({
  type: "image",
  url: "",
  caption: "",
});

export const createBlogGalleryBlock = (): BlogGalleryBlock => ({
  type: "gallery",
  items: [],
  caption: "",
});

export const createBlogVideoBlock = (): BlogVideoBlock => ({
  type: "video",
  url: "",
  caption: "",
});

export const createBlogBlock = (
  type: BlogContentBlock["type"],
): BlogContentBlock => {
  switch (type) {
    case "image":
      return createBlogImageBlock();
    case "gallery":
      return createBlogGalleryBlock();
    case "video":
      return createBlogVideoBlock();
    default:
      return createBlogParagraphBlock();
  }
};

export const parseBlogIntroduction = (raw?: string): BlogContentBlock[] => {
  if (!raw?.trim()) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((block) => parseBlock(block))
        .filter((block): block is BlogContentBlock => Boolean(block));
    }
  } catch {
    return raw
      .split(/\n{2,}/)
      .map((segment) => parseBlock(segment))
      .filter((block): block is BlogContentBlock => Boolean(block));
  }

  return [];
};

const sanitizeBlock = (block: BlogContentBlock): BlogContentBlock | null => {
  if (block.type === "paragraph") {
    const text = normalizeParagraphHtml(block.text);
    return text ? { type: "paragraph", text } : null;
  }

  if (block.type === "image") {
    const url = block.url.trim();
    const caption = normalizeCaption(block.caption);
    if (!url && !caption) return null;
    return { type: "image", url, ...(caption ? { caption } : {}) };
  }

  if (block.type === "gallery") {
    const items = block.items
      .map((item) => ({ url: item.url.trim() }))
      .filter((item) => item.url);
    const caption = normalizeCaption(block.caption);
    if (items.length === 0 && !caption) return null;
    return { type: "gallery", items, ...(caption ? { caption } : {}) };
  }

  const url = block.url.trim();
  const caption = normalizeCaption(block.caption);
  if (!url && !caption) return null;
  return { type: "video", url, ...(caption ? { caption } : {}) };
};

export const serializeBlogIntroduction = (
  blocks: BlogContentBlock[],
): string | undefined => {
  const sanitized = blocks
    .map((block) => sanitizeBlock(block))
    .filter((block): block is BlogContentBlock => Boolean(block));

  return sanitized.length > 0 ? JSON.stringify(sanitized) : undefined;
};

export const getBlogBlockAssetUrls = (blocks: BlogContentBlock[]) =>
  blocks.flatMap((block) => {
    if (block.type === "image" || block.type === "video") {
      return block.url.trim() ? [block.url.trim()] : [];
    }
    if (block.type === "gallery") {
      return block.items.map((item) => item.url.trim()).filter(Boolean);
    }
    return [];
  });
