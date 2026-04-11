import { LifeBuoy, MessageSquareMore, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createAdminSupportTicketMessage,
  fetchAllAdminSupportTickets,
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

type TicketDraftState = {
  replyDraft: string;
  statusDraft: BackendSupportTicketStatus;
  assigneeDraft: number | "";
  internalNote: boolean;
};

type ThreadItem = {
  key: string;
  authorRole: "dealer" | "admin" | "system";
  authorName?: string | null;
  internalNote: boolean;
  message: string;
  createdAt?: string | null;
  attachments: Array<{
    url: string;
    fileName?: string | null;
  }>;
  syntheticRoot?: boolean;
};

const copyKeys = {
  title: "Hỗ trợ",
  description:
    "Theo dõi ticket từ đại lý, điều phối trạng thái và phản hồi trực tiếp trong admin.",
  searchLabel: "Tìm ticket",
  searchPlaceholder: "Tìm mã ticket, đại lý, chủ đề...",
  status: "Trạng thái",
  all: "Tất cả",
  open: "Đang mở",
  processing: "Đang xử lý",
  resolved: "Đã xử lý",
  selected: "Ticket đang chọn",
  timeline: "Dòng thời gian",
  reply: "Nội dung phản hồi",
  save: "Lưu cập nhật",
  sendReply: "Gửi phản hồi công khai",
  saveInternal: "Lưu ghi chú nội bộ",
  assignee: "Người phụ trách",
  created: "Tạo lúc",
  updated: "Cập nhật",
  closed: "Đóng",
  next: "Tiếp",
  previous: "Trước",
  emptyTitle: "Chưa có ticket hỗ trợ",
  emptyMessage: "Ticket từ đại lý sẽ xuất hiện ở đây khi có yêu cầu mới.",
  emptyDetailTitle: "Chọn một ticket để xem chi tiết",
  emptyDetailMessage:
    "Khi ticket từ đại lý xuất hiện, bạn sẽ xem được toàn bộ cuộc hội thoại tại đây.",
  loadTitle: "Không tải được ticket",
  loadFallback: "Danh sách ticket chưa thể tải.",
  reload: "Tải lại",
} as const;

function createDraft(ticket: BackendSupportTicketResponse): TicketDraftState {
  return {
    replyDraft: "",
    statusDraft: ticket.status ?? "open",
    assigneeDraft: ticket.assigneeId ?? "",
    internalNote: false,
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
        ? message.attachments.filter((attachment) => !!attachment?.url)
        : [],
    });
  }

  return thread;
}

function SupportTicketsPageRevamp() {
  const { t } = useLanguage();
  const copy = translateCopy(copyKeys, t);
  const { accessToken } = useAuth();
  const { notify } = useToast();
  const [tickets, setTickets] = useState<BackendSupportTicketResponse[]>([]);
  const [allTickets, setAllTickets] = useState<BackendSupportTicketResponse[]>(
    [],
  );
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasActiveFilters = query.trim().length > 0 || statusFilter !== "all";

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
              response.items.find((item) => item.id === current)?.id ??
              response.items[0].id,
          );
        } else {
          setSelectedId(null);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : copy.loadFallback,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, copy.loadFallback, mergeTickets],
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
            response.find((item) => item.id === current)?.id ?? response[0].id,
        );
      } else {
        setSelectedId(null);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : copy.loadFallback,
      );
    } finally {
      setIsFilterLoading(false);
    }
  }, [accessToken, copy.loadFallback, mergeTickets]);

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

  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sourceTickets.filter((ticket) => {
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
        matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery))
      );
    });
  }, [query, sourceTickets, statusFilter]);

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
    ? draftsByTicketId[selectedTicket.id] ?? createDraft(selectedTicket)
    : null;

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

  const replaceTicket = useCallback(
    (updated: BackendSupportTicketResponse) => {
      setTickets((current) =>
        current.map((ticket) => (ticket.id === updated.id ? updated : ticket)),
      );
      setAllTickets((current) =>
        current.map((ticket) => (ticket.id === updated.id ? updated : ticket)),
      );
      setDraftsByTicketId((current) => ({
        ...current,
        [updated.id]: {
          ...(current[updated.id] ?? createDraft(updated)),
          statusDraft: updated.status ?? "open",
          assigneeDraft: updated.assigneeId ?? "",
        },
      }));
    },
    [],
  );

  const handleSave = async () => {
    if (!accessToken || !selectedTicket || !selectedDraft) return;
    setIsSaving(true);
    try {
      const updated = await updateAdminSupportTicket(accessToken, selectedTicket.id, {
        status: selectedDraft.statusDraft,
        assigneeId:
          selectedDraft.assigneeDraft === "" ? null : selectedDraft.assigneeDraft,
      });
      replaceTicket(updated);
      notify(t("Đã lưu cập nhật ticket."), {
        title: copy.title,
        variant: "success",
      });
    } catch (saveError) {
      notify(
        saveError instanceof Error ? saveError.message : copy.loadFallback,
        {
          title: copy.title,
          variant: "error",
        },
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!accessToken || !selectedTicket || !selectedDraft?.replyDraft.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      const updated = await createAdminSupportTicketMessage(
        accessToken,
        selectedTicket.id,
        {
          message: selectedDraft.replyDraft.trim(),
          internalNote: selectedDraft.internalNote,
        },
      );
      replaceTicket(updated);
      setDraftsByTicketId((current) => ({
        ...current,
        [selectedTicket.id]: {
          ...(current[selectedTicket.id] ?? createDraft(updated)),
          replyDraft: "",
          internalNote: false,
          statusDraft: updated.status ?? "open",
          assigneeDraft: updated.assigneeId ?? "",
        },
      }));
      notify(
        selectedDraft.internalNote
          ? t("Đã lưu ghi chú nội bộ.")
          : t("Đã gửi phản hồi tới đại lý."),
        {
          title: copy.title,
          variant: "success",
        },
      );
    } catch (saveError) {
      notify(
        saveError instanceof Error ? saveError.message : copy.loadFallback,
        {
          title: copy.title,
          variant: "error",
        },
      );
    } finally {
      setIsSaving(false);
    }
  };

  const statusLabel = useCallback(
    (status: BackendSupportTicketStatus | null | undefined) => {
      switch (status) {
        case "in_progress":
          return t("Đang xử lý");
        case "resolved":
          return t("Đã xử lý");
        case "closed":
          return t("Đã đóng");
        case "open":
        default:
          return t("Đang mở");
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

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard
          icon={LifeBuoy}
          label={copy.open}
          value={stats.open}
          tone="warning"
        />
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
                        tone={priorityTone[ticket.priority ?? "normal"] ?? "neutral"}
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
                </div>

                {selectedTicket.contextData ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                    <p className={`${tableMetaClass} mb-2`}>
                      {t("Ngữ cảnh ticket")}
                    </p>
                    <div className="grid gap-2 text-sm text-[var(--ink)] sm:grid-cols-2">
                      {selectedTicket.contextData.orderCode ? (
                        <p>
                          <span className="font-medium">{t("Mã đơn hàng")}:</span>{" "}
                          {selectedTicket.contextData.orderCode}
                        </p>
                      ) : null}
                      {selectedTicket.contextData.transactionCode ? (
                        <p>
                          <span className="font-medium">{t("Mã giao dịch")}:</span>{" "}
                          {selectedTicket.contextData.transactionCode}
                        </p>
                      ) : null}
                      {selectedTicket.contextData.paidAmount != null ? (
                        <p>
                          <span className="font-medium">{t("Số tiền đã chuyển")}:</span>{" "}
                          {selectedTicket.contextData.paidAmount}
                        </p>
                      ) : null}
                      {selectedTicket.contextData.paymentReference ? (
                        <p>
                          <span className="font-medium">{t("Nội dung chuyển khoản")}:</span>{" "}
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
                          <span className="font-medium">{t("Lý do trả hàng")}:</span>{" "}
                          {selectedTicket.contextData.returnReason}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
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
                          ? message.authorName ?? selectedTicket.dealerName ?? t("Đại lý")
                          : message.authorRole === "admin"
                            ? message.authorName ?? "Admin"
                            : message.authorName ?? t("Hệ thống")}
                        {message.syntheticRoot ? ` • ${t("Yêu cầu gốc")}` : ""}
                        {message.internalNote ? ` • ${t("Ghi chú nội bộ")}` : ""}
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-[var(--ink)]">
                        {message.message}
                      </p>
                      {message.attachments.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.attachments.map((attachment, index) => (
                            <a
                              key={`${message.key}-attachment-${index}`}
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--ink)] hover:border-[var(--accent)]"
                            >
                              {attachment.fileName || t("Tệp đính kèm")}
                            </a>
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

                <div className="grid gap-3 sm:grid-cols-2">
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
                    <div className="mt-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs text-[var(--muted)]">
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

                <label className="block text-sm text-[var(--ink)]">
                  <span className={tableMetaClass}>{copy.reply}</span>
                  <textarea
                    className={`${textareaClass} mt-2 min-h-[120px]`}
                    value={selectedDraft.replyDraft}
                    onChange={(event) =>
                      updateSelectedDraft({ replyDraft: event.target.value })
                    }
                    placeholder={
                      selectedDraft.internalNote
                        ? t("Nhập ghi chú nội bộ chỉ dành cho admin...")
                        : t("Nhập phản hồi sẽ được gửi tới đại lý...")
                    }
                  />
                </label>

                <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={selectedDraft.internalNote}
                    onChange={(event) =>
                      updateSelectedDraft({
                        internalNote: event.target.checked,
                      })
                    }
                  />
                  {t("Gửi dưới dạng ghi chú nội bộ")}
                </label>

                <div className="flex flex-wrap justify-end gap-3">
                  <GhostButton
                    disabled={isSaving || !selectedDraft.replyDraft.trim()}
                    onClick={() => void handleSendMessage()}
                    type="button"
                  >
                    {selectedDraft.internalNote
                      ? copy.saveInternal
                      : copy.sendReply}
                  </GhostButton>
                  <PrimaryButton
                    disabled={isSaving}
                    onClick={() => void handleSave()}
                    type="button"
                  >
                    {isSaving ? `${copy.save}...` : copy.save}
                  </PrimaryButton>
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
