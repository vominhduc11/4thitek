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

export const subtleActionButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]";

export const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

export const mediaOverlayActionClass =
  "absolute right-2 top-2 inline-flex min-h-11 items-center rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100";

export type CreateProductTabId = "basic" | "description" | "specs" | "videos";

export const productTabs: ReadonlyArray<{
  id: CreateProductTabId;
  label: string;
  errorTitle: string;
}> = [
  { id: "basic", label: "Thông tin", errorTitle: "Thiếu tên, SKU hoặc giá bán" },
  { id: "description", label: "Mô tả chi tiết", errorTitle: "Có lỗi ở ảnh mô tả" },
  { id: "specs", label: "Thông số", errorTitle: "Có lỗi ở thông số" },
  { id: "videos", label: "Video", errorTitle: "URL video không hợp lệ" },
];
