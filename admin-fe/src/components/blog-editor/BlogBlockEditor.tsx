import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  ImagePlus,
  Images,
  LoaderCircle,
  Plus,
  Trash2,
  Type,
  Video,
} from "lucide-react";
import { RichTextEditor } from "../RichTextEditor";
import { ProductVideoPreview } from "../ProductVideoPreview";
import {
  createBlogBlock,
  isValidRemoteUrl,
} from "../../lib/blogContent";
import { resolveBackendAssetUrl } from "../../lib/backendApi";
import type {
  BlogContentBlock,
  BlogGalleryItem,
} from "../../types/blogContent";

type UploadedAsset = {
  url: string;
  fileName?: string;
};

type BlogBlockEditorProps = {
  blocks: BlogContentBlock[];
  onChange: (blocks: BlogContentBlock[]) => void;
  onUploadImage: (file: File) => Promise<UploadedAsset>;
  onDeleteImage: (url: string) => Promise<void>;
  readOnly?: boolean;
  emptyMessage?: string;
};

const blockLabelMap: Record<BlogContentBlock["type"], string> = {
  paragraph: "Mô tả",
  image: "Hình ảnh",
  gallery: "Nhiều hình ảnh",
  video: "Video",
};

const blockIconMap = {
  paragraph: Type,
  image: ImagePlus,
  gallery: Images,
  video: Video,
} satisfies Record<BlogContentBlock["type"], typeof Type>;

const emptyVideoError = "Vui lòng nhập URL video công khai hợp lệ.";

const updateBlockAt = (
  blocks: BlogContentBlock[],
  index: number,
  nextBlock: BlogContentBlock,
) => blocks.map((block, blockIndex) => (blockIndex === index ? nextBlock : block));

const removeBlockAt = (blocks: BlogContentBlock[], index: number) =>
  blocks.filter((_, blockIndex) => blockIndex !== index);

const moveBlock = (
  blocks: BlogContentBlock[],
  fromIndex: number,
  direction: -1 | 1,
) => {
  const toIndex = fromIndex + direction;
  if (toIndex < 0 || toIndex >= blocks.length) {
    return blocks;
  }

  const next = [...blocks];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

export const BlogBlockEditor = ({
  blocks,
  onChange,
  onUploadImage,
  onDeleteImage,
  readOnly = false,
  emptyMessage = "Chưa có block nội dung nào.",
}: BlogBlockEditorProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const addBlock = (type: BlogContentBlock["type"]) => {
    onChange([...blocks, createBlogBlock(type)]);
  };

  const replaceBlock = (index: number, nextBlock: BlogContentBlock) => {
    onChange(updateBlockAt(blocks, index, nextBlock));
  };

  const handleRemoveBlock = async (index: number) => {
    const block = blocks[index];
    if (!block || readOnly) return;

    setErrorMessage("");
    if (block.type === "image" || block.type === "video") {
      if (block.url.trim()) {
        await onDeleteImage(block.url);
      }
    } else if (block.type === "gallery") {
      await Promise.all(block.items.map((item) => onDeleteImage(item.url)));
    }

    onChange(removeBlockAt(blocks, index));
  };

  const handleReplaceImage = async (index: number, file: File | null) => {
    if (!file) return;
    const currentBlock = blocks[index];
    if (!currentBlock || currentBlock.type !== "image") return;

    setErrorMessage("");
    setIsUploading(true);
    try {
      const stored = await onUploadImage(file);
      if (currentBlock.url.trim()) {
        await onDeleteImage(currentBlock.url);
      }
      replaceBlock(index, {
        ...currentBlock,
        url: stored.url,
        caption: currentBlock.caption ?? "",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể tải ảnh nội dung.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddGalleryItems = async (
    index: number,
    files: FileList | null,
  ) => {
    if (!files || files.length === 0) return;
    const currentBlock = blocks[index];
    if (!currentBlock || currentBlock.type !== "gallery") return;

    setErrorMessage("");
    setIsUploading(true);
    try {
      const uploaded = await Promise.all(
        Array.from(files).map((file) => onUploadImage(file)),
      );
      replaceBlock(index, {
        ...currentBlock,
        items: [
          ...currentBlock.items,
          ...uploaded.map((item) => ({ url: item.url })),
        ],
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể tải ảnh thư viện.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveGalleryItem = async (
    blockIndex: number,
    itemIndex: number,
  ) => {
    const currentBlock = blocks[blockIndex];
    if (!currentBlock || currentBlock.type !== "gallery") return;

    const item = currentBlock.items[itemIndex];
    if (item?.url) {
      await onDeleteImage(item.url);
    }

    replaceBlock(blockIndex, {
      ...currentBlock,
      items: currentBlock.items.filter((_, currentIndex) => currentIndex !== itemIndex),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => addBlock("paragraph")}
          disabled={readOnly}
        >
          <Plus className="h-4 w-4" />
          + Mô tả
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => addBlock("image")}
          disabled={readOnly}
        >
          <ImagePlus className="h-4 w-4" />
          + Hình ảnh
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => addBlock("gallery")}
          disabled={readOnly}
        >
          <Images className="h-4 w-4" />
          + Nhiều hình ảnh
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => addBlock("video")}
          disabled={readOnly}
        >
          <Video className="h-4 w-4" />
          + Video
        </button>
      </div>

      {errorMessage ? (
        <p className="text-sm font-medium text-[var(--error-text)]">{errorMessage}</p>
      ) : null}

      {blocks.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          {emptyMessage}
        </div>
      ) : (
        blocks.map((block, index) => {
          const Icon = blockIconMap[block.type];

          return (
            <section
              key={`${block.type}-${index}`}
              className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_10px_22px_rgba(11,24,38,0.06)]"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[16px] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--accent-strong)]"
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {blockLabelMap[block.type]}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Block {index + 1}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[var(--muted)]" aria-hidden="true">
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <button
                    type="button"
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-[14px] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--ink)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => onChange(moveBlock(blocks, index, -1))}
                    disabled={readOnly || index === 0}
                    aria-label="Đưa block lên trên"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-[14px] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--ink)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => onChange(moveBlock(blocks, index, 1))}
                    disabled={readOnly || index === blocks.length - 1}
                    aria-label="Đưa block xuống dưới"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center gap-2 rounded-[14px] border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-600 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => void handleRemoveBlock(index)}
                    disabled={readOnly}
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa
                  </button>
                </div>
              </div>

              {block.type === "paragraph" ? (
                <RichTextEditor
                  ariaLabel="Trình soạn thảo nội dung blog"
                  value={block.text}
                  onChange={(value) =>
                    replaceBlock(index, {
                      ...block,
                      text: value,
                    })
                  }
                  placeholder="Nhập nội dung mô tả cho bài viết"
                  readOnly={readOnly}
                />
              ) : null}

              {block.type === "image" ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-[18px] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60">
                      {isUploading ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                      Tải hình ảnh
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={readOnly || isUploading}
                        onChange={(event) => {
                          void handleReplaceImage(index, event.target.files?.[0] ?? null);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <input
                      className="min-h-11 flex-1 rounded-[18px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--ink)]"
                      placeholder="Hoặc dán URL hình ảnh"
                      value={block.url}
                      readOnly={readOnly}
                      onChange={(event) =>
                        replaceBlock(index, { ...block, url: event.target.value })
                      }
                    />
                  </div>
                  <input
                    className="min-h-11 w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--ink)]"
                    placeholder="Nhập chú thích cho hình ảnh"
                    value={block.caption ?? ""}
                    readOnly={readOnly}
                    onChange={(event) =>
                      replaceBlock(index, { ...block, caption: event.target.value })
                    }
                  />
                  {block.url.trim() ? (
                    <div className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface-muted)]">
                      <img
                        src={resolveBackendAssetUrl(block.url)}
                        alt={block.caption?.trim() || "Xem trước hình ảnh"}
                        className="w-full object-cover"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {block.type === "gallery" ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-[18px] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60">
                      {isUploading ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Images className="h-4 w-4" />
                      )}
                      Thêm ảnh vào thư viện
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={readOnly || isUploading}
                        onChange={(event) => {
                          void handleAddGalleryItems(index, event.target.files);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <span className="text-xs text-[var(--muted)]">
                      {block.items.length} ảnh
                    </span>
                  </div>
                  <input
                    className="min-h-11 w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--ink)]"
                    placeholder="Nhập chú thích cho thư viện ảnh"
                    value={block.caption ?? ""}
                    readOnly={readOnly}
                    onChange={(event) =>
                      replaceBlock(index, { ...block, caption: event.target.value })
                    }
                  />
                  {block.items.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {block.items.map((item: BlogGalleryItem, itemIndex: number) => (
                        <div
                          key={`gallery-item-${itemIndex}`}
                          className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface-muted)]"
                        >
                          <img
                            src={resolveBackendAssetUrl(item.url)}
                            alt={`Ảnh thư viện ${itemIndex + 1}`}
                            className="aspect-[4/3] w-full object-cover"
                          />
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-xs text-[var(--muted)]">
                              Ảnh {itemIndex + 1}
                            </span>
                            <button
                              type="button"
                              className="text-xs font-semibold text-rose-600"
                              disabled={readOnly}
                              onClick={() => void handleRemoveGalleryItem(index, itemIndex)}
                            >
                              Xóa ảnh
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-6 text-sm text-[var(--muted)]">
                      Chưa có ảnh nào trong thư viện này.
                    </div>
                  )}
                </div>
              ) : null}

              {block.type === "video" ? (
                <div className="space-y-3">
                  <input
                    className="min-h-11 w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--ink)]"
                    placeholder="Nhập URL video công khai"
                    value={block.url}
                    readOnly={readOnly}
                    onChange={(event) => {
                      setErrorMessage("");
                      replaceBlock(index, { ...block, url: event.target.value });
                    }}
                    onBlur={() => {
                      if (block.url.trim() && !isValidRemoteUrl(block.url)) {
                        setErrorMessage(emptyVideoError);
                      }
                    }}
                  />
                  <input
                    className="min-h-11 w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--ink)]"
                    placeholder="Nhập chú thích cho video"
                    value={block.caption ?? ""}
                    readOnly={readOnly}
                    onChange={(event) =>
                      replaceBlock(index, { ...block, caption: event.target.value })
                    }
                  />
                  {block.url.trim() && isValidRemoteUrl(block.url) ? (
                    <div className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface-muted)]">
                      <ProductVideoPreview
                        url={block.url}
                        title={block.caption || "Video bài viết"}
                      />
                    </div>
                  ) : block.url.trim() ? (
                    <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      {emptyVideoError}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          );
        })
      )}
    </div>
  );
};
