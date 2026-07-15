import { useState, useEffect, useCallback, useRef } from "react";
import Modal from "react-modal";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import {
  fetchAdminMediaList,
  type BackendAdminMediaListItem,
  type BackendMediaCategory,
} from "../../lib/adminApi";
import { uploadMediaAsset } from "../../lib/mediaUpload";
import {
  GhostButton,
  PrimaryButton,
  PaginationNav,
  SearchInput,
  panelClass,
} from "../ui-kit";
import { X, Upload, Check, ImageIcon, Loader2 } from "lucide-react";

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, mediaItem: BackendAdminMediaListItem) => void;
  onSelectMultiple?: (urls: string[], mediaItems: BackendAdminMediaListItem[]) => void;
  multiSelect?: boolean;
  category?: BackendMediaCategory;
}

const modalStyles = {
  overlay: {
    backgroundColor: "rgba(1, 8, 15, 0.62)",
    backdropFilter: "blur(14px)",
    display: "grid",
    placeItems: "center",
    padding: "1rem",
    zIndex: 60,
  },
  content: {
    position: "relative",
    inset: "unset",
    border: "none",
    background: "transparent",
    padding: 0,
    overflow: "visible",
    maxWidth: "54rem",
    width: "100%",
  },
} as const;

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  onSelectMultiple,
  multiSelect = false,
  category,
}: MediaPickerModalProps) {
  const { t } = useLanguage();
  const { accessToken } = useAuth();

  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [items, setItems] = useState<BackendAdminMediaListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Single-select: URL string, Multi-select: Set of URLs
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Map<string, BackendAdminMediaListItem>>(new Map());

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PAGE_SIZE = 12;

  const loadMedia = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetchAdminMediaList(accessToken, {
        page,
        size: PAGE_SIZE,
        category: category,
        query: searchQuery || undefined,
        status: "active",
        sortBy: "createdAt",
        sortDir: "desc",
      });
      setItems(res.items);
      setTotalPages(res.totalPages);
      setTotalItems(res.totalElements);
    } catch (err) {
      console.error("Failed to load media list", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, category, searchQuery]);

  useEffect(() => {
    if (isOpen && activeTab === "library") {
      void loadMedia();
    }
  }, [isOpen, activeTab, page, searchQuery, loadMedia]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const handleSelectMedia = (item: BackendAdminMediaListItem) => {
    const url = item.downloadUrl || "";
    if (!url) return;

    if (multiSelect) {
      const nextUrls = new Set(selectedUrls);
      const nextItems = new Map(selectedItems);

      if (nextUrls.has(url)) {
        nextUrls.delete(url);
        nextItems.delete(url);
      } else {
        nextUrls.add(url);
        nextItems.set(url, item);
      }
      setSelectedUrls(nextUrls);
      setSelectedItems(nextItems);
    } else {
      onSelect(url, item);
    }
  };

  const handleConfirmSelection = () => {
    if (multiSelect && onSelectMultiple) {
      const urls = Array.from(selectedUrls);
      const mediaItems = urls.map(url => selectedItems.get(url)!).filter(Boolean);
      onSelectMultiple(urls, mediaItems);
    }
  };

  // Upload handlers
  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !accessToken) return;
    setUploading(true);
    setUploadError("");
    setUploadProgress(5);

    try {
      const file = files[0]; // Chỉ upload 1 file tại 1 thời điểm
      const res = await uploadMediaAsset({
        token: accessToken,
        file,
        category: category || "product",
        onProgress: (percent) => setUploadProgress(percent),
      });

      if (res && res.downloadUrl) {
        const item: BackendAdminMediaListItem = {
          id: res.id,
          objectKey: res.objectKey,
          fileName: res.originalFileName,
          contentType: res.contentType,
          mediaType: res.mediaType,
          category: res.category,
          sizeBytes: res.sizeBytes,
          status: res.status,
          downloadUrl: res.downloadUrl,
          createdAt: res.createdAt,
          finalizedAt: res.finalizedAt,
        };

        if (multiSelect) {
          const nextUrls = new Set(selectedUrls);
          const nextItems = new Map(selectedItems);
          nextUrls.add(res.downloadUrl);
          nextItems.set(res.downloadUrl, item);
          setSelectedUrls(nextUrls);
          setSelectedItems(nextItems);
        }

        // Chuyển sang Tab library và reset page
        setActiveTab("library");
        setPage(0);
        await loadMedia();

        if (!multiSelect) {
          onSelect(res.downloadUrl, item);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setUploadError(message || t("Upload thất bại. Vui lòng thử lại."));
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    void handleUploadFiles(e.dataTransfer.files);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={modalStyles}
      contentLabel={t("Chọn hình ảnh")}
    >
      <div className={`${panelClass} flex max-h-[90vh] min-h-[500px] w-full flex-col overflow-hidden p-5 sm:p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold tracking-[-0.01em] text-[var(--ink)]">
              {t("Thư viện phương tiện")}
            </h3>
            <div className="flex rounded-xl bg-[var(--surface-muted)] p-1">
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "library"
                    ? "bg-[var(--surface-raised)] text-[var(--ink)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
                onClick={() => setActiveTab("library")}
              >
                {t("Thư viện")}
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "upload"
                    ? "bg-[var(--surface-raised)] text-[var(--ink)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
                onClick={() => setActiveTab("upload")}
              >
                {t("Tải ảnh mới")}
              </button>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          {activeTab === "library" ? (
            <div className="flex flex-1 flex-col space-y-4">
              {/* Filter / Search */}
              <div className="flex items-center justify-between gap-3">
                <SearchInput
                  id="media-picker-search"
                  label={t("Tìm kiếm ảnh")}
                  placeholder={t("Tìm theo tên file...")}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full max-w-md"
                />
                {multiSelect && selectedUrls.size > 0 && (
                  <span className="text-xs font-semibold text-[var(--accent-strong)]">
                    {t("Đã chọn {{count}} ảnh", { count: selectedUrls.size })}
                  </span>
                )}
              </div>

              {/* Grid */}
              {loading ? (
                <div className="flex flex-1 items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-20 text-[var(--muted)]">
                  <ImageIcon className="h-12 w-12 opacity-40" />
                  <p className="mt-4 text-sm font-semibold">{t("Thư viện ảnh trống")}</p>
                </div>
              ) : (
                <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {items.map((item) => {
                    const isSelected = selectedUrls.has(item.downloadUrl || "");
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectMedia(item)}
                        className={`group relative aspect-square overflow-hidden rounded-2xl border bg-[var(--surface-muted)] transition-all ${
                          isSelected
                            ? "border-[var(--accent)] ring-2 ring-[var(--accent)] ring-offset-1"
                            : "border-[var(--border)] hover:border-[var(--brand-border-strong)]"
                        }`}
                      >
                        <img
                          src={item.downloadUrl || ""}
                          alt={item.fileName || ""}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute right-2 top-2 rounded-full bg-[var(--accent)] p-1 text-white shadow">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-black/50 p-1 text-left opacity-0 transition group-hover:opacity-100">
                          <p className="truncate text-[10px] text-white">
                            {item.fileName}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <PaginationNav
                  page={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={PAGE_SIZE}
                  onPageChange={(p) => setPage(p)}
                  previousLabel={t("Trước")}
                  nextLabel={t("Sau")}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center">
              <div
                className={`flex w-full max-w-xl flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition ${
                  isDragOver
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--border)] bg-[var(--surface-muted)]"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="sr-only"
                  onChange={(e) => void handleUploadFiles(e.target.files)}
                  disabled={uploading}
                />
                <Upload className="h-10 w-10 text-[var(--muted)]" />
                <p className="mt-4 text-sm font-semibold text-[var(--ink)]">
                  {t("Kéo thả ảnh vào đây, hoặc")}
                </p>
                <GhostButton
                  type="button"
                  className="mt-3"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {t("Chọn file từ máy tính")}
                </GhostButton>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {t("Hỗ trợ JPG, PNG, GIF, WEBP tối đa 10MB")}
                </p>

                {uploading && (
                  <div className="mt-6 w-full max-w-xs">
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink)]">
                      <span>{t("Đang upload...")}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--border)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {uploadError && (
                  <p className="mt-4 text-xs font-semibold text-[var(--error-text)]">
                    {uploadError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[var(--border)] pt-4 gap-3">
          <GhostButton type="button" onClick={onClose}>
            {t("Hủy")}
          </GhostButton>
          {multiSelect && activeTab === "library" && (
            <PrimaryButton
              type="button"
              onClick={handleConfirmSelection}
              disabled={selectedUrls.size === 0}
            >
              {t("Xác nhận chọn")}
            </PrimaryButton>
          )}
        </div>
      </div>
    </Modal>
  );
}
