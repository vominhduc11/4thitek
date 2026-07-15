import {
  ChevronDown,
  Copy,
  X,
  Trash2,
  Upload,
} from "lucide-react";
import { RichTextEditor } from "../RichTextEditor";
import { resolveBackendAssetUrl } from "../../lib/backendApi";
import { ProductVideoPreview } from "../ProductVideoPreview";
import { DragHandle } from "./SortableList";

interface DescriptionItem {
  type: "title" | "description" | "image" | "gallery" | "video";
  text?: string;
  url?: string;
  caption?: string;
  gallery?: Array<{ url: string } | string>;
  key?: string;
}

interface BlockControlsProps {
  disabled: boolean;
  onDuplicate: () => void;
  onRemove: () => void;
  t: (key: string) => string;
}

export function BlockControls({
  disabled,
  onDuplicate,
  onRemove,
  t,
}: BlockControlsProps) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={onDuplicate}
        disabled={disabled}
        title={t("Nhân bản")}
        aria-label={t("Nhân bản")}
      >
        <Copy size={14} />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={onRemove}
        disabled={disabled}
        title={t("Xóa")}
        aria-label={t("Xóa")}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function collapsedPreview(block: DescriptionItem, t: (key: string) => string) {
  if (block.type === "title" || block.type === "description") {
    const raw = block.text || "";
    return raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  if (block.type === "image" || block.type === "video") {
    return block.caption || block.url || "";
  }
  if (block.type === "gallery") {
    const count = block.gallery?.length || 0;
    return `${t("Bộ sưu tập ảnh")} (${count} ${t("ảnh")}) ${block.caption ? `- ${block.caption}` : ""}`;
  }
  return "";
}

interface BlockCardProps {
  block: DescriptionItem;
  index: number;
  disabled?: boolean;
  structDisabled?: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onUpdate: (patch: Partial<DescriptionItem>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  t: (key: string) => string;
  sortable: any;

  // Media / File Uploads handlers
  descriptionImageErrors: Record<number, string>;
  handleDescriptionImageFile: (index: number, file: File | null) => Promise<void> | void;
  handleDescriptionGalleryFiles: (index: number, files: FileList | null) => Promise<void> | void;
  handleGalleryItemFile: (index: number, itemIndex: number, file: File | null) => Promise<void> | void;
  clearDescriptionImage: (index: number) => void;
  clearGalleryItemImage: (index: number, itemIndex: number, removeItem?: boolean) => void;

  // Rich Text config
  descriptionEditorModules?: Record<string, unknown>;
  descriptionEditorFormats?: string[];
}

export function BlockCard({
  block,
  index,
  disabled = false,
  structDisabled = false,
  collapsed,
  onToggleCollapse,
  onUpdate,
  onRemove,
  onDuplicate,
  t,
  sortable,
  descriptionImageErrors,
  handleDescriptionImageFile,
  handleDescriptionGalleryFiles,
  handleGalleryItemFile,
  clearDescriptionImage,
  clearGalleryItemImage,
  descriptionEditorModules,
  descriptionEditorFormats,
}: BlockCardProps) {
  const dragDisabled = structDisabled || disabled;
  const imageError = descriptionImageErrors[index];

  return (
    <div
      ref={sortable?.setNodeRef}
      style={{
        ...sortable?.style,
        opacity: sortable?.isDragging ? 0.5 : undefined,
      }}
      className="flex gap-3 p-4 border border-slate-200 rounded-xl bg-white hover:border-slate-300 hover:shadow-sm transition-all"
    >
      {!dragDisabled && sortable && (
        <div className="self-start pt-1.5">
          <DragHandle
            handleProps={sortable.handleProps}
            disabled={disabled}
            label={t("Kéo để sắp xếp")}
          />
        </div>
      )}

      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="shrink-0 self-start pt-2 text-slate-400 hover:text-slate-600"
          aria-expanded={!collapsed}
          aria-label={collapsed ? t("Mở rộng khối") : t("Thu gọn khối")}
        >
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              collapsed ? "-rotate-90" : ""
            }`}
          />
        </button>
      )}

      {/* Block Type Label */}
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-24 shrink-0 pt-2.5">
        {block.type === "description" ? t("Mô tả") : t(block.type)}
      </span>

      <div className="flex-1 min-w-0">
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="block w-full truncate py-1 text-left text-sm text-slate-500 hover:text-slate-800 italic"
          >
            {collapsedPreview(block, t) || t("(trống — bấm để mở rộng)")}
          </button>
        ) : (
          <div className="space-y-4">
            {/* Title block */}
            {block.type === "title" && (
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-slate-400 focus:outline-none"
                placeholder={t("Nhập tiêu đề")}
                value={block.text ?? ""}
                onChange={(e) => onUpdate({ text: e.target.value })}
                disabled={disabled}
              />
            )}

            {/* Description block */}
            {block.type === "description" && (
              <div className="richtext-editor border border-slate-200 rounded-lg overflow-hidden">
                <RichTextEditor
                  ariaLabel={t("Trình soạn thảo mô tả chi tiết")}
                  value={block.text ?? ""}
                  modules={descriptionEditorModules}
                  formats={descriptionEditorFormats}
                  placeholder={t("Nhập mô tả")}
                  readOnly={disabled}
                  onChange={(val) => onUpdate({ text: val })}
                />
              </div>
            )}

            {/* Image block */}
            {block.type === "image" && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100">
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={disabled}
                        onChange={(e) =>
                          handleDescriptionImageFile(
                            index,
                            e.target.files?.[0] ?? null,
                          )
                        }
                      />
                      <Upload size={16} />
                      {t("Chọn ảnh tải lên")}
                    </label>
                    {imageError && (
                      <p className="text-xs font-medium text-red-500">
                        {imageError}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                      placeholder={t("Nhập chú thích hình ảnh")}
                      value={block.caption ?? ""}
                      disabled={disabled}
                      onChange={(e) => onUpdate({ caption: e.target.value })}
                    />
                  </div>
                </div>

                {block.url && (
                  <div className="group relative overflow-hidden rounded-lg border border-slate-200 max-w-xl">
                    <img
                      src={resolveBackendAssetUrl(block.url)}
                      alt={t("Xem trước")}
                      className="max-h-72 w-full object-contain bg-slate-50"
                    />
                    {!disabled && (
                      <button
                        type="button"
                        className="absolute right-2 top-2 inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-white/90 px-3 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-50"
                        onClick={() => clearDescriptionImage(index)}
                      >
                        <Trash2 size={13} className="mr-1" />
                        {t("Xóa ảnh")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Gallery block */}
            {block.type === "gallery" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      disabled={disabled}
                      onChange={(e) =>
                        handleDescriptionGalleryFiles(index, e.target.files)
                      }
                    />
                    <Upload size={15} />
                    {t("Chọn nhiều ảnh")}
                  </label>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
                    onClick={() => {
                      const gallery = block.gallery ?? [];
                      onUpdate({ gallery: [...gallery, { url: "" }] });
                    }}
                    disabled={disabled}
                  >
                    + {t("Thêm ô ảnh trống")}
                  </button>
                </div>

                {imageError && (
                  <p className="text-xs font-medium text-red-500">
                    {imageError}
                  </p>
                )}

                <div>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder={t("Nhập chú thích bộ ảnh")}
                    value={block.caption ?? ""}
                    disabled={disabled}
                    onChange={(e) => onUpdate({ caption: e.target.value })}
                  />
                </div>

                {/* Render gallery items */}
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {(block.gallery ?? []).map((item, itemIdx) => {
                    const itemUrl = typeof item === "string" ? item : item?.url;
                    return (
                      <div
                        key={itemIdx}
                        className="relative p-3 border border-slate-200 rounded-lg bg-slate-50 flex flex-col gap-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">
                            #{itemIdx + 1}
                          </span>
                          {!disabled && (
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-700"
                              onClick={() =>
                                clearGalleryItemImage(index, itemIdx, true)
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <label className="flex cursor-pointer items-center justify-center gap-1 rounded border border-slate-200 bg-white py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            disabled={disabled}
                            onChange={(e) =>
                              handleGalleryItemFile(
                                index,
                                itemIdx,
                                e.target.files?.[0] ?? null,
                              )
                            }
                          />
                          <Upload size={12} />
                          {t("Tải ảnh")}
                        </label>

                        {itemUrl && (
                          <div className="relative overflow-hidden rounded border border-slate-200 aspect-[4/3] bg-white">
                            <img
                              src={resolveBackendAssetUrl(itemUrl)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            {!disabled && (
                              <button
                                type="button"
                                className="absolute right-1 top-1 bg-black/70 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition duration-150"
                                onClick={() =>
                                  clearGalleryItemImage(index, itemIdx, false)
                                }
                                title={t("Xóa ảnh")}
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Video block */}
            {block.type === "video" && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder={t(
                      "Nhập URL video YouTube hoặc file video công khai",
                    )}
                    value={block.url ?? ""}
                    disabled={disabled}
                    onChange={(e) => onUpdate({ url: e.target.value })}
                  />
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder={t("Nhập chú thích video")}
                    value={block.caption ?? ""}
                    disabled={disabled}
                    onChange={(e) => onUpdate({ caption: e.target.value })}
                  />
                </div>

                {block.url && (
                  <div className="group relative overflow-hidden rounded-lg border border-slate-200 max-w-xl">
                    <ProductVideoPreview
                      url={block.url}
                      title={block.caption}
                    />
                    {!disabled && (
                      <button
                        type="button"
                        className="absolute right-2 top-2 inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-white/90 px-3 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-50"
                        onClick={() => onUpdate({ url: "" })}
                      >
                        <Trash2 size={13} className="mr-1" />
                        {t("Xóa video")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <BlockControls
        disabled={dragDisabled}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
        t={t}
      />
    </div>
  );
}
