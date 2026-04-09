import { AlertTriangle, LoaderCircle, Package, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PageHeader,
  PagePanel,
  PaginationNav,
  SearchInput,
  StatCard,
  StatusBadge,
  inputClass,
  tableActionSelectClass,
  tableCardClass,
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
  tableValueClass,
} from "../components/ui-kit";
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

const PAGE_SIZE = 25;

const canDeleteOrder = (status: OrderStatus) => status === "cancelled";

const copyByLanguage = {
  vi: {
    title: "Đơn hàng",
    allStatuses: "Tất cả",
    description: "Theo dõi xử lý đơn, xác nhận trạng thái và ưu tiên giao hàng.",
    searchLabel: "Tìm đơn hàng",
    searchPlaceholder: "Tìm mã đơn hoặc đại lý...",
    totalOrders: "Tổng đơn",
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
    changeStatusTitle: "Xác nhận đổi trạng thái",
    changeStatusMessage: 'Bạn có chắc muốn chuyển đơn này sang trạng thái "{status}" không?',
    deleteTitle: "Xóa đơn hàng",
    deleteMessage: "Hành động này sẽ xóa đơn hàng khỏi danh sách quản trị.",
    confirmDelete: "Xóa đơn",
    updateFailed: "Không cập nhật được đơn hàng",
    deleteFailed: "Không xóa được đơn hàng",
    deleteLabel: "Xóa",
    loading: "Đang cập nhật...",
    previousLabel: "Trước",
    nextLabel: "Tiếp",
  },
  en: {
    title: "Orders",
    allStatuses: "All statuses",
    description: "Track order processing, confirm statuses, and keep shipping priorities clear.",
    searchLabel: "Search orders",
    searchPlaceholder: "Search by order code or dealer...",
    totalOrders: "Total orders",
    pendingOrders: "Pending",
    shippingOrders: "Shipping",
    emptyTitle: "No orders found",
    emptyMessage: "Try another filter or search keyword.",
    loadTitle: "Unable to load orders",
    loadFallback: "Could not load the order list",
    orderCode: "Order code",
    dealer: "Dealer",
    total: "Total value",
    status: "Status",
    actions: "Actions",
    detail: "View details",
    reviewRequired: "Needs review",
    changeStatusTitle: "Confirm status update",
    changeStatusMessage: 'Do you want to move this order to "{status}"?',
    deleteTitle: "Delete order",
    deleteMessage: "This will remove the order from the admin list.",
    confirmDelete: "Delete order",
    updateFailed: "Could not update the order",
    deleteFailed: "Could not delete the order",
    deleteLabel: "Delete",
    loading: "Updating...",
    previousLabel: "Previous",
    nextLabel: "Next",
  },
} as const;

function OrdersPageRevamp() {
  const { t, language } = useLanguage();
  const copy = copyByLanguage[language];
  const orderStatusOptions: Array<{ value: "all" | OrderStatus; label: string }> = [
    { value: "all", label: copy.allStatuses },
    { value: "pending", label: t(orderStatusLabel.pending) },
    { value: "confirmed", label: t(orderStatusLabel.confirmed) },
    { value: "shipping", label: t(orderStatusLabel.shipping) },
    { value: "completed", label: t(orderStatusLabel.completed) },
    { value: "cancelled", label: t(orderStatusLabel.cancelled) },
  ];
  const { notify } = useToast();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { deleteOrder, updateOrderStatus } = useAdminData();
  const { confirm, confirmDialog } = useConfirmDialog();

  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, shipping: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const toolbarSearchClass = "w-full sm:max-w-sm lg:w-72 xl:w-80";
  const requestIdRef = useRef(0);
  const summaryRequestIdRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

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

  const handleStatusChange = async (orderId: string, currentStatus: OrderStatus, nextStatus: OrderStatus, revert: () => void) => {
    if (nextStatus === currentStatus || updatingOrderId) {
      return;
    }

    const approved = await confirm({
      title: copy.changeStatusTitle,
      message: copy.changeStatusMessage.replace("{status}", t(orderStatusLabel[nextStatus])),
      tone: nextStatus === "cancelled" ? "danger" : "warning",
      confirmLabel: t(orderStatusLabel[nextStatus]),
    });

    if (!approved) {
      revert();
      return;
    }

    try {
      setUpdatingOrderId(orderId);
      await updateOrderStatus(orderId, nextStatus);
      await reloadCurrentPage();
    } catch (updateError) {
      notify(updateError instanceof Error ? updateError.message : copy.updateFailed, {
        title: copy.title,
        variant: "error",
      });
      revert();
    } finally {
      setUpdatingOrderId(null);
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SearchInput
          id="orders-search"
          label={copy.searchLabel}
          placeholder={copy.searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={toolbarSearchClass}
        />
        <select
          aria-label={copy.status}
          className={`${inputClass} w-full sm:max-w-[14rem] lg:w-56`}
          onChange={(event) => setStatusFilter(event.target.value as "all" | OrderStatus)}
          value={statusFilter}
        >
          {orderStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={copy.totalOrders} value={stats.total} tone="neutral" />
        <StatCard label={copy.pendingOrders} value={stats.pending} tone="warning" />
        <StatCard label={copy.shippingOrders} value={stats.shipping} tone="info" />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <LoadingRows rows={6} />
        ) : orders.length === 0 ? (
          <EmptyState icon={Package} title={copy.emptyTitle} message={copy.emptyMessage} />
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {orders.map((order) => {
                const isUpdating = updatingOrderId === order.id;
                return (
                  <article key={order.id} className={tableCardClass}>
                    <button className="w-full text-left" onClick={() => navigate(`/orders/${encodeURIComponent(order.id)}`)} type="button">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={tableValueClass}>
                            {order.orderCode}
                            {order.staleReviewRequired ? (
                              <AlertTriangle className="ml-1 inline h-3 w-3 text-rose-500" aria-label={copy.reviewRequired} />
                            ) : null}
                          </p>
                          <p className={tableMetaClass}>#{order.id} · {order.dealer}</p>
                        </div>
                        <StatusBadge tone={orderStatusTone[order.status]}>{t(orderStatusLabel[order.status])}</StatusBadge>
                      </div>
                      <p className="mt-4 text-sm font-semibold text-[var(--accent)]">{formatCurrency(order.total)}</p>
                    </button>
                    <div className="mt-4 grid gap-2">
                      <div className="flex items-center gap-2">
                        <select
                          aria-label={`${copy.status} ${order.id}`}
                          className={`w-full ${tableActionSelectClass}`}
                          disabled={isUpdating}
                          onChange={(event) =>
                            void handleStatusChange(order.id, order.status, event.target.value as OrderStatus, () => {
                              event.currentTarget.value = order.status;
                            })
                          }
                          value={order.status}
                        >
                          {resolveAllowedOrderStatuses(order.status, order.allowedTransitions).map((option) => (
                            <option key={`${order.id}-${option}`} value={option}>
                              {t(orderStatusLabel[option])}
                            </option>
                          ))}
                        </select>
                        {isUpdating ? <LoaderCircle aria-label={copy.loading} className="h-4 w-4 shrink-0 animate-spin text-[var(--muted)]" /> : null}
                      </div>
                      <GhostButton
                        className="w-full"
                        disabled={!canDeleteOrder(order.status)}
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => void handleDeleteOrder(order.id)}
                        title={canDeleteOrder(order.status) ? undefined : copy.deleteMessage}
                        type="button"
                      >
                        {copy.deleteLabel}
                      </GhostButton>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-separate border-spacing-y-2" role="table">
                <thead>
                  <tr className={tableHeadClass}>
                    <th className="px-3 py-2 font-semibold">{copy.orderCode}</th>
                    <th className="px-3 py-2 font-semibold">{copy.dealer}</th>
                    <th className="px-3 py-2 font-semibold">{copy.total}</th>
                    <th className="px-3 py-2 font-semibold">{copy.status}</th>
                    <th className="px-3 py-2 font-semibold">{copy.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const isUpdating = updatingOrderId === order.id;
                    return (
                      <tr key={order.id} className={`${tableRowClass} cursor-default`}>
                        <td className="rounded-l-2xl px-3 py-3 font-semibold text-[var(--ink)]">
                          <div className="flex items-center gap-1">
                            <Link
                              className="rounded-md text-[var(--ink)] underline-offset-4 transition hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                              to={`/orders/${encodeURIComponent(order.id)}`}
                            >
                              {order.orderCode}
                            </Link>
                            {order.staleReviewRequired ? (
                              <AlertTriangle className="h-3 w-3 shrink-0 text-rose-500" aria-label={copy.reviewRequired} />
                            ) : null}
                          </div>
                          <div className={tableMetaClass}>#{order.id}</div>
                        </td>
                        <td className="px-3 py-3">{order.dealer}</td>
                        <td className="px-3 py-3 font-semibold text-[var(--accent)]">{formatCurrency(order.total)}</td>
                        <td className="px-3 py-3">
                          <StatusBadge tone={orderStatusTone[order.status]}>{t(orderStatusLabel[order.status])}</StatusBadge>
                        </td>
                        <td className="rounded-r-2xl px-3 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                              to={`/orders/${encodeURIComponent(order.id)}`}
                            >
                              {copy.detail}
                            </Link>
                            <div className="flex items-center gap-2">
                              <select
                                aria-label={`${copy.status} ${order.id}`}
                                className={tableActionSelectClass}
                                disabled={isUpdating}
                                onChange={(event) =>
                                  void handleStatusChange(order.id, order.status, event.target.value as OrderStatus, () => {
                                    event.currentTarget.value = order.status;
                                  })
                                }
                                value={order.status}
                              >
                                {resolveAllowedOrderStatuses(order.status, order.allowedTransitions).map((option) => (
                                  <option key={`${order.id}-${option}`} value={option}>
                                    {t(orderStatusLabel[option])}
                                  </option>
                                ))}
                              </select>
                              {isUpdating ? <LoaderCircle aria-label={copy.loading} className="h-4 w-4 shrink-0 animate-spin text-[var(--muted)]" /> : null}
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PaginationNav
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              onPageChange={(nextPage) => void loadPage(nextPage)}
              previousLabel={copy.previousLabel}
              nextLabel={copy.nextLabel}
            />
          </>
        )}
      </div>
      {confirmDialog}
    </PagePanel>
  );
}

export default OrdersPageRevamp;
