import { CircleDollarSign, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAdminOrderById,
  fetchAdminUnmatchedPayments,
  resolveAdminUnmatchedPayment,
  type BackendOrderResponse,
  type BackendUnmatchedPaymentReason,
  type BackendUnmatchedPaymentResponse,
  type BackendUnmatchedPaymentStatus,
} from "../lib/adminApi";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency, formatDateTime } from "../lib/formatters";
import {
  EmptyState,
  ErrorState,
  FieldErrorMessage,
  GhostButton,
  LoadingRows,
  PageHeader,
  PagePanel,
  PaginationNav,
  PrimaryButton,
  StatCard,
  StatusBadge,
  bodyTextClass,
  inputClass,
  softCardClass,
  tableActionSelectClass,
  textareaClass,
} from "../components/ui-kit";
import { subscribeAdminRealtimeNotification } from "../lib/adminRealtime";

const STATUS_OPTIONS: BackendUnmatchedPaymentStatus[] = [
  "PENDING",
  "MATCHED",
  "REFUNDED",
  "WRITTEN_OFF",
];

const RESOLUTION_OPTIONS: BackendUnmatchedPaymentStatus[] = [
  "MATCHED",
  "REFUNDED",
  "WRITTEN_OFF",
];

const REASON_OPTIONS: BackendUnmatchedPaymentReason[] = [
  "ORDER_NOT_FOUND",
  "AMOUNT_MISMATCH",
  "ORDER_ALREADY_SETTLED",
  "ORDER_CANCELLED",
];

const statusTone = {
  PENDING: "warning",
  MATCHED: "success",
  REFUNDED: "info",
  WRITTEN_OFF: "neutral",
} as const;

const PAGE_SIZE = 20;

const copyByLanguage = {
  vi: {
    title: "Thanh toán không khớp",
    description:
      "Xem các giao dịch SePay chưa ghép được với đơn hàng, đọc nhanh nguyên nhân và xử lý từng case ngay trong một màn hình.",
    status: "Trạng thái",
    statusPending: "Chờ xử lý",
    statusMatched: "Đã khớp",
    statusRefunded: "Đã hoàn tiền",
    statusWrittenOff: "Đã xóa sổ",
    reason: "Lý do",
    reasonAll: "Tất cả lý do",
    reasonOrderNotFound: "Không tìm thấy đơn",
    reasonAmountMismatch: "Sai số tiền",
    reasonOrderAlreadySettled: "Đơn đã thanh toán",
    reasonOrderCancelled: "Đơn đã hủy",
    all: "Tất cả",
    reload: "Tải lại",
    queueTitle: "Danh sách case",
    queueHint: "Chọn một giao dịch để xem chi tiết và xử lý.",
    detailTitle: "Chi tiết giao dịch",
    detailHint: "Kiểm tra nguyên nhân, đơn gợi ý và cập nhật kết quả xử lý.",
    amount: "Số tiền",
    sender: "Người gửi",
    content: "Nội dung",
    receivedAt: "Nhận lúc",
    orderHint: "Đơn gợi ý",
    matchedOrder: "Đơn đã khớp",
    matchedOrderIdInput: "Mã đơn để ghép",
    allocationAmount: "Số tiền ghép",
    allocationHint: "Để trống để ghép toàn bộ số tiền giao dịch.",
    targetOrder: "Đơn mục tiêu",
    orderTotal: "Tổng đơn",
    orderPaid: "Đã thanh toán",
    orderOutstanding: "Còn phải thu",
    resolvedBy: "Xử lý bởi",
    resolvedAt: "Xử lý lúc",
    resolution: "Ghi chú xử lý",
    newStatus: "Trạng thái mới",
    resolutionNote: "Ghi chú",
    resolutionPlaceholder: "Mô tả cách bạn xử lý giao dịch này...",
    save: "Lưu xử lý",
    emptyTitle: "Không có giao dịch phù hợp",
    emptyMessage: "Thử thay đổi bộ lọc hoặc tải lại dữ liệu.",
    loadTitle: "Không tải được danh sách giao dịch",
    loadMessage: "Vui lòng kiểm tra kết nối và thử lại.",
    loadFallback: "Danh sách giao dịch chưa thể tải.",
    saveError: "Không lưu được thay đổi.",
    saveSuccess: "Đã cập nhật trạng thái giao dịch.",
    loadOrderFailed: "Không tải được thông tin đơn hàng.",
    matchOrderRequired: "Vui lòng nhập mã đơn cần ghép khi chọn trạng thái Đã khớp.",
    invalidOrderId: "Mã đơn không hợp lệ.",
    noSelectionTitle: "Chưa chọn giao dịch nào",
    noSelectionMessage: "Hãy chọn một case ở danh sách bên trái để xem chi tiết và xử lý.",
    summaryOpen: "Case đang mở",
    summaryPending: "Cần xử lý",
    summaryResolved: "Đã xử lý trên trang này",
    reviewBanner: "Case đang chờ xử lý",
    reviewSubtle: "Ưu tiên xác nhận lại đơn gợi ý trước khi chốt kết quả.",
    listStatusTitle: "Trạng thái hiện tại",
    previousLabel: "Trước",
    nextLabel: "Tiếp",
    missing: "Chưa có",
  },
  en: {
    title: "Unmatched payments",
    description:
      "Review SePay transfers that are not matched to an order, scan the root cause quickly, and resolve each case from one workspace.",
    status: "Status",
    statusPending: "Pending",
    statusMatched: "Matched",
    statusRefunded: "Refunded",
    statusWrittenOff: "Written off",
    reason: "Reason",
    reasonAll: "All reasons",
    reasonOrderNotFound: "Order not found",
    reasonAmountMismatch: "Amount mismatch",
    reasonOrderAlreadySettled: "Order already settled",
    reasonOrderCancelled: "Order cancelled",
    all: "All",
    reload: "Reload",
    queueTitle: "Case queue",
    queueHint: "Choose a payment to inspect details and resolve it.",
    detailTitle: "Payment details",
    detailHint: "Review the cause, suggested order, and record the resolution outcome.",
    amount: "Amount",
    sender: "Sender",
    content: "Content",
    receivedAt: "Received at",
    orderHint: "Suggested order",
    matchedOrder: "Matched order",
    matchedOrderIdInput: "Match to order ID",
    allocationAmount: "Allocation amount",
    allocationHint: "Leave empty to allocate the full unmatched amount.",
    targetOrder: "Target order",
    orderTotal: "Order total",
    orderPaid: "Paid",
    orderOutstanding: "Outstanding",
    resolvedBy: "Resolved by",
    resolvedAt: "Resolved at",
    resolution: "Resolution note",
    newStatus: "New status",
    resolutionNote: "Resolution note",
    resolutionPlaceholder: "Describe how this payment was handled...",
    save: "Save resolution",
    emptyTitle: "No matching payments",
    emptyMessage: "Try a different filter or reload the data.",
    loadTitle: "Unable to load payments",
    loadMessage: "Please check your connection and try again.",
    loadFallback: "The unmatched payment list could not be loaded.",
    saveError: "Could not save changes.",
    saveSuccess: "Payment status updated.",
    loadOrderFailed: "Could not load target order details.",
    matchOrderRequired: "Please provide a target order id when status is Matched.",
    invalidOrderId: "Invalid order id.",
    noSelectionTitle: "No payment selected",
    noSelectionMessage: "Choose a case from the list to inspect details and resolve it.",
    summaryOpen: "Open cases",
    summaryPending: "Pending",
    summaryResolved: "Resolved on this page",
    reviewBanner: "This case still needs resolution",
    reviewSubtle: "Confirm the suggested order before finalizing the result.",
    listStatusTitle: "Current status",
    previousLabel: "Previous",
    nextLabel: "Next",
    missing: "Not provided",
  },
} as const;

function UnmatchedPaymentsPageRevamp() {
  const { language } = useLanguage();
  const copy = copyByLanguage[language];
  const { accessToken } = useAuth();
  const { notify } = useToast();

  const [items, setItems] = useState<BackendUnmatchedPaymentResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"ALL" | BackendUnmatchedPaymentStatus>("ALL");
  const [reasonFilter, setReasonFilter] = useState<"ALL" | BackendUnmatchedPaymentReason>("ALL");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusDraft, setStatusDraft] = useState<BackendUnmatchedPaymentStatus>("MATCHED");
  const [resolutionDraft, setResolutionDraft] = useState("");
  const [matchedOrderIdDraft, setMatchedOrderIdDraft] = useState("");
  const [allocationAmountDraft, setAllocationAmountDraft] = useState("");
  const [matchedOrderPreview, setMatchedOrderPreview] = useState<BackendOrderResponse | null>(null);
  const [isOrderPreviewLoading, setIsOrderPreviewLoading] = useState(false);
  const [matchedOrderPreviewError, setMatchedOrderPreviewError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const orderPreviewRequestIdRef = useRef(0);

  const statusLabels: Record<BackendUnmatchedPaymentStatus, string> = {
    PENDING: copy.statusPending,
    MATCHED: copy.statusMatched,
    REFUNDED: copy.statusRefunded,
    WRITTEN_OFF: copy.statusWrittenOff,
  };

  const reasonLabels: Record<BackendUnmatchedPaymentReason, string> = {
    ORDER_NOT_FOUND: copy.reasonOrderNotFound,
    AMOUNT_MISMATCH: copy.reasonAmountMismatch,
    ORDER_ALREADY_SETTLED: copy.reasonOrderAlreadySettled,
    ORDER_CANCELLED: copy.reasonOrderCancelled,
  };

  const loadPage = useCallback(
    async (nextPage: number, nextStatus: "ALL" | BackendUnmatchedPaymentStatus, nextReason: "ALL" | BackendUnmatchedPaymentReason) => {
      if (!accessToken) {
        return;
      }

      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);
      setSaveError(null);

      try {
        const response = await fetchAdminUnmatchedPayments(accessToken, {
          page: nextPage,
          size: PAGE_SIZE,
          status: nextStatus === "ALL" ? undefined : nextStatus,
          reason: nextReason === "ALL" ? undefined : nextReason,
        });

        if (requestIdRef.current !== requestId) {
          return;
        }

        setItems(response.items);
        setPage(response.page);
        setTotalPages(response.totalPages);
        setTotalItems(response.totalElements);
        setSelectedId((current) =>
          response.items.find((item) => item.id === current)?.id ?? response.items[0]?.id ?? null,
        );
      } catch (loadError) {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : copy.loadFallback);
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [accessToken, copy.loadFallback],
  );

  const loadMatchedOrderPreview = useCallback(
    async (orderId: number) => {
      if (!accessToken || !Number.isInteger(orderId) || orderId <= 0) {
        setMatchedOrderPreview(null);
        setMatchedOrderPreviewError(null);
        return;
      }

      const requestId = ++orderPreviewRequestIdRef.current;
      setIsOrderPreviewLoading(true);
      setMatchedOrderPreviewError(null);
      try {
        const order = await fetchAdminOrderById(accessToken, orderId);
        if (orderPreviewRequestIdRef.current !== requestId) {
          return;
        }
        setMatchedOrderPreview(order);
      } catch (_) {
        if (orderPreviewRequestIdRef.current !== requestId) {
          return;
        }
        setMatchedOrderPreview(null);
        setMatchedOrderPreviewError(copy.loadOrderFailed);
      } finally {
        if (orderPreviewRequestIdRef.current === requestId) {
          setIsOrderPreviewLoading(false);
        }
      }
    },
    [accessToken, copy.loadOrderFailed],
  );

  useEffect(() => {
    void loadPage(0, statusFilter, reasonFilter);
  }, [loadPage, reasonFilter, statusFilter]);

  useEffect(() => {
    return subscribeAdminRealtimeNotification(() => {
      void loadPage(page, statusFilter, reasonFilter);
    });
  }, [loadPage, page, reasonFilter, statusFilter]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  useEffect(() => {
    if (!selectedItem) {
      setStatusDraft("MATCHED");
      setResolutionDraft("");
      setMatchedOrderIdDraft("");
      setAllocationAmountDraft("");
      setMatchedOrderPreview(null);
      setMatchedOrderPreviewError(null);
      return;
    }

    setStatusDraft(selectedItem.status === "PENDING" ? "MATCHED" : selectedItem.status ?? "MATCHED");
    setResolutionDraft(selectedItem.resolution ?? "");
    setMatchedOrderIdDraft(selectedItem.matchedOrderId ? String(selectedItem.matchedOrderId) : "");
    setAllocationAmountDraft("");
  }, [selectedItem]);

  useEffect(() => {
    if (statusDraft !== "MATCHED") {
      setMatchedOrderPreview(null);
      setMatchedOrderPreviewError(null);
      setIsOrderPreviewLoading(false);
      return;
    }

    const normalized = matchedOrderIdDraft.trim();
    if (!normalized) {
      setMatchedOrderPreview(null);
      setMatchedOrderPreviewError(null);
      return;
    }

    const parsedOrderId = Number(normalized);
    if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
      setMatchedOrderPreview(null);
      setMatchedOrderPreviewError(copy.invalidOrderId);
      setIsOrderPreviewLoading(false);
      return;
    }

    void loadMatchedOrderPreview(parsedOrderId);
  }, [statusDraft, matchedOrderIdDraft, loadMatchedOrderPreview, copy.invalidOrderId]);

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "PENDING").length,
    [items],
  );

  const resolvedCount = useMemo(() => Math.max(items.length - pendingCount, 0), [items.length, pendingCount]);

  const handleSave = async () => {
    if (!accessToken || !selectedItem) {
      return;
    }

    const normalizedMatchedOrderId = matchedOrderIdDraft.trim();
    const parsedMatchedOrderId =
      statusDraft === "MATCHED" ? Number(normalizedMatchedOrderId) : undefined;
    if (statusDraft === "MATCHED") {
      if (!normalizedMatchedOrderId) {
        setSaveError(copy.matchOrderRequired);
        return;
      }
      if (!Number.isInteger(parsedMatchedOrderId) || (parsedMatchedOrderId ?? 0) <= 0) {
        setSaveError(copy.invalidOrderId);
        return;
      }
    }
    const normalizedAllocation = allocationAmountDraft.trim();
    const parsedAllocationAmount =
      statusDraft === "MATCHED" && normalizedAllocation
        ? Number(normalizedAllocation)
        : undefined;
    if (statusDraft === "MATCHED" && normalizedAllocation) {
      if (!Number.isFinite(parsedAllocationAmount) || (parsedAllocationAmount ?? 0) <= 0) {
        setSaveError(copy.allocationAmount);
        return;
      }
    }

    setSaveError(null);
    setIsSaving(true);

    try {
      const updated = await resolveAdminUnmatchedPayment(accessToken, selectedItem.id, {
        status: statusDraft,
        resolution: resolutionDraft.trim() || undefined,
        matchedOrderId: statusDraft === "MATCHED" ? parsedMatchedOrderId : undefined,
        allocationAmount: statusDraft === "MATCHED" ? parsedAllocationAmount : undefined,
      });
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedId(updated.id);
      notify(copy.saveSuccess, { title: copy.title, variant: "success" });
    } catch (nextError) {
      setSaveError(copy.saveError);
      notify(nextError instanceof Error ? nextError.message : copy.saveError, {
        title: copy.title,
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && items.length === 0) {
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
          message={copy.loadMessage}
          onRetry={() => void loadPage(page, statusFilter, reasonFilter)}
        />
      </PagePanel>
    );
  }

  return (
    <PagePanel>
      <PageHeader
        title={copy.title}
        subtitle={copy.description}
        actions={
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:flex-wrap lg:justify-end">
            <select
              aria-label={copy.status}
              className={`${inputClass} w-full min-w-[12rem] lg:w-auto`}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "ALL" | BackendUnmatchedPaymentStatus)
              }
            >
              <option value="ALL">{copy.all}</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
            <select
              aria-label={copy.reason}
              className={`${inputClass} w-full min-w-[13rem] lg:w-auto`}
              value={reasonFilter}
              onChange={(event) =>
                setReasonFilter(event.target.value as "ALL" | BackendUnmatchedPaymentReason)
              }
            >
              <option value="ALL">{copy.reasonAll}</option>
              {REASON_OPTIONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reasonLabels[reason]}
                </option>
              ))}
            </select>
            <GhostButton onClick={() => void loadPage(page, statusFilter, reasonFilter)} type="button">
              <RefreshCw className="h-4 w-4" />
              {copy.reload}
            </GhostButton>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard icon={CircleDollarSign} label={copy.summaryOpen} value={String(totalItems)} tone="info" />
        <StatCard icon={CircleDollarSign} label={copy.summaryPending} value={String(pendingCount)} tone="warning" />
        <StatCard icon={CircleDollarSign} label={copy.summaryResolved} value={String(resolvedCount)} tone="success" />
      </div>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={copy.emptyTitle} message={copy.emptyMessage} />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.9fr)] xl:items-start">
          <section className="min-w-0 space-y-4">
            <div className={`${softCardClass} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    {copy.queueTitle}
                  </p>
                  <p className={bodyTextClass}>{copy.queueHint}</p>
                </div>
                <StatusBadge tone="warning">{pendingCount} {copy.statusPending}</StatusBadge>
              </div>
              <div className="mt-4 divide-y divide-[var(--border)]">
                {items.map((item) => {
                  const isSelected = item.id === selectedId;
                  const currentStatus = item.status ?? "PENDING";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={isSelected}
                      aria-current={isSelected ? "true" : undefined}
                      className={[
                        "w-full rounded-2xl px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
                        isSelected
                          ? "bg-[var(--accent-soft)]/45 shadow-[inset_0_0_0_1px_rgba(41,171,226,0.32)]"
                          : "hover:bg-[var(--surface)]",
                      ].join(" ")}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-[var(--ink)]">
                              {item.transactionCode ?? `#${item.id}`}
                            </p>
                            <StatusBadge tone={statusTone[currentStatus]}>{statusLabels[currentStatus]}</StatusBadge>
                          </div>
                          <p className="mt-1 text-xs text-[var(--muted)]">{reasonLabels[item.reason ?? "ORDER_NOT_FOUND"]}</p>
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            {copy.receivedAt}: {item.receivedAt ? formatDateTime(item.receivedAt) : copy.missing}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-[var(--ink)]">
                            {item.amount != null ? formatCurrency(Number(item.amount)) : copy.missing}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {item.orderCodeHint || copy.missing}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            {totalPages > 1 ? (
              <PaginationNav
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={PAGE_SIZE}
                onPageChange={(nextPage) => void loadPage(nextPage, statusFilter, reasonFilter)}
                previousLabel={copy.previousLabel}
                nextLabel={copy.nextLabel}
              />
            ) : null}
          </section>

          <section className="xl:sticky xl:top-24">
            <div className={`${softCardClass} p-5`}>
              {selectedItem ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                        {copy.detailTitle}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-[var(--ink)]">
                        {selectedItem.transactionCode ?? `#${selectedItem.id}`}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">{copy.detailHint}</p>
                    </div>
                    <StatusBadge tone={statusTone[selectedItem.status ?? "PENDING"]}>
                      {statusLabels[selectedItem.status ?? "PENDING"]}
                    </StatusBadge>
                  </div>

                  {selectedItem.status === "PENDING" ? (
                    <div className="mt-4 rounded-[18px] border border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--tone-warning-text)]">{copy.reviewBanner}</p>
                      <p className="mt-1 text-sm text-[var(--tone-warning-text)]/90">{copy.reviewSubtle}</p>
                    </div>
                  ) : null}

                  <dl className="mt-5 space-y-3 text-sm">
                    {[
                      { label: copy.amount, value: selectedItem.amount != null ? formatCurrency(Number(selectedItem.amount)) : copy.missing },
                      { label: copy.sender, value: selectedItem.senderInfo ?? copy.missing },
                      { label: copy.content, value: selectedItem.content ?? copy.missing },
                      { label: copy.reason, value: selectedItem.reason ? reasonLabels[selectedItem.reason] : copy.missing },
                      { label: copy.orderHint, value: selectedItem.orderCodeHint ?? copy.missing },
                      { label: copy.matchedOrder, value: selectedItem.matchedOrderId ? `#${selectedItem.matchedOrderId}` : copy.missing },
                      { label: copy.receivedAt, value: selectedItem.receivedAt ? formatDateTime(selectedItem.receivedAt) : copy.missing },
                      { label: copy.resolvedBy, value: selectedItem.resolvedBy ?? copy.missing },
                      { label: copy.resolvedAt, value: selectedItem.resolvedAt ? formatDateTime(selectedItem.resolvedAt) : copy.missing },
                    ].map((entry) => (
                      <div key={entry.label} className="grid gap-1 border-b border-[var(--border)] pb-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start">
                        <dt className="text-[var(--muted)]">{entry.label}</dt>
                        <dd className="font-medium text-[var(--ink)] sm:text-right">{entry.value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-5 space-y-3 border-t border-[var(--border)] pt-5">
                    <div>
                      <label htmlFor="unmatched-status" className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        {copy.newStatus}
                      </label>
                      <select
                        id="unmatched-status"
                        className={`${tableActionSelectClass} w-full`}
                        value={statusDraft}
                        onChange={(event) => {
                          setSaveError(null);
                          setStatusDraft(event.target.value as BackendUnmatchedPaymentStatus);
                        }}
                      >
                        {RESOLUTION_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </div>
                    {statusDraft === "MATCHED" ? (
                      <>
                        <div>
                          <label
                            htmlFor="unmatched-order-id"
                            className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]"
                          >
                            {copy.matchedOrderIdInput}
                          </label>
                          <input
                            id="unmatched-order-id"
                            className={inputClass}
                            inputMode="numeric"
                            placeholder="12345"
                            value={matchedOrderIdDraft}
                            onChange={(event) => {
                              setSaveError(null);
                              setMatchedOrderIdDraft(event.target.value);
                            }}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="unmatched-allocation-amount"
                            className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]"
                          >
                            {copy.allocationAmount}
                          </label>
                          <input
                            id="unmatched-allocation-amount"
                            className={inputClass}
                            inputMode="decimal"
                            placeholder={selectedItem.amount == null ? "0" : String(Number(selectedItem.amount))}
                            value={allocationAmountDraft}
                            onChange={(event) => {
                              setSaveError(null);
                              setAllocationAmountDraft(event.target.value);
                            }}
                          />
                          <p className="mt-1 text-xs text-[var(--muted)]">{copy.allocationHint}</p>
                        </div>
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-3 text-sm">
                          <p className="font-semibold text-[var(--ink)]">{copy.targetOrder}</p>
                          {isOrderPreviewLoading ? (
                            <p className="mt-2 text-[var(--muted)]">...</p>
                          ) : matchedOrderPreview ? (
                            <dl className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                              <div className="flex items-center justify-between gap-2">
                                <dt>{copy.matchedOrder}</dt>
                                <dd className="font-medium text-[var(--ink)]">{matchedOrderPreview.orderCode ?? `#${matchedOrderPreview.id}`}</dd>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <dt>{copy.orderTotal}</dt>
                                <dd className="font-medium text-[var(--ink)]">
                                  {matchedOrderPreview.totalAmount != null
                                    ? formatCurrency(Number(matchedOrderPreview.totalAmount))
                                    : copy.missing}
                                </dd>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <dt>{copy.orderPaid}</dt>
                                <dd className="font-medium text-[var(--ink)]">
                                  {matchedOrderPreview.paidAmount != null
                                    ? formatCurrency(Number(matchedOrderPreview.paidAmount))
                                    : copy.missing}
                                </dd>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <dt>{copy.orderOutstanding}</dt>
                                <dd className="font-medium text-[var(--ink)]">
                                  {matchedOrderPreview.outstandingAmount != null
                                    ? formatCurrency(Number(matchedOrderPreview.outstandingAmount))
                                    : copy.missing}
                                </dd>
                              </div>
                            </dl>
                          ) : (
                            <p className="mt-2 text-xs text-[var(--muted)]">
                              {matchedOrderPreviewError ?? copy.missing}
                            </p>
                          )}
                        </div>
                      </>
                    ) : null}
                    <div>
                      <label htmlFor="unmatched-resolution" className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        {copy.resolutionNote}
                      </label>
                      <textarea
                        id="unmatched-resolution"
                        className={textareaClass}
                        placeholder={copy.resolutionPlaceholder}
                        value={resolutionDraft}
                        onChange={(event) => {
                          setSaveError(null);
                          setResolutionDraft(event.target.value);
                        }}
                      />
                    </div>
                    {saveError ? <FieldErrorMessage message={saveError} /> : null}
                    <PrimaryButton className="w-full" disabled={isSaving} onClick={() => void handleSave()} type="button">
                      {isSaving ? "..." : copy.save}
                    </PrimaryButton>
                  </div>
                </>
              ) : (
                <EmptyState title={copy.noSelectionTitle} message={copy.noSelectionMessage} />
              )}
            </div>
          </section>
        </div>
      )}
    </PagePanel>
  );
}

export default UnmatchedPaymentsPageRevamp;
