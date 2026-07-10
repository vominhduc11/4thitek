import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { ProductVideoPreview } from "../../../../components/ProductVideoPreview";
import { FieldErrorMessage } from "../../../../components/ui-kit";
import { createVideoTemplate, isValidRemoteUrl } from "../constants";
import {
  mediaOverlayActionClass,
  subtleActionButtonClass,
  type NewProductDraft,
  type ProductVideoItem,
} from "../createProductModel";

type VideosTabProps = {
  t: (val: string) => string;
  newProduct: NewProductDraft;
  setNewProduct: Dispatch<SetStateAction<NewProductDraft>>;
  applyVideoTemplate: () => Promise<void>;
  videoUrlInputRefs: MutableRefObject<Record<number, HTMLInputElement | null>>;
  productVideoErrors: Record<number, string>;
  setProductVideoErrors: Dispatch<SetStateAction<Record<number, string>>>;
  validateProductVideoOnBlur: (index: number, video?: ProductVideoItem) => void;
  debouncedProductVideoUrls: Record<number, string>;
  moveVideoItem: (index: number, direction: -1 | 1) => void;
  removeVideoItem: (index: number) => void;
};

export function VideosTab({
  t,
  newProduct,
  setNewProduct,
  applyVideoTemplate,
  videoUrlInputRefs,
  productVideoErrors,
  setProductVideoErrors,
  validateProductVideoOnBlur,
  debouncedProductVideoUrls,
  moveVideoItem,
  removeVideoItem,
}: VideosTabProps) {
  return (
    <div
      id="product-tabpanel-videos"
      role="tabpanel"
      aria-labelledby="product-tab-videos"
      className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-[var(--surface-muted)] p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 text-sm text-slate-700">
        <div>
          <p className="font-semibold text-slate-900">{t("Video")}</p>
          <p className="max-w-2xl text-xs text-slate-500">
            {t(
              'Các video ở tab này hiển thị thành khu vực video riêng trên trang sản phẩm. Video chèn giữa nội dung dùng ở tab "Mô tả chi tiết".',
            )}
          </p>
        </div>
        <button
          type="button"
          className={subtleActionButtonClass}
          onClick={() => void applyVideoTemplate()}
        >
          {t("Dùng mẫu")}
        </button>
      </div>
      {newProduct.videos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
          <p className="font-semibold text-slate-700">
            {t("Chưa có video nào.")}
          </p>
          <button
            type="button"
            className={`mt-2 ${subtleActionButtonClass}`}
            onClick={() =>
              setNewProduct({
                ...newProduct,
                videos: createVideoTemplate(),
              })
            }
          >
            {t("Thêm video đầu tiên")}
          </button>
        </div>
      ) : (
        newProduct.videos.map((v, idx) => (
          <div
            key={idx}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3"
          >
            <label className="block">
              <span className="sr-only">{t("Tiêu đề video")}</span>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder={t("Nhập tiêu đề")}
                value={v.title}
                onChange={(e) => {
                  const copy = [...newProduct.videos];
                  copy[idx] = { ...copy[idx], title: e.target.value };
                  setNewProduct({ ...newProduct, videos: copy });
                }}
              />
            </label>
            <label className="block">
              <span className="sr-only">{t("URL video")}</span>
              <input
                id={`create-product-video-url-${idx}`}
                ref={(element) => {
                  videoUrlInputRefs.current[idx] = element;
                }}
                aria-describedby={
                  productVideoErrors[idx]
                    ? `create-product-video-url-${idx}-error`
                    : undefined
                }
                aria-invalid={Boolean(productVideoErrors[idx])}
                className={`w-full rounded-lg border px-3 py-2 text-sm ${productVideoErrors[idx] ? "border-rose-300" : "border-slate-200"}`}
                placeholder={t(
                  "Nhập URL video YouTube hoặc file video công khai",
                )}
                value={v.url}
                onChange={(e) => {
                  const copy = [...newProduct.videos];
                  copy[idx] = { ...copy[idx], url: e.target.value };
                  setNewProduct({ ...newProduct, videos: copy });
                  setProductVideoErrors((prev) => {
                    if (!(idx in prev)) return prev;
                    const next = { ...prev };
                    delete next[idx];
                    return next;
                  });
                }}
                onBlur={(e) =>
                  validateProductVideoOnBlur(idx, {
                    ...v,
                    url: e.target.value,
                  })
                }
              />
            </label>
            {productVideoErrors[idx] ? (
              <FieldErrorMessage
                className="text-xs"
                id={`create-product-video-url-${idx}-error`}
              >
                {productVideoErrors[idx]}
              </FieldErrorMessage>
            ) : null}
            <label className="block">
              <span className="sr-only">{t("Mô tả video")}</span>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder={t("Nhập mô tả")}
                rows={2}
                value={v.descriptions}
                onChange={(e) => {
                  const copy = [...newProduct.videos];
                  copy[idx] = {
                    ...copy[idx],
                    descriptions: e.target.value,
                  };
                  setNewProduct({ ...newProduct, videos: copy });
                }}
              />
            </label>
            {debouncedProductVideoUrls[idx] &&
            isValidRemoteUrl(debouncedProductVideoUrls[idx]) ? (
              <div className="group relative overflow-hidden rounded-lg border border-slate-200">
                <ProductVideoPreview
                  url={debouncedProductVideoUrls[idx]}
                  title={v.title}
                />
                <button
                  type="button"
                  className={mediaOverlayActionClass}
                  onClick={() => {
                    const copy = [...newProduct.videos];
                    copy[idx] = { ...copy[idx], url: "" };
                    setNewProduct({ ...newProduct, videos: copy });
                    setProductVideoErrors((prev) => {
                      if (!(idx in prev)) return prev;
                      const next = { ...prev };
                      delete next[idx];
                      return next;
                    });
                  }}
                >
                  {t("Xóa video")}
                </button>
              </div>
            ) : null}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={idx === 0}
                className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => moveVideoItem(idx, -1)}
              >
                {t("Lên")}
              </button>
              <button
                type="button"
                disabled={idx === newProduct.videos.length - 1}
                className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => moveVideoItem(idx, 1)}
              >
                {t("Xuống")}
              </button>
              <button
                type="button"
                className="min-h-11 px-3 py-2 text-xs font-semibold text-red-500"
                onClick={() => removeVideoItem(idx)}
              >
                {t("Xóa video")}
              </button>
            </div>
          </div>
        ))
      )}
      {newProduct.videos.length > 0 && (
        <button
          type="button"
          className={subtleActionButtonClass}
          onClick={() =>
            setNewProduct({
              ...newProduct,
              videos: [...newProduct.videos, ...createVideoTemplate()],
            })
          }
        >
          {t("+ Thêm video")}
        </button>
      )}
    </div>
  );
}

export default VideosTab;
