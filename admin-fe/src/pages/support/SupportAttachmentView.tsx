import { useEffect, useState } from "react";
import { FileText, PlayCircle, X } from "lucide-react";
import {
  inferSupportAttachmentMediaType,
  isPrivateSupportAttachmentUrl,
  type NormalizedSupportAttachment,
} from "../../lib/supportAttachment";

export type SupportAttachmentViewProps = {
  attachment: NormalizedSupportAttachment;
  t: (value: string) => string;
  accessToken?: string | null;
  removable?: boolean;
  onRemove?: () => void;
};

const formatBytes = (value?: number | null) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  if (value < 1024) {
    return `${value} B`;
  }
  const kb = value / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

export function SupportAttachmentView({
  attachment,
  t,
  accessToken,
  removable = false,
  onRemove,
}: SupportAttachmentViewProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [resolvedAssetUrl, setResolvedAssetUrl] = useState<string>("");
  const [resolutionFailed, setResolutionFailed] = useState(false);
  const mediaType = inferSupportAttachmentMediaType(attachment);
  const isImage = mediaType === "image" && !imageFailed;
  const isVideo = mediaType === "video";
  const fileLabel = attachment.fileName || t("Tệp đính kèm");
  const resolvedUrl =
    attachment.resolvedAccessUrl ||
    attachment.accessUrl ||
    attachment.resolvedUrl ||
    attachment.url;
  const isPrivateAttachment =
    !attachment.accessUrl &&
    !attachment.resolvedAccessUrl &&
    isPrivateSupportAttachmentUrl(attachment.resolvedUrl || attachment.url);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    setImageFailed(false);
    setResolutionFailed(false);

    if (!resolvedUrl) {
      setResolvedAssetUrl("");
      return undefined;
    }

    if (!isPrivateAttachment) {
      setResolvedAssetUrl(resolvedUrl);
      return undefined;
    }

    if (isVideo) {
      setResolutionFailed(true);
      setResolvedAssetUrl("");
      return undefined;
    }

    if (!accessToken) {
      setResolvedAssetUrl("");
      setResolutionFailed(true);
      return undefined;
    }

    setResolvedAssetUrl("");

    void (async () => {
      try {
        const response = await fetch(attachment.resolvedUrl || attachment.url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Attachment download failed (${response.status})`);
        }
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (active) {
          setResolvedAssetUrl(objectUrl);
        } else if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      } catch {
        if (active) {
          setResolutionFailed(true);
          setResolvedAssetUrl("");
        }
      }
    })();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [
    accessToken,
    attachment.resolvedUrl,
    attachment.url,
    isPrivateAttachment,
    isVideo,
    resolvedUrl,
  ]);

  const displayUrl = resolvedAssetUrl;
  const canOpenAttachment = isPrivateAttachment
    ? Boolean(displayUrl) && !resolutionFailed
    : Boolean(displayUrl);

  if (isVideo) {
    return (
      <div
        className={[
          "overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
          removable ? "w-56" : "w-64",
        ].join(" ")}
      >
        {canOpenAttachment ? (
          <video
            className="h-36 w-full bg-black object-cover"
            controls
            preload="metadata"
            src={displayUrl}
          />
        ) : (
          <div className="flex h-36 w-full flex-col items-center justify-center gap-2 bg-[var(--surface-muted)] text-[var(--muted)]">
            <PlayCircle className="h-6 w-6" />
            <span className="px-3 text-center text-xs">
              {resolutionFailed
                ? t("Không tải được video")
                : t("Video đính kèm")}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-2">
          <PlayCircle className="h-4 w-4 text-[var(--muted)]" />
          {canOpenAttachment ? (
            <a
              href={displayUrl}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 text-xs text-[var(--ink)] hover:text-[var(--accent)]"
            >
              <span className="block truncate">{fileLabel}</span>
              {formatBytes(attachment.sizeBytes) ? (
                <span className="block text-[11px] text-[var(--muted)]">
                  {formatBytes(attachment.sizeBytes)}
                </span>
              ) : null}
            </a>
          ) : (
            <span className="min-w-0 flex-1 text-xs text-[var(--muted)]">
              <span className="block truncate">{fileLabel}</span>
            </span>
          )}
          {removable && onRemove ? (
            <button
              type="button"
              className="shrink-0 text-[var(--muted)] hover:text-[var(--danger)]"
              onClick={onRemove}
              aria-label={t("Xóa tệp đính kèm")}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!isImage) {
    return (
      <div
        className={[
          "inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)]",
          removable ? "max-w-full" : "",
        ].join(" ")}
      >
        <FileText className="h-4 w-4 text-[var(--muted)]" />
        {canOpenAttachment ? (
          <a
            href={displayUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 hover:text-[var(--accent)]"
          >
            <span className="max-w-[220px] truncate">{fileLabel}</span>
            {formatBytes(attachment.sizeBytes) ? (
              <span className="text-xs text-[var(--muted)]">
                {formatBytes(attachment.sizeBytes)}
              </span>
            ) : null}
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 text-[var(--muted)]">
            <span className="max-w-[220px] truncate">{fileLabel}</span>
          </span>
        )}
        {removable && onRemove ? (
          <button
            type="button"
            className="text-[var(--muted)] hover:text-[var(--danger)]"
            onClick={onRemove}
            aria-label={t("Xóa tệp đính kèm")}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={[
        "overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
        removable ? "w-40" : "w-44",
      ].join(" ")}
    >
      {canOpenAttachment ? (
        <a
          href={displayUrl}
          target="_blank"
          rel="noreferrer"
          className="block"
          aria-label={t("Mở ảnh đính kèm")}
        >
          <img
            src={displayUrl}
            alt={fileLabel}
            className="h-28 w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        </a>
      ) : (
        <div className="flex h-28 w-full items-center justify-center bg-[var(--surface-muted)] text-[var(--muted)]">
          <span className="px-3 text-center text-xs">
            {resolutionFailed
              ? t("Không tải được tệp đính kèm")
              : isPrivateAttachment
                ? t("Đang tải tệp đính kèm...")
                : t("Tệp đính kèm")}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2">
        {canOpenAttachment ? (
          <a
            href={displayUrl}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 text-xs text-[var(--ink)] hover:text-[var(--accent)]"
          >
            <span className="block truncate">{fileLabel}</span>
          </a>
        ) : (
          <span className="min-w-0 flex-1 text-xs text-[var(--muted)]">
            <span className="block truncate">{fileLabel}</span>
          </span>
        )}
        {removable && onRemove ? (
          <button
            type="button"
            className="shrink-0 text-[var(--muted)] hover:text-[var(--danger)]"
            onClick={onRemove}
            aria-label={t("Xóa tệp đính kèm")}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
