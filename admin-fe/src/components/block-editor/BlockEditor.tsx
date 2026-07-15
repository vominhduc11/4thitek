import { useState, useRef } from "react";
import { SortableList } from "./SortableList";
import { BlockCard } from "./BlockCard";
import { createDescriptionBlock } from "../../pages/products/editor/constants";
import { Plus } from "lucide-react";

interface DescriptionItem {
  type: "title" | "description" | "image" | "gallery" | "video";
  text?: string;
  url?: string;
  caption?: string;
  gallery?: Array<{ url: string } | string>;
  key?: string;
}

interface BlockEditorProps {
  value: any[];
  onChange: (value: any[]) => void;
  disabled?: boolean;
  t: (key: string) => string;

  // Media upload handlers
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

export function BlockEditor({
  value = [],
  onChange,
  disabled = false,
  t,
  descriptionImageErrors,
  handleDescriptionImageFile,
  handleDescriptionGalleryFiles,
  handleGalleryItemFile,
  clearDescriptionImage,
  clearGalleryItemImage,
  descriptionEditorModules,
  descriptionEditorFormats,
}: BlockEditorProps) {
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(() => new Set());
  
  // Stable key generator using WeakMap to keep items tracked nicely without polluting parent state
  const keysWeakMapRef = useRef<WeakMap<object, string>>(new WeakMap());

  const getStableKey = (item: DescriptionItem): string => {
    if (item.key) return item.key;
    let key = keysWeakMapRef.current.get(item);
    if (!key) {
      key = Math.random().toString(36).substring(2, 9) + Date.now();
      keysWeakMapRef.current.set(item, key);
    }
    return key;
  };

  const toggleCollapsed = (key: string) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const addBlock = (type: DescriptionItem["type"]) => {
    const newBlock = {
      ...createDescriptionBlock(type),
      key: Math.random().toString(36).substring(2, 9) + Date.now(),
    };
    onChange([...value, newBlock]);
  };

  const updateBlock = (index: number, patch: Partial<DescriptionItem>) => {
    const updated = value.map((b, i) => {
      if (i === index) {
        // preserve key
        const key = getStableKey(b);
        return { ...b, ...patch, key };
      }
      return b;
    });
    onChange(updated);
  };

  const removeBlock = (index: number) => {
    const nextDescriptions = value.filter((_, i) => i !== index);
    onChange(nextDescriptions);
  };

  const duplicateBlock = (index: number) => {
    const original = value[index];
    const copy = {
      ...original,
      key: Math.random().toString(36).substring(2, 9) + Date.now(),
    };
    const next = [...value];
    next.splice(index + 1, 0, copy);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          <p className="font-semibold text-slate-700">
            {t("Chưa có khối nội dung nào.")}
          </p>
          <p className="mt-2 text-xs">
            {t("Chọn loại khối ở phía dưới để thêm tiêu đề, đoạn mô tả, hình ảnh, bộ ảnh hoặc video.")}
          </p>
        </div>
      ) : (
        <SortableList
          items={value}
          getId={(b) => getStableKey(b)}
          onReorder={(next) => onChange(next)}
          disabled={disabled}
          className="flex flex-col gap-3"
          t={t}
          renderItem={(block, sortable, index) => {
            const blockKey = getStableKey(block);
            return (
              <BlockCard
                key={blockKey}
                index={index}
                sortable={sortable}
                block={block}
                disabled={disabled}
                collapsed={collapsedKeys.has(blockKey)}
                onToggleCollapse={() => toggleCollapsed(blockKey)}
                onUpdate={(patch) => updateBlock(index, patch)}
                onRemove={() => removeBlock(index)}
                onDuplicate={() => duplicateBlock(index)}
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
            );
          }}
        />
      )}

      {/* Add block buttons bar */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer"
          onClick={() => addBlock("description")}
          disabled={disabled}
        >
          <Plus size={14} />
          {t("Thêm Mô tả")}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer"
          onClick={() => addBlock("title")}
          disabled={disabled}
        >
          <Plus size={14} />
          {t("Thêm Tiêu đề")}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer"
          onClick={() => addBlock("image")}
          disabled={disabled}
        >
          <Plus size={14} />
          {t("Thêm Hình ảnh")}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer"
          onClick={() => addBlock("gallery")}
          disabled={disabled}
        >
          <Plus size={14} />
          {t("Thêm Bộ ảnh")}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer"
          onClick={() => addBlock("video")}
          disabled={disabled}
        >
          <Plus size={14} />
          {t("Thêm Video")}
        </button>
      </div>
    </div>
  );
}
export default BlockEditor;
