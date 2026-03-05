import { Package, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminData, type OrderStatus } from '../context/AdminDataContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { orderStatusLabel, orderStatusTone } from '../lib/adminLabels'
import { formatCurrency } from '../lib/formatters'
import { useSimulatedPageLoad } from '../hooks/useSimulatedPageLoad'
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PagePanel,
  PrimaryButton,
  SearchInput,
  StatCard,
  StatusBadge,
} from '../components/ui-kit'

const ORDER_STATUS_OPTIONS: Array<{ value: 'all' | OrderStatus; label: string }> = [
  { value: 'all', label: 'Tat ca' },
  { value: 'pending', label: orderStatusLabel.pending },
  { value: 'packing', label: orderStatusLabel.packing },
  { value: 'delivering', label: orderStatusLabel.delivering },
  { value: 'completed', label: orderStatusLabel.completed },
  { value: 'cancelled', label: orderStatusLabel.cancelled },
]

function OrdersPage() {
  const { t } = useLanguage()
  const { notify } = useToast()
  const navigate = useNavigate()
  const { orders, addOrder, deleteOrder, updateOrderStatus } = useAdminData()
  const { isLoading, reload } = useSimulatedPageLoad('orders-page')

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    customer: '',
    total: '',
    items: '1',
    address: '',
    note: '',
  })

  const normalizedQuery = query.trim().toLowerCase()

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesStatus = statusFilter === 'all' ? true : order.status === statusFilter
        const matchesQuery =
          !normalizedQuery ||
          order.id.toLowerCase().includes(normalizedQuery) ||
          order.customer.toLowerCase().includes(normalizedQuery)
        return matchesStatus && matchesQuery
      }),
    [normalizedQuery, orders, statusFilter],
  )

  const stats = useMemo(() => {
    const pending = orders.filter((item) => item.status === 'pending').length
    const delivering = orders.filter((item) => item.status === 'delivering').length
    return { pending, delivering }
  }, [orders])

  const handleCreateOrder = () => {
    setError(null)
    const total = Number(form.total)
    const items = Number(form.items)
    if (!form.customer.trim()) {
      setError('Vui long nhap ten khach hang')
      return
    }
    if (Number.isNaN(total) || total <= 0) {
      setError('Tong tien phai lon hon 0')
      return
    }
    if (Number.isNaN(items) || items <= 0) {
      setError('So luong san pham phai lon hon 0')
      return
    }

    const created = addOrder({
      customer: form.customer,
      total,
      items,
      address: form.address || 'Chua cap nhat',
      note: form.note || 'Khong co ghi chu',
    })

    setForm({
      customer: '',
      total: '',
      items: '1',
      address: '',
      note: '',
    })
    setShowCreateForm(false)
    notify(`Da tao don ${created.id}`, { variant: 'success', title: 'Orders' })
  }

  if (isLoading) {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    )
  }

  if (error && !showCreateForm) {
    return (
      <PagePanel>
        <ErrorState
          title="Khong the tai du lieu"
          message={error}
          onRetry={() => {
            setError(null)
            reload()
          }}
        />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{t('Đơn hàng')}</h3>
          <p className="text-sm text-slate-500">
            Theo doi xu ly don va uu tien giao hang.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            id="orders-search"
            label="Search orders"
            placeholder="Tim ma don, ten khach..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-60 max-w-full"
          />
          <select
            aria-label="Filter order status"
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            onChange={(event) => setStatusFilter(event.target.value as 'all' | OrderStatus)}
            value={statusFilter}
          >
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <PrimaryButton
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateForm((value) => !value)}
            type="button"
          >
            Tao don
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Tong don" value={orders.length} tone="neutral" />
        <StatCard label="Cho xu ly" value={stats.pending} tone="warning" />
        <StatCard label="Dang giao" value={stats.delivering} tone="info" />
      </div>

      {showCreateForm ? (
        <div className="mt-6 rounded-3xl border border-slate-200/80 bg-[var(--surface-muted)] p-4">
          <p className="text-sm font-semibold text-slate-900">Tao don hang moi</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, customer: event.target.value }))
              }
              placeholder="Ten khach hang"
              value={form.customer}
            />
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, total: event.target.value }))
              }
              placeholder="Tong tien (VND)"
              type="number"
              value={form.total}
            />
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, items: event.target.value }))
              }
              placeholder="So luong san pham"
              type="number"
              value={form.items}
            />
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, address: event.target.value }))
              }
              placeholder="Dia chi giao hang"
              value={form.address}
            />
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] md:col-span-2"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, note: event.target.value }))
              }
              placeholder="Ghi chu"
              value={form.note}
            />
          </div>
          {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <PrimaryButton onClick={handleCreateOrder} type="button">
              Luu don
            </PrimaryButton>
            <GhostButton onClick={() => setShowCreateForm(false)} type="button">
              Huy
            </GhostButton>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Khong co don hang"
            message="Thu doi bo loc hoac tao don moi."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2" role="table">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-3 py-2 font-semibold">Ma don</th>
                  <th className="px-3 py-2 font-semibold">Khach hang</th>
                  <th className="px-3 py-2 font-semibold">Tong</th>
                  <th className="px-3 py-2 font-semibold">Trang thai</th>
                  <th className="px-3 py-2 font-semibold">Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    className="cursor-pointer rounded-2xl bg-white/80 text-sm text-slate-700 shadow-sm transition hover:bg-[var(--accent-soft)]/40"
                    key={order.id}
                    onClick={() => navigate(`/orders/${encodeURIComponent(order.id)}`)}
                    role="row"
                  >
                    <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-900">
                      #{order.id}
                    </td>
                    <td className="px-3 py-3">{order.customer}</td>
                    <td className="px-3 py-3 font-semibold text-[var(--accent)]">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge tone={orderStatusTone[order.status]}>
                        {orderStatusLabel[order.status]}
                      </StatusBadge>
                    </td>
                    <td className="rounded-r-2xl px-3 py-3">
                      <div
                        className="flex flex-wrap items-center gap-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <select
                          aria-label={`Change status for ${order.id}`}
                          className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                          onChange={(event) => {
                            const next = event.target.value as OrderStatus
                            updateOrderStatus(order.id, next)
                            notify(`Cap nhat ${order.id} -> ${orderStatusLabel[next]}`, {
                              title: 'Orders',
                              variant: 'info',
                            })
                          }}
                          value={order.status}
                        >
                          {ORDER_STATUS_OPTIONS.filter((item) => item.value !== 'all').map(
                            (option) => (
                              <option key={`${order.id}-${option.value}`} value={option.value}>
                                {option.label}
                              </option>
                            ),
                          )}
                        </select>
                        <GhostButton
                          className="h-9 min-w-0 px-3"
                          icon={<Trash2 className="h-4 w-4" />}
                          onClick={() => {
                            deleteOrder(order.id)
                            notify(`Da xoa ${order.id}`, { title: 'Orders', variant: 'error' })
                          }}
                          type="button"
                        >
                          Xoa
                        </GhostButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PagePanel>
  )
}

export default OrdersPage
