import { LifeBuoy, MessageSquareMore, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAllAdminSupportTickets,
  fetchAdminSupportTickets,
  updateAdminSupportTicket,
  type BackendSupportTicketResponse,
  type BackendSupportTicketStatus,
} from "../lib/adminApi";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCopy } from "../lib/i18n";
import { useToast } from "../context/ToastContext";
import { formatDateTime } from "../lib/formatters";
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
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

const STATUS_TRANSITIONS: Record<
  BackendSupportTicketStatus,
  BackendSupportTicketStatus[]
> = {
  OPEN: ["OPEN", "IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["IN_PROGRESS", "OPEN", "RESOLVED", "CLOSED"],
  RESOLVED: ["RESOLVED", "IN_PROGRESS", "CLOSED"],
  CLOSED: ["CLOSED"],
};

const statusTone = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  CLOSED: "neutral",
} as const;

const priorityTone = {
  NORMAL: "neutral",
  HIGH: "warning",
  URGENT: "danger",
} as const;

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
  reply: "Phản hồi admin",
  save: "Lưu cập nhật",
  created: "Tạo lúc",
  updated: "Cập nhật",
  closed: "Đóng",
  next: "Tiếp",
  previous: "Trước",
  emptyTitle: "Không có ticket phù hợp",
  emptyMessage: "Thử thay đổi bộ lọc hoặc tải lại dữ liệu.",
  loadTitle: "Không tải được ticket",
  loadFallback: "Danh sách ticket chưa thể tải.",
  reload: "Tải lại",
} as const;

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
    "ALL" | BackendSupportTicketStatus
  >("ALL");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [statusDraft, setStatusDraft] =
    useState<BackendSupportTicketStatus>("OPEN");
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasActiveFilters = query.trim().length > 0 || statusFilter !== "ALL";

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
        setTickets(response.items);
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
    [accessToken, copy.loadFallback],
  );

  useEffect(() => {
    void loadTickets(page);
  }, [loadTickets, page]);

  const loadAllTickets = useCallback(async () => {
    if (!accessToken) return;
    setIsFilterLoading(true);
    setError(null);
    try {
      const response = await fetchAllAdminSupportTickets(accessToken, 100);
      setAllTickets(response);
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
  }, [accessToken, copy.loadFallback]);

  useEffect(() => {
    if (!hasActiveFilters) {
      setAllTickets([]);
      setIsFilterLoading(false);
      setError(null);
      return;
    }

    void loadAllTickets();
  }, [hasActiveFilters, loadAllTickets]);

  const sourceTickets = hasActiveFilters ? allTickets : tickets;

  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sourceTickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : ticket.status === statusFilter;
      const haystack = [
        ticket.ticketCode,
        ticket.dealerName,
        ticket.subject,
        ticket.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        matchesStatus &&
        (!normalizedQuery || haystack.includes(normalizedQuery))
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

  useEffect(() => {
    if (!selectedTicket) return;
    setReplyDraft(selectedTicket.adminReply ?? "");
    setStatusDraft(selectedTicket.status ?? "OPEN");
  }, [selectedTicket]);

  const allowedStatusOptions = useMemo(
    () =>
      STATUS_TRANSITIONS[selectedTicket?.status ?? "OPEN"] ?? STATUS_OPTIONS,
    [selectedTicket],
  );

  useEffect(() => {
    if (!allowedStatusOptions.includes(statusDraft)) {
      setStatusDraft(selectedTicket?.status ?? "OPEN");
    }
  }, [allowedStatusOptions, selectedTicket, statusDraft]);

  const stats = useMemo(
    () => ({
      open: sourceTickets.filter((ticket) => ticket.status === "OPEN").length,
      progress: sourceTickets.filter(
        (ticket) => ticket.status === "IN_PROGRESS",
      ).length,
      resolved: sourceTickets.filter((ticket) => ticket.status === "RESOLVED")
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

  const handleSave = async () => {
    if (!accessToken || !selectedTicket) return;
    setIsSaving(true);
    try {
      const updated = await updateAdminSupportTicket(
        accessToken,
        selectedTicket.id,
        {
          status: statusDraft,
          adminReply: replyDraft,
        },
      );
      setTickets((current) =>
        current.map((ticket) => (ticket.id === updated.id ? updated : ticket)),
      );
      setAllTickets((current) =>
        current.map((ticket) => (ticket.id === updated.id ? updated : ticket)),
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
                event.target.value as "ALL" | BackendSupportTicketStatus,
              )
            }
          >
            <option value="ALL">{copy.all}</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.9fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)]">
        <div className="min-w-0 space-y-3">
          {filteredTickets.length === 0 ? (
            <EmptyState
              icon={LifeBuoy}
              title={copy.emptyTitle}
              message={copy.emptyMessage}
            />
          ) : (
            filteredTickets.map((ticket) => {
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
                        {ticket.ticketCode ?? `#${ticket.id}`} ·{" "}
                        {ticket.subject ?? "-"}
                      </p>
                      <p className={tableMetaClass}>
                        {ticket.dealerName ?? "-"} ·{" "}
                        {formatDateTime(
                          ticket.createdAt ?? new Date().toISOString(),
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        tone={
                          priorityTone[ticket.priority ?? "NORMAL"] ?? "neutral"
                        }
                      >
                        {ticket.priority ?? "NORMAL"}
                      </StatusBadge>
                      <StatusBadge tone={statusTone[ticket.status ?? "OPEN"]}>
                        {ticket.status ?? "OPEN"}
                      </StatusBadge>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-[var(--ink)]">
                    {ticket.message ?? "-"}
                  </p>
                </button>
              );
            })
          )}
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
          {selectedTicket ? (
            <div className="space-y-4">
              <div>
                <p className={tableMetaClass}>{copy.selected}</p>
                <h4 className="mt-2 text-lg font-semibold text-[var(--ink)]">
                  {selectedTicket.ticketCode ?? `#${selectedTicket.id}`}
                </h4>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {selectedTicket.dealerName ?? "-"} ·{" "}
                  {selectedTicket.category ?? "OTHER"} ·{" "}
                  {formatDateTime(selectedTicket.createdAt ?? new Date().toISOString())}
                </p>
              </div>

              {/* Conversation thread */}
              <div className="space-y-3">
                {/* Dealer message */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {selectedTicket.dealerName ?? t("Đại lý")}
                  </p>
                  <p className="text-sm text-[var(--ink)]">
                    {selectedTicket.message ?? "-"}
                  </p>
                </div>

                {/* Existing admin reply (read-only view) */}
                {selectedTicket.adminReply && (
                  <div className="rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                      Admin
                    </p>
                    <p className="text-sm text-[var(--ink)]">
                      {selectedTicket.adminReply}
                    </p>
                    {selectedTicket.updatedAt && (
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {formatDateTime(selectedTicket.updatedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-[var(--ink)]">
                  <span className={tableMetaClass}>{copy.status}</span>
                  <select
                    className={`mt-2 w-full ${tableActionSelectClass}`}
                    value={statusDraft}
                    onChange={(event) =>
                      setStatusDraft(
                        event.target.value as BackendSupportTicketStatus,
                      )
                    }
                  >
                    {allowedStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="text-sm text-[var(--ink)]">
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
                  value={replyDraft}
                  onChange={(event) => setReplyDraft(event.target.value)}
                />
              </label>

              <div className="flex justify-end">
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
              title={copy.emptyTitle}
              message={copy.emptyMessage}
            />
          )}
        </div>
      </div>
    </PagePanel>
  );
}

export default SupportTicketsPageRevamp;
