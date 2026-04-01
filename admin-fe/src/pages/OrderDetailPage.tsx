import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAdminData, type OrderStatus } from '../context/AdminDataContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { orderStatusLabel, orderStatusTone, resolveAllowedOrderStatuses } from '../lib/adminLabels'
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
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
  tableValueClass,
} from '../components/ui-kit'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import {
  fetchAdminOrderAdjustments,
  createAdminOrderAdjustment,
  fetchAdminOrderPayments,
  type BackendOrderAdjustmentType,
  type BackendOrderAdjustmentResponse,
  type BackendOrderPaymentResponse,
} from '../lib/adminApi'

const canDeleteOrder = (status: OrderStatus) => status === 'cancelled'

function OrderDetailPage() {
  const { id = '' } = useParams()
  const decodedId = decodeURIComponent(id)
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { notify } = useToast()
  const { confirm, confirmDialog } = useConfirmDialog()
  const { orders, ordersState, updateOrderStatus, recordOrderPayment, deleteOrder, reloadResource } =
    useAdminData()
  const { accessToken } = useAuth()
  const [paymentAmount, setPaymentAmount] = useState('')
  const [transactionCode, setTransactionCode] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [paymentError, setPaymentError] = useState('')

  // Payment history state
  const [payments, setPayments] = useState<BackendOrderPaymentResponse[]>([])
  const [paymentsError, setPaymentsError] = useState<string | null>(null)

  // Adjustments state
  const [adjustments, setAdjustments] = useState<BackendOrderAdjustmentResponse[]>([])
  const [adjustmentsError, setAdjustmentsError] = useState<string | null>(null)
  const [adjType, setAdjType] = useState<BackendOrderAdjustmentType>('CORRECTION')
  const [adjAmount, setAdjAmount] = useState('')
  const [adjReason, setAdjReason] = useState('')
  const [adjRef, setAdjRef] = useState('')
  const [adjConfirmOverride, setAdjConfirmOverride] = useState(false)
  const [adjError, setAdjError] = useState('')
  const [adjSubmitting, setAdjSubmitting] = useState(false)

  const order = orders.find((item) => item.id === decodedId)
  const orderId = order?.id
  const initialPaymentAmount =
    order && order.outstandingAmount > 0 ? String(order.outstandingAmount) : ''
  const validatePaymentAmount = useCallback(
    (value: string) => {
      if (!value.trim()) {
        return ''
      }

      const nextAmount = Number(value)
      if (Number.isNaN(nextAmount) || nextAmount <= 0) {
        return t('Sá»‘ tiá»n thanh toĂ¡n khĂ´ng há»£p lá»‡')
      }
      if (order && nextAmount > order.outstandingAmount) {
        return t('Sá»‘ tiá»n khĂ´ng Ä‘Æ°á»£t vÆ°á»£t quĂ¡ cĂ²n láº¡i')
      }

      return ''
    },
    [order, t],
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

  const resetPaymentForm = useCallback(() => {
    setPaymentAmount(initialPaymentAmount)
    setTransactionCode('')
    setPaymentNote('')
    setPaymentError('')
  }, [initialPaymentAmount])

  useEffect(() => {
    if (!order) {
      return
    }
    const timer = window.setTimeout(() => {
      resetPaymentForm()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [order, resetPaymentForm])

  useEffect(() => {
    if (!accessToken || !orderId) return
    let cancelled = false
    setPaymentsError(null)
    fetchAdminOrderPayments(accessToken, Number(orderId))
      .then((data) => { if (!cancelled) setPayments(data) })
      .catch((err) => {
        if (!cancelled) {
          setPaymentsError(err instanceof Error ? err.message : t('Không tải được lịch sử thanh toán'))
        }
      })
    return () => { cancelled = true }
  }, [accessToken, orderId, t])

  useEffect(() => {
    if (!accessToken || !orderId) return
    let cancelled = false
    setAdjustmentsError(null)
    fetchAdminOrderAdjustments(accessToken, Number(orderId))
      .then((data) => { if (!cancelled) setAdjustments(data) })
      .catch((err) => {
        if (!cancelled) {
          setAdjustmentsError(err instanceof Error ? err.message : t('Không tải được lịch sử điều chỉnh'))
        }
      })
    return () => { cancelled = true }
  }, [accessToken, orderId, t])

  useEffect(() => {
    setAdjConfirmOverride(false)
  }, [orderId])

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
    order.paymentMethod === 'debt'
      ? t('Công nợ')
      : order.paymentMethod === 'bank_transfer'
        ? t('Chuyển khoản ngân hàng')
        : t('Chưa xác định')
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

  const paymentStatusTone =
    order.paymentStatus === 'paid'
      ? 'success' as const
      : order.paymentStatus === 'debt_recorded'
        ? 'warning' as const
        : order.paymentStatus === 'cancelled' || order.paymentStatus === 'failed'
          ? 'danger' as const
          : 'neutral' as const

  const adjTypeLabel: Record<BackendOrderAdjustmentType, string> = {
    CORRECTION: t('Điều chỉnh'),
    WRITE_OFF: t('Xóa nợ'),
    CREDIT_NOTE: t('Ghi có'),
    REFUND_RECORD: t('Ghi nhận hoàn tiền'),
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <GhostButton
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/orders')}
          type="button"
        >
          {t('Về đơn hàng')}
        </GhostButton>
        <StatusBadge tone={orderStatusTone[order.status]}>{t(orderStatusLabel[order.status])}</StatusBadge>
      </div>

      {order.staleReviewRequired && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800/40 dark:bg-rose-900/20 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <span>
            {t('Đơn này đã hết hạn xử lý nhưng có thanh toán ghi nhận — cần xem xét thủ công trước khi hủy.')}
          </span>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Đơn hàng')}</p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--ink)]">{order.orderCode}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">#{order.id}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{formatDateTime(order.createdAt)}</p>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Đại lý')}</p>
              <p className="mt-1 font-semibold text-[var(--ink)]">{order.dealer}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Số mặt hàng')}</p>
              <p className="mt-1 font-semibold text-[var(--ink)]">{order.items}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Tổng tiền')}</p>
              <p className="mt-1 font-semibold text-[var(--accent)]">{formatCurrency(order.total)}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Phương thức')}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[var(--ink)]">{paymentMethodLabel}</span>
                <StatusBadge tone={paymentStatusTone}>{paymentStatusLabel}</StatusBadge>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Đã thu')}</p>
              <p className="mt-1 font-semibold text-[var(--tone-success-ink,#16a34a)]">{formatCurrency(order.paidAmount)}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Còn lại')}</p>
              <p className={`mt-1 font-semibold ${order.outstandingAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--ink)]'}`}>
                {formatCurrency(order.outstandingAmount)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Địa chỉ')}</p>
              <p className="mt-1 text-[var(--ink)]">{order.address || '—'}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Ghi chú')}</p>
              <p className="mt-1 text-[var(--ink)]">{order.note || '—'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
          <p className="text-sm font-semibold text-[var(--ink)]">{t('Cập nhật trạng thái')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              aria-label={t('Trạng thái đơn {id}', { id: order.id })}
              className={inputClass}
              onChange={async (event) => {
                const next = event.target.value as OrderStatus
                if (next === order.status) {
                  return
                }

                const approved = await confirm({
                  title: t('Xác nhận đổi trạng thái'),
                  message: t('Chuyển đơn này sang "{status}"?', {
                    status: t(orderStatusLabel[next]),
                  }),
                  tone: next === 'cancelled' ? 'danger' : 'warning',
                  confirmLabel: t(orderStatusLabel[next]),
                })

                if (!approved) {
                  event.currentTarget.value = order.status
                  return
                }

                try {
                  await updateOrderStatus(order.id, next)
                  notify(t('Đơn {id} -> {status}', { id: order.id, status: t(orderStatusLabel[next]) }), {
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
              {resolveAllowedOrderStatuses(order.status, order.allowedTransitions).map((status) => (
                <option key={status} value={status}>
                  {t(orderStatusLabel[status])}
                </option>
              ))}
            </select>
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
                    className={`${inputClass}${paymentError ? ' border-rose-300' : ''}`}
                    max={order.outstandingAmount > 0 ? order.outstandingAmount : undefined}
                    min="1"
                    onChange={(event) => {
                      setPaymentAmount(event.target.value)
                      const nextAmount = Number(event.target.value)
                      setPaymentError(
                        !event.target.value.trim() ||
                        (!Number.isNaN(nextAmount) &&
                          nextAmount > 0 &&
                          nextAmount <= order.outstandingAmount)
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
                    className={inputClass}
                    onChange={(event) => setTransactionCode(event.target.value)}
                    value={transactionCode}
                  />
                </label>
                <label className="space-y-2">
                  <span className={labelClass}>{t('Ghi chú nội bộ')}</span>
                  <textarea
                    className="min-h-24 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--ink)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    onChange={(event) => setPaymentNote(event.target.value)}
                    value={paymentNote}
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <PrimaryButton
                  onClick={async () => {
                    const nextPaymentError = validatePaymentAmount(paymentAmount)
                    if (nextPaymentError) {
                      setPaymentError(nextPaymentError)
                      return
                    }
                    const amount = Number(paymentAmount)
                    if (Number.isNaN(amount) || amount <= 0) {
                      setPaymentError(t('Số tiền thanh toán không hợp lệ'))
                      return
                    }

                    try {
                      await recordOrderPayment(order.id, {
                        amount,
                        method: order.paymentMethod ?? undefined,
                        channel:
                          order.paymentMethod === 'bank_transfer'
                            ? 'Admin manual bank transfer confirmation'
                            : order.paymentMethod === 'debt'
                              ? 'Admin manual debt confirmation'
                              : 'Admin manual payment confirmation',
                        transactionCode: transactionCode.trim() || undefined,
                        note: paymentNote.trim() || undefined,
                      })
                      notify(t('Đã ghi nhận thanh toán cho đơn {id}', { id: order.orderCode }), {
                        title: t('Đơn hàng'),
                        variant: 'success',
                      })
                      setPaymentError('')
                      // Refresh payment history
                      if (accessToken && orderId) {
                        fetchAdminOrderPayments(accessToken, Number(orderId))
                          .then((data) => setPayments(data))
                          .catch(() => { /* non-critical */ })
                      }
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

          {canDeleteOrder(order.status) && (
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
          )}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
        <p className="text-sm font-semibold text-[var(--ink)]">{t('Mặt hàng trong đơn')}</p>
        {order.orderItems.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">{t('Chưa có thông tin mặt hàng.')}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={tableHeadClass}>
                  <th className="px-3 py-2 text-left font-semibold">{t('SKU')}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t('Tên sản phẩm')}</th>
                  <th className="px-3 py-2 text-right font-semibold">{t('Số lượng')}</th>
                  <th className="px-3 py-2 text-right font-semibold">{t('Đơn giá')}</th>
                  <th className="px-3 py-2 text-right font-semibold">{t('Thành tiền')}</th>
                </tr>
              </thead>
              <tbody>
                {order.orderItems.map((item) => (
                  <tr key={`${item.productId}-${item.productSku}`} className={tableRowClass}>
                    <td className={`px-3 py-2 font-mono text-xs ${tableMetaClass}`}>{item.productSku}</td>
                    <td className={`px-3 py-2 font-medium ${tableValueClass}`}>{item.productName}</td>
                    <td className="px-3 py-2 text-right text-[var(--ink)]">{item.quantity}</td>
                    <td className="px-3 py-2 text-right text-[var(--ink)]">{formatCurrency(item.unitPrice)}</td>
                    <td className={`px-3 py-2 text-right ${tableValueClass}`}>
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--border)]">
                  <td colSpan={4} className={`px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide ${tableMetaClass}`}>
                    {t('Tổng cộng')}
                  </td>
                  <td className={`px-3 py-2 text-right ${tableValueClass}`}>
                    {formatCurrency(order.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
        <p className="text-sm font-semibold text-[var(--ink)]">{t('Lịch sử thanh toán')}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {t('Danh sách các lần ghi nhận thanh toán cho đơn hàng này.')}
        </p>
        {paymentsError && (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {paymentsError}
          </div>
        )}
        {payments.length === 0 && !paymentsError ? (
          <p className={`mt-3 text-sm ${tableMetaClass}`}>{t('Chưa có lịch sử thanh toán.')}</p>
        ) : payments.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={tableHeadClass}>
                  <th className="px-3 py-2 font-semibold">{t('Số tiền')}</th>
                  <th className="px-3 py-2 font-semibold">{t('Phương thức')}</th>
                  <th className="px-3 py-2 font-semibold">{t('Kênh')}</th>
                  <th className="px-3 py-2 font-semibold">{t('Mã giao dịch')}</th>
                  <th className="px-3 py-2 font-semibold">{t('Ghi chú')}</th>
                  <th className="px-3 py-2 font-semibold">{t('Người ghi')}</th>
                  <th className="px-3 py-2 font-semibold">{t('Thời gian')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className={tableRowClass}>
                    <td className="px-3 py-2 font-semibold text-[var(--tone-success-ink,#16a34a)]">{formatCurrency(Number(payment.amount ?? 0))}</td>
                    <td className="px-3 py-2 text-[var(--ink)]">{payment.method ?? '—'}</td>
                    <td className="px-3 py-2 text-[var(--ink)]">{payment.channel ?? '—'}</td>
                    <td className={`px-3 py-2 ${tableMetaClass}`}>{payment.transactionCode || '—'}</td>
                    <td className="px-3 py-2 max-w-xs break-words text-[var(--ink)]">{payment.note || '—'}</td>
                    <td className="px-3 py-2 text-[var(--ink)]">{payment.recordedBy || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-[var(--ink)]">
                      {payment.paidAt ? formatDateTime(payment.paidAt) : payment.createdAt ? formatDateTime(payment.createdAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
        <p className="text-sm font-semibold text-[var(--ink)]">{t('Điều chỉnh tài chính')}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {t('Ghi nhận điều chỉnh, bù trừ hoặc hoàn tiền cho đơn hàng. Số âm làm giảm đã thu, số dương bổ sung đã thu.')}
        </p>

        {adjustmentsError && (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {adjustmentsError}
          </div>
        )}
        {adjustments.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={tableHeadClass}>
                  <th className="px-3 py-2 font-semibold">{t('Loại')}</th>
                  <th className="px-3 py-2 font-semibold">{t('Số tiền')}</th>
                  <th className="px-3 py-2 font-semibold">{t('Lý do')}</th>
                  <th className="px-3 py-2 font-semibold">{t('Mã tham chiếu')}</th>
                  <th className="px-3 py-2 font-semibold">{t('Người tạo')}</th>
                  <th className="px-3 py-2 font-semibold">{t('Thời gian')}</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((adj) => (
                  <tr key={adj.id} className={tableRowClass}>
                    <td className={`px-3 py-2 font-medium ${tableValueClass}`}>{adjTypeLabel[adj.type] ?? adj.type}</td>
                    <td className="px-3 py-2 text-[var(--ink)]">{formatCurrency(Number(adj.amount))}</td>
                    <td className="px-3 py-2 max-w-xs break-words text-[var(--ink)]">{adj.reason}</td>
                    <td className={`px-3 py-2 ${tableMetaClass}`}>{adj.referenceCode || '—'}</td>
                    <td className="px-3 py-2 text-[var(--ink)]">{adj.createdBy || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-[var(--ink)]">{adj.createdAt ? formatDateTime(adj.createdAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <details className="mt-5">
          <summary className="cursor-pointer select-none list-none rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-muted)] [&::-webkit-details-marker]:hidden">
            {t('Thêm điều chỉnh tài chính')}
          </summary>
          <div className="mt-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className={labelClass}>{t('Loại điều chỉnh')}</span>
                <select
                  className={inputClass}
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as BackendOrderAdjustmentType)}
                >
                  <option value="CORRECTION">{t('Điều chỉnh')}</option>
                  <option value="WRITE_OFF">{t('Xóa nợ')}</option>
                  <option value="CREDIT_NOTE">{t('Ghi có')}</option>
                  <option value="REFUND_RECORD">{t('Ghi nhận hoàn tiền')}</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className={labelClass}>{t('Số tiền')}</span>
                <input
                  className={inputClass}
                  step="1"
                  type="number"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className={labelClass}>{t('Lý do (tối thiểu 10 ký tự)')}</span>
                <textarea
                  className="min-h-20 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className={labelClass}>{t('Mã tham chiếu (tuỳ chọn)')}</span>
                <input
                  className={inputClass}
                  value={adjRef}
                  onChange={(e) => setAdjRef(e.target.value)}
                />
              </label>
              {order?.status === 'completed' ? (
                <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:col-span-2">
                  <input
                    checked={adjConfirmOverride}
                    className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-700 focus:ring-amber-500"
                    onChange={(e) => setAdjConfirmOverride(e.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    {t('Đơn hàng đã hoàn tất. Xác nhận để tạo điều chỉnh tài chính.')}
                  </span>
                </label>
              ) : null}
            </div>

            {adjError && (
              <FieldErrorMessage className={fieldErrorClass}>{adjError}</FieldErrorMessage>
            )}

            <div className="mt-3">
              <PrimaryButton
                disabled={adjSubmitting}
                type="button"
                onClick={async () => {
                  if (!accessToken) return
                  const amount = Number(adjAmount)
                  if (Number.isNaN(amount) || amount === 0) {
                    setAdjError(t('Số tiền phải khác 0'))
                    return
                  }
                  if (order?.status === 'completed' && !adjConfirmOverride) {
                    setAdjError(t('Cần xác nhận trước khi điều chỉnh đơn đã hoàn tất'))
                    return
                  }
                  if (adjReason.trim().length < 10) {
                    setAdjError(t('Lý do phải có ít nhất 10 ký tự'))
                    return
                  }
                  setAdjError('')
                  setAdjSubmitting(true)
                  try {
                    const created = await createAdminOrderAdjustment(accessToken, Number(order.id), {
                      type: adjType,
                      amount,
                      reason: adjReason.trim(),
                      referenceCode: adjRef.trim() || undefined,
                      confirmOverride: order?.status === 'completed' ? adjConfirmOverride : undefined,
                    })
                    setAdjustments((prev) => [created, ...prev])
                    setAdjAmount('')
                    setAdjReason('')
                    setAdjRef('')
                    setAdjConfirmOverride(false)
                    void reloadResource('orders')
                    notify(t('Đã thêm điều chỉnh tài chính'), { title: t('Điều chỉnh'), variant: 'success' })
                  } catch (err) {
                    setAdjError(err instanceof Error ? err.message : t('Không thêm được điều chỉnh'))
                  } finally {
                    setAdjSubmitting(false)
                  }
                }}
              >
                {t('Thêm điều chỉnh')}
              </PrimaryButton>
            </div>
          </div>
        </details>
      </div>

      {confirmDialog}
    </PagePanel>
  )
}

export default OrderDetailPage
