import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAdminData, type OrderStatus } from '../context/AdminDataContext'
import { useToast } from '../context/ToastContext'
import { getAllowedOrderStatuses, orderStatusLabel, orderStatusTone } from '../lib/adminLabels'
import { formatCurrency, formatDateTime } from '../lib/formatters'
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PagePanel,
  PrimaryButton,
  StatusBadge,
} from '../components/ui-kit'

function OrderDetailPage() {
  const { id = '' } = useParams()
  const decodedId = decodeURIComponent(id)
  const navigate = useNavigate()
  const { notify } = useToast()
  const { orders, ordersState, updateOrderStatus, recordOrderPayment, deleteOrder, reloadResource } =
    useAdminData()
  const [paymentAmount, setPaymentAmount] = useState('')
  const [transactionCode, setTransactionCode] = useState('')
  const [paymentNote, setPaymentNote] = useState('')

  const order = orders.find((item) => item.id === decodedId)

  useEffect(() => {
    if (!order) {
      return
    }
    setPaymentAmount(order.outstandingAmount > 0 ? String(order.outstandingAmount) : '')
    setTransactionCode('')
    setPaymentNote('')
  }, [order?.id, order?.outstandingAmount])

  if (ordersState.status === 'loading' || ordersState.status === 'idle') {
    return (
      <PagePanel>
        <LoadingRows rows={4} />
      </PagePanel>
    )
  }

  if (ordersState.status === 'error') {
    return (
      <PagePanel>
        <ErrorState
          title="Khong the tai don hang"
          message={ordersState.error || 'Khong tai duoc chi tiet don hang'}
          onRetry={() => void reloadResource('orders')}
        />
      </PagePanel>
    )
  }

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

  const paymentMethodLabel =
    order.paymentMethod === 'debt' ? 'Cong no' : 'Chuyen khoan ngan hang'
  const paymentStatusLabel =
    order.paymentStatus === 'paid'
      ? 'Da thanh toan'
      : order.paymentStatus === 'debt_recorded'
        ? 'Ghi nhan cong no'
        : order.paymentStatus === 'cancelled'
          ? 'Da huy'
          : order.paymentStatus === 'failed'
            ? 'That bai'
            : 'Chua thanh toan'

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
        <StatusBadge tone={orderStatusTone[order.status]}>{orderStatusLabel[order.status]}</StatusBadge>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Don hang</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">#{order.id}</h3>
          <p className="mt-2 text-sm text-slate-500">{formatDateTime(order.createdAt)}</p>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-slate-900">Dai ly:</span> {order.dealer}
            </p>
            <p>
              <span className="font-semibold text-slate-900">So mat hang:</span> {order.items}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Tong tien:</span>{' '}
              {formatCurrency(order.total)}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Thanh toan:</span>{' '}
              {paymentMethodLabel} • {paymentStatusLabel}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Da thu:</span>{' '}
              {formatCurrency(order.paidAmount)}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Con lai:</span>{' '}
              {formatCurrency(order.outstandingAmount)}
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
              onChange={async (event) => {
                const next = event.target.value as OrderStatus
                try {
                  await updateOrderStatus(order.id, next)
                  notify(`Don ${order.id} -> ${orderStatusLabel[next]}`, {
                    title: 'Orders',
                    variant: 'info',
                  })
                } catch (error) {
                  notify(error instanceof Error ? error.message : 'Khong cap nhat duoc don hang', {
                    title: 'Orders',
                    variant: 'error',
                  })
                }
              }}
              value={order.status}
            >
              {getAllowedOrderStatuses(order.status).map((status) => (
                <option key={status} value={status}>
                  {orderStatusLabel[status]}
                </option>
              ))}
            </select>
            <PrimaryButton
              disabled={order.status !== 'delivering'}
              onClick={async () => {
                try {
                  await updateOrderStatus(order.id, 'completed')
                  notify(`Don ${order.id} da hoan tat`, { title: 'Orders', variant: 'success' })
                } catch (error) {
                  notify(error instanceof Error ? error.message : 'Khong cap nhat duoc don hang', {
                    title: 'Orders',
                    variant: 'error',
                  })
                }
              }}
              type="button"
            >
              Hoan tat nhanh
            </PrimaryButton>
          </div>

          {order.outstandingAmount > 0 ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <p className="text-sm font-semibold text-emerald-800">Ghi nhan thanh toan thu cong</p>
              <p className="mt-1 text-xs text-emerald-700">
                Dung khi can xac nhan tien da nhan ngoai webhook tu dong.
              </p>
              <div className="mt-3 grid gap-3">
                <input
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  min="1"
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  placeholder="So tien"
                  type="number"
                  value={paymentAmount}
                />
                <input
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  onChange={(event) => setTransactionCode(event.target.value)}
                  placeholder="Ma giao dich (tuy chon)"
                  value={transactionCode}
                />
                <textarea
                  className="min-h-24 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  onChange={(event) => setPaymentNote(event.target.value)}
                  placeholder="Ghi chu noi bo"
                  value={paymentNote}
                />
              </div>
              <div className="mt-3">
                <PrimaryButton
                  onClick={async () => {
                    const amount = Number(paymentAmount)
                    if (Number.isNaN(amount) || amount <= 0) {
                      notify('So tien thanh toan khong hop le', {
                        title: 'Orders',
                        variant: 'error',
                      })
                      return
                    }

                    try {
                      await recordOrderPayment(order.id, {
                        amount,
                        method: order.paymentMethod,
                        channel:
                          order.paymentMethod === 'bank_transfer'
                            ? 'Admin manual bank transfer confirmation'
                            : 'Admin manual payment confirmation',
                        transactionCode: transactionCode.trim() || undefined,
                        note: paymentNote.trim() || undefined,
                      })
                      notify(`Da ghi nhan thanh toan cho don ${order.id}`, {
                        title: 'Orders',
                        variant: 'success',
                      })
                    } catch (error) {
                      notify(
                        error instanceof Error ? error.message : 'Khong ghi nhan duoc thanh toan',
                        {
                          title: 'Orders',
                          variant: 'error',
                        },
                      )
                    }
                  }}
                  type="button"
                >
                  Ghi nhan thanh toan
                </PrimaryButton>
              </div>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/70 p-3">
            <p className="text-sm font-semibold text-rose-700">Xoa don hang</p>
            <p className="mt-1 text-xs text-rose-600">Hanh dong nay se xoa don khoi danh sach.</p>
            <GhostButton
              className="mt-3 border-rose-200 text-rose-700 hover:border-rose-500 hover:text-rose-700"
              onClick={async () => {
                try {
                  await deleteOrder(order.id)
                  notify(`Da xoa ${order.id}`, { title: 'Orders', variant: 'error' })
                  navigate('/orders')
                } catch (error) {
                  notify(error instanceof Error ? error.message : 'Khong xoa duoc don hang', {
                    title: 'Orders',
                    variant: 'error',
                  })
                }
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
