import {
  Download,
  FileText,
  Film,
  Image as ImageIcon,
  Link2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAdminMediaList,
  fetchAdminMediaSummary,
  fetchMediaAccessUrl,
  hardDeleteAdminMedia,
  softDeleteAdminMedia,
  type BackendAdminMediaListItem,
  type BackendAdminMediaSummary,
  type BackendMediaStatus,
  type BackendMediaType,
} from "../lib/adminApi";
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PagePanel,
  PaginationNav,
  SearchInput,
  StatCard,
  StatusBadge,
  inputClass,
  tableMetaClass,
  tableValueClass,
} from "../components/ui-kit";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";

const PAGE_SIZE = 20;

const formatBytes = (value: number | null | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "0 B";
  }
  if (value < 1024) {
    return `${value} B`;
  }
  const kb = value / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  return `${(mb / 1024).toFixed(2)} GB`;
};

const mediaTypeLabel = (mediaType?: BackendMediaType | null) => {
  switch (mediaType) {
    case "image":
      return "Image";
    case "video":
      return "Video";
    case "document":
      return "Document";
    default:
      return "Other";
  }
};

const statusTone = (
  status?: BackendMediaStatus | null,
): "neutral" | "warning" | "info" | "success" | "danger" => {
  switch (status) {
    case "active":
      return "success";
    case "pending":
      return "warning";
    case "orphaned":
      return "info";
    case "deleted":
      return "danger";
    default:
      return "neutral";
  }
};

const statusLabel = (status?: BackendMediaStatus | null) => {
  switch (status) {
    case "active":
      return "Active";
    case "pending":
      return "Pending";
    case "deleted":
      return "Deleted";
    case "orphaned":
      return "Orphaned";
    case "quarantined":
      return "Quarantined";
    default:
      return "Unknown";
  }
};

const mediaIcon = (mediaType?: BackendMediaType | null) => {
  switch (mediaType) {
    case "image":
      return <ImageIcon className="h-4 w-4" />;
    case "video":
      return <Film className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const STATUS_OPTIONS: Array<BackendMediaStatus | "all"> = [
  "all",
  "pending",
  "active",
  "orphaned",
  "deleted",
  "quarantined",
];

const TYPE_OPTIONS: Array<BackendMediaType | "all"> = [
  "all",
  "image",
  "video",
  "document",
  "other",
];

function MediaLibraryPage() {
  const { accessToken } = useAuth();
  const { t } = useLanguage();
  const { notify } = useToast();
  const [items, setItems] = useState<BackendAdminMediaListItem[]>([]);
  const [summary, setSummary] = useState<BackendAdminMediaSummary | null>(null);
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<BackendMediaType | "all">("all");
  const [status, setStatus] = useState<BackendMediaStatus | "all">("all");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyMediaId, setBusyMediaId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [pageData, summaryData] = await Promise.all([
        fetchAdminMediaList(accessToken, {
          page,
          size: PAGE_SIZE,
          sortBy: "createdAt",
          sortDir: "desc",
          ...(mediaType !== "all" ? { mediaType } : {}),
          ...(status !== "all" ? { status } : {}),
          ...(query.trim() ? { query: query.trim() } : {}),
        }),
        fetchAdminMediaSummary(accessToken),
      ]);
      setItems(pageData.items);
      setTotalPages(pageData.totalPages);
      setTotalElements(pageData.totalElements);
      setSummary(summaryData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("Không thể tải dữ liệu media."));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, mediaType, page, query, status, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(0);
  }, [query, mediaType, status]);

  const openMedia = useCallback(
    async (id: number) => {
      if (!accessToken) {
        return;
      }
      try {
        const payload = await fetchMediaAccessUrl(accessToken, id);
        window.open(payload.accessUrl, "_blank", "noopener,noreferrer");
      } catch (error) {
        notify(
          error instanceof Error
            ? error.message
            : "Media file is not available for preview or download.",
          { title: "Media", variant: "error" },
        );
      }
    },
    [accessToken, notify],
  );

  const softDeleteMedia = useCallback(
    async (item: BackendAdminMediaListItem) => {
      if (!accessToken) {
        return;
      }
      const isActiveEvidence = item.status === "active" && Boolean(item.linkedTicketId);
      if (isActiveEvidence) {
        const confirmed = window.confirm(
          "This media is ACTIVE support evidence. Archive anyway?",
        );
        if (!confirmed) {
          return;
        }
      }
      setBusyMediaId(item.id);
      try {
        if (isActiveEvidence) {
          const reason =
            window.prompt("Provide archive reason for active evidence:")?.trim() ||
            "";
          if (!reason) {
            throw new Error("Archive reason is required.");
          }
          await softDeleteAdminMedia(accessToken, item.id, {
            status: "deleted",
            force: true,
            reason,
          });
        } else {
          await softDeleteAdminMedia(accessToken, item.id, { status: "deleted" });
        }
        notify("Media archived.", { title: "Media", variant: "success" });
        await loadData();
      } catch (actionError) {
        notify(
          actionError instanceof Error ? actionError.message : "Archive failed.",
          { title: "Media", variant: "error" },
        );
      } finally {
        setBusyMediaId(null);
      }
    },
    [accessToken, loadData, notify],
  );

  const hardDeleteMedia = useCallback(
    async (item: BackendAdminMediaListItem) => {
      if (!accessToken) {
        return;
      }
      if (!window.confirm("Permanently delete this media file?")) {
        return;
      }
      setBusyMediaId(item.id);
      try {
        await hardDeleteAdminMedia(accessToken, item.id);
        notify("Media permanently deleted.", { title: "Media", variant: "success" });
        await loadData();
      } catch (actionError) {
        notify(
          actionError instanceof Error ? actionError.message : "Delete failed.",
          { title: "Media", variant: "error" },
        );
      } finally {
        setBusyMediaId(null);
      }
    },
    [accessToken, loadData, notify],
  );

  const summaryCards = useMemo(
    () => [
      { label: "Total files", value: summary?.totalFiles ?? 0, hint: "Support media only" },
      { label: "Total size", value: formatBytes(summary?.totalBytes), hint: "All support assets" },
      { label: "Images", value: formatBytes(summary?.imageBytes), hint: "Image storage" },
      { label: "Videos", value: formatBytes(summary?.videoBytes), hint: "Video storage" },
      { label: "Documents", value: formatBytes(summary?.documentBytes), hint: "Document storage" },
      { label: "Pending + Orphaned", value: formatBytes((summary?.pendingBytes ?? 0) + (summary?.orphanedBytes ?? 0)), hint: "Cleanup targets" },
    ],
    [summary],
  );

  return (
    <PagePanel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--ink)]">Media Library</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Manage support ticket media only (images, videos, documents).
          </p>
        </div>
        <GhostButton
          type="button"
          onClick={() => void loadData()}
          icon={<RefreshCw className="h-4 w-4" />}
        >
          Refresh
        </GhostButton>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            hint={card.hint}
          />
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[2fr_1fr_1fr]">
        <SearchInput
          id="admin-media-search"
          label="Search media"
          placeholder="Search file, object key, dealer, ticket..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className={inputClass}
          value={mediaType}
          onChange={(event) => setMediaType(event.target.value as BackendMediaType | "all")}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All types" : mediaTypeLabel(option)}
            </option>
          ))}
        </select>
        <select
          className={inputClass}
          value={status}
          onChange={(event) => setStatus(event.target.value as BackendMediaStatus | "all")}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All status" : statusLabel(option)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
        {isLoading ? (
          <LoadingRows rows={6} />
        ) : error ? (
          <ErrorState
            title="Could not load media"
            message={error}
            onRetry={() => void loadData()}
            retryLabel="Retry"
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No media assets"
            message="No files matched current filters."
            icon={FileText}
          />
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const canHardDelete =
                item.status === "deleted" || item.status === "orphaned";
              const canPreview = item.status === "active";
              const isBusy = busyMediaId === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
                          {mediaIcon(item.mediaType)}
                        </span>
                        <p className={`${tableValueClass} truncate`}>
                          {item.fileName || item.objectKey || `#${item.id}`}
                        </p>
                        <StatusBadge tone={statusTone(item.status)}>
                          {statusLabel(item.status)}
                        </StatusBadge>
                      </div>
                      <p className={`${tableMetaClass} mt-1`}>
                        {mediaTypeLabel(item.mediaType)} • {formatBytes(item.sizeBytes)} •{" "}
                        {item.contentType || "unknown"}
                      </p>
                      <p className={`${tableMetaClass} mt-1`}>
                        Ticket: {item.linkedTicketCode || "-"} • Dealer:{" "}
                        {item.linkedDealerName || "-"} • Uploader:{" "}
                        {item.uploadedByName || "-"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <GhostButton
                        type="button"
                        disabled={isBusy || !canPreview}
                        icon={<Link2 className="h-4 w-4" />}
                        onClick={() => void openMedia(item.id)}
                      >
                        Open
                      </GhostButton>
                      <GhostButton
                        type="button"
                        disabled={isBusy || !canPreview}
                        icon={<Download className="h-4 w-4" />}
                        onClick={() => void openMedia(item.id)}
                      >
                        Download
                      </GhostButton>
                      <GhostButton
                        type="button"
                        disabled={isBusy}
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => void softDeleteMedia(item)}
                      >
                        Archive
                      </GhostButton>
                      <GhostButton
                        type="button"
                        disabled={isBusy || !canHardDelete}
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => void hardDeleteMedia(item)}
                      >
                        Delete
                      </GhostButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PaginationNav
        page={page}
        totalPages={totalPages}
        totalItems={totalElements}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        previousLabel="Previous"
        nextLabel="Next"
      />
    </PagePanel>
  );
}

export default MediaLibraryPage;
