import {
  FileText,
  LifeBuoy,
  MessageSquareMore,
  PlayCircle,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createAdminSupportTicketMessage,
  deleteMediaAsset,
  deleteUploadUrl,
  fetchAllAdminSupportTickets,
  fetchAdminSupportTicket,
  fetchAdminSupportTickets,
  fetchAdminUsers,
  updateAdminSupportTicket,
  type BackendSupportCategory,
  type BackendSupportPriority,
  type BackendSupportTicketResponse,
  type BackendSupportTicketStatus,
  type BackendStaffUserResponse,
} from "../lib/adminApi";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCopy } from "../lib/i18n";
import { useToast } from "../context/ToastContext";
import { formatDateTime } from "../lib/formatters";
import { subscribeAdminSupportRefresh } from "../lib/adminRealtime";
import {
  inferSupportAttachmentMediaType,
  isPrivateSupportAttachmentUrl,
  normalizeSupportAttachment,
  type NormalizedSupportAttachment,
} from "../lib/supportAttachment";
import { uploadSupportMediaAsset } from "../lib/supportMediaUpload";
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PagePanel,
  PaginationNav,
  PrimaryButton,
  SearchInput,
  StatCard,
  StatusBadge,
  bodyTextClass,
  cardTitleClass,
  inputClass,
  softCardClass,
  tableActionSelectClass,
  tableMetaClass,
  textareaClass,
} from "../components/ui-kit";

const STATUS_OPTIONS: BackendSupportTicketStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];

const STATUS_TRANSITIONS: Record<
  BackendSupportTicketStatus,
  BackendSupportTicketStatus[]
> = {
  open: ["open", "in_progress", "closed"],
  in_progress: ["in_progress", "open", "resolved", "closed"],
  resolved: ["resolved", "in_progress", "closed"],
  closed: ["closed"],
};

const statusTone = {
  open: "warning",
  in_progress: "info",
  resolved: "success",
  closed: "neutral",
} as const;

const priorityTone = {
  normal: "neutral",
  high: "warning",
  urgent: "danger",
} as const;

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const ALLOWED_DOCUMENT_TYPES = new Set(["application/pdf"]);
const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "mp4",
  "webm",
  "pdf",
]);

type TicketDraftState = {
  replyDraft: string;
  statusDraft: BackendSupportTicketStatus;
  assigneeDraft: number | "";
  internalNote: boolean;
  attachments: DraftAttachment[];
};

type DraftAttachment = NormalizedSupportAttachment;

type ThreadItem = {
  key: string;
  authorRole: "dealer" | "admin" | "system";
  authorName?: string | null;
  internalNote: boolean;
  message: string;
  createdAt?: string | null;
  attachments: NormalizedSupportAttachment[];
  syntheticRoot?: boolean;
};

type SupportAttachmentViewProps = {
  attachment: NormalizedSupportAttachment;
  t: (value: string) => string;
  accessToken?: string | null;
  removable?: boolean;
  onRemove?: () => void;
};

const copyKeys = {
  title: "Hỗ trợ",
  description:
    "Theo dõi yêu cầu hỗ trợ từ đại lý, cập nhật người xử lý và phản hồi ngay trong admin.",
  searchLabel: "Tìm yêu cầu",
  searchPlaceholder: "Tìm mã yêu cầu, đại lý, chủ đề...",
  status: "Trạng thái",
  all: "Tất cả",
  open: "Mới tiếp nhận",
  processing: "Đang xử lý",
  resolved: "Đã xử lý xong",
  selected: "Yêu cầu đang xem",
  timeline: "Mốc xử lý",
  reply: "Nội dung gửi đại lý",
  save: "Lưu trạng thái xử lý",
  sendReply: "Gửi cho đại lý",
  saveInternal: "Lưu ghi chú nội bộ",
  assignee: "Người phụ trách",
  created: "Tiếp nhận lúc",
  updated: "Cập nhật gần nhất",
  closed: "Đã đóng lúc",
  next: "Tiếp",
  previous: "Trước",
  emptyTitle: "Chưa có yêu cầu hỗ trợ",
  emptyMessage: "Yêu cầu từ đại lý sẽ xuất hiện ở đây khi có trao đổi mới.",
  emptyDetailTitle: "Chọn một yêu cầu để xem chi tiết",
  emptyDetailMessage:
    "Khi có yêu cầu từ đại lý, bạn sẽ xem toàn bộ trao đổi tại đây.",
  loadTitle: "Không tải được yêu cầu hỗ trợ",
  loadFallback: "Danh sách yêu cầu hỗ trợ chưa thể tải.",
  reload: "Tải lại",
} as const;

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

const getFileExtension = (fileName: string) => {
  const normalized = fileName.trim().toLowerCase();
  const dot = normalized.lastIndexOf(".");
  if (dot < 0 || dot === normalized.length - 1) {
    return "";
  }
  return normalized.slice(dot + 1);
};

const validateSupportAttachmentFile = (file: File): string | null => {
  const contentType = file.type.trim().toLowerCase();
  const extension = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return "Chỉ hỗ trợ tệp JPG/JPEG/PNG/WEBP, MP4/WEBM hoặc PDF.";
  }

  if (contentType.startsWith("image/")) {
    if (file.size > MAX_IMAGE_BYTES) {
      return "Ảnh không được vượt quá 10MB.";
    }
    return null;
  }

  if (ALLOWED_VIDEO_TYPES.has(contentType)) {
    if (file.size > MAX_VIDEO_BYTES) {
      return "Video không được vượt quá 50MB.";
    }
    return null;
  }

  if (ALLOWED_DOCUMENT_TYPES.has(contentType)) {
    if (file.size > MAX_DOCUMENT_BYTES) {
      return "Tệp PDF không được vượt quá 10MB.";
    }
    return null;
  }

  if (["mp4", "webm"].includes(extension) && file.size <= MAX_VIDEO_BYTES) {
    return null;
  }
  if (extension === "pdf" && file.size <= MAX_DOCUMENT_BYTES) {
    return null;
  }

  return "Định dạng tệp không hợp lệ.";
};

const upsertTicket = (
  tickets: BackendSupportTicketResponse[],
  ticket: BackendSupportTicketResponse | null,
) => {
  if (!ticket) {
    return tickets;
  }
  const index = tickets.findIndex((entry) => entry.id === ticket.id);
  if (index < 0) {
    return [ticket, ...tickets];
  }
  const next = [...tickets];
  next[index] = ticket;
  return next;
};

function createDraft(ticket: BackendSupportTicketResponse): TicketDraftState {
  return {
    replyDraft: "",
    statusDraft: ticket.status ?? "open",
    assigneeDraft: ticket.assigneeId ?? "",
    internalNote: false,
    attachments: [],
  };
}

function buildThreadItems(ticket: BackendSupportTicketResponse): ThreadItem[] {
  const messages = Array.isArray(ticket.messages) ? ticket.messages : [];
  const rootMessage = (ticket.message || "").trim();
  const hasRootInMessages = messages.some(
    (message) =>
      message.authorRole === "dealer" &&
      !message.internalNote &&
      message.message.trim() === rootMessage,
  );

  const thread: ThreadItem[] = [];
  if (rootMessage && !hasRootInMessages) {
    thread.push({
      key: `root-${ticket.id}`,
      authorRole: "dealer",
      authorName: ticket.dealerName,
      internalNote: false,
      message: rootMessage,
      createdAt: ticket.createdAt,
      attachments: [],
      syntheticRoot: true,
    });
  }

  for (const message of messages) {
    thread.push({
      key: `message-${message.id}`,
      authorRole: message.authorRole,
      authorName: message.authorName,
      internalNote: message.internalNote === true,
      message: message.message,
      createdAt: message.createdAt,
      attachments: Array.isArray(message.attachments)
        ? message.attachments
            .map((attachment) => normalizeSupportAttachment(attachment ?? {}))
            .filter(
              (
                attachment,
              ): attachment is NormalizedSupportAttachment =>
                attachment !== null,
            )
        : [],
    });
  }

  return thread;
}

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

function SupportTicketsPageRevamp() {
  const { t } = useLanguage();
  const copy = translateCopy(copyKeys, t);
  const { accessToken } = useAuth();
  const { notify } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<BackendSupportTicketResponse[]>([]);
  const [allTickets, setAllTickets] = useState<BackendSupportTicketResponse[]>(
    [],
  );
  const [queriedTicket, setQueriedTicket] =
    useState<BackendSupportTicketResponse | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | BackendSupportTicketStatus
  >("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draftsByTicketId, setDraftsByTicketId] = useState<
    Record<number, TicketDraftState>
  >({});
  const [staffUsers, setStaffUsers] = useState<BackendStaffUserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isSavingProcessing, setIsSavingProcessing] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isDeletingAttachment, setIsDeletingAttachment] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(
    null,
  );
  const [showQuickStats, setShowQuickStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draftsByTicketIdRef = useRef(draftsByTicketId);
  const accessTokenRef = useRef(accessToken);
  const hasActiveFilters = query.trim().length > 0 || statusFilter !== "all";
  const isSaving = isSavingProcessing || isSendingMessage;
  const queryTicketId = useMemo(() => {
    const raw = new URLSearchParams(location.search).get("ticketId");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [location.search]);

  const mergeTickets = useCallback(
    (nextTickets: BackendSupportTicketResponse[]) => {
      setDraftsByTicketId((current) => {
        const nextDrafts = { ...current };
        for (const ticket of nextTickets) {
          if (!nextDrafts[ticket.id]) {
            nextDrafts[ticket.id] = createDraft(ticket);
          }
        }
        return nextDrafts;
      });
      return nextTickets;
    },
    [],
  );

  useEffect(() => {
    draftsByTicketIdRef.current = draftsByTicketId;
  }, [draftsByTicketId]);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    return () => {
      const token = accessTokenRef.current;
      if (!token) {
        return;
      }
      const attachments = Object.values(draftsByTicketIdRef.current).flatMap(
        (draft) => draft.attachments,
      );
      if (attachments.length === 0) {
        return;
      }
      void (async () => {
        for (const attachment of attachments) {
          if (!attachment.id || attachment.id <= 0) {
            continue;
          }
          try {
            await deleteMediaAsset(token, attachment.id);
          } catch {
            // Best-effort cleanup on exit.
          }
        }
      })();
    };
  }, []);

  const loadTickets = useCallback(
    async (nextPage: number) => {
      if (!accessToken) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchAdminSupportTickets(accessToken, {
          page: nextPage,
          size: 25,
        });
        setTickets(mergeTickets(response.items));
        setPage(response.page);
        setTotalPages(response.totalPages);
        setTotalItems(response.totalElements);
        if (response.items.length > 0) {
          setSelectedId(
            (current) =>
              (queryTicketId && current === queryTicketId
                ? current
                : null) ??
              response.items.find((item) => item.id === current)?.id ??
              response.items[0].id,
          );
        } else {
          setSelectedId((current) =>
            queryTicketId && current === queryTicketId ? current : null,
          );
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : copy.loadFallback,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, copy.loadFallback, mergeTickets, queryTicketId],
  );

  useEffect(() => {
    void loadTickets(page);
  }, [loadTickets, page]);

  useEffect(() => {
    if (!accessToken) return;
    void fetchAdminUsers(accessToken)
      .then((users) =>
        setStaffUsers(users.filter((user) => user.status !== "PENDING")),
      )
      .catch(() => setStaffUsers([]));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !queryTicketId) {
      setQueriedTicket(null);
      return;
    }
    let active = true;
    void fetchAdminSupportTicket(accessToken, queryTicketId)
      .then((ticket) => {
        if (!active) {
          return;
        }
        mergeTickets([ticket]);
        setQueriedTicket(ticket);
        setSelectedId(ticket.id);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setQueriedTicket(null);
      });
    return () => {
      active = false;
    };
  }, [accessToken, mergeTickets, queryTicketId]);

  const loadAllTickets = useCallback(async () => {
    if (!accessToken) return;
    setIsFilterLoading(true);
    setError(null);
    try {
      const response = await fetchAllAdminSupportTickets(accessToken, 100);
      setAllTickets(mergeTickets(response));
      if (response.length > 0) {
        setSelectedId(
          (current) =>
            (queryTicketId && current === queryTicketId ? current : null) ??
            response.find((item) => item.id === current)?.id ??
            response[0].id,
        );
      } else {
        setSelectedId((current) =>
          queryTicketId && current === queryTicketId ? current : null,
        );
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : copy.loadFallback,
      );
    } finally {
      setIsFilterLoading(false);
    }
  }, [accessToken, copy.loadFallback, mergeTickets, queryTicketId]);

  useEffect(() => {
    if (!hasActiveFilters) {
      setAllTickets([]);
      setIsFilterLoading(false);
      setError(null);
      return;
    }

    void loadAllTickets();
  }, [hasActiveFilters, loadAllTickets]);

  useEffect(() => {
    return subscribeAdminSupportRefresh(() => {
      void loadTickets(page);
      if (hasActiveFilters) {
        void loadAllTickets();
      }
    });
  }, [hasActiveFilters, loadAllTickets, loadTickets, page]);

  const sourceTickets = hasActiveFilters ? allTickets : tickets;
  const mergedSourceTickets = useMemo(
    () => upsertTicket(sourceTickets, queriedTicket),
    [queriedTicket, sourceTickets],
  );

  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return mergedSourceTickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "all" ? true : ticket.status === statusFilter;
      const haystack = [
        ticket.ticketCode,
        ticket.dealerName,
        ticket.subject,
        ticket.message,
        ticket.contextData?.orderCode,
        ticket.contextData?.transactionCode,
        ticket.contextData?.serial,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        matchesStatus &&
        (!normalizedQuery || haystack.includes(normalizedQuery))
      );
    });
  }, [mergedSourceTickets, query, statusFilter]);

  useEffect(() => {
    if (filteredTickets.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!filteredTickets.some((ticket) => ticket.id === selectedId)) {
      setSelectedId(filteredTickets[0].id);
    }
  }, [filteredTickets, selectedId]);

  const selectedTicket =
    filteredTickets.find((ticket) => ticket.id === selectedId) ?? null;

  const selectedDraft = selectedTicket
    ? (draftsByTicketId[selectedTicket.id] ?? createDraft(selectedTicket))
    : null;
  const isInternalNoteDraft = selectedDraft?.internalNote === true;
  const composerTitle = isInternalNoteDraft
    ? t("Ghi chú nội bộ")
    : t("Trao đổi với đại lý");
  const composerLabel = isInternalNoteDraft
    ? t("Nội dung ghi chú nội bộ")
    : t("Nội dung gửi đại lý");
  const composerHint = isInternalNoteDraft
    ? t("Chỉ người trong admin nhìn thấy nội dung này. Đại lý sẽ không nhận được.")
    : t("Đại lý sẽ nhìn thấy nội dung này sau khi bạn bấm gửi.");
  const composerPlaceholder = isInternalNoteDraft
    ? t("Nhập ghi chú chỉ dành cho người xử lý...")
    : t("Nhập nội dung cần gửi cho đại lý...");

  const updateSelectedDraft = useCallback(
    (patch: Partial<TicketDraftState>) => {
      if (!selectedTicket) {
        return;
      }
      setDraftsByTicketId((current) => ({
        ...current,
        [selectedTicket.id]: {
          ...(current[selectedTicket.id] ?? createDraft(selectedTicket)),
          ...patch,
        },
      }));
    },
    [selectedTicket],
  );

  useEffect(() => {
    if (!selectedTicket) {
      return;
    }
    const selectedDraftState =
      draftsByTicketId[selectedTicket.id] ?? createDraft(selectedTicket);
    const hasPendingComposerDraft =
      selectedDraftState.replyDraft.trim().length > 0 ||
      selectedDraftState.attachments.length > 0;
    void hasPendingComposerDraft;
  }, [draftsByTicketId, selectedTicket]);

  const openReplyComposer = useCallback(
    (internalNote: boolean) => {
      updateSelectedDraft({ internalNote });
    },
    [updateSelectedDraft],
  );

  const allowedStatusOptions = useMemo(
    () =>
      STATUS_TRANSITIONS[selectedTicket?.status ?? "open"] ?? STATUS_OPTIONS,
    [selectedTicket],
  );

  const stats = useMemo(
    () => ({
      open: sourceTickets.filter((ticket) => ticket.status === "open").length,
      progress: sourceTickets.filter(
        (ticket) => ticket.status === "in_progress",
      ).length,
      resolved: sourceTickets.filter((ticket) => ticket.status === "resolved")
        .length,
    }),
    [sourceTickets],
  );

  const handleReload = useCallback(async () => {
    await loadTickets(page);
    if (hasActiveFilters) {
      await loadAllTickets();
    }
  }, [hasActiveFilters, loadAllTickets, loadTickets, page]);

  const replaceTicket = useCallback((updated: BackendSupportTicketResponse) => {
    setTickets((current) =>
      current.map((ticket) => (ticket.id === updated.id ? updated : ticket)),
    );
    setAllTickets((current) =>
      current.map((ticket) => (ticket.id === updated.id ? updated : ticket)),
    );
    setQueriedTicket((current) =>
      current?.id === updated.id ? updated : current,
    );
    setDraftsByTicketId((current) => ({
      ...current,
      [updated.id]: {
        ...(current[updated.id] ?? createDraft(updated)),
        statusDraft: updated.status ?? "open",
        assigneeDraft: updated.assigneeId ?? "",
      },
    }));
  }, []);

  const handleSave = async () => {
    if (!accessToken || !selectedTicket || !selectedDraft) return;
    setIsSavingProcessing(true);
    try {
      const updated = await updateAdminSupportTicket(
        accessToken,
        selectedTicket.id,
        {
          status: selectedDraft.statusDraft,
          assigneeId:
            selectedDraft.assigneeDraft === ""
              ? null
              : selectedDraft.assigneeDraft,
        },
      );
      replaceTicket(updated);
      notify(t("Đã lưu trạng thái xử lý."), {
        title: copy.title,
        variant: "success",
      });
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : copy.loadFallback;
      notify(
        message,
        {
          title: copy.title,
          variant: "error",
        },
      );
    } finally {
      setIsSavingProcessing(false);
    }
  };

  const handleAttachmentUpload = async (file: File | null) => {
    if (!file || !accessToken || !selectedTicket || isDeletingAttachment) {
      return;
    }

    const validationError = validateSupportAttachmentFile(file);
    if (validationError) {
      notify(validationError, {
        title: copy.title,
        variant: "error",
      });
      return;
    }

    setIsUploadingAttachment(true);
    setUploadingFileName(file.name);
    setUploadProgress(0);
    try {
      const uploaded = await uploadSupportMediaAsset({
        token: accessToken,
        file,
        onProgress: (percent) => setUploadProgress(percent),
      });
      const normalizedAttachment = normalizeSupportAttachment({
        id: uploaded.id,
        url: uploaded.downloadUrl || uploaded.accessUrl || "",
        accessUrl: uploaded.accessUrl ?? undefined,
        fileName: uploaded.originalFileName || file.name,
        mediaType: uploaded.mediaType ?? undefined,
        contentType: uploaded.contentType ?? undefined,
        sizeBytes: uploaded.sizeBytes ?? undefined,
        createdAt: uploaded.createdAt ?? undefined,
      });
      if (!normalizedAttachment) {
        throw new Error(t("Cannot process attachment URL."));
      }
      setDraftsByTicketId((current) => {
        const existingDraft =
          current[selectedTicket.id] ?? createDraft(selectedTicket);
        const attachments = [...existingDraft.attachments, normalizedAttachment];
        return {
          ...current,
          [selectedTicket.id]: {
            ...existingDraft,
            attachments,
          },
        };
      });
    } catch (uploadError) {
      notify(
        uploadError instanceof Error
          ? uploadError.message
          : t("Cannot upload attachment."),
        {
          title: copy.title,
          variant: "error",
        },
      );
    } finally {
      setIsUploadingAttachment(false);
      setUploadProgress(0);
      setUploadingFileName(null);
    }
  };

  const removeDraftAttachment = useCallback(
    async (attachment: DraftAttachment) => {
      if (!accessToken || !selectedTicket || isDeletingAttachment) {
        return;
      }

      const ticketId = selectedTicket.id;
      const attachmentKey = String(attachment.id ?? attachment.url);
      setIsDeletingAttachment(true);
      try {
        if (attachment.id && attachment.id > 0) {
          await deleteMediaAsset(accessToken, attachment.id);
        } else if (attachment.url.trim()) {
          await deleteUploadUrl(accessToken, attachment.url.trim());
        }
        setDraftsByTicketId((current) => {
          const existingDraft = current[ticketId] ?? createDraft(selectedTicket);
          return {
            ...current,
            [ticketId]: {
              ...existingDraft,
              attachments: existingDraft.attachments.filter(
                (item) => String(item.id ?? item.url) !== attachmentKey,
              ),
            },
          };
        });
      } catch (deleteError) {
        notify(
          deleteError instanceof Error
            ? deleteError.message
            : t("Cannot remove attachment."),
          {
            title: copy.title,
            variant: "error",
          },
        );
      } finally {
        setIsDeletingAttachment(false);
      }
    },
    [accessToken, copy.title, isDeletingAttachment, notify, selectedTicket, t],
  );

  const handleSendMessage = async () => {
    if (
      !accessToken ||
      !selectedTicket ||
      !selectedDraft?.replyDraft.trim() ||
      isDeletingAttachment
    ) {
      return;
    }
    setIsSendingMessage(true);
    try {
      const mediaAssetIds = selectedDraft.attachments
        .map((attachment) => attachment.id)
        .filter((id): id is number => typeof id === "number" && id > 0);
      const legacyAttachments = selectedDraft.attachments
        .filter((attachment) => typeof attachment.id !== "number")
        .map((attachment) => ({
          url: attachment.url,
          fileName: attachment.fileName ?? undefined,
        }));

      const updated = await createAdminSupportTicketMessage(
        accessToken,
        selectedTicket.id,
        {
          message: selectedDraft.replyDraft.trim(),
          internalNote: selectedDraft.internalNote,
          ...(legacyAttachments.length > 0
            ? { attachments: legacyAttachments }
            : {}),
          ...(mediaAssetIds.length > 0 ? { mediaAssetIds } : {}),
        },
      );
      replaceTicket(updated);
      setDraftsByTicketId((current) => ({
        ...current,
        [selectedTicket.id]: {
          ...(current[selectedTicket.id] ?? createDraft(updated)),
          replyDraft: "",
          internalNote: false,
          attachments: [],
          statusDraft: updated.status ?? "open",
          assigneeDraft: updated.assigneeId ?? "",
        },
      }));
      notify(
        selectedDraft.internalNote
          ? t("Đã lưu ghi chú nội bộ.")
          : t("Đã gửi nội dung cho đại lý."),
        {
          title: copy.title,
          variant: "success",
        },
      );
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : copy.loadFallback;
      notify(
        message,
        {
          title: copy.title,
          variant: "error",
        },
      );
    } finally {
      setIsSendingMessage(false);
    }
  };

  const statusLabel = useCallback(
    (status: BackendSupportTicketStatus | null | undefined) => {
      switch (status) {
        case "in_progress":
          return t("Đang xử lý");
        case "resolved":
          return t("Đã xử lý xong");
        case "closed":
          return t("Đã đóng");
        case "open":
        default:
          return t("Mới tiếp nhận");
      }
    },
    [t],
  );

  const priorityLabel = useCallback(
    (priority: BackendSupportPriority | null | undefined) => {
      switch (priority) {
        case "high":
          return t("Cao");
        case "urgent":
          return t("Khẩn cấp");
        case "normal":
        default:
          return t("Bình thường");
      }
    },
    [t],
  );

  const categoryLabel = useCallback(
    (category: BackendSupportCategory | null | undefined) => {
      switch (category) {
        case "order":
          return t("Đơn hàng");
        case "warranty":
          return t("Bảo hành / Serial");
        case "product":
          return t("Sản phẩm");
        case "payment":
          return t("Thanh toán");
        case "returnOrder":
          return t("Đổi trả");
        case "other":
        default:
          return t("Khác");
      }
    },
    [t],
  );

  const threadItems = useMemo(
    () => (selectedTicket ? buildThreadItems(selectedTicket) : []),
    [selectedTicket],
  );

  if (isLoading || isFilterLoading) {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    );
  }

  if (error) {
    return (
      <PagePanel>
        <ErrorState
          title={copy.loadTitle}
          message={error}
          onRetry={() => void handleReload()}
        />
      </PagePanel>
    );
  }

  const showEmptyWorkspace = filteredTickets.length === 0;

  return (
    <PagePanel>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className={cardTitleClass}>{copy.title}</h3>
          <p className={bodyTextClass}>{copy.description}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <SearchInput
            id="support-search"
            label={copy.searchLabel}
            placeholder={copy.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full sm:max-w-sm lg:w-72 xl:w-80"
          />
          <select
            aria-label={copy.status}
            className={`${inputClass} w-full sm:w-auto`}
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "all" | BackendSupportTicketStatus,
              )
            }
          >
            <option value="all">{copy.all}</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
          <GhostButton
            aria-label={copy.reload}
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => void handleReload()}
            type="button"
          >
            {copy.reload}
          </GhostButton>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 text-left"
          onClick={() => setShowQuickStats((current) => !current)}
          aria-expanded={showQuickStats}
        >
          <span>
            <p className={tableMetaClass}>{t("Tổng quan nhanh")}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {t(
                "Dùng để nắm nhanh khối lượng ticket, ưu tiên xử lý các yêu cầu bên dưới.",
              )}
            </p>
          </span>
          <span className="text-sm font-medium text-[var(--accent)]">
            {showQuickStats ? t("Ẩn") : t("Xem")}
          </span>
        </button>
        {showQuickStats ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <StatCard icon={LifeBuoy} label={copy.open} value={stats.open} tone="warning" />
            <StatCard
              icon={MessageSquareMore}
              label={copy.processing}
              value={stats.progress}
              tone="info"
            />
            <StatCard
              icon={LifeBuoy}
              label={copy.resolved}
              value={stats.resolved}
              tone="success"
            />
          </div>
        ) : null}
      </div>

      {showEmptyWorkspace ? (
        <div className="mt-6">
          <EmptyState
            icon={LifeBuoy}
            title={copy.emptyTitle}
            message={copy.emptyMessage}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)]">
          <div className="min-w-0 space-y-3">
            {filteredTickets.map((ticket) => {
              const active = ticket.id === selectedTicket?.id;
              return (
                <button
                  key={ticket.id}
                  type="button"
                  className={[
                    softCardClass,
                    "w-full text-left transition",
                    active
                      ? "border-[var(--accent)] ring-2 ring-[var(--accent-soft)]"
                      : "hover:border-[var(--accent)]",
                  ].join(" ")}
                  onClick={() => setSelectedId(ticket.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {ticket.ticketCode ?? `#${ticket.id}`} •{" "}
                        {ticket.subject ?? "-"}
                      </p>
                      <p className={tableMetaClass}>
                        {ticket.dealerName ?? "-"} •{" "}
                        {formatDateTime(
                          ticket.createdAt ?? new Date().toISOString(),
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        tone={
                          priorityTone[ticket.priority ?? "normal"] ?? "neutral"
                        }
                      >
                        {priorityLabel(ticket.priority)}
                      </StatusBadge>
                      <StatusBadge tone={statusTone[ticket.status ?? "open"]}>
                        {statusLabel(ticket.status)}
                      </StatusBadge>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-[var(--ink)]">
                    {ticket.message ?? "-"}
                  </p>
                </button>
              );
            })}
            {!hasActiveFilters ? (
              <PaginationNav
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={25}
                onPageChange={setPage}
                previousLabel={copy.previous}
                nextLabel={copy.next}
              />
            ) : null}
          </div>

          <div className={`${softCardClass} min-w-0`}>
            {selectedTicket && selectedDraft ? (
              <div className="space-y-4">
                <div>
                  <p className={tableMetaClass}>{copy.selected}</p>
                  <h4 className="mt-2 text-lg font-semibold text-[var(--ink)]">
                    {selectedTicket.ticketCode ?? `#${selectedTicket.id}`}
                  </h4>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {selectedTicket.dealerName ?? "-"} •{" "}
                    {categoryLabel(selectedTicket.category)} •{" "}
                    {formatDateTime(
                      selectedTicket.createdAt ?? new Date().toISOString(),
                    )}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:border-[var(--accent)]"
                      onClick={() => openReplyComposer(false)}
                    >
                      {copy.sendReply}
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:border-amber-400"
                      onClick={() => openReplyComposer(true)}
                    >
                      {copy.saveInternal}
                    </button>
                  </div>
                </div>

                {selectedTicket.contextData ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                    <p className={`${tableMetaClass} mb-2`}>
                      {t("Thông tin liên quan")}
                    </p>
                    <div className="grid gap-2 text-sm text-[var(--ink)] sm:grid-cols-2">
                      {selectedTicket.contextData.orderCode ? (
                        <p>
                          <span className="font-medium">
                            {t("Mã đơn hàng")}:
                          </span>{" "}
                          {selectedTicket.contextData.orderCode}
                        </p>
                      ) : null}
                      {selectedTicket.contextData.transactionCode ? (
                        <p>
                          <span className="font-medium">
                            {t("Mã giao dịch")}:
                          </span>{" "}
                          {selectedTicket.contextData.transactionCode}
                        </p>
                      ) : null}
                      {selectedTicket.contextData.paidAmount != null ? (
                        <p>
                          <span className="font-medium">
                            {t("Số tiền đã chuyển")}:
                          </span>{" "}
                          {selectedTicket.contextData.paidAmount}
                        </p>
                      ) : null}
                      {selectedTicket.contextData.paymentReference ? (
                        <p>
                          <span className="font-medium">
                            {t("Nội dung chuyển khoản")}:
                          </span>{" "}
                          {selectedTicket.contextData.paymentReference}
                        </p>
                      ) : null}
                      {selectedTicket.contextData.serial ? (
                        <p>
                          <span className="font-medium">{t("Serial")}:</span>{" "}
                          {selectedTicket.contextData.serial}
                        </p>
                      ) : null}
                      {selectedTicket.contextData.returnReason ? (
                        <p className="sm:col-span-2">
                          <span className="font-medium">
                            {t("Lý do trả hàng")}:
                          </span>{" "}
                          {selectedTicket.contextData.returnReason}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {selectedTicket.contextData?.returnRequestId ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                    <p className={`${tableMetaClass} mb-2`}>
                      {t("Yêu cầu đổi trả liên quan")}
                    </p>
                    <div className="grid gap-2 text-sm text-[var(--ink)] sm:grid-cols-2">
                      <p>
                        <span className="font-medium">{t("Mã yêu cầu")}:</span>{" "}
                        {selectedTicket.contextData.returnRequestCode ??
                          `#${selectedTicket.contextData.returnRequestId}`}
                      </p>
                      <p>
                        <span className="font-medium">{t("Trạng thái")}:</span>{" "}
                        {selectedTicket.contextData.returnStatus ?? "-"}
                      </p>
                      <p className="sm:col-span-2">
                        <span className="font-medium">{t("Mã đơn hàng")}:</span>{" "}
                        {selectedTicket.contextData.orderCode ?? "-"}
                      </p>
                    </div>
                    <div className="mt-3">
                      <button
                        type="button"
                        className="rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:border-[var(--accent)]"
                        onClick={() =>
                          navigate(
                            `/returns/${selectedTicket.contextData?.returnRequestId}`,
                          )
                        }
                      >
                        {t("Mở chi tiết đổi trả")}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div>
                  <p className={tableMetaClass}>{t("Trao đổi trước đó")}</p>
                  <div className="mt-3 space-y-3">
                    {threadItems.map((message) => (
                      <div
                        key={message.key}
                        className={[
                          "rounded-2xl border px-4 py-3",
                          message.internalNote
                            ? "border-[var(--border)] bg-[var(--surface-muted)]"
                            : message.authorRole === "admin"
                              ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                              : message.syntheticRoot
                                ? "border-[var(--accent)]/40 bg-[var(--surface)]"
                                : "border-[var(--border)] bg-[var(--surface)]",
                        ].join(" ")}
                      >
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                          {message.authorRole === "dealer"
                            ? (message.authorName ??
                              selectedTicket.dealerName ??
                              t("Đại lý"))
                            : message.authorRole === "admin"
                              ? (message.authorName ?? "Admin")
                              : (message.authorName ?? t("Hệ thống"))}
                          {message.syntheticRoot
                            ? ` • ${t("Nội dung ban đầu")}`
                            : ""}
                          {message.internalNote
                            ? ` • ${t("Chỉ nội bộ")}`
                            : ""}
                        </p>
                        <p className="whitespace-pre-wrap text-sm text-[var(--ink)]">
                          {message.message}
                        </p>
                        {message.attachments.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.attachments.map((attachment, index) => (
                              <SupportAttachmentView
                                key={`${message.key}-attachment-${index}`}
                                attachment={attachment}
                                t={t}
                                accessToken={accessToken}
                              />
                            ))}
                          </div>
                        ) : null}
                        {message.createdAt ? (
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            {formatDateTime(message.createdAt)}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className={tableMetaClass}>{t("Cập nhật xử lý")}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {t(
                          "Chỉ lưu trạng thái và người phụ trách. Không gửi nội dung cho đại lý.",
                        )}
                      </p>
                    </div>
                    <PrimaryButton
                      disabled={isSaving || isDeletingAttachment}
                      onClick={() => void handleSave()}
                      type="button"
                    >
                      {isSaving ? `${copy.save}...` : copy.save}
                    </PrimaryButton>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-sm text-[var(--ink)]">
                      <span className={tableMetaClass}>{copy.status}</span>
                      <select
                        className={`mt-2 w-full ${tableActionSelectClass}`}
                        value={selectedDraft.statusDraft}
                        onChange={(event) =>
                          updateSelectedDraft({
                            statusDraft: event.target
                              .value as BackendSupportTicketStatus,
                          })
                        }
                      >
                        {allowedStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm text-[var(--ink)]">
                      <span className={tableMetaClass}>{copy.assignee}</span>
                      <select
                        className={`mt-2 w-full ${tableActionSelectClass}`}
                        value={selectedDraft.assigneeDraft}
                        onChange={(event) =>
                          updateSelectedDraft({
                            assigneeDraft: event.target.value
                              ? Number(event.target.value)
                              : "",
                          })
                        }
                      >
                        <option value="">{t("Chưa gán")}</option>
                        {staffUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="text-sm text-[var(--ink)] sm:col-span-2">
                      <span className={tableMetaClass}>{copy.timeline}</span>
                      <div className="mt-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-xs text-[var(--muted)]">
                        <p>
                          {copy.created}:{" "}
                          {formatDateTime(
                            selectedTicket.createdAt ?? new Date().toISOString(),
                          )}
                        </p>
                        <p>
                          {copy.updated}:{" "}
                          {formatDateTime(
                            selectedTicket.updatedAt ??
                              selectedTicket.createdAt ??
                              new Date().toISOString(),
                          )}
                        </p>
                        <p>
                          {copy.resolved}:{" "}
                          {selectedTicket.resolvedAt
                            ? formatDateTime(selectedTicket.resolvedAt)
                            : "-"}
                        </p>
                        <p>
                          {copy.closed}:{" "}
                          {selectedTicket.closedAt
                            ? formatDateTime(selectedTicket.closedAt)
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
                  <div>
                    <p className={tableMetaClass}>{composerTitle}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {t(
                        "Chọn rõ nội dung gửi cho đại lý hay chỉ lưu lại cho người xử lý.",
                      )}
                    </p>
                  </div>

                  <div className="mt-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-muted)] p-1">
                    <button
                      type="button"
                      className={[
                        "rounded-full px-4 py-2 text-sm font-medium transition",
                        !isInternalNoteDraft
                          ? "bg-[var(--accent)] text-white"
                          : "text-[var(--muted)] hover:text-[var(--ink)]",
                      ].join(" ")}
                      disabled={isSaving || isDeletingAttachment}
                      onClick={() => updateSelectedDraft({ internalNote: false })}
                    >
                      {t("Gửi cho đại lý")}
                    </button>
                    <button
                      type="button"
                      className={[
                        "rounded-full px-4 py-2 text-sm font-medium transition",
                        isInternalNoteDraft
                          ? "bg-amber-500 text-white"
                          : "text-[var(--muted)] hover:text-[var(--ink)]",
                      ].join(" ")}
                      disabled={isSaving}
                      onClick={() => updateSelectedDraft({ internalNote: true })}
                    >
                      {t("Ghi chú nội bộ")}
                    </button>
                  </div>

                  <div
                    className={[
                      "mt-4 rounded-2xl border px-4 py-3 text-sm",
                      isInternalNoteDraft
                        ? "border-amber-200 bg-amber-50 text-amber-900"
                        : "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]",
                    ].join(" ")}
                  >
                    <p className="font-medium">{composerTitle}</p>
                    <p className="mt-1">{composerHint}</p>
                  </div>

                  <label className="mt-4 block text-sm text-[var(--ink)]">
                    <span className={tableMetaClass}>{composerLabel}</span>
                    <textarea
                      className={`${textareaClass} mt-2 min-h-[120px]`}
                      value={selectedDraft.replyDraft}
                      onChange={(event) =>
                        updateSelectedDraft({ replyDraft: event.target.value })
                      }
                      placeholder={composerPlaceholder}
                    />
                  </label>

                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className={tableMetaClass}>
                        {t("Tệp đính kèm cho nội dung này")}
                      </span>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] hover:border-[var(--accent)]">
                        <Upload className="h-4 w-4" />
                        <span>
                          {isUploadingAttachment
                            ? t("Đang tải tệp...")
                            : t("Tải tệp minh chứng")}
                        </span>
                        <input
                          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,application/pdf,.jpg,.jpeg,.png,.webp,.mp4,.webm,.pdf"
                          className="hidden"
                          disabled={
                            isUploadingAttachment ||
                            isSaving ||
                            isDeletingAttachment
                          }
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            void handleAttachmentUpload(file);
                            event.currentTarget.value = "";
                          }}
                          type="file"
                        />
                      </label>
                    </div>
                    {isUploadingAttachment ? (
                      <p className="text-xs text-[var(--muted)]">
                        {uploadingFileName
                          ? `${uploadingFileName}: ${uploadProgress}%`
                          : `${uploadProgress}%`}
                      </p>
                    ) : null}
                    {selectedDraft.attachments.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedDraft.attachments.map((attachment, index) => (
                          <SupportAttachmentView
                            key={`${attachment.id ?? attachment.url}-${index}`}
                            attachment={attachment}
                            t={t}
                            accessToken={accessToken}
                            removable
                            onRemove={
                              isDeletingAttachment
                                ? undefined
                                : () => void removeDraftAttachment(attachment)
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--muted)]">
                        {t("Chưa có tệp đính kèm cho nội dung này.")}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-3">
                    <GhostButton
                      disabled={
                        isSaving ||
                        isDeletingAttachment ||
                        !selectedDraft.replyDraft.trim()
                      }
                      onClick={() => void handleSendMessage()}
                      type="button"
                    >
                      {isInternalNoteDraft ? copy.saveInternal : copy.sendReply}
                    </GhostButton>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={MessageSquareMore}
                title={copy.emptyDetailTitle}
                message={copy.emptyDetailMessage}
              />
            )}
          </div>
        </div>
      )}
    </PagePanel>
  );
}

export default SupportTicketsPageRevamp;



