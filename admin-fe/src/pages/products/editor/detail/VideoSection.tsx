import type { Dispatch, SetStateAction } from "react";
import { ProductVideoPreview } from "../../../../components/ProductVideoPreview";
import { isLocalBlobUrl, type ProductDraft, type VideoDraftItem } from "../detailProductModel";

type VideoSectionProps = {
  t: (val: string) => string;
  isEditing: boolean;
  draft: ProductDraft;
  setDraft: Dispatch<SetStateAction<ProductDraft | null>>;
  setProductVideoErrors: Dispatch<SetStateAction<Record<number, string>>>;
  videoItems: VideoDraftItem[];
  hasSingleVideo: boolean;
};

export function VideoSection({
  t,
  isEditing,
  draft,
  setDraft,
  setProductVideoErrors,
  videoItems,
  hasSingleVideo,
}: VideoSectionProps) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-5 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {t("Video")}
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-900">
            {t("Video giới thiệu và hướng dẫn")}
          </h4>
        </div>
      </div>
      {isEditing ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-2 text-sm text-slate-700">
            <div>
              <p className="font-semibold text-slate-900">{t("Video")}</p>
              <p className="text-xs text-slate-500">
                {t("Thêm video giới thiệu hoặc hướng dẫn sản phẩm.")}
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-[var(--accent)] underline"
              onClick={() =>
                setDraft({
                  ...draft,
                  videos: [
                    {
                      title: "",
                      description: "",
                      url: "",
                    },
                  ],
                })
              }
            >
              {t("Dùng mẫu")}
            </button>
          </div>
          {draft.videos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              <p className="font-semibold text-slate-700">
                {t("Chưa có video nào.")}
              </p>
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-[var(--accent)]"
                onClick={() =>
                  setDraft({
                    ...draft,
                    videos: [{ title: "", description: "", url: "" }],
                  })
                }
              >
                {t("Thêm video đầu tiên")}
              </button>
            </div>
          ) : (
            draft.videos.map((video, index) => (
              <div
                key={`video-${index}`}
                className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3"
              >
                <label className="block">
                  <span className="sr-only">{t("URL video")}</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder={t(
                      "Nhập URL video YouTube hoặc file video công khai",
                    )}
                    value={video.url}
                    onChange={(event) => {
                      const nextVideos = [...draft.videos];
                      nextVideos[index] = {
                        ...nextVideos[index],
                        url: event.target.value,
                      };
                      setDraft({ ...draft, videos: nextVideos });
                    }}
                  />
                </label>
                {video.url && (
                  <div className="group relative overflow-hidden rounded-lg border border-slate-200">
                    <ProductVideoPreview
                      url={video.url}
                      title={video.title}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2 inline-flex min-h-11 items-center rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                      onClick={() => {
                        const nextVideos = [...draft.videos];
                        nextVideos[index] = { ...nextVideos[index], url: "" };
                        setDraft({ ...draft, videos: nextVideos });
                      }}
                    >
                      {t("Xóa video")}
                    </button>
                  </div>
                )}
                <label className="block">
                  <span className="sr-only">{t("Tiêu đề video")}</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder={t("Nhập tiêu đề")}
                    value={video.title}
                    onChange={(event) => {
                      const nextVideos = [...draft.videos];
                      nextVideos[index] = {
                        ...nextVideos[index],
                        title: event.target.value,
                      };
                      setDraft({ ...draft, videos: nextVideos });
                    }}
                  />
                </label>
                <label className="block">
                  <span className="sr-only">{t("Mô tả video")}</span>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder={t("Nhập mô tả")}
                    rows={2}
                    value={video.description}
                    onChange={(event) => {
                      const nextVideos = [...draft.videos];
                      nextVideos[index] = {
                        ...nextVideos[index],
                        description: event.target.value,
                      };
                      setDraft({ ...draft, videos: nextVideos });
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="self-end text-xs text-red-500"
                  onClick={() => {
                    const nextVideos = draft.videos.filter(
                      (_, idx) => idx !== index,
                    );
                    setDraft({ ...draft, videos: nextVideos });
                    setProductVideoErrors((prev) => {
                      const next: Record<number, string> = {};
                      Object.entries(prev).forEach(([key, value]) => {
                        const idx = Number(key);
                        if (Number.isNaN(idx)) return;
                        if (idx < index) {
                          next[idx] = value;
                        } else if (idx > index) {
                          next[idx - 1] = value;
                        }
                      });
                      return next;
                    });
                  }}
                >
                  {t("Xóa video")}
                </button>
              </div>
            ))
          )}
          {draft.videos.length > 0 && (
            <button
              type="button"
              className="text-xs text-[var(--accent)]"
              onClick={() =>
                setDraft({
                  ...draft,
                  videos: [
                    ...draft.videos,
                    { title: "", description: "", url: "" },
                  ],
                })
              }
            >
              {t("+ Thêm video")}
            </button>
          )}
        </div>
      ) : (
        <>
          {videoItems.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              {t("Chưa có video nào.")}
            </p>
          ) : (
            <div
              className={
                hasSingleVideo
                  ? "mt-4 mx-auto max-w-3xl"
                  : "mt-4 grid gap-4 lg:grid-cols-2"
              }
            >
              {videoItems.map((video, index) => (
                <div
                  key={`video-${index}`}
                  className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {video.title || t("Video")}
                  </p>
                  {video.url ? (
                    isLocalBlobUrl(video.url) ? (
                      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                        <p className="font-semibold">
                          {t("Đã chọn tệp video cục bộ.")}
                        </p>
                        <p className="mt-1 text-[11px] text-amber-600">
                          {t("Xem trước sẽ hiển thị sau khi lưu.")}
                        </p>
                      </div>
                    ) : (
                      <video
                        src={video.url}
                        controls
                        preload="metadata"
                        className="mt-3 h-48 w-full rounded-xl border border-slate-200 bg-slate-950 object-cover"
                      />
                    )
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      {t("URL video")}: -
                    </p>
                  )}
                  {video.description && (
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 whitespace-pre-line">
                      {video.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default VideoSection;
