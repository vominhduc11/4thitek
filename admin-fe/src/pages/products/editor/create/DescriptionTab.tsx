import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { BlockEditor } from "../../../../components/block-editor/BlockEditor";
import {
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
  descriptionImageErrors,
  descriptionEditorModules,
  descriptionEditorFormats,
  isFormLocked,
  handleDescriptionImageFile,
  clearDescriptionImage,
  handleDescriptionGalleryFiles,
  handleGalleryItemFile,
  clearGalleryItemImage,
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

      <BlockEditor
        value={newProduct.descriptions}
        onChange={(updated: any[]) =>
          setNewProduct((prev) => ({ ...prev, descriptions: updated }))
        }
        disabled={isFormLocked}
        t={t}
        descriptionImageErrors={descriptionImageErrors}
        handleDescriptionImageFile={handleDescriptionImageFile}
        handleDescriptionGalleryFiles={handleDescriptionGalleryFiles}
        handleGalleryItemFile={handleGalleryItemFile}
        clearDescriptionImage={clearDescriptionImage}
        clearGalleryItemImage={clearGalleryItemImage}
        descriptionEditorModules={descriptionEditorModules}
        descriptionEditorFormats={descriptionEditorFormats}
      />

      {newProduct.descriptions.length > 0 &&
        newProduct.descriptions.some((item) => {
          if (item.type === "description")
            return !(item.text ?? "").trim();
          if (item.type === "image" || item.type === "video")
            return !(item.url ?? "").trim();
          if (item.type === "gallery") {
            const galleryArr = item.gallery ?? [];
            return galleryArr.every((g) => {
              const url = typeof g === "string" ? g : g?.url;
              return !url?.trim();
            });
          }
          return false;
        }) && (
          <p className="text-xs italic text-slate-400">
            {t("Các khối trống sẽ bị bỏ qua khi lưu.")}
          </p>
        )}
    </div>
  );
}

export default DescriptionTab;
