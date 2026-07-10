import type { Product } from "../../../types/product";
import { resolveBackendAssetUrl } from "../../../lib/backendApi";
import { formatDateOnly } from "../../../lib/formatters";
import { toPlainText } from "./constants";

const imageUrlCache = new Map<string, string>();

export const getImageUrl = (image: string) => {
  const cached = imageUrlCache.get(image);
  if (cached) {
    return cached;
  }

  let resolved = "";
  try {
    const parsed = JSON.parse(image) as { imageUrl?: string };
    resolved = resolveBackendAssetUrl(parsed.imageUrl || image);
  } catch {
    resolved = resolveBackendAssetUrl(image);
  }
  imageUrlCache.set(image, resolved);
  return resolved;
};

export const isLocalBlobUrl = (value?: string) =>
  Boolean(
    value && (value.startsWith("blob:") || value.startsWith("local-file:")),
  );

export type ProductDraft = {
  name: string;
  publishStatus: Product["publishStatus"];
  retailPrice: string;
  warrantyPeriod: string;
  shortDescription: string;
  image: string;
  specifications: SpecificationItem[];
  descriptions: DescriptionItem[];
  videos: VideoDraftItem[];
};

export type DescriptionItem = {
  type: "title" | "description" | "image" | "gallery" | "video";
  text?: string;
  url?: string;
  caption?: string;
  gallery?: Array<{ url: string } | string>;
};

export type SpecificationItem = {
  label: string;
  value: string;
};

export type VideoItem = {
  title?: string;
  descriptions?: string;
  description?: string;
  url?: string;
  type?: string;
};

export type VideoDraftItem = {
  title: string;
  description: string;
  url: string;
};

export type DescriptionReadBlock =
  | { type: "prose"; items: DescriptionItem[] }
  | { type: "media"; item: DescriptionItem; index: number };

export const buildDraft = (product: Product): ProductDraft => ({
  name: product.name,
  publishStatus: product.publishStatus,
  retailPrice: String(product.retailPrice ?? 0),
  warrantyPeriod:
    product.warrantyPeriod == null ? "" : String(product.warrantyPeriod),
  shortDescription: product.shortDescription,
  image: getImageUrl(product.image),
  specifications: parseSpecifications(product.specifications),
  descriptions: parseDescriptionItems(product.descriptions),
  videos: parseVideoItems(product.videos),
});

export const formatDisplayDate = (value?: string) => {
  const normalizedValue = value ? new Date(value) : new Date();
  const fallback = new Date();
  const safeDate = Number.isNaN(normalizedValue.getTime())
    ? fallback
    : normalizedValue;
  return formatDateOnly(safeDate.toISOString());
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const parseJson = <T,>(value: string, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const parseJsonArray = <T,>(value: string, fallback: T[] = []): T[] => {
  const parsed = parseJson<unknown>(value, fallback);
  return Array.isArray(parsed) ? (parsed as T[]) : fallback;
};

export const parseVideoItems = (value: string): VideoDraftItem[] =>
  parseJsonArray<VideoItem>(value, []).map((item) => ({
    title: String(item.title ?? "").trim(),
    description: String(item.description ?? item.descriptions ?? "").trim(),
    url: String(
      item.url ?? (item as { videoUrl?: string }).videoUrl ?? "",
    ).trim(),
  }));

export const parseDescriptionItems = (value: string): DescriptionItem[] =>
  parseJsonArray<DescriptionItem>(value, []).map((item) => {
    if (item.type === "image") {
      const imageUrl = (item as { imageUrl?: string }).imageUrl;
      return { ...item, url: item.url || imageUrl || "" };
    }
    if (item.type === "video") {
      const videoUrl = (item as { videoUrl?: string }).videoUrl;
      return { ...item, url: item.url || videoUrl || "" };
    }
    if (item.type === "gallery") {
      const legacyUrls = (item as { urls?: string[] }).urls;
      const gallerySource = Array.isArray(item.gallery)
        ? item.gallery
        : Array.isArray(legacyUrls)
          ? legacyUrls
          : [];
      const gallery = gallerySource
        .map((entry) => (typeof entry === "string" ? { url: entry } : entry))
        .filter(
          (entry): entry is { url: string } =>
            !!entry && typeof entry.url === "string",
        );
      return { ...item, gallery };
    }
    return item;
  });

export const parseSpecifications = (value: string): SpecificationItem[] => {
  const parsed = parseJson<unknown>(value, []);
  if (Array.isArray(parsed)) {
    return parsed
      .filter(
        (item): item is SpecificationItem => !!item && typeof item === "object",
      )
      .map((item) => ({
        label: String((item as SpecificationItem).label ?? "").trim(),
        value: String((item as SpecificationItem).value ?? "").trim(),
      }))
      .filter((item) => item.label || item.value);
  }
  if (parsed && typeof parsed === "object") {
    return Object.entries(parsed as Record<string, unknown>)
      .map(([label, value]) => ({
        label: String(label ?? "").trim(),
        value: value == null ? "" : String(value).trim(),
      }))
      .filter((item) => item.label || item.value);
  }
  return [];
};

export const formatCurrency = (value: number) => currencyFormatter.format(value);

export const isDescriptionTextItem = (item: DescriptionItem) =>
  item.type === "title" || item.type === "description";

export const normalizeProseParagraphs = (value: string) =>
  toPlainText(value)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/[ \t]*\n[ \t]*/g, "\n").trim())
    .filter(Boolean);

export const getGalleryReadLayoutClass = (count: number) => {
  if (count <= 1) {
    return "mx-auto max-w-4xl";
  }
  if (count === 2) {
    return "grid gap-3 sm:grid-cols-2";
  }
  return "grid gap-3 sm:grid-cols-2 xl:grid-cols-3";
};
