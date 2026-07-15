import type { Dispatch, SetStateAction } from "react";
import { BlockEditor } from "../../../../components/block-editor/BlockEditor";
import { DescriptionReadView } from "./DescriptionReadView";
import {
  type DescriptionItem,
  type DescriptionReadBlock,
  type ProductDraft,
} from "../detailProductModel";

type DescriptionSectionProps = {
  t: (val: string) => string;
  isEditing: boolean;
  draft: ProductDraft;
  setDraft: Dispatch<SetStateAction<ProductDraft | null>>;
  descriptionTypeOptions: Array<{ id: DescriptionItem["type"]; label: string }>;
  changeDescriptionType: (
    index: number,
    nextType: DescriptionItem["type"],
  ) => void;
  removeDescriptionItem: (index: number) => void;
  descriptionEditorModules: Record<string, unknown>;
  descriptionEditorFormats: string[];
  descriptionImageErrors: Record<number, string>;
  setDescriptionImageErrors: Dispatch<
    SetStateAction<Record<number, string>>
  >;
  handleDescriptionImageFile: (
    index: number,
    file: File | null,
  ) => void | Promise<void>;
  handleDescriptionGalleryFiles: (
    index: number,
    files: FileList | null,
  ) => void | Promise<void>;
  handleGalleryItemFile: (
    index: number,
    itemIndex: number,
    file: File | null,
  ) => void | Promise<void>;
  descriptionReadBlocks: DescriptionReadBlock[];
};

export function DescriptionSection({
  t,
  isEditing,
  draft,
  setDraft,
  descriptionEditorModules,
  descriptionEditorFormats,
  descriptionImageErrors,
  setDescriptionImageErrors,
  handleDescriptionImageFile,
  handleDescriptionGalleryFiles,
  handleGalleryItemFile,
  descriptionReadBlocks,
}: DescriptionSectionProps) {
  const clearDescriptionImage = (index: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const copy = [...prev.descriptions];
      copy[index] = { ...copy[index], url: "" };
      return { ...prev, descriptions: copy };
    });
    setDescriptionImageErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const clearGalleryItemImage = (
    index: number,
    itemIndex: number,
    removeItem = false,
  ) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const copy = [...prev.descriptions];
      const current = copy[index] ?? { type: "gallery" as const, gallery: [] };
      const nextGallery = [...(current.gallery ?? [])];
      if (removeItem) {
        nextGallery.splice(itemIndex, 1);
      } else {
        const existing = nextGallery[itemIndex];
        const existingItem =
          typeof existing === "string"
            ? { url: existing }
            : existing && typeof existing === "object"
              ? existing
              : { url: "" };
        nextGallery[itemIndex] = { ...existingItem, url: "" };
      }
      copy[index] = { ...current, gallery: nextGallery };
      return { ...prev, descriptions: copy };
    });
  };

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-5 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {t("Nội dung sản phẩm")}
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-900">
            {t("Mô tả chi tiết")}
          </h4>
        </div>
      </div>
      {isEditing ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-2 text-sm text-slate-700">
            <div>
              <p className="font-semibold text-slate-900">{t("Mô tả")}</p>
              <p className="text-xs text-slate-500">
                {t("Thêm các đoạn mô tả ngắn cho sản phẩm.")}
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-[var(--accent)] underline"
              onClick={() =>
                setDraft((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    descriptions: [
                      { type: "description", text: "" },
                      { type: "image", url: "", caption: "" },
                      { type: "gallery", gallery: [] },
                      { type: "video", url: "", caption: "" },
                    ],
                  };
                })
              }
            >
              {t("Dùng mẫu")}
            </button>
          </div>

          <BlockEditor
            value={draft.descriptions}
            onChange={(updated: any[]) =>
              setDraft((prev) => (prev ? { ...prev, descriptions: updated } : null))
            }
            disabled={!isEditing}
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
        </div>
      ) : (
        <DescriptionReadView
          descriptionReadBlocks={descriptionReadBlocks}
          t={t}
        />
      )}
    </div>
  );
}

export default DescriptionSection;
