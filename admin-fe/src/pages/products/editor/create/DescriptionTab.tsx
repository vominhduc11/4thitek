import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { GripVertical } from "lucide-react";
import { ProductVideoPreview } from "../../../../components/ProductVideoPreview";
import { RichTextEditor } from "../../../../components/RichTextEditor";
import { FieldErrorMessage } from "../../../../components/ui-kit";
import { resolveBackendAssetUrl } from "../../../../lib/backendApi";
import {
  isValidRemoteUrl,
  moveIndexedRecord,
  moveListItem,
} from "../constants";
import {
  mediaOverlayActionClass,
  subtleActionButtonClass,
  type DescriptionItem,
  type NewProductDraft,
} from "../createProductModel";

type DescriptionBlockOption = {
  id: DescriptionItem["type"];
  label: string;
  addLabel: string;
};

type DescriptionTabProps = {
  t: (val: string) => string;
  newProduct: NewProductDraft;
  setNewProduct: Dispatch<SetStateAction<NewProductDraft>>;
  applyDescriptionTemplate: () => Promise<void>;
  descriptionBlockOptions: DescriptionBlockOption[];
  appendDescriptionBlock: (type: DescriptionItem["type"]) => void;
  descriptionDragIndexRef: MutableRefObject<number | null>;
  descriptionImageErrors: Record<number, string>;
  setDescriptionImageErrors: Dispatch<SetStateAction<Record<number, string>>>;
  getDescriptionBlockLabel: (type: DescriptionItem["type"]) => string;
  moveDescriptionItem: (index: number, direction: -1 | 1) => void;
  removeDescriptionItem: (index: number) => void;
  descriptionEditorModules: Record<string, unknown>;
  descriptionEditorFormats: string[];
  isFormLocked: boolean;
  handleDescriptionImageFile: (index: number, file: File | null) => Promise<void>;
  clearDescriptionImage: (index: number) => void;
  handleDescriptionGalleryFiles: (
    index: number,
    files: FileList | null,
  ) => Promise<void>;
  handleGalleryItemFile: (
    index: number,
    itemIndex: number,
    file: File | null,
  ) => Promise<void>;
  clearGalleryItemImage: (
    index: number,
    itemIndex: number,
    removeItem?: boolean,
  ) => void;
  debouncedDescriptionVideoUrls: Record<number, string>;
};

export function DescriptionTab({
  t,
  newProduct,
  setNewProduct,
  applyDescriptionTemplate,
  descriptionBlockOptions,
  appendDescriptionBlock,
  descriptionDragIndexRef,
  descriptionImageErrors,
  setDescriptionImageErrors,
  getDescriptionBlockLabel,
  moveDescriptionItem,
  removeDescriptionItem,
  descriptionEditorModules,
  descriptionEditorFormats,
  isFormLocked,
  handleDescriptionImageFile,
  clearDescriptionImage,
  handleDescriptionGalleryFiles,
  handleGalleryItemFile,
  clearGalleryItemImage,
  debouncedDescriptionVideoUrls,
}: DescriptionTabProps) {
  return (
    <div
      id="product-tabpanel-description"
      role="tabpanel"
      aria-labelledby="product-tab-description"
      className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-[var(--surface-muted)] p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 text-sm text-slate-700">
        <div>
          <p className="font-semibold text-slate-900">
            {t("Mô tả chi tiết")}
          </p>
          <p className="max-w-2xl text-xs text-slate-500">
            {t(
              "Xây dựng phần mô tả chi tiết bằng các khối nội dung. Thứ tự các khối cũng là thứ tự hiển thị trên trang sản phẩm.",
            )}
          </p>
        </div>
        <button
          type="button"
          className={subtleActionButtonClass}
          onClick={() => void applyDescriptionTemplate()}
        >
          {t("Dùng mẫu")}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {descriptionBlockOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={subtleActionButtonClass}
            onClick={() => appendDescriptionBlock(option.id)}
          >
            {option.addLabel}
          </button>
        ))}
      </div>
      {newProduct.descriptions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
          <p className="font-semibold text-slate-700">
            {t("Chưa có khối nội dung nào.")}
          </p>
          <p className="mt-2">
            {t(
              "Chọn loại khối ở phía trên để thêm tiêu đề, đoạn mô tả, hình ảnh, bộ ảnh hoặc video vào trang chi tiết sản phẩm.",
            )}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {t(
              'Nút "Dùng mẫu" sẽ tạo sẵn một bố cục cơ bản để bạn chỉnh sửa nhanh hơn.',
            )}
          </p>
        </div>
      ) : (
        newProduct.descriptions.map((d, idx) => (
          <div
            key={idx}
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-3"
            draggable
            onDragStart={() => {
              descriptionDragIndexRef.current = idx;
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const fromIdx = descriptionDragIndexRef.current;
              if (fromIdx === null || fromIdx === idx) return;
              setNewProduct((prev) => ({
                ...prev,
                descriptions: moveListItem(
                  prev.descriptions,
                  fromIdx,
                  idx,
                ),
              }));
              setDescriptionImageErrors((prev) =>
                moveIndexedRecord(prev, fromIdx, idx),
              );
              descriptionDragIndexRef.current = null;
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="cursor-grab text-slate-300 active:cursor-grabbing"
                  aria-hidden="true"
                  title={t("Kéo để sắp xếp")}
                >
                  <GripVertical className="h-4 w-4" />
                </span>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t("Khối")} {idx + 1}
                  </p>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    {getDescriptionBlockLabel(d.type)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={idx === 0}
                  className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => moveDescriptionItem(idx, -1)}
                >
                  {t("Lên")}
                </button>
                <button
                  type="button"
                  disabled={idx === newProduct.descriptions.length - 1}
                  className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => moveDescriptionItem(idx, 1)}
                >
                  {t("Xuống")}
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-lg px-3 py-2 text-xs font-semibold text-red-500"
                  onClick={() => removeDescriptionItem(idx)}
                >
                  {t("Xóa")}
                </button>
              </div>
            </div>
            {d.type === "description" && (
              <div className="richtext-editor">
                <RichTextEditor
                  ariaLabel={t("Trình soạn thảo mô tả chi tiết")}
                  value={d.text ?? ""}
                  modules={descriptionEditorModules}
                  formats={descriptionEditorFormats}
                  placeholder={t("Nhập mô tả")}
                  readOnly={isFormLocked}
                  onChange={(value) => {
                    const copy = [...newProduct.descriptions];
                    copy[idx] = { ...copy[idx], text: value };
                    setNewProduct({
                      ...newProduct,
                      descriptions: copy,
                    });
                  }}
                />
              </div>
            )}
            {d.type === "image" && (
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <label
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  htmlFor={`create-product-description-image-${idx}`}
                >
                  <input
                    id={`create-product-description-image-${idx}`}
                    type="file"
                    accept="image/*"
                    aria-describedby={
                      descriptionImageErrors[idx]
                        ? `create-product-description-image-${idx}-error`
                        : undefined
                    }
                    aria-invalid={Boolean(descriptionImageErrors[idx])}
                    className="sr-only"
                    onChange={(e) =>
                      handleDescriptionImageFile(
                        idx,
                        e.target.files?.[0] ?? null,
                      )
                    }
                  />
                  {t("Chọn ảnh")}
                </label>
                <label className="block">
                  <span className="sr-only">
                    {t("Chú thích hình ảnh")}
                  </span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder={t("Nhập chú thích")}
                    value={d.caption ?? ""}
                    onChange={(e) => {
                      const copy = [...newProduct.descriptions];
                      copy[idx] = {
                        ...copy[idx],
                        caption: e.target.value,
                      };
                      setNewProduct({
                        ...newProduct,
                        descriptions: copy,
                      });
                    }}
                  />
                </label>
                {descriptionImageErrors[idx] ? (
                  <FieldErrorMessage
                    className="text-xs"
                    id={`create-product-description-image-${idx}-error`}
                  >
                    {descriptionImageErrors[idx]}
                  </FieldErrorMessage>
                ) : null}
                {d.url && (
                  <div className="group relative overflow-hidden rounded-lg border border-slate-200 sm:col-span-2">
                    <img
                      src={resolveBackendAssetUrl(d.url)}
                      alt={t("Xem trước")}
                      className="h-40 w-full object-cover"
                    />
                    <button
                      type="button"
                      className={mediaOverlayActionClass}
                      onClick={() => clearDescriptionImage(idx)}
                    >
                      {t("Xóa ảnh")}
                    </button>
                  </div>
                )}
              </div>
            )}
            {d.type === "gallery" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    htmlFor={`create-product-description-gallery-${idx}`}
                  >
                    <input
                      id={`create-product-description-gallery-${idx}`}
                      type="file"
                      accept="image/*"
                      multiple
                      aria-describedby={
                        descriptionImageErrors[idx]
                          ? `create-product-description-gallery-${idx}-error`
                          : undefined
                      }
                      aria-invalid={Boolean(
                        descriptionImageErrors[idx],
                      )}
                      className="sr-only"
                      onChange={(e) =>
                        handleDescriptionGalleryFiles(
                          idx,
                          e.target.files,
                        )
                      }
                    />
                    {t("Chọn nhiều ảnh")}
                  </label>
                  <button
                    type="button"
                    className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    onClick={() => {
                      const copy = [...newProduct.descriptions];
                      const current = { ...copy[idx] };
                      current.gallery = [
                        ...(current.gallery ?? []),
                        { url: "" },
                      ];
                      copy[idx] = current;
                      setNewProduct({
                        ...newProduct,
                        descriptions: copy,
                      });
                    }}
                  >
                    {t("Thêm hình ảnh")}
                  </button>
                </div>
                {descriptionImageErrors[idx] ? (
                  <FieldErrorMessage
                    className="text-xs"
                    id={`create-product-description-gallery-${idx}-error`}
                  >
                    {descriptionImageErrors[idx]}
                  </FieldErrorMessage>
                ) : null}
                <label className="text-sm text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {t("Chú thích bộ ảnh")}
                  </span>
                  <input
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder={t("Nhập chú thích bộ ảnh")}
                    value={d.caption ?? ""}
                    onChange={(e) => {
                      const copy = [...newProduct.descriptions];
                      copy[idx] = {
                        ...copy[idx],
                        caption: e.target.value,
                      };
                      setNewProduct({
                        ...newProduct,
                        descriptions: copy,
                      });
                    }}
                  />
                </label>
                {(d.gallery ?? []).length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    <p className="font-semibold text-slate-700">
                      {t("Chưa có hình ảnh nào.")}
                    </p>
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-[var(--accent)]"
                      onClick={() => {
                        const copy = [...newProduct.descriptions];
                        const current = { ...copy[idx] };
                        current.gallery = [
                          ...(current.gallery ?? []),
                          { url: "" },
                        ];
                        copy[idx] = current;
                        setNewProduct({
                          ...newProduct,
                          descriptions: copy,
                        });
                      }}
                    >
                      {t("Thêm hình ảnh đầu tiên")}
                    </button>
                  </div>
                )}
                {(d.gallery ?? []).map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <div className="grid gap-3 xl:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] xl:items-start">
                      <div className="space-y-2">
                        <label
                          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                          htmlFor={`create-product-description-gallery-${idx}-item-${itemIdx}`}
                        >
                          <input
                            id={`create-product-description-gallery-${idx}-item-${itemIdx}`}
                            type="file"
                            accept="image/*"
                            aria-describedby={
                              descriptionImageErrors[idx]
                                ? `create-product-description-gallery-${idx}-error`
                                : undefined
                            }
                            aria-invalid={Boolean(
                              descriptionImageErrors[idx],
                            )}
                            className="sr-only"
                            onChange={(e) =>
                              handleGalleryItemFile(
                                idx,
                                itemIdx,
                                e.target.files?.[0] ?? null,
                              )
                            }
                          />
                          {t("Chọn ảnh")}
                        </label>
                        {item.url && (
                          <div className="group relative overflow-hidden rounded-lg border border-slate-200">
                            <img
                              src={resolveBackendAssetUrl(item.url)}
                              alt={t("Xem trước")}
                              className="h-24 w-full object-cover"
                            />
                            <button
                              type="button"
                              className={mediaOverlayActionClass}
                              onClick={() =>
                                clearGalleryItemImage(idx, itemIdx)
                              }
                            >
                              {t("Xóa ảnh")}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-start justify-end">
                        <button
                          type="button"
                          className="text-xs text-red-500"
                          onClick={() =>
                            clearGalleryItemImage(idx, itemIdx, true)
                          }
                        >
                          {t("Xóa ảnh")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {d.type === "video" && (
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder={t(
                    "Nhập URL video YouTube hoặc file video công khai",
                  )}
                  value={d.url ?? ""}
                  onChange={(e) => {
                    const copy = [...newProduct.descriptions];
                    copy[idx] = { ...copy[idx], url: e.target.value };
                    setNewProduct({
                      ...newProduct,
                      descriptions: copy,
                    });
                  }}
                />
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder={t("Nhập chú thích")}
                  value={d.caption ?? ""}
                  onChange={(e) => {
                    const copy = [...newProduct.descriptions];
                    copy[idx] = {
                      ...copy[idx],
                      caption: e.target.value,
                    };
                    setNewProduct({
                      ...newProduct,
                      descriptions: copy,
                    });
                  }}
                />
                <p className="text-xs text-slate-500 md:col-span-2">
                  {t(
                    'Video này hiển thị xen kẽ trong mô tả chi tiết. Nếu muốn có khu vực video riêng cho sản phẩm, dùng tab "Video".',
                  )}
                </p>
                {debouncedDescriptionVideoUrls[idx] &&
                isValidRemoteUrl(debouncedDescriptionVideoUrls[idx]) ? (
                  <div className="group relative overflow-hidden rounded-lg border border-slate-200 sm:col-span-2">
                    <ProductVideoPreview
                      url={debouncedDescriptionVideoUrls[idx]}
                      title={d.caption}
                    />
                    <button
                      type="button"
                      className={mediaOverlayActionClass}
                      onClick={() => {
                        const copy = [...newProduct.descriptions];
                        copy[idx] = { ...copy[idx], url: "" };
                        setNewProduct({
                          ...newProduct,
                          descriptions: copy,
                        });
                      }}
                    >
                      {t("Xóa video")}
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))
      )}
      {newProduct.descriptions.length > 0 &&
        newProduct.descriptions.some((item) => {
          if (item.type === "description")
            return !(item.text ?? "").trim();
          if (item.type === "image" || item.type === "video")
            return !(item.url ?? "").trim();
          if (item.type === "gallery")
            return (item.gallery ?? []).every((g) => !g.url.trim());
          return false;
        }) && (
          <p className="text-xs italic text-slate-400">
            {t("Các khối trống sẽ bị bỏ qua khi lưu.")}
          </p>
        )}
      {newProduct.descriptions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {descriptionBlockOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={subtleActionButtonClass}
              onClick={() => appendDescriptionBlock(option.id)}
            >
              {option.addLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DescriptionTab;
