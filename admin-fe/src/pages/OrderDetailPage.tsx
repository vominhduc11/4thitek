import { ArrowLeft } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAdminData, type OrderStatus } from '../context/AdminDataContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { getAllowedOrderStatuses, orderStatusLabel, orderStatusTone } from '../lib/adminLabels'
import { formatCurrency, formatDateTime } from '../lib/formatters'
import {
  EmptyState,
  ErrorState,
  FieldErrorMessage,
  GhostButton,
  LoadingRows,
  PagePanel,
  PrimaryButton,
  StatusBadge,
  fieldErrorClass,
  inputClass,
  labelClass,
} from '../components/ui-kit'
import { useConfirmDialog } from '../hooks/useConfirmDialog'

function OrderDetailPage() {
  const { id = '' } = useParams()
  const decodedId = decodeURIComponent(id)
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { notify } = useToast()
  const { confirm, confirmDialog } = useConfirmDialog()
  const { orders, ordersState, updateOrderStatus, recordOrderPayment, deleteOrder, reloadResource } =
    useAdminData()
  const [paymentAmount, setPaymentAmount] = useState('')
  const [transactionCode, setTransactionCode] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [paymentError, setPaymentError] = useState('')

  const order = orders.find((item) => item.id === decodedId)
  const initialPaymentAmount = useMemo(
    () => (order && order.outstandingAmount > 0 ? String(order.outstandingAmount) : ''),
    [order?.outstandingAmount],
  )
  const isPaymentDirty = useMemo(
    () =>
      Boolean(
        order &&
          order.outstandingAmount > 0 &&
          (paymentAmount !== initialPaymentAmount ||
            transactionCode.trim() !== '' ||
            paymentNote.trim() !== ''),
      ),
    [initialPaymentAmount, order, paymentAmount, paymentNote, transactionCode],
  )

  useEffect(() => {
    if (!order) {
      return
    }
    setPaymentAmount(initialPaymentAmount)
    setTransactionCode('')
    setPaymentNote('')
    setPaymentError('')
  }, [initialPaymentAmount, order?.id])

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
          title={t('Không thể tải đơn hàng')}
          message={ordersState.error || t('Không tải được chi tiết đơn hàng')}
          onRetry={() => void reloadResource('orders')}
        />
      </PagePanel>
    )
  }

  if (!order) {
    return (
      <PagePanel>
        <EmptyState
          title={t('Không tìm thấy đơn hàng')}
          message={t('Đơn {id} không tồn tại hoặc đã bị xóa.', { id: decodedId })}
        />
        <div className="mt-4">
          <GhostButton
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/orders')}
            type="button"
          >
            {t('Về danh sách')}
          </GhostButton>
        </div>
      </PagePanel>
    )
  }

  const paymentMethodLabel =
    order.paymentMethod === 'debt' ? t('Công nợ') : t('Chuyển khoản ngân hàng')
  const paymentStatusLabel =
    order.paymentStatus === 'paid'
      ? t('Đã thanh toán')
      : order.paymentStatus === 'debt_recorded'
        ? t('Ghi nhận công nợ')
        : order.paymentStatus === 'cancelled'
          ? t('Đã hủy')
          : order.paymentStatus === 'failed'
            ? t('Thất bại')
            : t('Chưa thanh toán')

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900"
          to="/orders"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('Về đơn hàng')}
        </Link>
        <StatusBadge tone={orderStatusTone[order.status]}>{orderStatusLabel[order.status]}</StatusBadge>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('Đơn hàng')}</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">#{order.id}</h3>
          <p className="mt-2 text-sm text-slate-500">{formatDateTime(order.createdAt)}</p>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-slate-900">{t('Đại lý')}:</span> {order.dealer}
            </p>
            <p>
              <span className="font-semibold text-slate-900">{t('Số mặt hàng')}:</span> {order.items}
            </p>
            <p>
              <span className="font-semibold text-slate-900">{t('Tổng tiền')}:</span>{' '}
              {formatCurrency(order.total)}
            </p>
            <p>
              <span className="font-semibold text-slate-900">{t('Thanh toán')}:</span>{' '}
              {paymentMethodLabel} | {paymentStatusLabel}
            </p>
            <p>
              <span className="font-semibold text-slate-900">{t('Đã thu')}:</span>{' '}
              {formatCurrency(order.paidAmount)}
            </p>
            <p>
              <span className="font-semibold text-slate-900">{t('Còn lại')}:</span>{' '}
              {formatCurrency(order.outstandingAmount)}
            </p>
            <p>
              <span className="font-semibold text-slate-900">{t('Địa chỉ')}:</span> {order.address}
            </p>
            <p>
              <span className="font-semibold text-slate-900">{t('Ghi chú')}:</span> {order.note}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5">
          <p className="text-sm font-semibold text-slate-900">{t('Cập nhật trạng thái')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              aria-label={t('Trạng thái đơn {id}', { id: order.id })}
              className={`${inputClass} bg-white text-slate-700`}
              onChange={async (event) => {
                const next = event.target.value as OrderStatus
                if (next === order.status) {
                  return
                }

                const approved = await confirm({
                  title: t('Xác nhận đổi trạng thái'),
                  message: t('Chuyển đơn này sang "{status}"?', {
                    status: orderStatusLabel[next],
                  }),
                  tone: next === 'cancelled' ? 'danger' : 'warning',
                  confirmLabel: orderStatusLabel[next],
                })

                if (!approved) {
                  event.currentTarget.value = order.status
                  return
                }

                try {
                  await updateOrderStatus(order.id, next)
                  notify(t('Đơn {id} -> {status}', { id: order.id, status: orderStatusLabel[next] }), {
                    title: t('Đơn hàng'),
                    variant: 'info',
                  })
                } catch (error) {
                  notify(error instanceof Error ? error.message : t('Không cập nhật được đơn hàng'), {
                    title: t('Đơn hàng'),
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
                const approved = await confirm({
                  title: t('Xác nhận hoàn tất đơn'),
                  message: t('Đánh dấu đơn {id} đã hoàn tất?', { id: order.id }),
                  tone: 'info',
                  confirmLabel: t('Hoàn tất'),
                })
                if (!approved) {
                  return
                }

                try {
                  await updateOrderStatus(order.id, 'completed')
                  notify(t('Đơn {id} đã hoàn tất', { id: order.id }), {
                    title: t('Đơn hàng'),
                    variant: 'success',
                  })
                } catch (error) {
                  notify(error instanceof Error ? error.message : t('Không cập nhật được đơn hàng'), {
                    title: t('Đơn hàng'),
                    variant: 'error',
                  })
                }
              }}
              type="button"
            >
              {t('Hoàn tất nhanh')}
            </PrimaryButton>
          </div>

          {order.outstandingAmount > 0 && isPaymentDirty ? (
            <div
              className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
              role="status"
            >
              {t('Có thay đổi chưa lưu trong biểu mẫu thanh toán.')}
            </div>
          ) : null}

          {order.outstandingAmount > 0 ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <p className="text-sm font-semibold text-emerald-800">
                {t('Ghi nhận thanh toán thủ công')}
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                {t('Dùng khi cần xác nhận tiền đã nhận ngoài webhook tự động.')}
              </p>
              <div className="mt-3 grid gap-3">
                <label className="space-y-2">
                  <span className={labelClass}>{t('Số tiền')}</span>
                  <input
                    aria-describedby={paymentError ? 'order-payment-amount-error' : undefined}
                    aria-invalid={Boolean(paymentError)}
                    className={`${inputClass} bg-white text-slate-700 ${paymentError ? 'border-rose-300' : ''}`}
                    min="1"
                    onChange={(event) => {
                      setPaymentAmount(event.target.value)
                      const nextAmount = Number(event.target.value)
                      setPaymentError(
                        !event.target.value.trim() || (!Number.isNaN(nextAmount) && nextAmount > 0)
                          ? ''
                          : t('Số tiền thanh toán không hợp lệ'),
                      )
                    }}
                    type="number"
                    value={paymentAmount}
                  />
                  {paymentError ? (
                    <FieldErrorMessage className={fieldErrorClass} id="order-payment-amount-error">
                      {paymentError}
                    </FieldErrorMessage>
                  ) : null}
                </label>
                <label className="space-y-2">
                  <span className={labelClass}>{t('Mã giao dịch')}</span>
                  <input
                    className={`${inputClass} bg-white text-slate-700`}
                    onChange={(event) => setTransactionCode(event.target.value)}
                    value={transactionCode}
                  />
                </label>
                <label className="space-y-2">
                  <span className={labelClass}>{t('Ghi chú nội bộ')}</span>
                  <textarea
                    className="min-h-24 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    onChange={(event) => setPaymentNote(event.target.value)}
                    value={paymentNote}
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <PrimaryButton
                  onClick={async () => {
                    const amount = Number(paymentAmount)
                    if (Number.isNaN(amount) || amount <= 0) {
                      setPaymentError(t('Số tiền thanh toán không hợp lệ'))
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
                      notify(t('Đã ghi nhận thanh toán cho đơn {id}', { id: order.id }), {
                        title: t('Đơn hàng'),
                        variant: 'success',
                      })
                      setPaymentError('')
                    } catch (error) {
                      notify(
                        error instanceof Error ? error.message : t('Không ghi nhận được thanh toán'),
                        {
                          title: t('Đơn hàng'),
                          variant: 'error',
                        },
                      )
                    }
                  }}
                  type="button"
                >
                  {t('Ghi nhận thanh toán')}
                </PrimaryButton>
                {isPaymentDirty ? (
                  <GhostButton
                    onClick={() => {
                      setPaymentAmount(initialPaymentAmount)
                      setTransactionCode('')
                      setPaymentNote('')
                      setPaymentError('')
                    }}
                    type="button"
                  >
                    {t('Hoàn tác')}
                  </GhostButton>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/70 p-3">
            <p className="text-sm font-semibold text-rose-700">{t('Xóa đơn hàng')}</p>
            <p className="mt-1 text-xs text-rose-600">
              {t('Hành động này sẽ xóa đơn khỏi danh sách.')}
            </p>
            <GhostButton
              className="mt-3 border-rose-200 text-rose-700 hover:border-rose-500 hover:text-rose-700"
              onClick={async () => {
                const approved = await confirm({
                  title: t('Xóa đơn hàng'),
                  message: t('Hành động này sẽ xóa đơn khỏi danh sách.'),
                  tone: 'danger',
                  confirmLabel: t('Xóa đơn'),
                })
                if (!approved) {
                  return
                }

                try {
                  await deleteOrder(order.id)
                  notify(t('Đã xóa {id}', { id: order.id }), {
                    title: t('Đơn hàng'),
                    variant: 'error',
                  })
                  navigate('/orders')
                } catch (error) {
                  notify(error instanceof Error ? error.message : t('Không xóa được đơn hàng'), {
                    title: t('Đơn hàng'),
                    variant: 'error',
                  })
                }
              }}
              type="button"
            >
              {t('Xóa đơn')}
            </GhostButton>
          </div>
        </div>
      </div>
      {confirmDialog}
    </PagePanel>
  )
}

export default OrderDetailPage
