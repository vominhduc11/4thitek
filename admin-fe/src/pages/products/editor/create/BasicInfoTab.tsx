import type { ChangeEvent, Dispatch, MutableRefObject, SetStateAction } from "react";
import { FieldErrorMessage } from "../../../../components/ui-kit";
import { formatNumberInput, toDigitsOnly } from "../constants";
import type { CreateProductErrorField, NewProductDraft } from "../createProductModel";

import { ImageUrlInput } from "../../../../components/media/ImageUrlInput";

type BasicInfoTabProps = {
  t: (val: string) => string;
  newProduct: NewProductDraft;
  setNewProduct: Dispatch<SetStateAction<NewProductDraft>>;
  errors: Record<string, string>;
  validateCreateFieldOnBlur: (
    field: Exclude<CreateProductErrorField, "videos">,
    draft?: NewProductDraft,
  ) => void;
  nameInputRef: MutableRefObject<HTMLInputElement | null>;
  warrantyInputRef: MutableRefObject<HTMLInputElement | null>;
  skuInputRef: MutableRefObject<HTMLInputElement | null>;
  retailPriceInputRef: MutableRefObject<HTMLInputElement | null>;
  imageInputRef: MutableRefObject<HTMLInputElement | null>;
  handleRetailPriceChange: (e: ChangeEvent<HTMLInputElement>) => void;
  hasZeroRetailPrice: boolean;
  imageError: string;
  handleImageChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  selectedImageName: string;
  imagePreviewUrl: string;
  handleClearImage: () => void;
};

export function BasicInfoTab({
  t,
  newProduct,
  setNewProduct,
  errors,
  validateCreateFieldOnBlur,
  nameInputRef,
  warrantyInputRef,
  skuInputRef,
  retailPriceInputRef,
  handleRetailPriceChange,
  hasZeroRetailPrice,
  imageError,
}: BasicInfoTabProps) {
  return (
    <div
      id="product-tabpanel-basic"
      role="tabpanel"
      aria-labelledby="product-tab-basic"
      className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            {t("Thông tin cơ bản")}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label
              className="text-sm text-slate-700"
              htmlFor="create-product-name"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t("Tên sản phẩm")}{" "}
                <span className="text-rose-500">*</span>
              </span>
              <input
                id="create-product-name"
                ref={nameInputRef}
                aria-describedby={
                  errors.name ? "create-product-name-error" : undefined
                }
                aria-invalid={Boolean(errors.name)}
                className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm ${errors.name ? "border-rose-300" : "border-slate-200"}`}
                placeholder={t("Nhập tên sản phẩm")}
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                onBlur={(e) =>
                  validateCreateFieldOnBlur("name", {
                    ...newProduct,
                    name: e.target.value,
                  })
                }
              />
              {errors.name ? (
                <FieldErrorMessage
                  className="mt-1 text-xs"
                  id="create-product-name-error"
                >
                  {errors.name}
                </FieldErrorMessage>
              ) : null}
            </label>
            <label
              className="text-sm text-slate-700"
              htmlFor="create-product-warranty-period"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t("Thời hạn bảo hành (tháng)")}
              </span>
              <input
                id="create-product-warranty-period"
                ref={warrantyInputRef}
                type="text"
                aria-describedby={
                  errors.warrantyPeriod
                    ? "create-product-warranty-period-error"
                    : undefined
                }
                aria-invalid={Boolean(errors.warrantyPeriod)}
                inputMode="numeric"
                autoComplete="off"
                placeholder="12"
                className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm ${errors.warrantyPeriod ? "border-rose-300" : "border-slate-200"}`}
                value={newProduct.warrantyPeriod}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    warrantyPeriod: toDigitsOnly(e.target.value),
                  })
                }
                onBlur={(e) =>
                  validateCreateFieldOnBlur("warrantyPeriod", {
                    ...newProduct,
                    warrantyPeriod: toDigitsOnly(e.target.value),
                  })
                }
              />
              <p className="mt-1 text-xs text-slate-500">
                {t("Mặc định là 12 tháng nếu bạn không thay đổi.")}
              </p>
              {errors.warrantyPeriod ? (
                <FieldErrorMessage
                  className="mt-1 text-xs"
                  id="create-product-warranty-period-error"
                >
                  {errors.warrantyPeriod}
                </FieldErrorMessage>
              ) : null}
            </label>
            <label
              className="text-sm text-slate-700"
              htmlFor="create-product-sku"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                SKU *
              </span>
              <input
                id="create-product-sku"
                ref={skuInputRef}
                aria-describedby={
                  errors.sku ? "create-product-sku-error" : undefined
                }
                aria-invalid={Boolean(errors.sku)}
                className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm ${errors.sku ? "border-rose-300" : "border-slate-200"}`}
                placeholder={t("Nhập SKU")}
                value={newProduct.sku}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, sku: e.target.value })
                }
                onBlur={(e) =>
                  validateCreateFieldOnBlur("sku", {
                    ...newProduct,
                    sku: e.target.value,
                  })
                }
              />
              <p className="mt-1 text-xs text-slate-500">
                {t(
                  "Gợi ý: dùng chữ in hoa, số và dấu gạch ngang để dễ tìm kiếm.",
                )}
              </p>
              {errors.sku ? (
                <FieldErrorMessage
                  className="mt-1 text-xs"
                  id="create-product-sku-error"
                >
                  {errors.sku}
                </FieldErrorMessage>
              ) : null}
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t("Mô tả ngắn")}
              </span>
              <textarea
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder={t("Nhập mô tả ngắn")}
                rows={3}
                maxLength={500}
                value={newProduct.shortDescription}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    shortDescription: e.target.value,
                  })
                }
              />
              <p className="mt-0.5 text-right text-xs text-slate-400">
                {newProduct.shortDescription.length}/500
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {t(
                  'Đoạn này dùng cho phần tóm tắt ngắn. Nội dung đầy đủ được xây dựng ở tab "Mô tả chi tiết".',
                )}
              </p>
            </label>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            {t("Hiển thị")}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {t(
              "Thiết lập hiển thị này chỉ điều khiển dữ liệu cho Hero trang chủ và danh sách sản phẩm trang chủ, không tạo thêm section riêng.",
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <label className="inline-flex max-w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
              <span className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newProduct.isFeatured}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      isFeatured: e.target.checked,
                    })
                  }
                />
                <span className="font-semibold">
                  {t("Hiển thị ở Hero trang chủ")}
                </span>
              </span>
              <span className="pl-6 text-xs leading-5 text-slate-500">
                {t(
                  "Chỉ dùng để chọn sản phẩm cho khu vực Hero đầu trang chủ. Main-fe hiện dùng featuredProducts[0] cho HeroSection.",
                )}
              </span>
            </label>
            <label className="inline-flex max-w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
              <span className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newProduct.showOnHomepage}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      showOnHomepage: e.target.checked,
                    })
                  }
                />
                <span className="font-semibold">
                  {t("Hiển thị trong danh sách sản phẩm trang chủ")}
                </span>
              </span>
              <span className="pl-6 text-xs leading-5 text-slate-500">
                {t(
                  "Dùng để hiển thị sản phẩm trong section danh sách sản phẩm ở trang chủ. Main-fe hiện dùng homepageProducts cho ProductSeries.",
                )}
              </span>
            </label>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            {t("Giá & trạng thái")}
          </p>
          <div className="mt-4 grid gap-3">
            <label
              className="text-sm text-slate-700"
              htmlFor="create-product-retail-price"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t("Giá bán lẻ")}{" "}
                <span className="text-rose-500">*</span>
              </span>
              <div className="relative mt-2">
                <input
                  id="create-product-retail-price"
                  ref={retailPriceInputRef}
                  type="text"
                  aria-describedby={
                    errors.retailPrice
                      ? "create-product-retail-price-error"
                      : undefined
                  }
                  aria-invalid={Boolean(errors.retailPrice)}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={t("Nhập giá bán lẻ")}
                  className={`w-full rounded-xl border px-3 py-2 pr-12 text-sm ${errors.retailPrice ? "border-rose-300" : "border-slate-200"}`}
                  value={formatNumberInput(newProduct.retailPrice)}
                  onChange={handleRetailPriceChange}
                  onBlur={(e) =>
                    validateCreateFieldOnBlur("retailPrice", {
                      ...newProduct,
                      retailPrice: toDigitsOnly(e.target.value),
                    })
                  }
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                  VND
                </span>
              </div>
              {hasZeroRetailPrice ? (
                <p className="mt-1 text-xs text-amber-600">
                  {t(
                    "Giá 0 VND vẫn được phép, nhưng hệ thống sẽ hỏi xác nhận khi tạo.",
                  )}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  {t("Nhập giá bán lẻ thực tế của sản phẩm.")}
                </p>
              )}
              {errors.retailPrice ? (
                <FieldErrorMessage
                  className="mt-1 text-xs"
                  id="create-product-retail-price-error"
                >
                  {errors.retailPrice}
                </FieldErrorMessage>
              ) : null}
            </label>
            <label className="text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t("Trạng thái xuất bản")}
              </span>
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={newProduct.publishStatus}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    publishStatus: e.target.value as
                      | "DRAFT"
                      | "PUBLISHED",
                  })
                }
              >
                <option value="DRAFT">{t("Bản nháp")}</option>
                <option value="PUBLISHED">{t("Đã xuất bản")}</option>
              </select>
            </label>
          </div>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-[var(--surface-muted)] p-4">
          <p className="text-sm font-semibold text-slate-900 mb-3">
            {t("Ảnh sản phẩm")}
          </p>
          <ImageUrlInput
            value={newProduct.imageUrl}
            onChange={(url) => {
              setNewProduct((prev) => ({ ...prev, imageUrl: url }));
            }}
            error={imageError}
            category="product"
          />
        </div>
      </div>
    </div>
  );
}

export default BasicInfoTab;
