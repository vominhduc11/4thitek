import { AlertTriangle, ArrowLeft, ChevronDown, Copy, ExternalLink } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

function StatusDropdown({
  options,
  onSelect,
  disabled,
  buttonLabel,
}: {
  options: Array<{ value: OrderStatus; label: string }>
  onSelect: (s: OrderStatus) => void
  disabled: boolean
  buttonLabel: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])
  if (options.length === 0) return null
  return (
    <div ref={ref} className="relative">
      <button
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {buttonLabel}
        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              className="block w-full px-4 py-2.5 text-left text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--surface-muted)] focus-visible:outline-none"
              onClick={() => { onSelect(opt.value); setOpen(false) }}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function OrderDetailPage() {
  const { id = '' } = useParams()
  const decodedId = decodeURIComponent(id)
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { notify } = useToast()
  const { confirm, prompt, confirmDialog, promptDialog } = useConfirmDialog()
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
  const [isStatusUpdating, setIsStatusUpdating] = useState(false)

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      notify(t('Đã sao chép {label}', { label }), { variant: 'success', durationMs: 1500 })
    } catch {
      notify(t('Không thể sao chép'), { variant: 'error', durationMs: 1500 })
    }
  }, [notify, t])

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
        return t('Số tiền thanh toán không hợp lệ')
      }
      if (order && nextAmount > order.outstandingAmount) {
        return t('Số tiền không được vượt quá còn lại')
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
    order.paymentMethod === 'bank_transfer'
      ? 'Bank transfer'
      : 'Unknown'
  const paymentStatusLabel =
    order.paymentStatus === 'paid'
      ? 'Paid'
      : order.paymentStatus === 'cancelled'
          ? 'Cancelled'
          : 'Pending payment'

  const paymentStatusTone =
    order.paymentStatus === 'paid'
      ? 'success' as const
      : order.paymentStatus === 'cancelled'
          ? 'danger' as const
          : 'neutral' as const
  const adjTypeLabel: Record<BackendOrderAdjustmentType, string> = {
    CORRECTION: t('Điều chỉnh'),
    WRITE_OFF: t('Xóa nợ'),
    CREDIT_NOTE: t('Ghi có'),
    REFUND_RECORD: t("Ghi nhận hoàn tiền"),
  }

  const statusTransitions = resolveAllowedOrderStatuses(order.status, order.allowedTransitions)
    .filter((s) => s !== order.status)
    .map((s) => ({ value: s, label: t(orderStatusLabel[s]) }))

  const handleStatusChange = async (next: OrderStatus) => {
    if (next === order.status) return

    let cancelReason: string | undefined

    if (next === 'cancelled') {
      const reason = await prompt({
        title: t('Xác nhận hủy đơn'),
        message: t('Vui lòng nhập lý do hủy. Hành động này không thể hoàn tác.'),
        inputLabel: t('Lý do hủy'),
        inputPlaceholder: t('Ví dụ: Khách yêu cầu hủy, Hết hàng, Lỗi giá...'),
        tone: 'danger',
        confirmLabel: t('Hủy đơn'),
        cancelLabel: t('Không hủy'),
        required: true,
      })
      if (reason === null) return
      cancelReason = reason
    } else {
      if (next === 'confirmed' && order.paymentStatus !== 'paid') {
        const proceed = await confirm({
          title: t('Đơn chưa được thanh toán'),
          message: t('Đơn này chưa thanh toán (trạng thái: {status}). Thông thường chỉ xác nhận sau khi đã thu tiền. Bạn có chắc muốn tiếp tục?', { status: paymentStatusLabel }),
          tone: 'warning',
          confirmLabel: t('Xác nhận dù chưa thanh toán'),
          cancelLabel: t('Không'),
        })
        if (!proceed) return
      }

      const approved = await confirm({
        title: t('Xác nhận đổi trạng thái'),
        message: t('Chuyển đơn này sang "{status}"?', { status: t(orderStatusLabel[next]) }),
        tone: 'warning',
        confirmLabel: t(orderStatusLabel[next]),
      })
      if (!approved) return
    }

    try {
      setIsStatusUpdating(true)
      await updateOrderStatus(order.id, next, cancelReason)
      notify(t('Đơn {id} → {status}', { id: order.orderCode, status: t(orderStatusLabel[next]) }), {
        title: t('Đơn hàng'), variant: 'success',
      })
    } catch (error) {
      notify(error instanceof Error ? error.message : t('Không cập nhật được đơn hàng'), {
        title: t('Đơn hàng'), variant: 'error',
      })
    } finally {
      setIsStatusUpdating(false)
    }
  }

  return (
    <PagePanel>
      {/* ─── Sticky header ─── */}
      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 py-2.5 backdrop-blur sm:-mx-5 sm:-mt-5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <GhostButton
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/orders')}
            type="button"
          >
            {t('Về đơn hàng')}
          </GhostButton>
          <span className="hidden text-sm font-semibold text-[var(--ink)] sm:block">{order.orderCode}</span>
          <span className="hidden text-xs text-[var(--muted)] sm:block">#{order.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone={orderStatusTone[order.status]}>{t(orderStatusLabel[order.status])}</StatusBadge>
          <StatusDropdown
            buttonLabel={t('Đổi trạng thái')}
            disabled={isStatusUpdating}
            onSelect={(s) => void handleStatusChange(s)}
            options={statusTransitions}
          />
        </div>
      </div>

      {/* ─── Alert banners ─── */}
      {order.staleReviewRequired && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800/40 dark:bg-rose-900/20 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <span>{t('Đơn này đã hết hạn xử lý nhưng có thanh toán ghi nhận nên cần xem xét thủ công trước khi hủy.')}</span>
        </div>
      )}
      {order.shippingOverdue && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span>{t('Đơn này đã được xác nhận quá lâu nhưng chưa chuyển sang giao hàng. Cần kiểm tra fulfillment và logistics.')}</span>
        </div>
      )}

      {/* ─── 2-column grid ─── */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">

        {/* LEFT: order info + items + history */}
        <div className="min-w-0 space-y-4">
          {/* Order summary */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Đơn hàng')}</p>
                <h3 className="mt-1.5 text-xl font-semibold text-[var(--ink)]">{order.orderCode}</h3>
                <p className="mt-0.5 text-xs text-[var(--muted)]">#{order.id} · {formatDateTime(order.createdAt)}</p>
              </div>
              <StatusBadge tone={paymentStatusTone}>{paymentStatusLabel}</StatusBadge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{t('Tổng tiền')}</p>
                <p className="mt-1 font-semibold text-[var(--accent)]">{formatCurrency(order.total)}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{t('Đã thanh toán')}</p>
                <p className="mt-1 font-semibold text-[var(--tone-success-ink,#16a34a)]">{formatCurrency(order.paidAmount)}</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:col-span-1">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{t('Còn lại')}</p>
                <p className={`mt-1 font-semibold ${order.outstandingAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--ink)]'}`}>
                  {formatCurrency(order.outstandingAmount)}
                </p>
              </div>
              <div className="col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:col-span-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{t('Phương thức thanh toán')}</p>
                <p className="mt-1 font-medium text-[var(--ink)]">{paymentMethodLabel}</p>
              </div>
            </div>
          </div>

          {/* Order items */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
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
                      <th className="px-3 py-2 text-right font-semibold">{t('SL')}</th>
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
                        <td className={`px-3 py-2 text-right ${tableValueClass}`}>{formatCurrency(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[var(--border)]">
                      <td colSpan={4} className={`px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide ${tableMetaClass}`}>{t('Tổng cộng')}</td>
                      <td className={`px-3 py-2 text-right font-bold text-[var(--accent)]`}>{formatCurrency(order.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Payment history accordion */}
          <details className="group rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
              <p className="text-sm font-semibold text-[var(--ink)]">{t('Lịch sử thanh toán')}
                {payments.length > 0 && <span className="ml-2 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent-strong)]">{payments.length}</span>}
              </p>
              <ChevronDown className="h-4 w-4 text-[var(--muted)] transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-4">
              {paymentsError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{paymentsError}</div>
              )}
              {payments.length === 0 && !paymentsError ? (
                <p className={`text-sm ${tableMetaClass}`}>{t('Chưa có lịch sử thanh toán.')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={tableHeadClass}>
                        <th className="px-3 py-2 font-semibold">{t('Số tiền')}</th>
                        <th className="px-3 py-2 font-semibold">{t('Kênh')}</th>
                        <th className="px-3 py-2 font-semibold">{t('Mã GD')}</th>
                        <th className="px-3 py-2 font-semibold">{t('Ghi chú')}</th>
                        <th className="px-3 py-2 font-semibold">{t('Người ghi')}</th>
                        <th className="px-3 py-2 font-semibold">{t('Thời gian')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className={tableRowClass}>
                          <td className="px-3 py-2 font-semibold text-[var(--tone-success-ink,#16a34a)]">{formatCurrency(Number(p.amount ?? 0))}</td>
                          <td className="px-3 py-2 text-[var(--ink)]">{p.channel ?? '—'}</td>
                          <td className={`px-3 py-2 font-mono ${tableMetaClass}`}>{p.transactionCode || '—'}</td>
                          <td className="max-w-[12rem] break-words px-3 py-2 text-[var(--ink)]">{p.note || '—'}</td>
                          <td className="px-3 py-2 text-[var(--ink)]">{p.recordedBy || '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-[var(--ink)]">{p.paidAt ? formatDateTime(p.paidAt) : p.createdAt ? formatDateTime(p.createdAt) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </details>

          {/* Financial adjustments accordion */}
          <details className="group rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
              <p className="text-sm font-semibold text-[var(--ink)]">{t('Điều chỉnh tài chính')}
                {adjustments.length > 0 && <span className="ml-2 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent-strong)]">{adjustments.length}</span>}
              </p>
              <ChevronDown className="h-4 w-4 text-[var(--muted)] transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-4 space-y-4">
              <p className="text-xs text-[var(--muted)]">{t('Ghi nhận điều chỉnh, bù trừ hoặc hoàn tiền cho đơn hàng.')}</p>
              {adjustmentsError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{adjustmentsError}</div>
              )}
              {adjustments.length > 0 && (
                <div className="overflow-x-auto">
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
                          <td className="max-w-[12rem] break-words px-3 py-2 text-[var(--ink)]">{adj.reason}</td>
                          <td className={`px-3 py-2 ${tableMetaClass}`}>{adj.referenceCode || '—'}</td>
                          <td className="px-3 py-2 text-[var(--ink)]">{adj.createdBy || '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-[var(--ink)]">{adj.createdAt ? formatDateTime(adj.createdAt) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <details className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <summary className="cursor-pointer select-none list-none px-4 py-3 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-muted)] [&::-webkit-details-marker]:hidden">{t('Thêm điều chỉnh tài chính')}</summary>
                <div className="border-t border-[var(--border)] p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className={labelClass}>{t('Loại điều chỉnh')}</span>
                      <select className={inputClass} value={adjType} onChange={(e) => setAdjType(e.target.value as BackendOrderAdjustmentType)}>
                        <option value="CORRECTION">{t('Điều chỉnh')}</option>
                        <option value="WRITE_OFF">{t('Xóa nợ')}</option>
                        <option value="CREDIT_NOTE">{t('Ghi có')}</option>
                        <option value="REFUND_RECORD">{t('Ghi nhận hoàn tiền')}</option>
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className={labelClass}>{t('Số tiền')}</span>
                      <input className={inputClass} step="1" type="number" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} />
                    </label>
                    <label className="space-y-1 sm:col-span-2">
                      <span className={labelClass}>{t('Lý do (tối thiểu 10 ký tự)')}</span>
                      <textarea className="min-h-20 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} />
                    </label>
                    <label className="space-y-1 sm:col-span-2">
                      <span className={labelClass}>{t('Mã tham chiếu (tuỳ chọn)')}</span>
                      <input className={inputClass} value={adjRef} onChange={(e) => setAdjRef(e.target.value)} />
                    </label>
                    {order?.status === 'completed' ? (
                      <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:col-span-2">
                        <input checked={adjConfirmOverride} className="mt-1 h-4 w-4 accent-amber-600" onChange={(e) => setAdjConfirmOverride(e.target.checked)} type="checkbox" />
                        <span>{t('Đơn hàng đã hoàn tất. Xác nhận để tạo điều chỉnh tài chính.')}</span>
                      </label>
                    ) : null}
                  </div>
                  {adjError && <FieldErrorMessage className={fieldErrorClass}>{adjError}</FieldErrorMessage>}
                  <div className="mt-3">
                    <PrimaryButton disabled={adjSubmitting} type="button" onClick={async () => {
                      if (!accessToken) return
                      const amount = Number(adjAmount)
                      if (Number.isNaN(amount) || amount === 0) { setAdjError(t('Số tiền phải khác 0')); return }
                      if (order?.status === 'completed' && !adjConfirmOverride) { setAdjError(t('Cần xác nhận trước khi điều chỉnh đơn đã hoàn tất')); return }
                      if (adjReason.trim().length < 10) { setAdjError(t('Lý do phải có ít nhất 10 ký tự')); return }
                      setAdjError(''); setAdjSubmitting(true)
                      try {
                        const created = await createAdminOrderAdjustment(accessToken, Number(order.id), { type: adjType, amount, reason: adjReason.trim(), referenceCode: adjRef.trim() || undefined, confirmOverride: order?.status === 'completed' ? adjConfirmOverride : undefined })
                        setAdjustments((prev) => [created, ...prev])
                        setAdjAmount(''); setAdjReason(''); setAdjRef(''); setAdjConfirmOverride(false)
                        void reloadResource('orders')
                        notify(t('Đã thêm điều chỉnh tài chính'), { title: t('Điều chỉnh'), variant: 'success' })
                      } catch (err) {
                        setAdjError(err instanceof Error ? err.message : t('Không thêm được điều chỉnh'))
                      } finally { setAdjSubmitting(false) }
                    }}>
                      {t('Thêm điều chỉnh')}
                    </PrimaryButton>
                  </div>
                </div>
              </details>
            </div>
          </details>
        </div>

        {/* RIGHT: customer info + actions sidebar */}
        <div className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          {/* Customer & delivery */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
            <p className="text-sm font-semibold text-[var(--ink)]">{t('Thông tin giao hàng')}</p>
            <div className="mt-3 space-y-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{t('Đại lý')}</p>
                <p className="mt-1 font-semibold text-[var(--ink)]">{order.dealer}</p>
                <p className="text-xs text-[var(--muted)]">{t('Số mặt hàng')}: {order.items}</p>
              </div>
              {order.address && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{t('Địa chỉ')}</p>
                    <div className="flex items-center gap-1.5">
                      <button
                        aria-label={t('Sao chép địa chỉ')}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
                        onClick={() => void copyToClipboard(order.address, t('địa chỉ'))}
                        type="button"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <a
                        aria-label={t('Mở Google Maps')}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--accent)]"
                        href={`https://maps.google.com/?q=${encodeURIComponent(order.address)}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-[var(--ink)]">{order.address}</p>
                </div>
              )}
              {!order.address && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{t('Địa chỉ')}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">—</p>
                </div>
              )}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{t('Ghi chú')}</p>
                <p className="mt-1 text-sm text-[var(--ink)]">{order.note || '—'}</p>
              </div>
            </div>
          </div>

          {/* Payment recording */}
          {order.outstandingAmount > 0 && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-800/30 dark:bg-emerald-900/10">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{t('Ghi nhận thanh toán')}</p>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">{t('Dùng khi cần xác nhận tiền đã nhận ngoài webhook tự động.')}</p>
              {isPaymentDirty && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800" role="status">
                  {t('Có thay đổi chưa lưu.')}
                </div>
              )}
              <div className="mt-3 grid gap-3">
                <label className="space-y-1.5">
                  <span className={labelClass}>{t('Số tiền')}</span>
                  <input
                    aria-describedby={paymentError ? 'order-payment-amount-error' : undefined}
                    aria-invalid={Boolean(paymentError)}
                    className={`${inputClass} w-full${paymentError ? ' border-rose-300' : ''}`}
                    max={order.outstandingAmount}
                    min="1"
                    onChange={(e) => { setPaymentAmount(e.target.value); const n = Number(e.target.value); setPaymentError(!e.target.value.trim() || (!Number.isNaN(n) && n > 0 && n <= order.outstandingAmount) ? '' : t('Số tiền không hợp lệ')) }}
                    type="number"
                    value={paymentAmount}
                  />
                  {paymentError && <FieldErrorMessage className={fieldErrorClass} id="order-payment-amount-error">{paymentError}</FieldErrorMessage>}
                </label>
                <label className="space-y-1.5">
                  <span className={labelClass}>{t('Mã giao dịch')}</span>
                  <input className={`${inputClass} w-full`} onChange={(e) => setTransactionCode(e.target.value)} value={transactionCode} />
                </label>
                <label className="space-y-1.5">
                  <span className={labelClass}>{t('Ghi chú nội bộ')}</span>
                  <textarea className="min-h-20 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" onChange={(e) => setPaymentNote(e.target.value)} value={paymentNote} />
                </label>
              </div>
              <div className="mt-3 flex gap-2">
                <PrimaryButton
                  onClick={async () => {
                    const err = validatePaymentAmount(paymentAmount)
                    if (err) { setPaymentError(err); return }
                    const amount = Number(paymentAmount)
                    if (Number.isNaN(amount) || amount <= 0) { setPaymentError(t('Số tiền thanh toán không hợp lệ')); return }
                    try {
                      await recordOrderPayment(order.id, { amount, method: 'bank_transfer', channel: 'Admin manual bank transfer confirmation', transactionCode: transactionCode.trim() || undefined, note: paymentNote.trim() || undefined })
                      notify(t('Đã ghi nhận thanh toán cho đơn {id}', { id: order.orderCode }), { title: t('Đơn hàng'), variant: 'success' })
                      setPaymentError('')
                      if (accessToken && orderId) {
                        fetchAdminOrderPayments(accessToken, Number(orderId)).then((data) => setPayments(data)).catch(() => { /* non-critical */ })
                      }
                    } catch (error) {
                      notify(error instanceof Error ? error.message : t('Không ghi nhận được thanh toán'), { title: t('Đơn hàng'), variant: 'error' })
                    }
                  }}
                  type="button"
                >
                  {t('Ghi nhận thanh toán')}
                </PrimaryButton>
                {isPaymentDirty && (
                  <GhostButton onClick={() => { setPaymentAmount(initialPaymentAmount); setTransactionCode(''); setPaymentNote(''); setPaymentError('') }} type="button">
                    {t('Hoàn tác')}
                  </GhostButton>
                )}
              </div>
            </div>
          )}

          {/* Delete zone */}
          {canDeleteOrder(order.status) && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-800/30 dark:bg-rose-900/10">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{t('Xóa đơn hàng')}</p>
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{t('Hành động này sẽ xóa đơn khỏi danh sách.')}</p>
              <GhostButton
                className="mt-3 border-rose-200 text-rose-700 hover:border-rose-500 hover:text-rose-700"
                onClick={async () => {
                  const approved = await confirm({ title: t('Xóa đơn hàng'), message: t('Hành động này sẽ xóa đơn khỏi danh sách.'), tone: 'danger', confirmLabel: t('Xóa đơn') })
                  if (!approved) return
                  try {
                    await deleteOrder(order.id)
                    notify(t('Đã xóa {id}', { id: order.id }), { title: t('Đơn hàng'), variant: 'error' })
                    navigate('/orders')
                  } catch (error) {
                    notify(error instanceof Error ? error.message : t('Không xóa được đơn hàng'), { title: t('Đơn hàng'), variant: 'error' })
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

      {confirmDialog}
      {promptDialog}
    </PagePanel>
  )
}

export default OrderDetailPage
