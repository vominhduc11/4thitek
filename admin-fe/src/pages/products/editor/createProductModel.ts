export type GalleryItem = {
  url: string;
};

export type ProductSpecificationItem = {
  label: string;
  value: string;
};

export type ProductVideoItem = {
  title: string;
  descriptions: string;
  url: string;
};

export type DescriptionItem = {
  type: "title" | "description" | "image" | "gallery" | "video";
  text?: string;
  url?: string;
  caption?: string;
  gallery?: GalleryItem[];
};

export type NewProductDraft = {
  name: string;
  sku: string;
  shortDescription: string;
  descriptions: DescriptionItem[];
  specifications: ProductSpecificationItem[];
  videos: ProductVideoItem[];
  retailPrice: string;
  warrantyPeriod: string;
  publishStatus: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  showOnHomepage: boolean;
  imageUrl: string;
};

export type CreateProductErrorField =
  | "name"
  | "sku"
  | "retailPrice"
  | "warrantyPeriod"
  | "videos";

export const createProductErrorFieldOrder: CreateProductErrorField[] = [
  "name",
  "sku",
  "retailPrice",
  "warrantyPeriod",
  "videos",
];

export const createProductErrorTabMap: Record<
  CreateProductErrorField,
  "basic" | "description" | "specs" | "videos"
> = {
  name: "basic",
  sku: "basic",
  retailPrice: "basic",
  warrantyPeriod: "basic",
  videos: "videos",
};

export const hasDescriptionContent = (items: DescriptionItem[]) =>
  items.some((item) => {
    if ((item.text ?? "").trim()) return true;
    if ((item.url ?? "").trim()) return true;
    if ((item.caption ?? "").trim()) return true;
    return (item.gallery ?? []).some((galleryItem) => galleryItem.url.trim());
  });

export const hasSpecificationContent = (
  items: Array<{ label: string; value: string }>,
) => items.some((item) => item.label.trim() || item.value.trim());

export const hasVideoContent = (items: ProductVideoItem[]) =>
  items.some(
    (item) => item.title.trim() || item.descriptions.trim() || item.url.trim(),
  );

export const sanitizeDescriptionItem = (
  item: DescriptionItem,
): DescriptionItem | null => {
  if (item.type === "description") {
    const text = item.text?.trim() ?? "";
    return text ? { type: item.type, text } : null;
  }

  if (item.type === "image" || item.type === "video") {
    const url = item.url?.trim() ?? "";
    const caption = item.caption?.trim() ?? "";
    if (!url && !caption) return null;
    return {
      type: item.type,
      ...(url ? { url } : {}),
      ...(caption ? { caption } : {}),
    };
  }

  const gallery = (item.gallery ?? [])
    .map((galleryItem) => ({ url: galleryItem.url.trim() }))
    .filter((galleryItem) => galleryItem.url);
  const caption = item.caption?.trim() ?? "";

  if (gallery.length === 0 && !caption) return null;

  return {
    type: "gallery",
    ...(gallery.length > 0 ? { gallery } : {}),
    ...(caption ? { caption } : {}),
  };
};

export const sanitizeDescriptionItems = (items: DescriptionItem[]) =>
  items
    .map((item) => sanitizeDescriptionItem(item))
    .filter((item): item is DescriptionItem => Boolean(item));

export const createInitialNewProduct = (): NewProductDraft => ({
  name: "",
  sku: "",
  shortDescription: "",
  descriptions: [],
  specifications: [],
  videos: [],
  retailPrice: "",
  warrantyPeriod: "12",
  publishStatus: "DRAFT" as "DRAFT" | "PUBLISHED",
  isFeatured: false,
  showOnHomepage: false,
  imageUrl: "",
});
