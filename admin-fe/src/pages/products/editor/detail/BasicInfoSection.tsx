import type {
  ChangeEvent,
  Dispatch,
  FormEvent,
  MutableRefObject,
  SetStateAction,
} from "react";
import { FieldErrorMessage } from "../../../../components/ui-kit";
import type { Product } from "../../../../types/product";
import { formatNumberInput, toDigitsOnly } from "../constants";
import type { ProductDraft } from "../detailProductModel";

type BasicInfoSectionProps = {
  t: (val: string) => string;
  isEditing: boolean;
  draft: ProductDraft;
  setDraft: Dispatch<SetStateAction<ProductDraft | null>>;
  draftErrors: Record<string, string>;
  retailPriceInputRef: MutableRefObject<HTMLInputElement | null>;
  handleRetailPriceChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSave: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  handleMainImageFile: (file: File | null) => void | Promise<void>;
  setMainImagePreviewUrl: Dispatch<SetStateAction<string>>;
  shortDescription: string;
};

export function BasicInfoSection({
  t,
  isEditing,
  draft,
  setDraft,
  draftErrors,
  retailPriceInputRef,
  handleRetailPriceChange,
  handleSave,
  handleMainImageFile,
  setMainImagePreviewUrl,
  shortDescription,
}: BasicInfoSectionProps) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {t("Thông tin cơ bản")}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {t("Tên sản phẩm, xuất bản, giá bán, bảo hành và mô tả ngắn.")}
        </p>
      </div>
      {isEditing ? (
        <form id="product-edit-form" className="space-y-5" onSubmit={handleSave}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t("Tên sản phẩm")}
              </label>
              <input
                aria-describedby={
                  draftErrors.name ? "product-detail-name-error" : undefined
                }
                aria-invalid={Boolean(draftErrors.name)}
                className={`mt-2 w-full rounded-2xl border bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 ${
                  draftErrors.name ? "border-rose-300" : "border-slate-200"
                }`}
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
              {draftErrors.name ? (
                <FieldErrorMessage id="product-detail-name-error">
                  {draftErrors.name}
                </FieldErrorMessage>
              ) : null}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t("Giá bán lẻ")}
              </label>
              <div className="relative">
                <input
                  ref={retailPriceInputRef}
                  aria-describedby={
                    draftErrors.retailPrice
                      ? "product-detail-price-error"
                      : undefined
                  }
                  aria-invalid={Boolean(draftErrors.retailPrice)}
                  className={`mt-2 w-full rounded-2xl border bg-slate-50 px-3 py-2 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 ${
                    draftErrors.retailPrice
                      ? "border-rose-300"
                      : "border-slate-200"
                  }`}
                  type="text"
                  inputMode="numeric"
                  value={formatNumberInput(toDigitsOnly(draft.retailPrice))}
                  onChange={handleRetailPriceChange}
                  placeholder="0"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  VND
                </span>
              </div>
              {draftErrors.retailPrice ? (
                <FieldErrorMessage id="product-detail-price-error">
                  {draftErrors.retailPrice}
                </FieldErrorMessage>
              ) : null}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t("Thời hạn bảo hành (tháng)")}
              </label>
              <input
                aria-describedby={
                  draftErrors.warrantyPeriod
                    ? "product-detail-warranty-error"
                    : undefined
                }
                aria-invalid={Boolean(draftErrors.warrantyPeriod)}
                className={`mt-2 w-full rounded-2xl border bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 ${
                  draftErrors.warrantyPeriod
                    ? "border-rose-300"
                    : "border-slate-200"
                }`}
                type="number"
                min="1"
                step="1"
                value={draft.warrantyPeriod}
                onChange={(event) =>
                  setDraft({ ...draft, warrantyPeriod: event.target.value })
                }
              />
              {draftErrors.warrantyPeriod ? (
                <FieldErrorMessage id="product-detail-warranty-error">
                  {draftErrors.warrantyPeriod}
                </FieldErrorMessage>
              ) : null}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t("Xuất bản")}
              </label>
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
                value={draft.publishStatus}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    publishStatus: event.target
                      .value as Product["publishStatus"],
                  })
                }
              >
                <option value="PUBLISHED">{t("Đã xuất bản")}</option>
                <option value="DRAFT">{t("Bản nháp")}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t("Ảnh sản phẩm")}
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) =>
                      handleMainImageFile(event.target.files?.[0] ?? null)
                    }
                  />
                  {t("Tải ảnh")}
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {t("Hoặc nhập URL thủ công")}
              </p>
              <input
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
                value={draft.image}
                onChange={(event) => {
                  setMainImagePreviewUrl("");
                  setDraft({ ...draft, image: event.target.value });
                }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {t("Mô tả ngắn")}
            </label>
            <textarea
              className="mt-2 min-h-[110px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
              maxLength={500}
              value={draft.shortDescription}
              onChange={(event) =>
                setDraft({ ...draft, shortDescription: event.target.value })
              }
            />
            <p className="mt-0.5 text-right text-xs text-slate-400">
              {draft.shortDescription.length}/500
            </p>
          </div>
        </form>
      ) : (
        <>
          <h4 className="text-sm font-semibold text-slate-900">
            {t("Mô tả ngắn")}
          </h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 whitespace-pre-line sm:text-[15px]">
            {shortDescription || t("Chưa có mô tả nào.")}
          </p>
        </>
      )}
    </div>
  );
}

export default BasicInfoSection;
