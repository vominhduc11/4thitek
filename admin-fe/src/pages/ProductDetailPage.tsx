import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Archive,
  ArrowLeft,
  CheckCircle,
  Pencil,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import productPlaceholder from "../assets/product-placeholder.svg";
import { sectionCardClass } from "../components/ui-kit";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductsContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { useSaveShortcut } from "../hooks/useSaveShortcut";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import type { Product } from "../types/product";
import { resolveBackendAssetUrl } from "../lib/backendApi";

import {
  MAX_IMAGE_BYTES,
  VIDEO_FILE_NOTICE,
  toPlainText,
} from "./products/editor/constants";
import { BasicInfoSection } from "./products/editor/detail/BasicInfoSection";
import { DescriptionSection } from "./products/editor/detail/DescriptionSection";
import { SpecsSection } from "./products/editor/detail/SpecsSection";
import { VideoSection } from "./products/editor/detail/VideoSection";
import { useNumericFormatter } from "./products/editor/useNumericFormatter";
import { useTrackedUpload } from "./products/editor/useTrackedUpload";
import {
  buildDraft,
  formatCurrency,
  formatDisplayDate,
  getImageUrl,
  isDescriptionTextItem,
  isLocalBlobUrl,
  parseDescriptionItems,
  parseSpecifications,
  parseVideoItems,
  type DescriptionItem,
  type DescriptionReadBlock,
  type ProductDraft,
} from "./products/editor/detailProductModel";

function ProductDetailPage() {
  const { sku } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { accessToken } = useAuth();
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const {
    products,
    archiveProduct,
    restoreProduct,
    togglePublishStatus,
    updateProduct,
    deleteProduct,
  } = useProducts();
  const product = products.find((item) => item.sku === sku);
  const toastTitle = t("Sản phẩm");
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ProductDraft | null>(
    product ? buildDraft(product) : null,
  );
  const [descriptionImageErrors, setDescriptionImageErrors] = useState<
    Record<number, string>
  >({});
  const [, setDescriptionVideoErrors] = useState<Record<number, string>>({});
  const [, setProductVideoErrors] = useState<Record<number, string>>({});
  const [actionMessage, setActionMessage] = useState("");
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = useState("");

  const {
    uploadImageAsset,
    trackUploadedAsset: trackEditUploadedAsset,
    clearUploadedAssetTracking: clearEditUploadedAssetTracking,
    cleanupUploadedAssets: cleanupEditUploadedAssets,
    uploadedAssetUrlsRef: editUploadedAssetUrlsRef,
    getTrackedUploadUrls: getTrackedEditUploadUrls,
  } = useTrackedUpload(accessToken, notify, t);

  const getDraftTrackedUploadUrls = (value: ProductDraft) =>
    getTrackedEditUploadUrls([
      value.image,
      ...value.descriptions.flatMap((item) => [
        item.url,
        ...(item.gallery ?? []).map((entry) =>
          typeof entry === "string" ? entry : entry.url,
        ),
      ]),
    ]);

  const { inputRef: retailPriceInputRef, handleInputChange: handleRetailPriceChange } = useNumericFormatter(
    draft?.retailPrice ?? "",
    (digits) => {
      setDraft((prev) => {
        if (!prev) return prev;
        return { ...prev, retailPrice: digits };
      });
    }
  );

  const productStatusLabelMap: Record<Product["status"], string> = {
    Active: "Đang bán",
    "Low Stock": "Tồn kho thấp",
    Draft: "Bản nháp",
  };

  const publishStatusLabelMap: Record<Product["publishStatus"], string> = {
    PUBLISHED: "Đã xuất bản",
    DRAFT: "Bản nháp",
  };

  const validateDraft = useCallback(
    (value: ProductDraft) => {
      const errors: Record<string, string> = {};
      const retailPrice = Number(value.retailPrice);
      const warrantyPeriod = Number(value.warrantyPeriod);

      if (!value.name.trim()) {
        errors.name = t("Vui lòng nhập tên sản phẩm");
      }
      if (Number.isNaN(retailPrice) || retailPrice < 0) {
        errors.retailPrice = t("Giá bán lẻ phải là số không âm");
      }
      if (
        Number.isNaN(warrantyPeriod) ||
        warrantyPeriod <= 0 ||
        !Number.isInteger(warrantyPeriod)
      ) {
        errors.warrantyPeriod = t("Thời hạn bảo hành phải là số nguyên dương");
      }

      return errors;
    },
    [t],
  );

  const draftErrors = useMemo(
    () => (draft ? validateDraft(draft) : {}),
    [draft, validateDraft],
  );
  const isDirty = useMemo(() => {
    if (!draft || !product) {
      return false;
    }

    return JSON.stringify(draft) !== JSON.stringify(buildDraft(product));
  }, [draft, product]);

  // Ctrl/Cmd+S submits the edit form; warn on tab close while there are edits.
  useSaveShortcut(isEditing && isDirty, () => {
    const form = document.getElementById("product-edit-form");
    if (form instanceof HTMLFormElement) {
      form.requestSubmit();
    }
  });
  useUnsavedChanges(isEditing && isDirty);

  useEffect(() => {
    if (product && !isEditing) {
      // Draft state is intentionally reset when the server-backed product changes outside edit mode.
      setDraft(buildDraft(product));
      setMainImagePreviewUrl("");
    }
  }, [product, isEditing]);

  useEffect(() => {
    if (!actionMessage) return;
    const timer = window.setTimeout(() => setActionMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  useEffect(() => {
    if (!mainImagePreviewUrl || !mainImagePreviewUrl.startsWith("blob:")) {
      return;
    }

    return () => {
      URL.revokeObjectURL(mainImagePreviewUrl);
    };
  }, [mainImagePreviewUrl]);



  const descriptionEditorModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "link"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["divider", "clean"],
        ],
      },
    }),
    [],
  );

  const descriptionEditorFormats = useMemo(
    () => ["header", "bold", "italic", "link", "list", "divider"],
    [],
  );

  const descriptionItems = useMemo(
    () => (product ? parseDescriptionItems(product.descriptions) : []),
    [product],
  );
  const specificationItems = useMemo(
    () => (product ? parseSpecifications(product.specifications) : []),
    [product],
  );
  const videoItems = useMemo(
    () => (product ? parseVideoItems(product.videos) : []),
    [product],
  );
  const shortDescription = product?.shortDescription?.trim() ?? "";
  const hasSingleVideo = videoItems.length === 1;

  const descriptionReadBlocks = useMemo<DescriptionReadBlock[]>(() => {
    const blocks: DescriptionReadBlock[] = [];
    let proseItems: DescriptionItem[] = [];

    descriptionItems.forEach((item, index) => {
      if (isDescriptionTextItem(item)) {
        const normalizedText =
          item.type === "description"
            ? toPlainText(item.text ?? "")
            : String(item.text ?? "").trim();

        if (normalizedText) {
          proseItems.push({ ...item, text: normalizedText });
        }
        return;
      }

      if (proseItems.length > 0) {
        blocks.push({ type: "prose", items: proseItems });
        proseItems = [];
      }

      blocks.push({ type: "media", item, index });
    });

    if (proseItems.length > 0) {
      blocks.push({ type: "prose", items: proseItems });
    }

    return blocks;
  }, [descriptionItems]);

  if (!product) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <h3 className="text-lg font-semibold text-slate-900">
          {t("Không tìm thấy sản phẩm")}
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          {t("SKU {sku} không tồn tại hoặc đã bị xóa.", { sku: sku ?? "" })}
        </p>
        <Link
          className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
          to="/products"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("Quay lại danh sách")}
        </Link>
      </section>
    );
  }

  if (!draft) {
    return null;
  }

  const handleStartEdit = () => {
    if (editUploadedAssetUrlsRef.current.size > 0) {
      void cleanupEditUploadedAssets(
        Array.from(editUploadedAssetUrlsRef.current),
      );
    }
    setDraft(buildDraft(product));
    setMainImagePreviewUrl("");
    setDescriptionImageErrors({});
    setDescriptionVideoErrors({});
    setProductVideoErrors({});
    setIsEditing(true);
  };

  const handleCancelEdit = async () => {
    await cleanupEditUploadedAssets(
      Array.from(editUploadedAssetUrlsRef.current),
    );
    setDraft(buildDraft(product));
    setMainImagePreviewUrl("");
    setDescriptionImageErrors({});
    setDescriptionVideoErrors({});
    setProductVideoErrors({});
    setIsEditing(false);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (Object.keys(draftErrors).length > 0) {
      notify(t("Vui lòng kiểm tra lại các trường bắt buộc"), {
        title: toastTitle,
        variant: "error",
      });
      return;
    }

    const nextRetailPrice = Number(draft.retailPrice);
    const nextWarrantyPeriod = Number(draft.warrantyPeriod);
    const cleanedSpecifications = draft.specifications
      .map((spec) => ({
        label: String(spec.label || "").trim(),
        value: String(spec.value || "").trim(),
      }))
      .filter((spec) => spec.label || spec.value);
    const cleanedDescriptions = draft.descriptions
      .map((item) => {
        if (item.type === "title" || item.type === "description") {
          const text = String(item.text || "").trim();
          return { type: item.type, text };
        }
        if (item.type === "image" || item.type === "video") {
          const rawUrl = String(item.url || "").trim();
          const url = isLocalBlobUrl(rawUrl) ? "" : rawUrl;
          const caption = String(item.caption || "").trim();
          return { type: item.type, url, caption };
        }
        if (item.type === "gallery") {
          const caption = String(item.caption || "").trim();
          const gallery = (item.gallery ?? [])
            .map((entry) => (typeof entry === "string" ? entry : entry.url))
            .map((url) => String(url || "").trim())
            .filter((url) => url && !isLocalBlobUrl(url))
            .map((url) => ({ url }));
          return { type: item.type, caption, gallery };
        }
        return item;
      })
      .filter((item) => {
        if (item.type === "title" || item.type === "description") {
          return !!item.text;
        }
        if (item.type === "image" || item.type === "video") {
          return !!item.url || !!item.caption;
        }
        if (item.type === "gallery") {
          return (item.gallery ?? []).length > 0 || !!item.caption;
        }
        return false;
      });
    const cleanedVideos = draft.videos
      .map((video) => ({
        title: String(video.title || "").trim(),
        description: String(video.description || "").trim(),
        url: (() => {
          const rawUrl = String(video.url || "").trim();
          return isLocalBlobUrl(rawUrl) ? "" : rawUrl;
        })(),
      }))
      .filter((video) => video.title || video.description || video.url);
    const retainedTrackedUrls = getDraftTrackedUploadUrls(draft);
    const discardedTrackedUrls = Array.from(
      editUploadedAssetUrlsRef.current,
    ).filter((url) => !retainedTrackedUrls.includes(url));

    try {
      await updateProduct(product.sku, {
        name: draft.name.trim() || product.name,
        publishStatus: draft.publishStatus,
        retailPrice: nextRetailPrice,
        warrantyPeriod: nextWarrantyPeriod,
        shortDescription: draft.shortDescription.trim(),
        image: draft.image.trim() || productPlaceholder,
        descriptions: JSON.stringify(cleanedDescriptions),
        specifications: JSON.stringify(cleanedSpecifications),
        videos: JSON.stringify(cleanedVideos),
        updatedAt: new Date().toISOString(),
      });

      await cleanupEditUploadedAssets(discardedTrackedUrls);
      clearEditUploadedAssetTracking();
      setIsEditing(false);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("Không thể lưu sản phẩm"),
        {
          title: toastTitle,
          variant: "error",
        },
      );
    }
  };

  const handleDelete = async () => {
    if (!product.isDeleted) {
      return;
    }
    const confirmed = await confirm({
      title: t("Xóa vĩnh viễn sản phẩm"),
      message: t("Xóa vĩnh viễn sản phẩm này? Hành động không thể hoàn tác."),
      tone: "danger",
      confirmLabel: t("Xóa"),
    });
    if (confirmed) {
      try {
        await deleteProduct(product.sku);
        navigate("/products");
      } catch (error) {
        notify(
          error instanceof Error ? error.message : t("Không thể xóa sản phẩm"),
          {
            title: toastTitle,
            variant: "error",
          },
        );
      }
    }
  };

  const handleArchiveToggle = async () => {
    if (product.isDeleted) {
      try {
        await restoreProduct(product.sku);
        setActionMessage(t("Đã khôi phục sản phẩm về bản nháp."));
      } catch (error) {
        notify(
          error instanceof Error
            ? error.message
            : t("Không thể khôi phục sản phẩm"),
          {
            title: toastTitle,
            variant: "error",
          },
        );
      }
      return;
    }

    const confirmed = await confirm({
      title: t("Ẩn sản phẩm"),
      message: t("Ẩn sản phẩm này khỏi danh mục hiện hành?"),
      tone: "warning",
      confirmLabel: t("Ẩn sản phẩm"),
    });
    if (!confirmed) {
      return;
    }

    try {
      await archiveProduct(product.sku);
      setActionMessage("");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("Không thể ẩn sản phẩm"),
        {
          title: toastTitle,
          variant: "error",
        },
      );
    }
  };

  const descriptionTypeOptions: Array<{
    id: DescriptionItem["type"];
    label: string;
  }> = [
    { id: "title", label: t("Tiêu đề") },
    { id: "description", label: t("Mô tả") },
    { id: "image", label: t("Hình ảnh") },
    { id: "gallery", label: t("Nhiều hình ảnh") },
    { id: "video", label: t("Video") },
  ];

  const changeDescriptionType = (
    index: number,
    nextType: DescriptionItem["type"],
  ) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const nextDescriptions = [...prev.descriptions];
      const current = nextDescriptions[index] ?? { type: nextType };
      const nextItem: DescriptionItem = { type: nextType };

      if (nextType === "title" || nextType === "description") {
        nextItem.text = current.text ?? "";
      }
      if (nextType === "image" || nextType === "video") {
        nextItem.url = current.url ?? "";
        nextItem.caption = current.caption ?? "";
      }
      if (nextType === "gallery") {
        const gallerySource = current.gallery ?? [];
        nextItem.gallery = gallerySource.map((entry) =>
          typeof entry === "string" ? { url: entry } : entry,
        );
        nextItem.caption = current.caption ?? "";
      }

      nextDescriptions[index] = nextItem;
      return { ...prev, descriptions: nextDescriptions };
    });
    setDescriptionImageErrors((prev) => {
      if (!(index in prev)) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setDescriptionVideoErrors((prev) => {
      if (!(index in prev)) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const removeDescriptionItem = (index: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const nextDescriptions = prev.descriptions.filter(
        (_, idx) => idx !== index,
      );
      return { ...prev, descriptions: nextDescriptions };
    });
    setDescriptionImageErrors((prev) => {
      const next: Record<number, string> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const idx = Number(key);
        if (Number.isNaN(idx)) return;
        if (idx < index) {
          next[idx] = value;
        } else if (idx > index) {
          next[idx - 1] = value;
        }
      });
      return next;
    });
    setDescriptionVideoErrors((prev) => {
      const next: Record<number, string> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const idx = Number(key);
        if (Number.isNaN(idx)) return;
        if (idx < index) {
          next[idx] = value;
        } else if (idx > index) {
          next[idx - 1] = value;
        }
      });
      return next;
    });
  };

  const handleDescriptionImageFile = async (
    index: number,
    file: File | null,
  ) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setDescriptionImageErrors((prev) => ({
        ...prev,
        [index]: t("Ảnh tối đa 10MB"),
      }));
      return;
    }
    try {
      const stored = await uploadImageAsset(file);
      trackEditUploadedAsset(stored.url);
      setDraft((prev) => {
        if (!prev) return prev;
        const copy = [...prev.descriptions];
        const current = copy[index] ?? { type: "image" as const };
        copy[index] = { ...current, type: "image", url: stored.url };
        return { ...prev, descriptions: copy };
      });
      setDescriptionImageErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    } catch {
      // ignore
    }
  };

  const handleDescriptionGalleryFiles = async (
    index: number,
    files: FileList | null,
  ) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    const oversized = fileList.find((file) => file.size > MAX_IMAGE_BYTES);
    if (oversized) {
      setDescriptionImageErrors((prev) => ({
        ...prev,
        [index]: t("Ảnh tối đa 10MB"),
      }));
    }
    const validFiles = fileList.filter((file) => file.size <= MAX_IMAGE_BYTES);
    if (validFiles.length === 0) return;
    try {
      const storedItems = await Promise.all(
        validFiles.map((candidate) => uploadImageAsset(candidate)),
      );
      storedItems.forEach((item) => trackEditUploadedAsset(item.url));
      const newItems = storedItems
        .filter((item) => item.url)
        .map((item) => ({ url: item.url }));
      setDraft((prev) => {
        if (!prev) return prev;
        const copy = [...prev.descriptions];
        const current = copy[index] ?? {
          type: "gallery" as const,
          gallery: [] as { url: string }[],
        };
        const nextGallery = [...(current.gallery ?? []), ...newItems];
        copy[index] = { ...current, type: "gallery", gallery: nextGallery };
        return { ...prev, descriptions: copy };
      });
      setDescriptionImageErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    } catch {
      // ignore
    }
  };

  const handleGalleryItemFile = async (
    index: number,
    itemIndex: number,
    file: File | null,
  ) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setDescriptionImageErrors((prev) => ({
        ...prev,
        [index]: t("Ảnh tối đa 10MB"),
      }));
      return;
    }
    try {
      const stored = await uploadImageAsset(file);
      trackEditUploadedAsset(stored.url);
      setDraft((prev) => {
        if (!prev) return prev;
        const copy = [...prev.descriptions];
        const current = copy[index] ?? {
          type: "gallery" as const,
          gallery: [] as { url: string }[],
        };
        const nextGallery = [...(current.gallery ?? [])];
        const existing = nextGallery[itemIndex];
        const existingItem =
          typeof existing === "string"
            ? { url: existing }
            : existing && typeof existing === "object"
              ? existing
              : { url: "" };
        nextGallery[itemIndex] = { ...existingItem, url: stored.url };
        copy[index] = { ...current, type: "gallery", gallery: nextGallery };
        return { ...prev, descriptions: copy };
      });
      setDescriptionImageErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    } catch {
      // ignore
    }
  };

  const handleDescriptionVideoFile = async (
    index: number,
    file: File | null,
  ) => {
    if (!file) return;
    void index;
    setActionMessage(t(VIDEO_FILE_NOTICE));
  };

  const handleProductVideoFile = async (index: number, file: File | null) => {
    if (!file) return;
    void index;
    setActionMessage(t(VIDEO_FILE_NOTICE));
  };

  void handleDescriptionVideoFile;
  void handleProductVideoFile;
  const handleMainImageFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      notify(t("Ảnh tối đa 10MB"), {
        title: toastTitle,
        variant: "error",
      });
      return;
    }
    setMainImagePreviewUrl(URL.createObjectURL(file));
    try {
      const stored = await uploadImageAsset(file);
      trackEditUploadedAsset(stored.url);
      setDraft((prev) => (prev ? { ...prev, image: stored.url } : prev));
    } catch {
      setMainImagePreviewUrl("");
      notify(t("Không thể tải ảnh sản phẩm"), {
        title: toastTitle,
        variant: "error",
      });
    }
  };

  return (
    <section className="space-y-6 pb-8">
      <div className={`${sectionCardClass} sm:p-6`}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <Link
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
              to="/products"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("Sản phẩm")}
            </Link>
            <h3 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-slate-900">
              {product.name}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
              {shortDescription}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold " +
                  (product.isDeleted
                    ? "bg-slate-200 text-slate-600"
                    : product.publishStatus === "PUBLISHED"
                      ? "bg-emerald-500/15 text-emerald-700"
                      : product.publishStatus === "DRAFT"
                        ? "bg-slate-900/5 text-slate-700"
                        : "bg-slate-200 text-slate-600")
                }
              >
                {product.isDeleted
                  ? t("Đã xóa")
                  : t(publishStatusLabelMap[product.publishStatus])}
              </span>
              <button
                type="button"
                disabled={product.isDeleted}
                onClick={async () => {
                  try {
                    await updateProduct(product.sku, {
                      isFeatured: !product.isFeatured,
                    });
                  } catch (error) {
                    notify(
                      error instanceof Error
                        ? error.message
                        : t("Không thể cập nhật"),
                      { title: toastTitle, variant: "error" },
                    );
                  }
                }}
                title={`${product.isFeatured ? t("Ẩn khỏi Hero trang chủ") : t("Hiển thị ở Hero trang chủ")} — ${t("Cập nhật ngay không cần lưu")}`}
                className={
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold transition " +
                  (product.isFeatured
                    ? "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
                    : "bg-slate-900/5 text-slate-400 hover:bg-amber-500/10 hover:text-amber-600")
                }
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {t("Hero trang chủ")}
              </button>
              <button
                type="button"
                disabled={product.isDeleted}
                onClick={async () => {
                  try {
                    await updateProduct(product.sku, {
                      showOnHomepage: !product.showOnHomepage,
                    });
                  } catch (error) {
                    notify(
                      error instanceof Error
                        ? error.message
                        : t("Không thể cập nhật"),
                      { title: toastTitle, variant: "error" },
                    );
                  }
                }}
                title={`${product.showOnHomepage ? t("Ẩn khỏi danh sách sản phẩm trang chủ") : t("Hiển thị trong danh sách sản phẩm trang chủ")} — ${t("Cập nhật ngay không cần lưu")}`}
                className={
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold transition " +
                  (product.showOnHomepage
                    ? "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                    : "bg-slate-900/5 text-slate-400 hover:bg-blue-500/10 hover:text-blue-600")
                }
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {t("Danh sách trang chủ")}
              </button>
            </div>
            <div className="mt-3 grid max-w-3xl gap-2 text-xs text-slate-500 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 leading-5">
                {t(
                  "Hero trang chủ dùng để chọn sản phẩm nổi bật cho khu vực đầu trang.",
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 leading-5">
                {t(
                  "Danh sách trang chủ dùng để hiển thị trong danh sách sản phẩm ở homepage.",
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
              <span className="rounded-full bg-slate-900/5 px-3 py-1 font-semibold">
                SKU {product.sku}
              </span>
              <span className="rounded-full bg-slate-900/5 px-3 py-1 font-semibold">
                {t("Cập nhật {date}", {
                  date: formatDisplayDate(product.updatedAt),
                })}
              </span>
            </div>
          </div>
          <div className="w-full xl:w-auto xl:min-w-[22rem] xl:max-w-[30rem]">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {isEditing ? (
                <>
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
                    type="button"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4" />
                    {t("Hủy thao tác")}
                  </button>
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0"
                    disabled={!isDirty}
                    type="submit"
                    form="product-edit-form"
                  >
                    <Save className="h-4 w-4" />
                    {t("Lưu thay đổi")}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
                    type="button"
                    onClick={handleStartEdit}
                  >
                    <Pencil className="h-4 w-4" />
                    {t("Chỉnh sửa")}
                  </button>
                  <button
                    className={
                      product.publishStatus === "DRAFT" && !product.isDeleted
                        ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0"
                        : "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
                    }
                    type="button"
                    onClick={async () => {
                      if (product.publishStatus === "PUBLISHED") {
                        const approved = await confirm({
                          title: t("Hủy xuất bản"),
                          message: t("Hủy xuất bản sản phẩm này?"),
                          tone: "warning",
                          confirmLabel: t("Hủy xuất bản"),
                        });
                        if (!approved) {
                          return;
                        }
                      }

                      try {
                        await togglePublishStatus(product.sku);
                      } catch (error) {
                        notify(
                          error instanceof Error
                            ? error.message
                            : t("Không thể cập nhật trạng thái xuất bản"),
                          {
                            title: toastTitle,
                            variant: "error",
                          },
                        );
                      }
                    }}
                    disabled={product.isDeleted}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {product.publishStatus === "DRAFT"
                      ? t("Xuất bản")
                      : t("Hủy xuất bản")}
                  </button>
                </>
              )}
            </div>
            <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <button
                className={
                  product.isDeleted
                    ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400"
                    : "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-400"
                }
                type="button"
                onClick={handleArchiveToggle}
              >
                {product.isDeleted ? (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    {t("Khôi phục")}
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4" />
                    {t("Ẩn sản phẩm")}
                  </>
                )}
              </button>
              <button
                className={
                  product.isDeleted
                    ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 sm:self-start"
                    : "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-400 sm:self-start"
                }
                type="button"
                onClick={handleDelete}
                disabled={!product.isDeleted}
                title={
                  product.isDeleted
                    ? t("Xóa vĩnh viễn")
                    : t("Chỉ xóa vĩnh viễn được khi đã ẩn sản phẩm")
                }
              >
                <Trash2 className="h-4 w-4" />
                {t("Xóa")}
              </button>
            </div>
          </div>
        </div>
        {actionMessage && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {actionMessage}
          </div>
        )}
        {isEditing && isDirty ? (
          <div
            className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
            role="status"
          >
            {t("Bạn có thay đổi chưa lưu trong sản phẩm này.")}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.35fr]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t("Tổng quan sản phẩm")}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {t(
                  "Ảnh đại diện, giá bán, trạng thái và mức tồn kho hiện tại.",
                )}
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <img
              className="h-24 w-24 rounded-3xl border border-slate-200 bg-slate-50 object-cover"
              src={
                mainImagePreviewUrl ||
                resolveBackendAssetUrl(draft.image.trim()) ||
                getImageUrl(product.image) ||
                productPlaceholder
              }
              alt={product.name}
            />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                SKU {product.sku}
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--accent)]">
                {formatCurrency(product.retailPrice || 0)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {t("Cập nhật {date}", {
                  date: formatDisplayDate(product.updatedAt),
                })}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {t("Trạng thái")}
              </p>
              <span
                className={
                  product.isDeleted
                    ? "mt-2 inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                    : product.status === "Active"
                      ? "mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700"
                      : product.status === "Low Stock"
                        ? "mt-2 inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-700"
                        : "mt-2 inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                }
              >
                <span
                  className={
                    product.isDeleted
                      ? "h-2 w-2 rounded-full bg-slate-400"
                      : product.status === "Active"
                        ? "h-2 w-2 rounded-full bg-emerald-500"
                        : product.status === "Low Stock"
                          ? "h-2 w-2 rounded-full bg-amber-500"
                          : "h-2 w-2 rounded-full bg-slate-400"
                  }
                />
                {product.isDeleted
                  ? t("Đã xóa")
                  : t(productStatusLabelMap[product.status])}
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {t("Tồn kho")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {product.availableStock}
              </p>
              <p className="text-xs text-slate-500">
                {t("Cập nhật {date}", {
                  date: formatDisplayDate(product.updatedAt),
                })}
              </p>
            </div>
          </div>
        </div>

        <BasicInfoSection
          t={t}
          isEditing={isEditing}
          draft={draft}
          setDraft={setDraft}
          draftErrors={draftErrors}
          retailPriceInputRef={retailPriceInputRef}
          handleRetailPriceChange={handleRetailPriceChange}
          handleSave={handleSave}
          handleMainImageFile={handleMainImageFile}
          setMainImagePreviewUrl={setMainImagePreviewUrl}
          shortDescription={shortDescription}
        />
      </div>

      <SpecsSection
        t={t}
        isEditing={isEditing}
        draft={draft}
        setDraft={setDraft}
        specificationItems={specificationItems}
      />

      <DescriptionSection
        t={t}
        isEditing={isEditing}
        draft={draft}
        setDraft={setDraft}
        descriptionTypeOptions={descriptionTypeOptions}
        changeDescriptionType={changeDescriptionType}
        removeDescriptionItem={removeDescriptionItem}
        descriptionEditorModules={descriptionEditorModules}
        descriptionEditorFormats={descriptionEditorFormats}
        descriptionImageErrors={descriptionImageErrors}
        setDescriptionImageErrors={setDescriptionImageErrors}
        handleDescriptionImageFile={handleDescriptionImageFile}
        handleDescriptionGalleryFiles={handleDescriptionGalleryFiles}
        handleGalleryItemFile={handleGalleryItemFile}
        descriptionReadBlocks={descriptionReadBlocks}
      />

      <VideoSection
        t={t}
        isEditing={isEditing}
        draft={draft}
        setDraft={setDraft}
        setProductVideoErrors={setProductVideoErrors}
        videoItems={videoItems}
        hasSingleVideo={hasSingleVideo}
      />
      {confirmDialog}
    </section>
  );
}

export default ProductDetailPage;
