import { AlertTriangle, ChevronDown, LoaderCircle, Package, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ErrorState,
  GhostButton,
  LoadingRows,
  PageHeader,
  PagePanel,
  PaginationNav,
  SearchInput,
  StatCard,
  StatusBadge,
  tableMetaClass,
} from "../components/ui-kit";
import { AdminTable, type AdminTableColumn } from "../components/AdminTable";
import { useAdminData, type Order, type OrderStatus } from "../context/AdminDataContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import {
  orderStatusLabel,
  orderStatusTone,
  resolveAllowedOrderStatuses,
} from "../lib/adminLabels";
import { formatCurrency } from "../lib/formatters";
import { fetchAdminOrdersPaged, fetchAdminOrderSummary } from "../lib/adminApi";
import { mapOrder, toBackendOrderStatus } from "../lib/adminDataMappers";
import { translateCopy } from "../lib/i18n";

const PAGE_SIZE = 25;

const canDeleteOrder = (status: OrderStatus) => status === "cancelled";

const parseStatusFilter = (value: string | null): "all" | OrderStatus => {
  switch (value) {
    case "pending":
    case "confirmed":
    case "shipping":
    case "completed":
    case "cancelled":
      return value;
    default:
      return "all";
  }
};

const copyKeys = {
  title: "Đơn hàng",
  allStatuses: "Tất cả",
  description: "Theo dõi xử lý đơn, xác nhận trạng thái và ưu tiên giao hàng.",
  searchLabel: "Tìm đơn hàng",
  searchPlaceholder: "Tìm mã đơn hoặc đại lý...",
  totalOrders: "Tổng đơn hàng",
  pendingOrders: "Chờ xử lý",
  shippingOrders: "Đang giao",
  emptyTitle: "Không có đơn hàng",
  emptyMessage: "Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.",
  loadTitle: "Không thể tải đơn hàng",
  loadFallback: "Không tải được danh sách đơn hàng",
  orderCode: "Mã đơn",
  dealer: "Đại lý",
  total: "Tổng giá trị",
  status: "Trạng thái",
  actions: "Thao tác",
  detail: "Xem chi tiết",
  reviewRequired: "Cần xem xét",
  shippingOverdue: "Chậm giao",
  changeStatusTitle: "Xác nhận đổi trạng thái",
  changeStatusMessage: 'Bạn có chắc muốn chuyển đơn này sang trạng thái "{status}" không?',
  changeStatusLabel: "Đổi trạng thái",
  cancelReasonTitle: "Xác nhận hủy đơn",
  cancelReasonMessage: "Vui lòng nhập lý do hủy. Hành động này không thể hoàn tác.",
  cancelReasonLabel: "Lý do hủy",
  cancelReasonPlaceholder: "Ví dụ: Khách yêu cầu hủy, Hết hàng, Lỗi giá...",
  cancelOrderLabel: "Hủy đơn",
  cancelAbortLabel: "Không hủy",
  deleteTitle: "Xóa đơn hàng",
  deleteMessage: "Hành động này sẽ xóa đơn hàng khỏi danh sách quản trị.",
  confirmDelete: "Xóa đơn",
  updateFailed: "Không cập nhật được đơn hàng",
  deleteFailed: "Không xóa được đơn hàng",
  deleteLabel: "Xóa",
  loading: "Đang cập nhật...",
  previousLabel: "Trước",
  nextLabel: "Tiếp",
  undoLabel: "Hoàn tác",
  selectedLabel: "đã chọn",
  clearSelection: "Bỏ chọn",
  batchChangeStatus: "Đổi trạng thái hàng loạt",
  mixedStatusHint: "Chọn đơn cùng trạng thái để đổi hàng loạt",
  batchUpdated: "Đã cập nhật {count} đơn hàng",
} as const;

function StatusActionMenu({
  options,
  onSelect,
  disabled,
  label,
  buttonLabel,
}: {
  options: Array<{ value: OrderStatus; label: string }>;
  onSelect: (status: OrderStatus) => void;
  disabled: boolean;
  label: string;
  buttonLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (options.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        aria-label={label}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-[var(--border)] px-3.5 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span>{buttonLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              className="block w-full px-4 py-2.5 text-left text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
              onClick={() => {
                onSelect(option.value);
                setOpen(false);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdersPageRevamp() {
  const { t } = useLanguage();
  const copy = translateCopy(copyKeys, t);
  const orderStatusOptions: Array<{ value: "all" | OrderStatus; label: string }> = [
    { value: "all", label: copy.allStatuses },
    { value: "pending", label: t(orderStatusLabel.pending) },
    { value: "confirmed", label: t(orderStatusLabel.confirmed) },
    { value: "processing", label: t(orderStatusLabel.processing) },
    { value: "shipping", label: t(orderStatusLabel.shipping) },
    { value: "completed", label: t(orderStatusLabel.completed) },
    { value: "cancel_requested", label: t(orderStatusLabel.cancel_requested) },
    { value: "cancel_rejected", label: t(orderStatusLabel.cancel_rejected) },
    { value: "cancelled", label: t(orderStatusLabel.cancelled) },
  ];
  const { notify } = useToast();
  const [searchParams] = useSearchParams();
  const { accessToken } = useAuth();
  const { deleteOrder, updateOrderStatus } = useAdminData();
  const { confirm, prompt, confirmDialog, promptDialog } = useConfirmDialog();

  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, shipping: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>(
    parseStatusFilter(searchParams.get("status")),
  );
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const toolbarSearchClass = "w-full sm:max-w-sm lg:w-72 xl:w-80";
  const requestIdRef = useRef(0);
  const summaryRequestIdRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const nextFilter = parseStatusFilter(searchParams.get("status"));
    setStatusFilter((current) => (current === nextFilter ? current : nextFilter));
  }, [searchParams]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [statusFilter, debouncedQuery]);

  const loadSummary = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    const requestId = ++summaryRequestIdRef.current;
    try {
      const summary = await fetchAdminOrderSummary(accessToken);
      if (summaryRequestIdRef.current !== requestId) {
        return;
      }
      setStats({
        total: Number(summary.total ?? 0),
        pending: Number(summary.pending ?? 0),
        shipping: Number(summary.shipping ?? 0),
      });
    } catch {
      if (summaryRequestIdRef.current !== requestId) {
        return;
      }
      setStats({ total: 0, pending: 0, shipping: 0 });
    }
  }, [accessToken]);

  const loadPage = useCallback(
    async (nextPage: number) => {
      if (!accessToken) {
        return;
      }

      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchAdminOrdersPaged(accessToken, {
          page: nextPage,
          size: PAGE_SIZE,
          status: statusFilter === "all" ? undefined : toBackendOrderStatus(statusFilter),
          query: debouncedQuery || undefined,
        });

        if (requestIdRef.current !== requestId) {
          return;
        }

        setOrders(response.items.map(mapOrder));
        setPage(response.page);
        setTotalPages(response.totalPages);
        setTotalItems(response.totalElements);
      } catch (loadError) {
        if (requestIdRef.current !== requestId) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : copy.loadFallback;
        setError(message);
        notify(message, { title: copy.title, variant: "error" });
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [accessToken, copy.loadFallback, copy.title, debouncedQuery, notify, statusFilter],
  );

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void loadPage(0);
  }, [loadPage]);

  const reloadCurrentPage = useCallback(
    async (nextPage?: number) => {
      const pageToLoad = nextPage ?? page;
      await Promise.all([loadPage(pageToLoad), loadSummary()]);
    },
    [loadPage, loadSummary, page],
  );

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Toggle the currently-displayed rows by membership, matching AdminTable's
  // header checkbox `checked` state (all displayed rows selected). This keeps
  // the box's appearance and its action aligned even when selection spans pages.
  const toggleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const batchStatusOptions = useMemo(() => {
    const selected = orders.filter((o) => selectedIds.has(o.id));
    if (selected.length === 0) return [];
    const firstStatus = selected[0].status;
    if (!selected.every((o) => o.status === firstStatus)) return [];
    return resolveAllowedOrderStatuses(firstStatus, selected[0].allowedTransitions)
      .filter((s) => s !== firstStatus)
      .map((s) => ({ value: s, label: t(orderStatusLabel[s]) }));
  }, [orders, selectedIds, t]);

  const handleStatusChange = async (
    orderId: string,
    currentStatus: OrderStatus,
    nextStatus: OrderStatus,
    isUndo = false,
  ) => {
    if (nextStatus === currentStatus || updatingOrderId) return;

    let cancelReason: string | undefined;
    if (nextStatus === 'cancelled' && !isUndo) {
      const reason = await prompt({
        title: copy.cancelReasonTitle,
        message: copy.cancelReasonMessage,
        inputLabel: copy.cancelReasonLabel,
        inputPlaceholder: copy.cancelReasonPlaceholder,
        tone: 'danger',
        confirmLabel: copy.cancelOrderLabel,
        cancelLabel: copy.cancelAbortLabel,
        required: true,
      });
      if (reason === null) return;
      cancelReason = reason;
    }

    const statDelta = (status: OrderStatus, field: "pending" | "shipping") => (status === field ? 1 : 0);

    // Optimistic update
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
    setStats((prev) => ({
      ...prev,
      pending: prev.pending - statDelta(currentStatus, "pending") + statDelta(nextStatus, "pending"),
      shipping: prev.shipping - statDelta(currentStatus, "shipping") + statDelta(nextStatus, "shipping"),
    }));

    try {
      setUpdatingOrderId(orderId);
      await updateOrderStatus(orderId, nextStatus, cancelReason);
      if (!isUndo) {
        notify(t(orderStatusLabel[nextStatus]), {
          title: copy.changeStatusLabel,
          variant: "success",
          durationMs: 5000,
          action: {
            label: copy.undoLabel,
            onAction: () => void handleStatusChange(orderId, nextStatus, currentStatus, true),
          },
        });
      }
    } catch (updateError) {
      // Rollback
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: currentStatus } : o)));
      setStats((prev) => ({
        ...prev,
        pending: prev.pending + statDelta(currentStatus, "pending") - statDelta(nextStatus, "pending"),
        shipping: prev.shipping + statDelta(currentStatus, "shipping") - statDelta(nextStatus, "shipping"),
      }));
      notify(updateError instanceof Error ? updateError.message : copy.updateFailed, {
        title: copy.title,
        variant: "error",
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleBatchStatusChange = async (nextStatus: OrderStatus) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || isBatchUpdating) return;

    const prevStatuses = new Map(
      orders.filter((o) => selectedIds.has(o.id)).map((o) => [o.id, o.status]),
    );

    setOrders((prev) =>
      prev.map((o) => (selectedIds.has(o.id) ? { ...o, status: nextStatus } : o)),
    );

    try {
      setIsBatchUpdating(true);
      await Promise.all(ids.map((id) => updateOrderStatus(id, nextStatus)));
      clearSelection();
      notify(
        copy.batchUpdated.replace("{count}", String(ids.length)),
        { title: copy.title, variant: "success" },
      );
    } catch (err) {
      setOrders((prev) =>
        prev.map((o) => {
          const prev_s = prevStatuses.get(o.id);
          return prev_s ? { ...o, status: prev_s } : o;
        }),
      );
      notify(err instanceof Error ? err.message : copy.updateFailed, {
        title: copy.title,
        variant: "error",
      });
    } finally {
      setIsBatchUpdating(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const approved = await confirm({
      title: copy.deleteTitle,
      message: copy.deleteMessage,
      tone: "danger",
      confirmLabel: copy.confirmDelete,
    });

    if (!approved) {
      return;
    }

    try {
      await deleteOrder(orderId);
      const nextPage = page > 0 && orders.length === 1 ? page - 1 : page;
      await reloadCurrentPage(nextPage);
    } catch (deleteError) {
      notify(deleteError instanceof Error ? deleteError.message : copy.deleteFailed, {
        title: copy.title,
        variant: "error",
      });
    }
  };

  const columns: AdminTableColumn<Order>[] = [
    {
      key: "orderCode",
      label: copy.orderCode,
      render: (order) => (
        <>
          <div className="flex items-center gap-1">
            <Link
              className="rounded-md font-semibold text-[var(--ink)] underline-offset-4 transition hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              to={`/orders/${encodeURIComponent(order.id)}`}
            >
              {order.orderCode}
            </Link>
            {order.staleReviewRequired ? (
              <AlertTriangle
                className="h-3 w-3 shrink-0 text-rose-500"
                aria-label={copy.reviewRequired}
              />
            ) : null}
            {order.shippingOverdue ? (
              <AlertTriangle
                className="h-3 w-3 shrink-0 text-amber-500"
                aria-label={copy.shippingOverdue}
              />
            ) : null}
          </div>
          <div className={tableMetaClass}>#{order.id}</div>
        </>
      ),
    },
    { key: "dealer", label: copy.dealer, render: (order) => order.dealer },
    {
      key: "total",
      label: copy.total,
      className: "font-semibold text-[var(--accent)]",
      render: (order) => formatCurrency(order.total),
    },
    {
      key: "status",
      label: copy.status,
      render: (order) => (
        <StatusBadge tone={orderStatusTone[order.status]}>
          {t(orderStatusLabel[order.status])}
        </StatusBadge>
      ),
    },
  ];

  const renderRowActions = (order: Order) => {
    const isUpdating = updatingOrderId === order.id;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          to={`/orders/${encodeURIComponent(order.id)}`}
        >
          {copy.detail}
        </Link>
        <div className="flex items-center gap-2">
          <StatusActionMenu
            disabled={!!updatingOrderId}
            label={`${copy.status} ${order.id}`}
            buttonLabel={copy.changeStatusLabel}
            onSelect={(nextStatus) =>
              void handleStatusChange(order.id, order.status, nextStatus)
            }
            options={resolveAllowedOrderStatuses(
              order.status,
              order.allowedTransitions,
            )
              .filter((s) => s !== order.status)
              .map((s) => ({ value: s, label: t(orderStatusLabel[s]) }))}
          />
          {isUpdating ? (
            <LoaderCircle
              aria-label={copy.loading}
              className="h-4 w-4 shrink-0 animate-spin text-[var(--muted)]"
            />
          ) : null}
        </div>
        <GhostButton
          disabled={!canDeleteOrder(order.status)}
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => void handleDeleteOrder(order.id)}
          title={canDeleteOrder(order.status) ? undefined : copy.deleteMessage}
          type="button"
        >
          {copy.deleteLabel}
        </GhostButton>
      </div>
    );
  };

  if (isLoading && totalItems === 0 && orders.length === 0) {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    );
  }

  if (error) {
    return (
      <PagePanel>
        <ErrorState title={copy.loadTitle} message={error} onRetry={() => void reloadCurrentPage()} />
      </PagePanel>
    );
  }

  return (
    <PagePanel>
      <PageHeader title={copy.title} subtitle={copy.description} />

      <div className="mt-4 space-y-3">
        <SearchInput
          id="orders-search"
          label={copy.searchLabel}
          placeholder={copy.searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={toolbarSearchClass}
        />
        <div
          aria-label={copy.status}
          className="flex flex-wrap gap-1.5"
          role="tablist"
        >
          {orderStatusOptions.map((option) => (
            <button
              key={option.value}
              aria-selected={statusFilter === option.value}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 ${
                statusFilter === option.value
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              }`}
              onClick={() => setStatusFilter(option.value)}
              role="tab"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <StatCard label={copy.totalOrders} value={stats.total} tone="neutral" />
        <StatCard label={copy.pendingOrders} value={stats.pending} tone="warning" />
        <StatCard label={copy.shippingOrders} value={stats.shipping} tone="info" />
      </div>

      {selectedIds.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--brand-border)] bg-[var(--accent-soft)] px-4 py-2.5 shadow-sm">
          <span className="text-sm font-semibold text-[var(--accent-strong)]">
            {selectedIds.size} {copy.selectedLabel}
          </span>
          {batchStatusOptions.length > 0 ? (
            <StatusActionMenu
              disabled={isBatchUpdating || !!updatingOrderId}
              label={copy.batchChangeStatus}
              buttonLabel={copy.batchChangeStatus}
              onSelect={(s) => void handleBatchStatusChange(s)}
              options={batchStatusOptions}
            />
          ) : (
            <span className="text-xs text-[var(--muted)]">{copy.mixedStatusHint}</span>
          )}
          <button
            aria-label={copy.clearSelection}
            className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            onClick={clearSelection}
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="mt-6">
        {isLoading ? (
          <LoadingRows rows={6} />
        ) : (
          <>
            <AdminTable
              columns={columns}
              rows={orders}
              selection={{
                selectedIds,
                onToggle: toggleSelected,
                onToggleAll: toggleSelectAll,
                ariaLabel: "Chọn tất cả",
              }}
              rowActions={renderRowActions}
              rowClassName={(order) =>
                selectedIds.has(order.id)
                  ? "cursor-default !bg-[var(--accent-soft)]/50"
                  : "cursor-default"
              }
              minWidthClass="min-w-full"
              caption={copy.title}
              emptyIcon={Package}
              emptyTitle={copy.emptyTitle}
              emptyMessage={copy.emptyMessage}
            />
            {orders.length > 0 && (
              <PaginationNav
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={PAGE_SIZE}
                onPageChange={(nextPage) => void loadPage(nextPage)}
                previousLabel={copy.previousLabel}
                nextLabel={copy.nextLabel}
              />
            )}
          </>
        )}
      </div>
      {confirmDialog}
      {promptDialog}
    </PagePanel>
  );
}

export default OrdersPageRevamp;
