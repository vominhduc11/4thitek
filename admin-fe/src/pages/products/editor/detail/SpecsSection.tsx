import type { Dispatch, SetStateAction } from "react";
import type { ProductDraft, SpecificationItem } from "../detailProductModel";

type SpecsSectionProps = {
  t: (val: string) => string;
  isEditing: boolean;
  draft: ProductDraft;
  setDraft: Dispatch<SetStateAction<ProductDraft | null>>;
  specificationItems: SpecificationItem[];
};

export function SpecsSection({
  t,
  isEditing,
  draft,
  setDraft,
  specificationItems,
}: SpecsSectionProps) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-5 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {t("Thông số")}
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-900">
            {t("Cấu hình và thông số kỹ thuật")}
          </h4>
        </div>
      </div>
      {isEditing ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
          {draft.specifications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              <p className="font-semibold text-slate-700">
                {t("Chưa có thông số nào.")}
              </p>
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-[var(--accent)]"
                onClick={() =>
                  setDraft({
                    ...draft,
                    specifications: [{ label: "", value: "" }],
                  })
                }
              >
                {t("Thêm thông số đầu tiên")}
              </button>
            </div>
          ) : (
            draft.specifications.map((spec, index) => (
              <div
                key={`spec-${index}`}
                className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-center"
              >
                <label className="block">
                  <span className="sr-only">{t("Nhãn thông số")}</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder={t("Nhãn")}
                    value={spec.label}
                    onChange={(event) => {
                      const next = [...draft.specifications];
                      next[index] = {
                        ...next[index],
                        label: event.target.value,
                      };
                      setDraft({ ...draft, specifications: next });
                    }}
                  />
                </label>
                <label className="block">
                  <span className="sr-only">{t("Giá trị thông số")}</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder={t("Giá trị")}
                    value={spec.value}
                    onChange={(event) => {
                      const next = [...draft.specifications];
                      next[index] = {
                        ...next[index],
                        value: event.target.value,
                      };
                      setDraft({ ...draft, specifications: next });
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="justify-self-end text-xs text-red-500 md:justify-self-auto"
                  onClick={() => {
                    const next = draft.specifications.filter(
                      (_, idx) => idx !== index,
                    );
                    setDraft({ ...draft, specifications: next });
                  }}
                >
                  {t("Xóa")}
                </button>
              </div>
            ))
          )}
          {draft.specifications.length > 0 && (
            <button
              type="button"
              className="text-xs text-[var(--accent)]"
              onClick={() =>
                setDraft({
                  ...draft,
                  specifications: [
                    ...draft.specifications,
                    { label: "", value: "" },
                  ],
                })
              }
            >
              {t("+ Thêm thông số")}
            </button>
          )}
        </div>
      ) : (
        <>
          {specificationItems.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              {t("Chưa có thông số nào.")}
            </p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {specificationItems.map((spec, index) => (
                <div
                  key={`spec-${spec.label}-${index}`}
                  className="grid gap-1.5 rounded-2xl border border-slate-200 bg-[var(--surface-muted)] px-4 py-3 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-start sm:gap-4"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {spec.label || t("Nhãn")}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-slate-900 whitespace-pre-line break-words">
                    {spec.value || "-"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SpecsSection;
