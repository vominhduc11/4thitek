import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAdminData, type OrderStatus } from '../context/AdminDataContext'
import { useToast } from '../context/ToastContext'
import { orderStatusLabel, orderStatusTone } from '../lib/adminLabels'
import { formatCurrency, formatDateTime } from '../lib/formatters'
import {
  EmptyState,
  GhostButton,
  PagePanel,
  PrimaryButton,
  StatusBadge,
} from '../components/ui-kit'

const STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'packing',
  'delivering',
  'completed',
  'cancelled',
]

function OrderDetailPage() {
  const { id = '' } = useParams()
  const decodedId = decodeURIComponent(id)
  const navigate = useNavigate()
  const { notify } = useToast()
  const { orders, updateOrderStatus, deleteOrder } = useAdminData()

  const order = orders.find((item) => item.id === decodedId)

  if (!order) {
    return (
      <PagePanel>
        <EmptyState
          title="Khong tim thay don hang"
          message={`Don ${decodedId} khong ton tai hoac da bi xoa.`}
        />
        <div className="mt-4">
          <GhostButton
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/orders')}
            type="button"
          >
            Ve danh sach
          </GhostButton>
        </div>
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900"
          to="/orders"
        >
          <ArrowLeft className="h-4 w-4" />
          Ve don hang
        </Link>
        <StatusBadge tone={orderStatusTone[order.status]}>
          {orderStatusLabel[order.status]}
        </StatusBadge>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Don hang</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">#{order.id}</h3>
          <p className="mt-2 text-sm text-slate-500">{formatDateTime(order.createdAt)}</p>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-slate-900">Khach hang:</span> {order.customer}
            </p>
            <p>
              <span className="font-semibold text-slate-900">So mat hang:</span> {order.items}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Tong tien:</span>{' '}
              {formatCurrency(order.total)}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Dia chi:</span> {order.address}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Ghi chu:</span> {order.note}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5">
          <p className="text-sm font-semibold text-slate-900">Cap nhat trang thai</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              aria-label={`Order status ${order.id}`}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) => {
                const next = event.target.value as OrderStatus
                updateOrderStatus(order.id, next)
                notify(`Don ${order.id} -> ${orderStatusLabel[next]}`, {
                  title: 'Orders',
                  variant: 'info',
                })
              }}
              value={order.status}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {orderStatusLabel[status]}
                </option>
              ))}
            </select>
            <PrimaryButton
              onClick={() => {
                updateOrderStatus(order.id, 'completed')
                notify(`Don ${order.id} da hoan tat`, { title: 'Orders', variant: 'success' })
              }}
              type="button"
            >
              Hoan tat nhanh
            </PrimaryButton>
          </div>

          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/70 p-3">
            <p className="text-sm font-semibold text-rose-700">Xoa don hang</p>
            <p className="mt-1 text-xs text-rose-600">
              Hanh dong nay se xoa don khoi danh sach.
            </p>
            <GhostButton
              className="mt-3 border-rose-200 text-rose-700 hover:border-rose-500 hover:text-rose-700"
              onClick={() => {
                deleteOrder(order.id)
                notify(`Da xoa ${order.id}`, { title: 'Orders', variant: 'error' })
                navigate('/orders')
              }}
              type="button"
            >
              Xoa don
            </GhostButton>
          </div>
        </div>
      </div>
    </PagePanel>
  )
}

export default OrderDetailPage
