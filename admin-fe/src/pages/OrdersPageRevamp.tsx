import { Package, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PagePanel,
  SearchInput,
  StatCard,
  StatusBadge,
  bodyTextClass,
  cardTitleClass,
  inputClass,
  tableActionSelectClass,
  tableCardClass,
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
  tableValueClass,
} from '../components/ui-kit'
import { useAdminData, type OrderStatus } from '../context/AdminDataContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import { getAllowedOrderStatuses, orderStatusLabel, orderStatusTone } from '../lib/adminLabels'
import { formatCurrency } from '../lib/formatters'

const ORDER_STATUS_OPTIONS: Array<{ value: 'all' | OrderStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: orderStatusLabel.pending },
  { value: 'packing', label: orderStatusLabel.packing },
  { value: 'delivering', label: orderStatusLabel.delivering },
  { value: 'completed', label: orderStatusLabel.completed },
  { value: 'cancelled', label: orderStatusLabel.cancelled },
]

const canDeleteOrder = (status: OrderStatus) => status === 'cancelled'

const copyByLanguage = {
  vi: {
    title: '\u0110\u01a1n h\u00e0ng',
    description:
      'Theo d\u00f5i x\u1eed l\u00fd \u0111\u01a1n, x\u00e1c nh\u1eadn tr\u1ea1ng th\u00e1i v\u00e0 \u01b0u ti\u00ean giao h\u00e0ng.',
    searchLabel: 'T\u00ecm \u0111\u01a1n h\u00e0ng',
    searchPlaceholder: 'T\u00ecm m\u00e3 \u0111\u01a1n ho\u1eb7c \u0111\u1ea1i l\u00fd...',
    totalOrders: 'T\u1ed5ng \u0111\u01a1n',
    pendingOrders: 'Ch\u1edd x\u1eed l\u00fd',
    deliveringOrders: '\u0110ang giao',
    emptyTitle: 'Kh\u00f4ng c\u00f3 \u0111\u01a1n h\u00e0ng',
    emptyMessage: 'Th\u1eed \u0111i\u1ec1u ch\u1ec9nh b\u1ed9 l\u1ecdc ho\u1eb7c t\u1eeb kh\u00f3a t\u00ecm ki\u1ebfm.',
    loadTitle: 'Kh\u00f4ng th\u1ec3 t\u1ea3i \u0111\u01a1n h\u00e0ng',
    loadFallback: 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c danh s\u00e1ch \u0111\u01a1n h\u00e0ng',
    orderCode: 'M\u00e3 \u0111\u01a1n',
    dealer: '\u0110\u1ea1i l\u00fd',
    total: 'T\u1ed5ng gi\u00e1 tr\u1ecb',
    status: 'Tr\u1ea1ng th\u00e1i',
    actions: 'Thao t\u00e1c',
    changeStatusTitle: 'X\u00e1c nh\u1eadn \u0111\u1ed5i tr\u1ea1ng th\u00e1i',
    changeStatusMessage:
      'B\u1ea1n c\u00f3 ch\u1eafc mu\u1ed1n chuy\u1ec3n \u0111\u01a1n n\u00e0y sang tr\u1ea1ng th\u00e1i "{status}" kh\u00f4ng?',
    deleteTitle: 'X\u00f3a \u0111\u01a1n h\u00e0ng',
    deleteMessage: 'H\u00e0nh \u0111\u1ed9ng n\u00e0y s\u1ebd x\u00f3a \u0111\u01a1n h\u00e0ng kh\u1ecfi danh s\u00e1ch qu\u1ea3n tr\u1ecb.',
    confirmDelete: 'X\u00f3a \u0111\u01a1n',
    updateFailed: 'Kh\u00f4ng c\u1eadp nh\u1eadt \u0111\u01b0\u1ee3c \u0111\u01a1n h\u00e0ng',
    deleteFailed: 'Kh\u00f4ng x\u00f3a \u0111\u01b0\u1ee3c \u0111\u01a1n h\u00e0ng',
    deleteLabel: 'X\u00f3a',
  },
  en: {
    title: 'Orders',
    description: 'Track the order queue, confirm status changes, and prioritize delivery.',
    searchLabel: 'Search orders',
    searchPlaceholder: 'Search by order code or dealer...',
    totalOrders: 'Total orders',
    pendingOrders: 'Pending',
    deliveringOrders: 'Delivering',
    emptyTitle: 'No orders found',
    emptyMessage: 'Try adjusting filters or your search keywords.',
    loadTitle: 'Unable to load orders',
    loadFallback: 'Could not load the orders list',
    orderCode: 'Order code',
    dealer: 'Dealer',
    total: 'Total',
    status: 'Status',
    actions: 'Actions',
    changeStatusTitle: 'Confirm status change',
    changeStatusMessage: 'Change this order to "{status}"?',
    deleteTitle: 'Delete order',
    deleteMessage: 'This action removes the order from the admin list.',
    confirmDelete: 'Delete order',
    updateFailed: 'Could not update the order',
    deleteFailed: 'Could not delete the order',
    deleteLabel: 'Delete',
  },
} as const

function OrdersPageRevamp() {
  const { language } = useLanguage()
  const copy = copyByLanguage[language]
  const { notify } = useToast()
  const navigate = useNavigate()
  const { orders, ordersState, deleteOrder, updateOrderStatus, reloadResource } = useAdminData()
  const { confirm, confirmDialog } = useConfirmDialog()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const [localError, setLocalError] = useState<string | null>(null)
  const toolbarSearchClass = 'w-full sm:max-w-sm lg:w-72 xl:w-80'

  const normalizedQuery = query.trim().toLowerCase()

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesStatus = statusFilter === 'all' ? true : order.status === statusFilter
        const matchesQuery =
          !normalizedQuery ||
          order.id.toLowerCase().includes(normalizedQuery) ||
          order.dealer.toLowerCase().includes(normalizedQuery)
        return matchesStatus && matchesQuery
      }),
    [normalizedQuery, orders, statusFilter],
  )

  const stats = useMemo(() => {
    const pending = orders.filter((item) => item.status === 'pending').length
    const delivering = orders.filter((item) => item.status === 'delivering').length
    return { pending, delivering }
  }, [orders])

  const handleStatusChange = async (
    orderId: string,
    currentStatus: OrderStatus,
    nextStatus: OrderStatus,
    revert: () => void,
  ) => {
    if (nextStatus === currentStatus) {
      return
    }

    const approved = await confirm({
      title: copy.changeStatusTitle,
      message: copy.changeStatusMessage.replace('{status}', orderStatusLabel[nextStatus]),
      tone: nextStatus === 'cancelled' ? 'danger' : 'warning',
      confirmLabel: orderStatusLabel[nextStatus],
    })

    if (!approved) {
      revert()
      return
    }

    try {
      await updateOrderStatus(orderId, nextStatus)
    } catch (updateError) {
      notify(updateError instanceof Error ? updateError.message : copy.updateFailed, {
        title: copy.title,
        variant: 'error',
      })
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    const approved = await confirm({
      title: copy.deleteTitle,
      message: copy.deleteMessage,
      tone: 'danger',
      confirmLabel: copy.confirmDelete,
    })

    if (!approved) {
      return
    }

    try {
      await deleteOrder(orderId)
    } catch (deleteError) {
      notify(deleteError instanceof Error ? deleteError.message : copy.deleteFailed, {
        title: copy.title,
        variant: 'error',
      })
    }
  }

  if (ordersState.status === 'loading' || ordersState.status === 'idle') {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    )
  }

  if (localError || ordersState.status === 'error') {
    return (
      <PagePanel>
        <ErrorState
          title={copy.loadTitle}
          message={localError || ordersState.error || copy.loadFallback}
          onRetry={() => {
            setLocalError(null)
            void reloadResource('orders')
          }}
        />
      </PagePanel>
    )
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
            onChange={(event) => setStatusFilter(event.target.value as 'all' | OrderStatus)}
            value={statusFilter}
          >
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard label={copy.totalOrders} value={orders.length} tone="neutral" />
        <StatCard label={copy.pendingOrders} value={stats.pending} tone="warning" />
        <StatCard label={copy.deliveringOrders} value={stats.delivering} tone="info" />
      </div>

      <div className="mt-6">
        {filteredOrders.length === 0 ? (
          <EmptyState icon={Package} title={copy.emptyTitle} message={copy.emptyMessage} />
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {filteredOrders.map((order) => (
                <article key={order.id} className={tableCardClass}>
                  <button
                    className="w-full text-left"
                    onClick={() => navigate(`/orders/${encodeURIComponent(order.id)}`)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={tableValueClass}>#{order.id}</p>
                        <p className={tableMetaClass}>{order.dealer}</p>
                      </div>
                      <StatusBadge tone={orderStatusTone[order.status]}>
                        {orderStatusLabel[order.status]}
                      </StatusBadge>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[var(--accent)]">
                      {formatCurrency(order.total)}
                    </p>
                  </button>
                  <div className="mt-4 grid gap-2">
                    <select
                      aria-label={`${copy.status} ${order.id}`}
                      className={`w-full ${tableActionSelectClass}`}
                      onChange={(event) =>
                        void handleStatusChange(
                          order.id,
                          order.status,
                          event.target.value as OrderStatus,
                          () => {
                            event.currentTarget.value = order.status
                          },
                        )
                      }
                      value={order.status}
                    >
                      {getAllowedOrderStatuses(order.status).map((option) => (
                        <option key={`${order.id}-${option}`} value={option}>
                          {orderStatusLabel[option]}
                        </option>
                      ))}
                    </select>
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
              ))}
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
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={tableRowClass}
                      onClick={() => navigate(`/orders/${encodeURIComponent(order.id)}`)}
                      role="row"
                    >
                      <td className="rounded-l-2xl px-3 py-3 font-semibold text-[var(--ink)]">
                        #{order.id}
                      </td>
                      <td className="px-3 py-3">{order.dealer}</td>
                      <td className="px-3 py-3 font-semibold text-[var(--accent)]">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={orderStatusTone[order.status]}>
                          {orderStatusLabel[order.status]}
                        </StatusBadge>
                      </td>
                      <td
                        className="rounded-r-2xl px-3 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            aria-label={`${copy.status} ${order.id}`}
                            className={tableActionSelectClass}
                            onChange={(event) =>
                              void handleStatusChange(
                                order.id,
                                order.status,
                                event.target.value as OrderStatus,
                                () => {
                                  event.currentTarget.value = order.status
                                },
                              )
                            }
                            value={order.status}
                          >
                            {getAllowedOrderStatuses(order.status).map((option) => (
                              <option key={`${order.id}-${option}`} value={option}>
                                {orderStatusLabel[option]}
                              </option>
                            ))}
                          </select>
                          <GhostButton
                            className="min-h-11 min-w-0 px-3"
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
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {confirmDialog}
    </PagePanel>
  )
}

export default OrdersPageRevamp
