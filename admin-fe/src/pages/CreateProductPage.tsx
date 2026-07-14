import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MonitorSmartphone, RotateCcw } from "lucide-react";
import {
  GhostButton,
  PageHeader,
  PagePanel,
  StatusBadge,
  sectionCardClass,
} from "../components/ui-kit";
import { LivePreview } from "../components/LivePreview";
import { previewAdminProduct } from "../lib/admin-api/products";
import { useLivePreview } from "../hooks/useLivePreview";
import { WEB_ORIGIN } from "../lib/webOrigin";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductsContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import {
  MAX_IMAGE_BYTES,
  createSpecificationTemplate,
  createDescriptionTemplate,
  createVideoTemplate,
  createDescriptionBlock,
  isValidRemoteUrl,
  moveListItem,
  moveIndexedRecord,
  getErrorMessage,
} from "./products/editor/constants";
import { useNumericFormatter } from "./products/editor/useNumericFormatter";
import { useTrackedUpload } from "./products/editor/useTrackedUpload";
import {
  createInitialNewProduct,
  createProductErrorFieldOrder,
  createProductErrorTabMap,
  hasDescriptionContent,
  hasSpecificationContent,
  hasVideoContent,
  productTabs,
  sanitizeDescriptionItems,
  secondaryButtonClass,
  type CreateProductErrorField,
  type DescriptionItem,
  type GalleryItem,
  type NewProductDraft,
  type ProductVideoItem,
} from "./products/editor/createProductModel";
import { SpecsTab } from "./products/editor/create/SpecsTab";
import { BasicInfoTab } from "./products/editor/create/BasicInfoTab";
import { DescriptionTab } from "./products/editor/create/DescriptionTab";
import { VideosTab } from "./products/editor/create/VideosTab";

function CreateProductPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { accessToken } = useAuth();
  const { confirm, confirmDialog } = useConfirmDialog();
  const { products, addProduct } = useProducts();

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const warrantyInputRef = useRef<HTMLInputElement | null>(null);
  const skuInputRef = useRef<HTMLInputElement | null>(null);
  const videoUrlInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const {
    isUploading,
    uploadingCount,
    uploadImageAsset,
    trackUploadedAsset,
    clearUploadedAssetTracking,
    cleanupUploadedAssets,
    uploadedAssetUrlsRef,
    getTrackedUploadUrls,
  } = useTrackedUpload(accessToken, notify, t);

  const getTrackedUploadUrlsFromDescriptionItem = (item?: DescriptionItem) =>
    getTrackedUploadUrls([
      item?.url,
      ...(item?.gallery ?? []).map((g) => g.url),
    ]);

  const getTrackedUploadUrlsFromDescriptionItems = (items: DescriptionItem[]) =>
    getTrackedUploadUrls(
      items.flatMap((item) => [
        item.url,
        ...(item.gallery ?? []).map((g) => g.url),
      ]),
    );

  const tabRefs = useRef<
    Record<
      "basic" | "description" | "specs" | "videos",
      HTMLButtonElement | null
    >
  >({
    basic: null,
    description: null,
    specs: null,
    videos: null,
  });

  const descriptionDragIndexRef = useRef<number | null>(null);
  const specDragIndexRef = useRef<number | null>(null);

  const [selectedImageName, setSelectedImageName] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [descriptionImageErrors, setDescriptionImageErrors] = useState<
    Record<number, string>
  >({});
  const [productVideoErrors, setProductVideoErrors] = useState<
    Record<number, string>
  >({});
  const [debouncedDescriptionVideoUrls, setDebouncedDescriptionVideoUrls] =
    useState<Record<number, string>>({});
  const [debouncedProductVideoUrls, setDebouncedProductVideoUrls] = useState<
    Record<number, string>
  >({});
  const [activeTab, setActiveTab] = useState<
    "basic" | "description" | "specs" | "videos"
  >("basic");
  const [newProduct, setNewProduct] = useState(createInitialNewProduct);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const tabOrder = ["basic", "description", "specs", "videos"] as const;

  // Payload dry-run cho Live Preview: dựng cùng shape lúc lưu (object, không JSON-string),
  // sanitize giống validateCreateProduct để xem trước khớp trang public thật.
  const livePreviewPayload = useMemo(() => {
    const priceNum = Number(newProduct.retailPrice);
    const warrantyPeriodNum = Number(newProduct.warrantyPeriod);
    const specifications = newProduct.specifications
      .map((item) => ({ label: item.label.trim(), value: item.value.trim() }))
      .filter((item) => item.label || item.value);
    const videos = newProduct.videos
      .map((video) => ({
        title: video.title.trim(),
        descriptions: video.descriptions.trim(),
        url: video.url.trim(),
      }))
      .filter((video) => video.title || video.descriptions || video.url);
    return {
      name: newProduct.name.trim() || undefined,
      sku: newProduct.sku.trim() || undefined,
      shortDescription: newProduct.shortDescription.trim() || undefined,
      retailPrice: Number.isFinite(priceNum) ? priceNum : undefined,
      warrantyPeriod: Number.isFinite(warrantyPeriodNum) ? warrantyPeriodNum : undefined,
      image: newProduct.imageUrl ? { imageUrl: newProduct.imageUrl } : undefined,
      descriptions: sanitizeDescriptionItems(newProduct.descriptions),
      specifications,
      videos,
    };
  }, [newProduct]);

  const {
    data: livePreviewData,
    error: livePreviewError,
    loading: livePreviewLoading,
  } = useLivePreview({
    open: showLivePreview && Boolean(accessToken),
    payload: livePreviewPayload,
    previewFn: (body) => previewAdminProduct(accessToken as string, body),
  });

  const { inputRef: retailPriceInputRef, handleInputChange: handleRetailPriceChange } = useNumericFormatter(
    newProduct.retailPrice,
    (digits) => {
      setNewProduct((prev) => ({ ...prev, retailPrice: digits }));
      setErrors((prev) => {
        if (!prev.retailPrice) return prev;
        const next = { ...prev };
        delete next.retailPrice;
        return next;
      });
    }
  );

  const isFormLocked = isCreating || isUploading;

  // Revoke blob URL when imagePreviewUrl changes
  useEffect(() => {
    if (!imagePreviewUrl || !imagePreviewUrl.startsWith("blob:")) return;
    return () => {
      URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  // Debounce description video URLs
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextUrls = newProduct.descriptions.reduce<Record<number, string>>(
        (acc, item, index) => {
          if (item.type !== "video") return acc;
          const url = item.url?.trim() ?? "";
          if (url) acc[index] = url;
          return acc;
        },
        {},
      );
      setDebouncedDescriptionVideoUrls(nextUrls);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [newProduct.descriptions]);

  // Debounce product video URLs
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextUrls = newProduct.videos.reduce<Record<number, string>>(
        (acc, item, index) => {
          const url = item.url.trim();
          if (url) acc[index] = url;
          return acc;
        },
        {},
      );
      setDebouncedProductVideoUrls(nextUrls);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [newProduct.videos]);



  const isCreateFormDirty = useMemo(
    () =>
      JSON.stringify(newProduct) !== JSON.stringify(createInitialNewProduct()),
    [newProduct],
  );

  const createTabHasError = useMemo(
    () => ({
      basic: Boolean(
        imageError ||
        errors.name ||
        errors.sku ||
        errors.retailPrice ||
        errors.warrantyPeriod,
      ),
      description: Object.keys(descriptionImageErrors).length > 0,
      specs: false,
      videos: Object.keys(productVideoErrors).length > 0,
    }),
    [descriptionImageErrors, errors, imageError, productVideoErrors],
  );

  const hasZeroRetailPrice = newProduct.retailPrice.trim() === "0";

  const clearDescriptionImage = (index: number) => {
    const currentUrl = newProduct.descriptions[index]?.url?.trim() ?? "";
    setNewProduct((prev) => {
      const copy = [...prev.descriptions];
      const currentItem = copy[index] ?? { type: "image" as const };
      copy[index] = { ...currentItem, type: "image", url: "" };
      return { ...prev, descriptions: copy };
    });
    setDescriptionImageErrors((prev) => {
      if (!(index in prev)) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
    void cleanupUploadedAssets([currentUrl]);
  };

  const clearGalleryItemImage = (
    index: number,
    itemIndex: number,
    removeItem = false,
  ) => {
    const current = newProduct.descriptions[index];
    const currentUrl = current?.gallery?.[itemIndex]?.url?.trim() ?? "";
    setNewProduct((prev) => {
      const copy = [...prev.descriptions];
      const currentItem = copy[index] ?? {
        type: "gallery" as const,
        gallery: [] as GalleryItem[],
      };
      const nextGallery = [...(currentItem.gallery ?? [])];
      if (removeItem) {
        nextGallery.splice(itemIndex, 1);
      } else {
        const existing = nextGallery[itemIndex] ?? { url: "" };
        nextGallery[itemIndex] = { ...existing, url: "" };
      }
      copy[index] = { ...currentItem, type: "gallery", gallery: nextGallery };
      return { ...prev, descriptions: copy };
    });
    setDescriptionImageErrors((prev) => {
      if (!(index in prev)) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
    void cleanupUploadedAssets([currentUrl]);
  };

  const getCreateFieldError = (
    field: Exclude<CreateProductErrorField, "videos">,
    draft: NewProductDraft = newProduct,
  ) => {
    if (field === "name") {
      return draft.name.trim() ? "" : t("Vui lòng nhập tên sản phẩm");
    }
    if (field === "sku") {
      const normalizedSku = draft.sku.trim();
      if (!normalizedSku) return t("Vui lòng nhập SKU");
      return products.some(
        (p) => p.sku.toLowerCase() === normalizedSku.toLowerCase(),
      )
        ? t("SKU đã tồn tại")
        : "";
    }
    if (field === "retailPrice") {
      if (!draft.retailPrice.trim()) return t("Vui lòng nhập giá bán lẻ");
      const priceNum = Number(draft.retailPrice);
      return Number.isNaN(priceNum) || priceNum < 0
        ? t("Giá phải là số không âm")
        : "";
    }
    if (field === "warrantyPeriod") {
      const n = Number(draft.warrantyPeriod);
      if (Number.isNaN(n) || n <= 0 || !Number.isInteger(n))
        return t("Thời hạn bảo hành phải là số nguyên dương");
      if (n > 120) return t("Tối đa 120 tháng");
      return "";
    }
    return "";
  };

  const setCreateFieldError = (
    field: Exclude<CreateProductErrorField, "videos">,
    message: string,
  ) => {
    setErrors((prev) => {
      if (!message) {
        if (!(field in prev)) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      }
      if (prev[field] === message) return prev;
      return { ...prev, [field]: message };
    });
  };

  const validateCreateFieldOnBlur = (
    field: Exclude<CreateProductErrorField, "videos">,
    draft: NewProductDraft = newProduct,
  ) => {
    setCreateFieldError(field, getCreateFieldError(field, draft));
  };

  const getProductVideoError = (video: ProductVideoItem) => {
    const hasVideoValues =
      video.title.trim() || video.descriptions.trim() || video.url.trim();
    if (!hasVideoValues) return "";
    if (!video.url.trim()) return t("Vui lòng nhập URL video");
    return isValidRemoteUrl(video.url) ? "" : t("URL video không hợp lệ");
  };

  const validateProductVideoOnBlur = (
    index: number,
    video: ProductVideoItem = newProduct.videos[index] ??
      createVideoTemplate()[0],
  ) => {
    setProductVideoErrors((prev) => {
      const message = getProductVideoError(video);
      if (!message) {
        if (!(index in prev)) return prev;
        const next = { ...prev };
        delete next[index];
        return next;
      }
      if (prev[index] === message) return prev;
      return { ...prev, [index]: message };
    });
  };

  const focusCreateField = (field: CreateProductErrorField) => {
    const target =
      field === "name"
        ? nameInputRef.current
        : field === "warrantyPeriod"
          ? warrantyInputRef.current
          : field === "sku"
            ? skuInputRef.current
            : field === "retailPrice"
              ? retailPriceInputRef.current
              : null;
    target?.focus();
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const confirmTemplateReplacement = async (hasContent: boolean) => {
    if (!hasContent) return true;
    return confirm({
      title: t("Thay thế dữ liệu hiện tại?"),
      message: t("Mẫu sẽ ghi đè nội dung bạn đang nhập trong mục này."),
      confirmLabel: t("Ghi đè"),
      cancelLabel: t("Giữ lại"),
      tone: "warning",
    });
  };

  const applyDescriptionTemplate = async () => {
    const approved = await confirmTemplateReplacement(
      hasDescriptionContent(newProduct.descriptions),
    );
    if (!approved) return;
    const previousUrls = getTrackedUploadUrlsFromDescriptionItems(
      newProduct.descriptions,
    );
    setDescriptionImageErrors({});
    setNewProduct((prev) => ({
      ...prev,
      descriptions: createDescriptionTemplate(),
    }));
    void cleanupUploadedAssets(previousUrls);
  };

  const applySpecificationTemplate = async () => {
    const approved = await confirmTemplateReplacement(
      hasSpecificationContent(newProduct.specifications),
    );
    if (!approved) return;
    setNewProduct((prev) => ({
      ...prev,
      specifications: createSpecificationTemplate(),
    }));
  };

  const applyVideoTemplate = async () => {
    const approved = await confirmTemplateReplacement(
      hasVideoContent(newProduct.videos),
    );
    if (!approved) return;
    setProductVideoErrors({});
    setNewProduct((prev) => ({ ...prev, videos: createVideoTemplate() }));
  };

  const descriptionBlockOptions: Array<{
    id: DescriptionItem["type"];
    label: string;
    addLabel: string;
  }> = [
    { id: "description", label: t("Mô tả"), addLabel: t("+ Mô tả") },
    { id: "image", label: t("Hình ảnh"), addLabel: t("+ Hình ảnh") },
    {
      id: "gallery",
      label: t("Nhiều hình ảnh"),
      addLabel: t("+ Nhiều hình ảnh"),
    },
    { id: "video", label: t("Video"), addLabel: t("+ Video") },
  ];

  const getDescriptionBlockLabel = (type: DescriptionItem["type"]) =>
    descriptionBlockOptions.find((option) => option.id === type)?.label ?? type;

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

  const appendDescriptionBlock = (type: DescriptionItem["type"]) => {
    setNewProduct((prev) => ({
      ...prev,
      descriptions: [...prev.descriptions, createDescriptionBlock(type)],
    }));
  };

  const moveDescriptionItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newProduct.descriptions.length)
      return;
    setNewProduct((prev) => ({
      ...prev,
      descriptions: moveListItem(prev.descriptions, index, targetIndex),
    }));
    setDescriptionImageErrors((prev) =>
      moveIndexedRecord(prev, index, targetIndex),
    );
  };

  const moveSpecificationItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newProduct.specifications.length)
      return;
    setNewProduct((prev) => ({
      ...prev,
      specifications: moveListItem(prev.specifications, index, targetIndex),
    }));
  };

  const moveVideoItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newProduct.videos.length) return;
    setNewProduct((prev) => ({
      ...prev,
      videos: moveListItem(prev.videos, index, targetIndex),
    }));
    setProductVideoErrors((prev) =>
      moveIndexedRecord(prev, index, targetIndex),
    );
    videoUrlInputRefs.current = moveIndexedRecord(
      videoUrlInputRefs.current,
      index,
      targetIndex,
    );
  };

  const removeVideoItem = (idx: number) => {
    const copy = newProduct.videos.filter((_, i) => i !== idx);
    setNewProduct({ ...newProduct, videos: copy });
    const nextRefs: Record<number, HTMLInputElement | null> = {};
    Object.entries(videoUrlInputRefs.current).forEach(([key, element]) => {
      const index = Number(key);
      if (Number.isNaN(index) || index === idx) return;
      nextRefs[index > idx ? index - 1 : index] = element;
    });
    videoUrlInputRefs.current = nextRefs;
    setProductVideoErrors((prev) => {
      const next: Record<number, string> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const index = Number(key);
        if (Number.isNaN(index)) return;
        if (index < idx) next[index] = value;
        else if (index > idx) next[index - 1] = value;
      });
      return next;
    });
  };

  const applySuggestedSpecificationLabel = (label: string) => {
    setNewProduct((prev) => {
      const emptyLabelIndex = prev.specifications.findIndex(
        (item) => !item.label.trim(),
      );
      const copy = [...prev.specifications];
      if (emptyLabelIndex >= 0) {
        copy[emptyLabelIndex] = { ...copy[emptyLabelIndex], label };
        return { ...prev, specifications: copy };
      }
      return { ...prev, specifications: [...copy, { label, value: "" }] };
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
      const previousUrl = newProduct.descriptions[index]?.url?.trim() ?? "";
      const stored = await uploadImageAsset(file);
      trackUploadedAsset(stored.url);
      setNewProduct((prev) => {
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
      void cleanupUploadedAssets([previousUrl]);
    } catch (error) {
      const message = getErrorMessage(
        error,
        t("Không thể tải ảnh lên. Vui lòng thử lại."),
      );
      setDescriptionImageErrors((prev) => ({ ...prev, [index]: message }));
      notify(message, { title: t("Sản phẩm"), variant: "error" });
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
        validFiles.map((file) => uploadImageAsset(file)),
      );
      storedItems.forEach((item) => trackUploadedAsset(item.url));
      const newItems = storedItems
        .filter((item) => item.url)
        .map((item) => ({ url: item.url }));
      setNewProduct((prev) => {
        const copy = [...prev.descriptions];
        const current = copy[index] ?? {
          type: "gallery" as const,
          gallery: [] as GalleryItem[],
        };
        copy[index] = {
          ...current,
          type: "gallery",
          gallery: [...(current.gallery ?? []), ...newItems],
        };
        return { ...prev, descriptions: copy };
      });
      setDescriptionImageErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    } catch (error) {
      const message = getErrorMessage(
        error,
        t("Không thể tải ảnh lên. Vui lòng thử lại."),
      );
      setDescriptionImageErrors((prev) => ({ ...prev, [index]: message }));
      notify(message, { title: t("Sản phẩm"), variant: "error" });
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
      const previousUrl =
        newProduct.descriptions[index]?.gallery?.[itemIndex]?.url?.trim() ?? "";
      const stored = await uploadImageAsset(file);
      trackUploadedAsset(stored.url);
      setNewProduct((prev) => {
        const copy = [...prev.descriptions];
        const current = copy[index] ?? {
          type: "gallery" as const,
          gallery: [] as GalleryItem[],
        };
        const nextGallery = [...(current.gallery ?? [])];
        nextGallery[itemIndex] = {
          ...(nextGallery[itemIndex] ?? { url: "" }),
          url: stored.url,
        };
        copy[index] = { ...current, type: "gallery", gallery: nextGallery };
        return { ...prev, descriptions: copy };
      });
      setDescriptionImageErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      void cleanupUploadedAssets([previousUrl]);
    } catch (error) {
      const message = getErrorMessage(
        error,
        t("Không thể tải ảnh lên. Vui lòng thử lại."),
      );
      setDescriptionImageErrors((prev) => ({ ...prev, [index]: message }));
      notify(message, { title: t("Sản phẩm"), variant: "error" });
    }
  };

  const removeDescriptionItem = (index: number) => {
    const removedItem = newProduct.descriptions[index];
    setNewProduct((prev) => ({
      ...prev,
      descriptions: prev.descriptions.filter((_, i) => i !== index),
    }));
    setDescriptionImageErrors((prev) => {
      const next: Record<number, string> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const idx = Number(key);
        if (Number.isNaN(idx)) return;
        if (idx < index) next[idx] = value;
        else if (idx > index) next[idx - 1] = value;
      });
      return next;
    });
    void cleanupUploadedAssets(
      getTrackedUploadUrlsFromDescriptionItem(removedItem),
    );
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previousImageUrl = newProduct.imageUrl.trim();
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(t("Ảnh tối đa 10MB"));
      setSelectedImageName("");
      setImagePreviewUrl("");
      event.target.value = "";
      return;
    }
    setImageError("");
    setSelectedImageName(file.name);
    setImagePreviewUrl(URL.createObjectURL(file));
    try {
      const stored = await uploadImageAsset(file);
      trackUploadedAsset(stored.url);
      setNewProduct((prev) => ({ ...prev, imageUrl: stored.url }));
      void cleanupUploadedAssets([previousImageUrl]);
    } catch (error) {
      const message = getErrorMessage(error, t("Không thể xử lý tệp đã chọn"));
      setImageError(message);
      setSelectedImageName("");
      event.target.value = "";
      setImagePreviewUrl("");
      notify(message, { title: t("Sản phẩm"), variant: "error" });
    }
  };

  const handleClearImage = () => {
    const currentImageUrl = newProduct.imageUrl.trim();
    setImagePreviewUrl("");
    setImageError("");
    setSelectedImageName("");
    setNewProduct((prev) => ({ ...prev, imageUrl: "" }));
    if (imageInputRef.current) imageInputRef.current.value = "";
    void cleanupUploadedAssets([currentImageUrl]);
  };

  const requestNavigateAway = async () => {
    if (isFormLocked) return;
    if (isCreateFormDirty) {
      const approved = await confirm({
        title: t("Rời khỏi trang?"),
        message: t("Mọi thay đổi chưa lưu sẽ bị mất."),
        confirmLabel: t("Rời đi"),
        cancelLabel: t("Ở lại"),
        tone: "warning",
      });
      if (!approved) return;
    }
    await cleanupUploadedAssets(Array.from(uploadedAssetUrlsRef.current));
    navigate("/products");
  };

  const validateCreateProduct = () => {
    const nextErrors: Record<string, string> = {};
    const nextProductVideoErrors: Record<number, string> = {};
    const basicFields: Array<Exclude<CreateProductErrorField, "videos">> = [
      "name",
      "sku",
      "retailPrice",
      "warrantyPeriod",
    ];

    basicFields.forEach((field) => {
      const message = getCreateFieldError(field);
      if (message) nextErrors[field] = message;
    });

    const priceNum = Number(newProduct.retailPrice);
    const warrantyPeriodNum = Number(newProduct.warrantyPeriod);

    newProduct.videos.forEach((video, index) => {
      const message = getProductVideoError(video);
      if (message) nextProductVideoErrors[index] = message;
    });

    const firstVideoErrorIndex =
      Object.keys(nextProductVideoErrors)
        .map((key) => Number(key))
        .find((index) => !Number.isNaN(index)) ?? null;

    const sanitizedDescriptions = sanitizeDescriptionItems(
      newProduct.descriptions,
    );

    const firstErrorField =
      createProductErrorFieldOrder.find((field) =>
        field === "videos"
          ? firstVideoErrorIndex !== null
          : Boolean(nextErrors[field]),
      ) ?? null;

    const sanitizedSpecifications = newProduct.specifications
      .map((item) => ({ label: item.label.trim(), value: item.value.trim() }))
      .filter((item) => item.label || item.value);

    const sanitizedVideos = newProduct.videos
      .map((video) => ({
        title: video.title.trim(),
        descriptions: video.descriptions.trim(),
        url: video.url.trim(),
      }))
      .filter((video) => video.title || video.descriptions || video.url);

    return {
      nextErrors,
      nextProductVideoErrors,
      firstErrorField,
      firstVideoErrorIndex,
      priceNum,
      sanitizedDescriptions,
      sanitizedSpecifications,
      sanitizedVideos,
      warrantyPeriodNum,
    };
  };

  const handleCreateProductSubmit = () => {
    if (isFormLocked) return;

    const {
      nextErrors,
      nextProductVideoErrors,
      firstErrorField,
      firstVideoErrorIndex,
      priceNum,
      sanitizedDescriptions,
      sanitizedSpecifications,
      sanitizedVideos,
      warrantyPeriodNum,
    } = validateCreateProduct();

    setErrors(nextErrors);
    setProductVideoErrors(nextProductVideoErrors);

    if (firstErrorField) {
      const targetTab = createProductErrorTabMap[firstErrorField];
      setActiveTab(targetTab);
      window.setTimeout(() => {
        tabRefs.current[targetTab]?.focus();
        if (firstErrorField === "videos" && firstVideoErrorIndex !== null) {
          const target = videoUrlInputRefs.current[firstVideoErrorIndex];
          target?.focus();
          target?.scrollIntoView({ block: "center", behavior: "smooth" });
          return;
        }
        focusCreateField(firstErrorField);
      }, 0);
      notify(t("Vui lòng kiểm tra lại các trường bắt buộc"), {
        title: t("Sản phẩm"),
        variant: "error",
      });
      return;
    }

    void (async () => {
      if (newProduct.retailPrice.trim() === "0") {
        const approved = await confirm({
          title: t("Tạo sản phẩm với giá 0 VND?"),
          message: t(
            "Sản phẩm sẽ được lưu với giá bán lẻ bằng 0. Hãy xác nhận nếu đây là chủ đích của bạn.",
          ),
          confirmLabel: t("Vẫn tạo"),
          cancelLabel: t("Xem lại giá"),
          tone: "warning",
        });
        if (!approved) {
          setActiveTab("basic");
          window.setTimeout(() => {
            retailPriceInputRef.current?.focus();
            retailPriceInputRef.current?.scrollIntoView({
              block: "center",
              behavior: "smooth",
            });
          }, 0);
          return;
        }
      }

      setIsCreating(true);
      try {
        await addProduct({
          name: newProduct.name.trim(),
          sku: newProduct.sku.trim(),
          shortDescription: newProduct.shortDescription.trim(),
          retailPrice: priceNum || 0,
          warrantyPeriod: warrantyPeriodNum,
          publishStatus: newProduct.publishStatus,
          isFeatured: newProduct.isFeatured,
          showOnHomepage: newProduct.showOnHomepage,
          image: newProduct.imageUrl
            ? JSON.stringify({ imageUrl: newProduct.imageUrl })
            : undefined,
          descriptions: JSON.stringify(sanitizedDescriptions),
          specifications: JSON.stringify(sanitizedSpecifications),
          videos: JSON.stringify(sanitizedVideos),
        });
        clearUploadedAssetTracking();
        notify(t("Sản phẩm đã được tạo thành công"), {
          title: t("Sản phẩm"),
          variant: "success",
        });
        navigate("/products");
      } catch (error) {
        notify(
          error instanceof Error ? error.message : t("Không thể tạo sản phẩm"),
          {
            title: t("Sản phẩm"),
            variant: "error",
          },
        );
      } finally {
        setIsCreating(false);
      }
    })();
  };

  return (
    <PagePanel>
      <LivePreview
        open={showLivePreview}
        onClose={() => setShowLivePreview(false)}
        data={livePreviewData}
        error={livePreviewError}
        loading={livePreviewLoading}
        device={previewDevice}
        onDeviceChange={setPreviewDevice}
        webOrigin={WEB_ORIGIN}
        previewPath="/preview/product"
        t={t}
      />
      <fieldset
        aria-busy={isFormLocked}
        className="m-0 min-w-0 border-0 p-0"
        disabled={isFormLocked}
      >
        <div aria-busy={isFormLocked}>
          {/* Header */}
          <div className="sr-only">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isFormLocked}
              onClick={() => void requestNavigateAway()}
            >
              <ArrowLeft className="h-4 w-4" />
              {t("Về sản phẩm")}
            </button>
            <h3 className="text-lg font-semibold text-slate-900 sm:text-right">
              {t("Tạo sản phẩm")}
            </h3>
          </div>

          <div className={sectionCardClass}>
            <PageHeader
              title={t("Tạo sản phẩm")}
              subtitle={t("Thiết lập thông tin cơ bản, mô tả, thông số và video trước khi xuất bản sản phẩm mới.")}
              actions={
                <div className="flex items-center gap-2">
                  <GhostButton
                    icon={<MonitorSmartphone className="h-4 w-4" />}
                    onClick={() => setShowLivePreview((v) => !v)}
                    type="button"
                  >
                    {showLivePreview ? t("Đóng xem trước") : t("Xem trước trực tiếp")}
                  </GhostButton>
                  <GhostButton
                    disabled={isFormLocked}
                    icon={<ArrowLeft className="h-4 w-4" />}
                    onClick={() => void requestNavigateAway()}
                    type="button"
                  >
                    {t("Về sản phẩm")}
                  </GhostButton>
                </div>
              }
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  {t("Tab hiện tại")}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                  {t(productTabs.find((tab) => tab.id === activeTab)?.label ?? "Thông tin")}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  {t("Trạng thái biểu mẫu")}
                </p>
                <div className="mt-1">
                  <StatusBadge tone={isCreateFormDirty ? "warning" : "neutral"}>
                    {isCreateFormDirty ? t("Chưa lưu") : t("Đã sẵn sàng")}
                  </StatusBadge>
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  {t("Tải tài nguyên")}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                  {isUploading ? t("Đang tải {count} tệp", { count: uploadingCount }) : t("Không có tệp đang tải")}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-5 sm:hidden">
            <label className="block text-sm text-slate-700" htmlFor="create-product-tab-select">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t("Các tab sản phẩm")}
              </span>
              <select
                id="create-product-tab-select"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900"
                onChange={(event) => setActiveTab(event.target.value as typeof activeTab)}
                value={activeTab}
              >
                {productTabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {t(tab.label)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div
            className="mt-4 hidden gap-2 overflow-x-auto px-1 pb-1 sm:flex sm:flex-wrap"
            role="tablist"
            aria-label={t("Các tab sản phẩm")}
          >
            {[
              {
                id: "basic",
                label: "Thông tin",
                errorTitle: "Thiếu tên, SKU hoặc giá bán",
              },
              {
                id: "description",
                label: "Mô tả chi tiết",
                errorTitle: "Có lỗi ở ảnh mô tả",
              },
              {
                id: "specs",
                label: "Thông số",
                errorTitle: "Có lỗi ở thông số",
              },
              {
                id: "videos",
                label: "Video",
                errorTitle: "URL video không hợp lệ",
              },
            ].map((tab) => {
              const tabId = tab.id as typeof activeTab;
              const isTabActive = activeTab === tabId;
              const tabHasError = createTabHasError[tabId];

              return (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabRefs.current[tabId] = node;
                  }}
                  id={`product-tab-${tab.id}`}
                  className={
                    isTabActive
                      ? `inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow ${tabHasError ? "ring-2 ring-rose-200 ring-offset-2 ring-offset-white" : ""}`
                      : `inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${tabHasError ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-700"}`
                  }
                  role="tab"
                  aria-selected={isTabActive}
                  aria-controls={`product-tabpanel-${tab.id}`}
                  tabIndex={isTabActive ? 0 : -1}
                  title={tabHasError ? t(tab.errorTitle) : undefined}
                  onKeyDown={(event) => {
                    const currentIndex = tabOrder.indexOf(activeTab);
                    let nextIndex = currentIndex;

                    switch (event.key) {
                      case "ArrowRight":
                      case "ArrowDown":
                        nextIndex = (currentIndex + 1) % tabOrder.length;
                        break;
                      case "ArrowLeft":
                      case "ArrowUp":
                        nextIndex =
                          (currentIndex - 1 + tabOrder.length) %
                          tabOrder.length;
                        break;
                      case "Home":
                        nextIndex = 0;
                        break;
                      case "End":
                        nextIndex = tabOrder.length - 1;
                        break;
                      default:
                        return;
                    }

                    event.preventDefault();
                    const nextTab = tabOrder[nextIndex];
                    setActiveTab(nextTab);
                    tabRefs.current[nextTab]?.focus();
                  }}
                  onClick={() => setActiveTab(tabId)}
                >
                  <span>{t(tab.label)}</span>
                  {tabHasError ? (
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-current"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {isCreateFormDirty ? (
            <div
              className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
              role="status"
            >
              {t("Bạn có thay đổi chưa lưu trong biểu mẫu tạo sản phẩm.")}
            </div>
          ) : null}

          {/* Basic tab */}
          {activeTab === "basic" && (
            <BasicInfoTab
              t={t}
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              errors={errors}
              validateCreateFieldOnBlur={validateCreateFieldOnBlur}
              nameInputRef={nameInputRef}
              warrantyInputRef={warrantyInputRef}
              skuInputRef={skuInputRef}
              retailPriceInputRef={retailPriceInputRef}
              imageInputRef={imageInputRef}
              handleRetailPriceChange={handleRetailPriceChange}
              hasZeroRetailPrice={hasZeroRetailPrice}
              imageError={imageError}
              handleImageChange={handleImageChange}
              selectedImageName={selectedImageName}
              imagePreviewUrl={imagePreviewUrl}
              handleClearImage={handleClearImage}
            />
          )}

          {/* Description tab */}
          {activeTab === "description" && (
            <DescriptionTab
              t={t}
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              applyDescriptionTemplate={applyDescriptionTemplate}
              descriptionBlockOptions={descriptionBlockOptions}
              appendDescriptionBlock={appendDescriptionBlock}
              descriptionDragIndexRef={descriptionDragIndexRef}
              descriptionImageErrors={descriptionImageErrors}
              setDescriptionImageErrors={setDescriptionImageErrors}
              getDescriptionBlockLabel={getDescriptionBlockLabel}
              moveDescriptionItem={moveDescriptionItem}
              removeDescriptionItem={removeDescriptionItem}
              descriptionEditorModules={descriptionEditorModules}
              descriptionEditorFormats={descriptionEditorFormats}
              isFormLocked={isFormLocked}
              handleDescriptionImageFile={handleDescriptionImageFile}
              clearDescriptionImage={clearDescriptionImage}
              handleDescriptionGalleryFiles={handleDescriptionGalleryFiles}
              handleGalleryItemFile={handleGalleryItemFile}
              clearGalleryItemImage={clearGalleryItemImage}
              debouncedDescriptionVideoUrls={debouncedDescriptionVideoUrls}
            />
          )}

          {/* Specs tab */}
          {activeTab === "specs" && (
            <SpecsTab
              t={t}
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              specDragIndexRef={specDragIndexRef}
              applySuggestedSpecificationLabel={applySuggestedSpecificationLabel}
              applySpecificationTemplate={applySpecificationTemplate}
              moveSpecificationItem={moveSpecificationItem}
            />
          )}

          {/* Videos tab */}
          {activeTab === "videos" && (
            <VideosTab
              t={t}
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              applyVideoTemplate={applyVideoTemplate}
              videoUrlInputRefs={videoUrlInputRefs}
              productVideoErrors={productVideoErrors}
              setProductVideoErrors={setProductVideoErrors}
              validateProductVideoOnBlur={validateProductVideoOnBlur}
              debouncedProductVideoUrls={debouncedProductVideoUrls}
              moveVideoItem={moveVideoItem}
              removeVideoItem={removeVideoItem}
            />
          )}

          {/* Actions */}
          <div className="sticky bottom-3 z-10 mt-6 flex flex-col gap-3 rounded-[22px] border border-[var(--brand-border)] bg-[var(--surface)]/95 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur sm:bottom-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--muted)]">
              {t("Kiểm tra tab hiện tại và các trường bắt buộc trước khi tạo sản phẩm mới.")}
            </p>
            <button
              type="button"
              disabled={isFormLocked}
              className={secondaryButtonClass}
              onClick={() => void requestNavigateAway()}
            >
              {t("Hủy thao tác")}
            </button>
            <button
              type="button"
              disabled={isFormLocked}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,113,188,0.24)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleCreateProductSubmit}
            >
              {isCreating ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  {t("Đang tạo...")}
                </>
              ) : (
                t("Tạo sản phẩm")
              )}
            </button>
          </div>
        </div>
      </fieldset>
      {confirmDialog}
    </PagePanel>
  );
}

export default CreateProductPage;
