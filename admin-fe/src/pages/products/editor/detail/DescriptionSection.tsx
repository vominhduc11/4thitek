import { useState, type Dispatch, type SetStateAction } from "react";
import { ProductVideoPreview } from "../../../../components/ProductVideoPreview";
import { RichTextEditor } from "../../../../components/RichTextEditor";
import { resolveBackendAssetUrl } from "../../../../lib/backendApi";
import { DescriptionReadView } from "./DescriptionReadView";
import { MediaPickerModal } from "../../../../components/media/MediaPickerModal";
import {
  isLocalBlobUrl,
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
  descriptionTypeOptions,
  changeDescriptionType,
  removeDescriptionItem,
  descriptionEditorModules,
  descriptionEditorFormats,
  descriptionImageErrors,
  setDescriptionImageErrors,
  descriptionReadBlocks,
}: DescriptionSectionProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerConfig, setPickerConfig] = useState<{
    type: "image" | "gallery" | "gallery-item";
    index: number;
    itemIndex?: number;
  } | null>(null);

  const handleSelectMedia = (url: string) => {
    if (!pickerConfig) return;
    const { type, index, itemIndex } = pickerConfig;
    const copy = [...draft.descriptions];

    if (type === "image") {
      copy[index] = { ...copy[index], url };
    } else if (type === "gallery-item" && itemIndex !== undefined) {
      const current = { ...copy[index] };
      const gallery = [...(current.gallery ?? [])];
      const existingEntry = gallery[itemIndex];
      const normalizedEntry =
        typeof existingEntry === "string" || !existingEntry
          ? {}
          : existingEntry;
      gallery[itemIndex] = { ...normalizedEntry, url };
      current.gallery = gallery;
      copy[index] = current;
    }

    setDraft({ ...draft, descriptions: copy });
    setPickerOpen(false);
    setPickerConfig(null);
  };

  const handleSelectMultipleMedia = (urls: string[]) => {
    if (!pickerConfig) return;
    const { type, index } = pickerConfig;
    const copy = [...draft.descriptions];

    if (type === "gallery") {
      const current = { ...copy[index] };
      const newItems = urls.map((url) => ({ url }));
      current.gallery = [...(current.gallery ?? []), ...newItems];
      copy[index] = current;
    }

    setDraft({ ...draft, descriptions: copy });
    setPickerOpen(false);
    setPickerConfig(null);
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
                setDraft({
                  ...draft,
                  descriptions: [
                    { type: "description", text: "" },
                    { type: "image", url: "", caption: "" },
                    { type: "gallery", gallery: [] },
                    { type: "video", url: "", caption: "" },
                  ],
                })
              }
            >
              {t("Dùng mẫu")}
            </button>
          </div>
          {draft.descriptions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              <p className="font-semibold text-slate-700">
                {t("Chưa có mô tả nào.")}
              </p>
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-[var(--accent)]"
                onClick={() =>
                  setDraft({
                    ...draft,
                    descriptions: [{ type: "description", text: "" }],
                  })
                }
              >
                {t("Thêm mô tả đầu tiên")}
              </button>
            </div>
          ) : (
            draft.descriptions.map((item, index) => (
              <div
                key={`description-item-${index}`}
                className="space-y-3 rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 text-[11px]">
                    {descriptionTypeOptions.map((option) => {
                      const isActive = item.type === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={
                            isActive
                              ? "rounded-full bg-[var(--accent)] px-2 py-1 font-semibold text-white shadow-sm"
                              : "rounded-full px-2 py-1 font-semibold text-slate-600 hover:text-slate-900"
                          }
                          onClick={() =>
                            changeDescriptionType(index, option.id)
                          }
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="text-xs text-red-500"
                    onClick={() => removeDescriptionItem(index)}
                  >
                    {t("Xóa")}
                  </button>
                </div>
                {item.type === "title" && (
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold"
                    placeholder={t("Nhập tiêu đề")}
                    value={item.text ?? ""}
                    onChange={(event) => {
                      const nextDescriptions = [...draft.descriptions];
                      nextDescriptions[index] = {
                        ...nextDescriptions[index],
                        text: event.target.value,
                      };
                      setDraft({ ...draft, descriptions: nextDescriptions });
                    }}
                  />
                )}
                {item.type === "description" && (
                  <div className="richtext-editor">
                    <RichTextEditor
                      ariaLabel={t("Trình soạn thảo mô tả chi tiết")}
                      value={item.text ?? ""}
                      modules={descriptionEditorModules}
                      formats={descriptionEditorFormats}
                      placeholder={t("Nhập mô tả")}
                      onChange={(value) => {
                        const nextDescriptions = [...draft.descriptions];
                        nextDescriptions[index] = {
                          ...nextDescriptions[index],
                          text: value,
                        };
                        setDraft({
                          ...draft,
                          descriptions: nextDescriptions,
                        });
                      }}
                    />
                  </div>
                )}
                {item.type === "image" && (
                  <div className="grid gap-2 md:grid-cols-[1.4fr_1fr]">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      onClick={() => {
                        setPickerConfig({ type: "image", index: index });
                        setPickerOpen(true);
                      }}
                    >
                      {t("Chọn ảnh")}
                    </button>
                    <label className="block">
                      <span className="sr-only">
                        {t("Chú thích hình ảnh")}
                      </span>
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder={t("Nhập chú thích")}
                        value={item.caption ?? ""}
                        onChange={(event) => {
                          const nextDescriptions = [...draft.descriptions];
                          nextDescriptions[index] = {
                            ...nextDescriptions[index],
                            caption: event.target.value,
                          };
                          setDraft({
                            ...draft,
                            descriptions: nextDescriptions,
                          });
                        }}
                      />
                    </label>
                    {descriptionImageErrors[index] && (
                      <p className="text-xs text-rose-500">
                        {descriptionImageErrors[index]}
                      </p>
                    )}
                    {item.url &&
                      (isLocalBlobUrl(item.url) ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 md:col-span-2">
                          <p className="font-semibold">
                            {t("Đã chọn tệp ảnh cục bộ.")}
                          </p>
                          <p className="mt-1 text-[11px] text-amber-600">
                            {t("Xem trước sẽ hiển thị sau khi lưu.")}
                          </p>
                          <button
                            type="button"
                            className="mt-2 inline-flex text-[11px] font-semibold text-rose-600"
                            onClick={() => {
                              const nextDescriptions = [
                                ...draft.descriptions,
                              ];
                              nextDescriptions[index] = {
                                ...nextDescriptions[index],
                                url: "",
                              };
                              setDraft({
                                ...draft,
                                descriptions: nextDescriptions,
                              });
                              setDescriptionImageErrors((prev) => {
                                const next = { ...prev };
                                delete next[index];
                                return next;
                              });
                            }}
                          >
                            {t("Xóa ảnh")}
                          </button>
                        </div>
                      ) : (
                        <div className="group relative overflow-hidden rounded-lg border border-slate-200 md:col-span-2">
                          <img
                            src={resolveBackendAssetUrl(item.url)}
                            alt={t("Xem trước")}
                            className="h-40 w-full object-cover"
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-2 inline-flex min-h-11 items-center rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                            onClick={() => {
                              const nextDescriptions = [
                                ...draft.descriptions,
                              ];
                              nextDescriptions[index] = {
                                ...nextDescriptions[index],
                                url: "",
                              };
                              setDraft({
                                ...draft,
                                descriptions: nextDescriptions,
                              });
                              setDescriptionImageErrors((prev) => {
                                const next = { ...prev };
                                delete next[index];
                                return next;
                              });
                            }}
                          >
                            {t("Xóa ảnh")}
                          </button>
                        </div>
                      ))}
                  </div>
                )}
                {item.type === "gallery" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        onClick={() => {
                          setPickerConfig({ type: "gallery", index: index });
                          setPickerOpen(true);
                        }}
                      >
                        {t("Chọn nhiều ảnh")}
                      </button>
                      <button
                        type="button"
                        className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        onClick={() => {
                          const nextDescriptions = [...draft.descriptions];
                          const current = { ...nextDescriptions[index] };
                          const nextGallery = [
                            ...(current.gallery ?? []),
                            { url: "" },
                          ];
                          current.gallery = nextGallery;
                          nextDescriptions[index] = current;
                          setDraft({
                            ...draft,
                            descriptions: nextDescriptions,
                          });
                        }}
                      >
                        {t("Thêm hình ảnh")}
                      </button>
                    </div>
                    {descriptionImageErrors[index] && (
                      <p className="text-xs text-rose-500">
                        {descriptionImageErrors[index]}
                      </p>
                    )}
                    <label className="text-sm text-slate-700">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {t("Chú thích bộ ảnh")}
                      </span>
                      <input
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder={t("Nhập chú thích bộ ảnh")}
                        value={item.caption ?? ""}
                        onChange={(event) => {
                          const nextDescriptions = [...draft.descriptions];
                          nextDescriptions[index] = {
                            ...nextDescriptions[index],
                            caption: event.target.value,
                          };
                          setDraft({
                            ...draft,
                            descriptions: nextDescriptions,
                          });
                        }}
                      />
                    </label>
                    {(item.gallery ?? []).length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                        <p className="font-semibold text-slate-700">
                          {t("Chưa có hình ảnh nào.")}
                        </p>
                        <button
                          type="button"
                          className="mt-2 text-xs font-semibold text-[var(--accent)]"
                          onClick={() => {
                            const nextDescriptions = [...draft.descriptions];
                            const current = { ...nextDescriptions[index] };
                            const nextGallery = [
                              ...(current.gallery ?? []),
                              { url: "" },
                            ];
                            current.gallery = nextGallery;
                            nextDescriptions[index] = current;
                            setDraft({
                              ...draft,
                              descriptions: nextDescriptions,
                            });
                          }}
                        >
                          {t("Thêm hình ảnh đầu tiên")}
                        </button>
                      </div>
                    ) : (
                      (item.gallery ?? []).map((entry, entryIndex) => (
                        <div
                          key={entryIndex}
                          className="rounded-lg border border-slate-200 bg-white p-3"
                        >
                          <div className="grid gap-3 xl:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] xl:items-start">
                            <div className="space-y-2">
                              <button
                                type="button"
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                onClick={() => {
                                  setPickerConfig({
                                    type: "gallery-item",
                                    index: index,
                                    itemIndex: entryIndex,
                                  });
                                  setPickerOpen(true);
                                }}
                              >
                                {t("Chọn ảnh")}
                              </button>
                              {entry &&
                                typeof entry !== "string" &&
                                entry.url &&
                                (isLocalBlobUrl(entry.url) ? (
                                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                                    <p className="font-semibold">
                                      {t("Đã chọn tệp ảnh cục bộ.")}
                                    </p>
                                    <button
                                      type="button"
                                      className="mt-2 inline-flex text-[11px] font-semibold text-rose-600"
                                      onClick={() => {
                                        const nextDescriptions = [
                                          ...draft.descriptions,
                                        ];
                                        const current = {
                                          ...nextDescriptions[index],
                                        };
                                        const nextGallery = [
                                          ...(current.gallery ?? []),
                                        ];
                                        const currentEntry =
                                          typeof nextGallery[entryIndex] ===
                                          "string"
                                            ? { url: "" }
                                            : {
                                                ...(nextGallery[
                                                  entryIndex
                                                ] as { url?: string }),
                                              };
                                        nextGallery[entryIndex] = {
                                          ...currentEntry,
                                          url: "",
                                        };
                                        current.gallery = nextGallery;
                                        nextDescriptions[index] = current;
                                        setDraft({
                                          ...draft,
                                          descriptions: nextDescriptions,
                                        });
                                      }}
                                    >
                                      {t("Xóa ảnh")}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="group relative overflow-hidden rounded-lg border border-slate-200">
                                    <img
                                      src={resolveBackendAssetUrl(entry.url)}
                                      alt={t("Xem trước")}
                                      className="h-24 w-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      className="absolute right-2 top-2 inline-flex min-h-11 items-center rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                                      onClick={() => {
                                        const nextDescriptions = [
                                          ...draft.descriptions,
                                        ];
                                        const current = {
                                          ...nextDescriptions[index],
                                        };
                                        const nextGallery = [
                                          ...(current.gallery ?? []),
                                        ];
                                        const currentEntry =
                                          typeof nextGallery[entryIndex] ===
                                          "string"
                                            ? { url: "" }
                                            : {
                                                ...(nextGallery[
                                                  entryIndex
                                                ] as { url?: string }),
                                              };
                                        nextGallery[entryIndex] = {
                                          ...currentEntry,
                                          url: "",
                                        };
                                        current.gallery = nextGallery;
                                        nextDescriptions[index] = current;
                                        setDraft({
                                          ...draft,
                                          descriptions: nextDescriptions,
                                        });
                                      }}
                                    >
                                      {t("Xóa ảnh")}
                                    </button>
                                  </div>
                                ))}
                            </div>
                            <div className="flex items-start justify-end">
                              <button
                                type="button"
                                className="text-xs text-red-500"
                                onClick={() => {
                                  const nextDescriptions = [
                                    ...draft.descriptions,
                                  ];
                                  const current = {
                                    ...nextDescriptions[index],
                                  };
                                  const nextGallery = (
                                    current.gallery ?? []
                                  ).filter((_, i) => i !== entryIndex);
                                  current.gallery = nextGallery;
                                  nextDescriptions[index] = current;
                                  setDraft({
                                    ...draft,
                                    descriptions: nextDescriptions,
                                  });
                                }}
                              >
                                {t("Xóa ảnh")}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {item.type === "video" && (
                  <div className="grid gap-2 md:grid-cols-[1.4fr_1fr]">
                    <label className="block">
                      <span className="sr-only">{t("URL video")}</span>
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder={t(
                          "Nhập URL video YouTube hoặc file video công khai",
                        )}
                        value={item.url ?? ""}
                        onChange={(event) => {
                          const nextDescriptions = [...draft.descriptions];
                          nextDescriptions[index] = {
                            ...nextDescriptions[index],
                            url: event.target.value,
                          };
                          setDraft({
                            ...draft,
                            descriptions: nextDescriptions,
                          });
                        }}
                      />
                    </label>
                    <label className="block">
                      <span className="sr-only">{t("Chú thích video")}</span>
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder={t("Nhập chú thích")}
                        value={item.caption ?? ""}
                        onChange={(event) => {
                          const nextDescriptions = [...draft.descriptions];
                          nextDescriptions[index] = {
                            ...nextDescriptions[index],
                            caption: event.target.value,
                          };
                          setDraft({
                            ...draft,
                            descriptions: nextDescriptions,
                          });
                        }}
                      />
                    </label>
                    {item.url && (
                      <div className="group relative overflow-hidden rounded-lg border border-slate-200 md:col-span-2">
                        <ProductVideoPreview
                          url={item.url}
                          title={item.caption ?? item.text}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-2 inline-flex min-h-11 items-center rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                          onClick={() => {
                            const nextDescriptions = [...draft.descriptions];
                            nextDescriptions[index] = {
                              ...nextDescriptions[index],
                              url: "",
                            };
                            setDraft({
                              ...draft,
                              descriptions: nextDescriptions,
                            });
                          }}
                        >
                          {t("Xóa video")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          {draft.descriptions.length > 0 && (
            <button
              type="button"
              className="text-xs text-[var(--accent)]"
              onClick={() =>
                setDraft({
                  ...draft,
                  descriptions: [
                    ...draft.descriptions,
                    { type: "description", text: "" },
                  ],
                })
              }
            >
              {t("Thêm mục mô tả")}
            </button>
          )}
        </div>
      ) : (
        <DescriptionReadView
          descriptionReadBlocks={descriptionReadBlocks}
          t={t}
        />
      )}
      {pickerOpen && (
        <MediaPickerModal
          isOpen={pickerOpen}
          category="product"
          multiSelect={pickerConfig?.type === "gallery"}
          onSelect={handleSelectMedia}
          onSelectMultiple={handleSelectMultipleMedia}
          onClose={() => {
            setPickerOpen(false);
            setPickerConfig(null);
          }}
        />
      )}
    </div>
  );
}

export default DescriptionSection;
