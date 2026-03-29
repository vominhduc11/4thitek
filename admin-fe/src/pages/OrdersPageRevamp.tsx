import { AlertTriangle, LoaderCircle, Package, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PageHeader,
  PagePanel,
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
import { useAdminData, type OrderStatus } from "../context/AdminDataContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCopy } from "../lib/i18n";
import { useToast } from "../context/ToastContext";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import {
  getAllowedOrderStatuses,
  orderStatusLabel,
  orderStatusTone,
} from "../lib/adminLabels";
import { formatCurrency } from "../lib/formatters";

const canDeleteOrder = (status: OrderStatus) => status === "cancelled";

const copyKeys = {
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
  changeStatusTitle: "Xác nhận đổi trạng thái",
  changeStatusMessage:
    'Bạn có chắc muốn chuyển đơn này sang trạng thái "{status}" không?',
  deleteTitle: "Xóa đơn hàng",
  deleteMessage: "Hành động này sẽ xóa đơn hàng khỏi danh sách quản trị.",
  confirmDelete: "Xóa đơn",
  updateFailed: "Không cập nhật được đơn hàng",
  deleteFailed: "Không xóa được đơn hàng",
  deleteLabel: "Xóa",
} as const;

function OrdersPageRevamp() {
  const { t } = useLanguage();
  const copy = translateCopy(copyKeys, t);
  const ORDER_STATUS_OPTIONS: Array<{
    value: "all" | OrderStatus;
    label: string;
  }> = [
    { value: "all", label: copy.allStatuses },
    { value: "pending", label: t(orderStatusLabel.pending) },
    { value: "confirmed", label: t(orderStatusLabel.confirmed) },
    { value: "shipping", label: t(orderStatusLabel.shipping) },
    { value: "completed", label: t(orderStatusLabel.completed) },
    { value: "cancelled", label: t(orderStatusLabel.cancelled) },
  ];
  const { notify } = useToast();
  const navigate = useNavigate();
  const {
    orders,
    ordersState,
    deleteOrder,
    updateOrderStatus,
    reloadResource,
  } = useAdminData();
  const { confirm, confirmDialog } = useConfirmDialog();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [localError, setLocalError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const toolbarSearchClass = "w-full sm:max-w-sm lg:w-72 xl:w-80";

  const normalizedQuery = query.trim().toLowerCase();

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesStatus =
          statusFilter === "all" ? true : order.status === statusFilter;
        const matchesQuery =
          !normalizedQuery ||
          order.id.toLowerCase().includes(normalizedQuery) ||
          order.orderCode.toLowerCase().includes(normalizedQuery) ||
          order.dealer.toLowerCase().includes(normalizedQuery);
        return matchesStatus && matchesQuery;
      }),
    [normalizedQuery, orders, statusFilter],
  );

  const stats = useMemo(() => {
    const pending = orders.filter((item) => item.status === "pending").length;
    const shipping = orders.filter((item) => item.status === "shipping").length;
    return { pending, shipping };
  }, [orders]);

  const handleStatusChange = async (
    orderId: string,
    currentStatus: OrderStatus,
    nextStatus: OrderStatus,
    revert: () => void,
  ) => {
    if (nextStatus === currentStatus || updatingOrderId) {
      return;
    }

    const approved = await confirm({
      title: copy.changeStatusTitle,
      message: copy.changeStatusMessage.replace(
        "{status}",
        t(orderStatusLabel[nextStatus]),
      ),
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
    } catch (updateError) {
      notify(
        updateError instanceof Error ? updateError.message : copy.updateFailed,
        {
          title: copy.title,
          variant: "error",
        },
      );
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
    } catch (deleteError) {
      notify(
        deleteError instanceof Error ? deleteError.message : copy.deleteFailed,
        {
          title: copy.title,
          variant: "error",
        },
      );
    }
  };

  if (ordersState.status === "loading" || ordersState.status === "idle") {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    );
  }

  if (localError || ordersState.status === "error") {
    return (
      <PagePanel>
        <ErrorState
          title={copy.loadTitle}
          message={localError || ordersState.error || copy.loadFallback}
          onRetry={() => {
            setLocalError(null);
            void reloadResource("orders");
          }}
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
          <>
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
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | OrderStatus)
              }
              value={statusFilter}
            >
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label={copy.totalOrders}
          value={orders.length}
          tone="neutral"
        />
        <StatCard
          label={copy.pendingOrders}
          value={stats.pending}
          tone="warning"
        />
        <StatCard
          label={copy.shippingOrders}
          value={stats.shipping}
          tone="info"
        />
      </div>

      <div className="mt-6">
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title={copy.emptyTitle}
            message={copy.emptyMessage}
          />
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {filteredOrders.map((order) => {
                const isUpdating = updatingOrderId === order.id;
                const availableTransitions =
                  order.allowedTransitions ??
                  getAllowedOrderStatuses(order.status);
                return (
                  <article key={order.id} className={tableCardClass}>
                    <button
                      className="w-full text-left"
                      onClick={() =>
                        navigate(`/orders/${encodeURIComponent(order.id)}`)
                      }
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={tableValueClass}>
                            {order.orderCode}
                            {order.staleReviewRequired && (
                              <AlertTriangle
                                className="ml-1 inline h-3 w-3 text-rose-500"
                                aria-label="Cần xem xét"
                              />
                            )}
                          </p>
                          <p className={tableMetaClass}>
                            #{order.id} · {order.dealer}
                          </p>
                        </div>
                        <StatusBadge tone={orderStatusTone[order.status]}>
                          {t(orderStatusLabel[order.status])}
                        </StatusBadge>
                      </div>
                      <p className="mt-4 text-sm font-semibold text-[var(--accent)]">
                        {formatCurrency(order.total)}
                      </p>
                    </button>
                    <div className="mt-4 grid gap-2">
                      <div className="flex items-center gap-2">
                        <select
                          aria-label={`${copy.status} ${order.id}`}
                          className={`w-full ${tableActionSelectClass}`}
                          disabled={isUpdating}
                          onChange={(event) =>
                            void handleStatusChange(
                              order.id,
                              order.status,
                              event.target.value as OrderStatus,
                              () => {
                                event.currentTarget.value = order.status;
                              },
                            )
                          }
                          value={order.status}
                        >
                          {availableTransitions.map((option) => (
                            <option
                              key={`${order.id}-${option}`}
                              value={option}
                            >
                              {t(orderStatusLabel[option])}
                            </option>
                          ))}
                        </select>
                        {isUpdating ? (
                          <LoaderCircle
                            aria-label={t("Đang cập nhật...")}
                            className="h-4 w-4 shrink-0 animate-spin text-[var(--muted)]"
                          />
                        ) : null}
                      </div>
                      <GhostButton
                        className="w-full"
                        disabled={!canDeleteOrder(order.status)}
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => void handleDeleteOrder(order.id)}
                        title={
                          canDeleteOrder(order.status)
                            ? undefined
                            : copy.deleteMessage
                        }
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
              <table
                className="min-w-[56rem] border-separate border-spacing-y-2"
                role="table"
              >
                <thead>
                  <tr className={tableHeadClass}>
                    <th className="w-56 px-3 py-2 font-semibold">
                      {copy.orderCode}
                    </th>
                    <th className="min-w-44 px-3 py-2 font-semibold">
                      {copy.dealer}
                    </th>
                    <th className="w-32 px-3 py-2 font-semibold">
                      {copy.total}
                    </th>
                    <th className="w-32 px-3 py-2 font-semibold">
                      {copy.status}
                    </th>
                    <th className="w-64 px-3 py-2 font-semibold">
                      {copy.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const isUpdating = updatingOrderId === order.id;
                    const availableTransitions =
                      order.allowedTransitions ??
                      getAllowedOrderStatuses(order.status);
                    return (
                      <tr
                        key={order.id}
                        className={tableRowClass}
                        onClick={() =>
                          navigate(`/orders/${encodeURIComponent(order.id)}`)
                        }
                        role="row"
                      >
                        <td className="rounded-l-2xl px-3 py-3 font-semibold text-[var(--ink)]">
                          <div className="flex items-center gap-1">
                            {order.orderCode}
                            {order.staleReviewRequired && (
                              <AlertTriangle
                                className="h-3 w-3 text-rose-500 shrink-0"
                                aria-label="Cần xem xét"
                              />
                            )}
                          </div>
                          <div className={tableMetaClass}>#{order.id}</div>
                        </td>
                        <td className="px-3 py-3">{order.dealer}</td>
                        <td className="px-3 py-3 whitespace-nowrap font-semibold text-[var(--accent)]">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <StatusBadge tone={orderStatusTone[order.status]}>
                            {t(orderStatusLabel[order.status])}
                          </StatusBadge>
                        </td>
                        <td
                          className="rounded-r-2xl px-3 py-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                            <div className="flex min-w-0 items-center gap-2">
                              <select
                                aria-label={`${copy.status} ${order.id}`}
                                className={`${tableActionSelectClass} min-w-0 flex-1 whitespace-nowrap xl:min-w-[11rem] xl:flex-none`}
                                disabled={isUpdating}
                                onChange={(event) =>
                                  void handleStatusChange(
                                    order.id,
                                    order.status,
                                    event.target.value as OrderStatus,
                                    () => {
                                      event.currentTarget.value = order.status;
                                    },
                                  )
                                }
                                value={order.status}
                              >
                                {availableTransitions.map((option) => (
                                  <option
                                    key={`${order.id}-${option}`}
                                    value={option}
                                  >
                                    {t(orderStatusLabel[option])}
                                  </option>
                                ))}
                              </select>
                              {isUpdating ? (
                                <LoaderCircle
                                  aria-label={t("Đang cập nhật...")}
                                  className="h-4 w-4 shrink-0 animate-spin text-[var(--muted)]"
                                />
                              ) : null}
                            </div>
                            <GhostButton
                              className="min-h-11 min-w-0 whitespace-nowrap px-3 xl:w-auto"
                              disabled={!canDeleteOrder(order.status)}
                              icon={<Trash2 className="h-4 w-4" />}
                              onClick={() => void handleDeleteOrder(order.id)}
                              title={
                                canDeleteOrder(order.status)
                                  ? undefined
                                  : copy.deleteMessage
                              }
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
          </>
        )}
      </div>
      {confirmDialog}
    </PagePanel>
  );
}

export default OrdersPageRevamp;
