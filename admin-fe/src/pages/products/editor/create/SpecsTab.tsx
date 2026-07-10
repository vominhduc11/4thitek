import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { GripVertical } from "lucide-react";
import {
  moveListItem,
  suggestedSpecificationLabels,
} from "../constants";
import {
  subtleActionButtonClass,
  type NewProductDraft,
} from "../createProductModel";

type SpecsTabProps = {
  t: (val: string) => string;
  newProduct: NewProductDraft;
  setNewProduct: Dispatch<SetStateAction<NewProductDraft>>;
  specDragIndexRef: MutableRefObject<number | null>;
  applySuggestedSpecificationLabel: (label: string) => void;
  applySpecificationTemplate: () => Promise<void>;
  moveSpecificationItem: (index: number, direction: -1 | 1) => void;
};

export function SpecsTab({
  t,
  newProduct,
  setNewProduct,
  specDragIndexRef,
  applySuggestedSpecificationLabel,
  applySpecificationTemplate,
  moveSpecificationItem,
}: SpecsTabProps) {
  return (
    <div
      id="product-tabpanel-specs"
      role="tabpanel"
      aria-labelledby="product-tab-specs"
      className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-[var(--surface-muted)] p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 text-sm text-slate-700">
        <div>
          <p className="font-semibold text-slate-900">
            {t("Thông số")}
          </p>
          <p className="text-xs text-slate-500">
            {t("Thêm các thông số kỹ thuật quan trọng.")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedSpecificationLabels.map((label) => (
              <button
                key={label}
                type="button"
                className="min-h-11 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                onClick={() => applySuggestedSpecificationLabel(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className={subtleActionButtonClass}
          onClick={() => void applySpecificationTemplate()}
        >
          {t("Dùng mẫu")}
        </button>
      </div>
      {newProduct.specifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
          <p className="font-semibold text-slate-700">
            {t("Chưa có thông số nào.")}
          </p>
          <button
            type="button"
            className={`mt-2 ${subtleActionButtonClass}`}
            onClick={() =>
              setNewProduct({
                ...newProduct,
                specifications: [{ label: "", value: "" }],
              })
            }
          >
            {t("Thêm thông số đầu tiên")}
          </button>
        </div>
      ) : (
        newProduct.specifications.map((s, idx) => (
          <div
            key={idx}
            className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center"
            draggable
            onDragStart={() => {
              specDragIndexRef.current = idx;
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const fromIdx = specDragIndexRef.current;
              if (fromIdx === null || fromIdx === idx) return;
              setNewProduct((prev) => ({
                ...prev,
                specifications: moveListItem(
                  prev.specifications,
                  fromIdx,
                  idx,
                ),
              }));
              specDragIndexRef.current = null;
            }}
          >
            <span
              className="hidden cursor-grab self-center text-slate-300 active:cursor-grabbing lg:flex"
              aria-hidden="true"
              title={t("Kéo để sắp xếp")}
            >
              <GripVertical className="h-4 w-4" />
            </span>
            <label className="block">
              <span className="sr-only">{t("Nhãn thông số")}</span>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder={t("Nhập nhãn")}
                value={s.label}
                onChange={(e) => {
                  const copy = [...newProduct.specifications];
                  copy[idx] = { ...copy[idx], label: e.target.value };
                  setNewProduct({
                    ...newProduct,
                    specifications: copy,
                  });
                }}
              />
            </label>
            <label className="block">
              <span className="sr-only">{t("Giá trị thông số")}</span>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder={t("Nhập giá trị")}
                value={s.value}
                onChange={(e) => {
                  const copy = [...newProduct.specifications];
                  copy[idx] = { ...copy[idx], value: e.target.value };
                  setNewProduct({
                    ...newProduct,
                    specifications: copy,
                  });
                }}
              />
            </label>
            <div className="grid grid-cols-3 gap-2 sm:col-span-2 lg:col-span-1 lg:flex lg:items-center lg:justify-end lg:justify-self-end">
              <button
                type="button"
                disabled={idx === 0}
                className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
                onClick={() => moveSpecificationItem(idx, -1)}
              >
                {t("Lên")}
              </button>
              <button
                type="button"
                disabled={idx === newProduct.specifications.length - 1}
                className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
                onClick={() => moveSpecificationItem(idx, 1)}
              >
                {t("Xuống")}
              </button>
              <button
                type="button"
                className="min-h-11 w-full px-3 py-2 text-xs font-semibold text-red-500 lg:w-auto"
                onClick={() => {
                  const copy = newProduct.specifications.filter(
                    (_, i) => i !== idx,
                  );
                  setNewProduct({
                    ...newProduct,
                    specifications: copy,
                  });
                }}
              >
                {t("Xóa")}
              </button>
            </div>
          </div>
        ))
      )}
      {newProduct.specifications.length > 0 && (
        <button
          type="button"
          className={subtleActionButtonClass}
          onClick={() =>
            setNewProduct({
              ...newProduct,
              specifications: [
                ...newProduct.specifications,
                { label: "", value: "" },
              ],
            })
          }
        >
          {t("+ Thêm thông số")}
        </button>
      )}
    </div>
  );
}

export default SpecsTab;
