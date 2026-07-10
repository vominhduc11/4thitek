import { resolveBackendAssetUrl } from "../../../../lib/backendApi";
import {
  getGalleryReadLayoutClass,
  isLocalBlobUrl,
  normalizeProseParagraphs,
  type DescriptionItem,
  type DescriptionReadBlock,
} from "../detailProductModel";

type DescriptionReadViewProps = {
  descriptionReadBlocks: DescriptionReadBlock[];
  t: (val: string) => string;
};

export function DescriptionReadView({
  descriptionReadBlocks,
  t,
}: DescriptionReadViewProps) {
  const renderDescriptionProseItem = (item: DescriptionItem, index: number) => {
    if (item.type === "title") {
      return (
        <h4
          key={`desc-title-${index}`}
          className="text-[15px] font-semibold leading-6 tracking-tight text-slate-900 sm:text-[17px]"
        >
          {item.text || ""}
        </h4>
      );
    }

    const paragraphs = normalizeProseParagraphs(item.text ?? "");
    return (
      <div key={`desc-text-${index}`} className="space-y-2">
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph, paragraphIndex) => (
            <p
              key={`desc-text-${index}-${paragraphIndex}`}
              className="text-sm leading-6 text-slate-600 sm:text-[15px] sm:leading-[1.7]"
            >
              {paragraph}
            </p>
          ))
        ) : (
          <p className="text-sm leading-6 text-slate-600 sm:text-[15px] sm:leading-[1.7]">
            {t("Chưa có mô tả nào.")}
          </p>
        )}
      </div>
    );
  };

  const renderDescriptionMediaItem = (item: DescriptionItem, index: number) => {
    if (item.type === "image") {
      const imageUrl = item.url || (item as { imageUrl?: string }).imageUrl;
      const isLocal = isLocalBlobUrl(imageUrl);
      return (
        <div
          key={`desc-image-${index}`}
          className="mx-auto max-w-4xl space-y-3"
        >
          {imageUrl ? (
            isLocal ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                <p className="font-semibold">{t("Đã chọn tệp ảnh cục bộ.")}</p>
                <p className="mt-1 text-[11px] text-amber-600">
                  {t("Xem trước sẽ hiển thị sau khi lưu.")}
                </p>
              </div>
            ) : (
              <img
                src={resolveBackendAssetUrl(imageUrl)}
                alt={item.caption || t("Xem trước")}
                width="800"
                height="448"
                loading="lazy"
                className="h-56 w-full rounded-[1.35rem] border border-slate-200 object-cover shadow-[0_12px_32px_rgba(15,23,42,0.08)] sm:h-64"
              />
            )
          ) : (
            <p className="text-sm text-slate-500">{t("Ảnh URL")}: -</p>
          )}
          {item.caption ? (
            <p className="px-1 text-xs font-medium leading-6 text-slate-500">
              {item.caption}
            </p>
          ) : null}
        </div>
      );
    }

    if (item.type === "gallery") {
      const galleryItems =
        item.gallery?.map((entry) =>
          typeof entry === "string" ? { url: entry } : entry,
        ) ?? [];
      const galleryLayoutClass = getGalleryReadLayoutClass(galleryItems.length);
      return (
        <div
          key={`desc-gallery-${index}`}
          className="mx-auto max-w-5xl space-y-3"
        >
          {galleryItems.length === 0 ? (
            <p className="text-sm text-slate-500">
              {t("Chưa có hình ảnh nào.")}
            </p>
          ) : (
            <div className={galleryLayoutClass}>
              {galleryItems.map((entry, galleryIndex) =>
                isLocalBlobUrl(entry.url) ? (
                  <div
                    key={`desc-gallery-${index}-${galleryIndex}`}
                    className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700"
                  >
                    <p className="font-semibold">
                      {t("Đã chọn tệp ảnh cục bộ.")}
                    </p>
                    <p className="mt-1 text-[11px] text-amber-600">
                      {t("Xem trước sẽ hiển thị sau khi lưu.")}
                    </p>
                  </div>
                ) : (
                  <img
                    key={`desc-gallery-${index}-${galleryIndex}`}
                    src={resolveBackendAssetUrl(entry.url)}
                    alt={item.caption || t("Xem trước")}
                    className={
                      galleryItems.length === 1
                        ? "h-56 w-full rounded-[1.35rem] border border-slate-200 object-cover shadow-[0_12px_32px_rgba(15,23,42,0.08)] sm:h-64"
                        : "h-40 w-full rounded-[1.2rem] border border-slate-200 object-cover shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                    }
                  />
                ),
              )}
            </div>
          )}
          {item.caption ? (
            <p className="px-1 text-xs font-medium leading-6 text-slate-500">
              {item.caption}
            </p>
          ) : null}
        </div>
      );
    }

    if (item.type === "video") {
      const videoUrl = item.url || (item as { videoUrl?: string }).videoUrl;
      const isLocal = isLocalBlobUrl(videoUrl);
      return (
        <div
          key={`desc-video-${index}`}
          className="mx-auto max-w-4xl space-y-3"
        >
          {videoUrl ? (
            isLocal ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                <p className="font-semibold">
                  {t("Đã chọn tệp video cục bộ.")}
                </p>
                <p className="mt-1 text-[11px] text-amber-600">
                  {t("Xem trước sẽ hiển thị sau khi lưu.")}
                </p>
              </div>
            ) : (
              <video
                src={videoUrl}
                controls
                preload="metadata"
                className="h-56 w-full rounded-[1.35rem] border border-slate-200 bg-slate-950 object-cover shadow-[0_12px_32px_rgba(15,23,42,0.08)] sm:h-64"
              />
            )
          ) : (
            <p className="text-sm text-slate-500">{t("URL video")}: -</p>
          )}
          {item.caption ? (
            <p className="px-1 text-xs font-medium leading-6 text-slate-500">
              {item.caption}
            </p>
          ) : null}
        </div>
      );
    }

    return null;
  };

  if (descriptionReadBlocks.length === 0) {
    return (
      <p className="mt-3 text-sm text-slate-500">{t("Chưa có mô tả nào.")}</p>
    );
  }

  return (
    <div className="mt-4 space-y-2.5">
      {descriptionReadBlocks.map((block, blockIndex) => (
        <div
          key={`description-block-${block.type}-${blockIndex}`}
          className={
            block.type === "prose"
              ? "rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] px-4 py-2.5 sm:px-5 sm:py-3"
              : "rounded-3xl border border-slate-200/90 bg-[var(--surface-muted)] p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] sm:p-4"
          }
        >
          {block.type === "prose" ? (
            <div className="max-w-3xl space-y-2">
              {block.items.map((item, itemIndex) =>
                renderDescriptionProseItem(item, itemIndex),
              )}
            </div>
          ) : (
            renderDescriptionMediaItem(block.item, block.index)
          )}
        </div>
      ))}
    </div>
  );
}

export default DescriptionReadView;
