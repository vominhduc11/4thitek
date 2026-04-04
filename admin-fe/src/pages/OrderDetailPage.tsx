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
        return t('SĂ¡Â»â€˜ tiĂ¡Â»Ân thanh toÄ‚Â¡n khÄ‚Â´ng hĂ¡Â»Â£p lĂ¡Â»â€¡')
      }
      if (order && nextAmount > order.outstandingAmount) {
        return t('SĂ¡Â»â€˜ tiĂ¡Â»Ân khÄ‚Â´ng Ă„â€˜Ă†Â°Ă¡Â»Â£t vĂ†Â°Ă¡Â»Â£t quÄ‚Â¡ cÄ‚Â²n lĂ¡ÂºÂ¡i')
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
          setPaymentsError(err instanceof Error ? err.message : t('KhĂ´ng táº£i Ä‘Æ°á»£c lá»‹ch sá»­ thanh toĂ¡n'))
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
          setAdjustmentsError(err instanceof Error ? err.message : t('KhĂ´ng táº£i Ä‘Æ°á»£c lá»‹ch sá»­ Ä‘iá»u chá»‰nh'))
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
          title={t('KhĂ´ng thá»ƒ táº£i Ä‘Æ¡n hĂ ng')}
          message={ordersState.error || t('KhĂ´ng táº£i Ä‘Æ°á»£c chi tiáº¿t Ä‘Æ¡n hĂ ng')}
          onRetry={() => void reloadResource('orders')}
        />
      </PagePanel>
    )
  }

  if (!order) {
    return (
      <PagePanel>
        <EmptyState
          title={t('KhĂ´ng tĂ¬m tháº¥y Ä‘Æ¡n hĂ ng')}
          message={t('ÄÆ¡n {id} khĂ´ng tá»“n táº¡i hoáº·c Ä‘Ă£ bá»‹ xĂ³a.', { id: decodedId })}
        />
        <div className="mt-4">
          <GhostButton
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/orders')}
            type="button"
          >
            {t('Vá» danh sĂ¡ch')}
          </GhostButton>
        </div>
      </PagePanel>
    )
  }

  const paymentMethodLabel =
    order.paymentMethod === 'debt'
      ? t('CĂ´ng ná»£')
      : order.paymentMethod === 'bank_transfer'
        ? t('Chuyá»ƒn khoáº£n ngĂ¢n hĂ ng')
        : t('ChÆ°a xĂ¡c Ä‘á»‹nh')
  const paymentStatusLabel =
    order.paymentStatus === 'paid'
      ? t('ÄĂ£ thanh toĂ¡n')
      : order.paymentStatus === 'debt_recorded'
        ? t('Open receivable')
        : order.paymentStatus === 'cancelled'
          ? t('ÄĂ£ há»§y')
          : order.paymentStatus === 'failed'
            ? t('Tháº¥t báº¡i')
            : t('ChÆ°a thanh toĂ¡n')

  const paymentStatusTone =
    order.paymentStatus === 'paid'
      ? 'success' as const
      : order.paymentStatus === 'debt_recorded'
        ? 'warning' as const
        : order.paymentStatus === 'cancelled' || order.paymentStatus === 'failed'
          ? 'danger' as const
          : 'neutral' as const
  const paymentExposureLabel =
    order.paymentMethod !== 'debt'
      ? t('Remaining balance')
      : order.openReceivableAmount > 0
        ? t('Open receivable')
        : order.reservedCreditAmount > 0
          ? t('Credit reserved')
          : t('Remaining balance')
  const paymentExposureTone =
    order.openReceivableAmount > 0
      ? 'text-rose-600 dark:text-rose-400'
      : order.reservedCreditAmount > 0
        ? 'text-amber-700 dark:text-amber-300'
        : 'text-[var(--ink)]'
  const paymentExposureAmount =
    order.openReceivableAmount > 0
      ? order.openReceivableAmount
      : order.reservedCreditAmount > 0
        ? order.reservedCreditAmount
        : order.outstandingAmount

  const adjTypeLabel: Record<BackendOrderAdjustmentType, string> = {
    CORRECTION: t('Äiá»u chá»‰nh'),
    WRITE_OFF: t('XĂ³a ná»£'),
    CREDIT_NOTE: t('Ghi cĂ³'),
    REFUND_RECORD: t('Ghi nháº­n hoĂ n tiá»n'),
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <GhostButton
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/orders')}
          type="button"
        >
          {t('Vá» Ä‘Æ¡n hĂ ng')}
        </GhostButton>
        <StatusBadge tone={orderStatusTone[order.status]}>{t(orderStatusLabel[order.status])}</StatusBadge>
      </div>

      {order.staleReviewRequired && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800/40 dark:bg-rose-900/20 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <span>
            {t('ÄÆ¡n nĂ y Ä‘Ă£ háº¿t háº¡n xá»­ lĂ½ nhÆ°ng cĂ³ thanh toĂ¡n ghi nháº­n â€” cáº§n xem xĂ©t thá»§ cĂ´ng trÆ°á»›c khi há»§y.')}
          </span>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('ÄÆ¡n hĂ ng')}</p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--ink)]">{order.orderCode}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">#{order.id}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{formatDateTime(order.createdAt)}</p>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Äáº¡i lĂ½')}</p>
              <p className="mt-1 font-semibold text-[var(--ink)]">{order.dealer}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Sá»‘ máº·t hĂ ng')}</p>
              <p className="mt-1 font-semibold text-[var(--ink)]">{order.items}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Tá»•ng tiá»n')}</p>
              <p className="mt-1 font-semibold text-[var(--accent)]">{formatCurrency(order.total)}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('PhÆ°Æ¡ng thá»©c')}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[var(--ink)]">{paymentMethodLabel}</span>
                <StatusBadge tone={paymentStatusTone}>{paymentStatusLabel}</StatusBadge>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('ÄĂ£ thu')}</p>
              <p className="mt-1 font-semibold text-[var(--tone-success-ink,#16a34a)]">{formatCurrency(order.paidAmount)}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('CĂ²n láº¡i')}</p>
              <p className={`mt-1 font-semibold ${order.outstandingAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--ink)]'}`}>
                {formatCurrency(order.outstandingAmount)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{paymentExposureLabel}</p>
              <p className={`mt-1 font-semibold ${paymentExposureTone}`}>
                {formatCurrency(paymentExposureAmount)}
              </p>
            </div>
            {order.paymentMethod === 'debt' ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Credit exposure')}</p>
                <p className={`mt-1 font-semibold ${order.creditExposureAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--ink)]'}`}>
                  {formatCurrency(order.creditExposureAmount)}
                </p>
              </div>
            ) : null}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Äá»‹a chá»‰')}</p>
              <p className="mt-1 text-[var(--ink)]">{order.address || 'â€”'}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Ghi chĂº')}</p>
              <p className="mt-1 text-[var(--ink)]">{order.note || 'â€”'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
          <p className="text-sm font-semibold text-[var(--ink)]">{t('Cáº­p nháº­t tráº¡ng thĂ¡i')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              aria-label={t('Tráº¡ng thĂ¡i Ä‘Æ¡n {id}', { id: order.id })}
              className={inputClass}
              onChange={async (event) => {
                const next = event.target.value as OrderStatus
                if (next === order.status) {
                  return
                }

                const approved = await confirm({
                  title: t('XĂ¡c nháº­n Ä‘á»•i tráº¡ng thĂ¡i'),
                  message: t('Chuyá»ƒn Ä‘Æ¡n nĂ y sang "{status}"?', {
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
                  notify(t('ÄÆ¡n {id} -> {status}', { id: order.id, status: t(orderStatusLabel[next]) }), {
                    title: t('ÄÆ¡n hĂ ng'),
                    variant: 'info',
                  })
                } catch (error) {
                  notify(error instanceof Error ? error.message : t('KhĂ´ng cáº­p nháº­t Ä‘Æ°á»£c Ä‘Æ¡n hĂ ng'), {
                    title: t('ÄÆ¡n hĂ ng'),
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
              {t('CĂ³ thay Ä‘á»•i chÆ°a lÆ°u trong biá»ƒu máº«u thanh toĂ¡n.')}
            </div>
          ) : null}

          {order.outstandingAmount > 0 ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <p className="text-sm font-semibold text-emerald-800">
                {t('Ghi nháº­n thanh toĂ¡n thá»§ cĂ´ng')}
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                {t('DĂ¹ng khi cáº§n xĂ¡c nháº­n tiá»n Ä‘Ă£ nháº­n ngoĂ i webhook tá»± Ä‘á»™ng.')}
              </p>
              <div className="mt-3 grid gap-3">
                <label className="space-y-2">
                  <span className={labelClass}>{t('Sá»‘ tiá»n')}</span>
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
                          : t('Sá»‘ tiá»n thanh toĂ¡n khĂ´ng há»£p lá»‡'),
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
                  <span className={labelClass}>{t('MĂ£ giao dá»‹ch')}</span>
                  <input
                    className={inputClass}
                    onChange={(event) => setTransactionCode(event.target.value)}
                    value={transactionCode}
                  />
                </label>
                <label className="space-y-2">
                  <span className={labelClass}>{t('Ghi chĂº ná»™i bá»™')}</span>
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
                      setPaymentError(t('Sá»‘ tiá»n thanh toĂ¡n khĂ´ng há»£p lá»‡'))
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
                      notify(t('ÄĂ£ ghi nháº­n thanh toĂ¡n cho Ä‘Æ¡n {id}', { id: order.orderCode }), {
                        title: t('ÄÆ¡n hĂ ng'),
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
                        error instanceof Error ? error.message : t('KhĂ´ng ghi nháº­n Ä‘Æ°á»£c thanh toĂ¡n'),
                        {
                          title: t('ÄÆ¡n hĂ ng'),
                          variant: 'error',
                        },
                      )
                    }
                  }}
                  type="button"
                >
                  {t('Ghi nháº­n thanh toĂ¡n')}
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
                    {t('HoĂ n tĂ¡c')}
                  </GhostButton>
                ) : null}
              </div>
            </div>
          ) : null}

          {canDeleteOrder(order.status) && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/70 p-3">
              <p className="text-sm font-semibold text-rose-700">{t('XĂ³a Ä‘Æ¡n hĂ ng')}</p>
              <p className="mt-1 text-xs text-rose-600">
                {t('HĂ nh Ä‘á»™ng nĂ y sáº½ xĂ³a Ä‘Æ¡n khá»i danh sĂ¡ch.')}
              </p>
              <GhostButton
                className="mt-3 border-rose-200 text-rose-700 hover:border-rose-500 hover:text-rose-700"
                onClick={async () => {
                  const approved = await confirm({
                    title: t('XĂ³a Ä‘Æ¡n hĂ ng'),
                    message: t('HĂ nh Ä‘á»™ng nĂ y sáº½ xĂ³a Ä‘Æ¡n khá»i danh sĂ¡ch.'),
                    tone: 'danger',
                    confirmLabel: t('XĂ³a Ä‘Æ¡n'),
                  })
                  if (!approved) {
                    return
                  }

                  try {
                    await deleteOrder(order.id)
                    notify(t('ÄĂ£ xĂ³a {id}', { id: order.id }), {
                      title: t('ÄÆ¡n hĂ ng'),
                      variant: 'error',
                    })
                    navigate('/orders')
                  } catch (error) {
                    notify(error instanceof Error ? error.message : t('KhĂ´ng xĂ³a Ä‘Æ°á»£c Ä‘Æ¡n hĂ ng'), {
                      title: t('ÄÆ¡n hĂ ng'),
                      variant: 'error',
                    })
                  }
                }}
                type="button"
              >
                {t('XĂ³a Ä‘Æ¡n')}
              </GhostButton>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
        <p className="text-sm font-semibold text-[var(--ink)]">{t('Máº·t hĂ ng trong Ä‘Æ¡n')}</p>
        {order.orderItems.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">{t('ChÆ°a cĂ³ thĂ´ng tin máº·t hĂ ng.')}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={tableHeadClass}>
                  <th className="px-3 py-2 text-left font-semibold">{t('SKU')}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t('TĂªn sáº£n pháº©m')}</th>
                  <th className="px-3 py-2 text-right font-semibold">{t('Sá»‘ lÆ°á»£ng')}</th>
                  <th className="px-3 py-2 text-right font-semibold">{t('ÄÆ¡n giĂ¡')}</th>
                  <th className="px-3 py-2 text-right font-semibold">{t('ThĂ nh tiá»n')}</th>
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
                    {t('Tá»•ng cá»™ng')}
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
        <p className="text-sm font-semibold text-[var(--ink)]">{t('Lá»‹ch sá»­ thanh toĂ¡n')}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {t('Danh sĂ¡ch cĂ¡c láº§n ghi nháº­n thanh toĂ¡n cho Ä‘Æ¡n hĂ ng nĂ y.')}
        </p>
        {paymentsError && (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {paymentsError}
          </div>
        )}
        {payments.length === 0 && !paymentsError ? (
          <p className={`mt-3 text-sm ${tableMetaClass}`}>{t('ChÆ°a cĂ³ lá»‹ch sá»­ thanh toĂ¡n.')}</p>
        ) : payments.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={tableHeadClass}>
                  <th className="px-3 py-2 font-semibold">{t('Sá»‘ tiá»n')}</th>
                  <th className="px-3 py-2 font-semibold">{t('PhÆ°Æ¡ng thá»©c')}</th>
                  <th className="px-3 py-2 font-semibold">{t('KĂªnh')}</th>
                  <th className="px-3 py-2 font-semibold">{t('MĂ£ giao dá»‹ch')}</th>
                  <th className="px-3 py-2 font-semibold">{t('Ghi chĂº')}</th>
                  <th className="px-3 py-2 font-semibold">{t('NgÆ°á»i ghi')}</th>
                  <th className="px-3 py-2 font-semibold">{t('Thá»i gian')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className={tableRowClass}>
                    <td className="px-3 py-2 font-semibold text-[var(--tone-success-ink,#16a34a)]">{formatCurrency(Number(payment.amount ?? 0))}</td>
                    <td className="px-3 py-2 text-[var(--ink)]">{payment.method ?? 'â€”'}</td>
                    <td className="px-3 py-2 text-[var(--ink)]">{payment.channel ?? 'â€”'}</td>
                    <td className={`px-3 py-2 ${tableMetaClass}`}>{payment.transactionCode || 'â€”'}</td>
                    <td className="px-3 py-2 max-w-xs break-words text-[var(--ink)]">{payment.note || 'â€”'}</td>
                    <td className="px-3 py-2 text-[var(--ink)]">{payment.recordedBy || 'â€”'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-[var(--ink)]">
                      {payment.paidAt ? formatDateTime(payment.paidAt) : payment.createdAt ? formatDateTime(payment.createdAt) : 'â€”'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
        <p className="text-sm font-semibold text-[var(--ink)]">{t('Äiá»u chá»‰nh tĂ i chĂ­nh')}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {t('Ghi nháº­n Ä‘iá»u chá»‰nh, bĂ¹ trá»« hoáº·c hoĂ n tiá»n cho Ä‘Æ¡n hĂ ng. Sá»‘ Ă¢m lĂ m giáº£m Ä‘Ă£ thu, sá»‘ dÆ°Æ¡ng bá»• sung Ä‘Ă£ thu.')}
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
                  <th className="px-3 py-2 font-semibold">{t('Loáº¡i')}</th>
                  <th className="px-3 py-2 font-semibold">{t('Sá»‘ tiá»n')}</th>
                  <th className="px-3 py-2 font-semibold">{t('LĂ½ do')}</th>
                  <th className="px-3 py-2 font-semibold">{t('MĂ£ tham chiáº¿u')}</th>
                  <th className="px-3 py-2 font-semibold">{t('NgÆ°á»i táº¡o')}</th>
                  <th className="px-3 py-2 font-semibold">{t('Thá»i gian')}</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((adj) => (
                  <tr key={adj.id} className={tableRowClass}>
                    <td className={`px-3 py-2 font-medium ${tableValueClass}`}>{adjTypeLabel[adj.type] ?? adj.type}</td>
                    <td className="px-3 py-2 text-[var(--ink)]">{formatCurrency(Number(adj.amount))}</td>
                    <td className="px-3 py-2 max-w-xs break-words text-[var(--ink)]">{adj.reason}</td>
                    <td className={`px-3 py-2 ${tableMetaClass}`}>{adj.referenceCode || 'â€”'}</td>
                    <td className="px-3 py-2 text-[var(--ink)]">{adj.createdBy || 'â€”'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-[var(--ink)]">{adj.createdAt ? formatDateTime(adj.createdAt) : 'â€”'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <details className="mt-5">
          <summary className="cursor-pointer select-none list-none rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-muted)] [&::-webkit-details-marker]:hidden">
            {t('ThĂªm Ä‘iá»u chá»‰nh tĂ i chĂ­nh')}
          </summary>
          <div className="mt-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className={labelClass}>{t('Loáº¡i Ä‘iá»u chá»‰nh')}</span>
                <select
                  className={inputClass}
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as BackendOrderAdjustmentType)}
                >
                  <option value="CORRECTION">{t('Äiá»u chá»‰nh')}</option>
                  <option value="WRITE_OFF">{t('XĂ³a ná»£')}</option>
                  <option value="CREDIT_NOTE">{t('Ghi cĂ³')}</option>
                  <option value="REFUND_RECORD">{t('Ghi nháº­n hoĂ n tiá»n')}</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className={labelClass}>{t('Sá»‘ tiá»n')}</span>
                <input
                  className={inputClass}
                  step="1"
                  type="number"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className={labelClass}>{t('LĂ½ do (tá»‘i thiá»ƒu 10 kĂ½ tá»±)')}</span>
                <textarea
                  className="min-h-20 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className={labelClass}>{t('MĂ£ tham chiáº¿u (tuá»³ chá»n)')}</span>
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
                    {t('ÄÆ¡n hĂ ng Ä‘Ă£ hoĂ n táº¥t. XĂ¡c nháº­n Ä‘á»ƒ táº¡o Ä‘iá»u chá»‰nh tĂ i chĂ­nh.')}
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
                    setAdjError(t('Sá»‘ tiá»n pháº£i khĂ¡c 0'))
                    return
                  }
                  if (order?.status === 'completed' && !adjConfirmOverride) {
                    setAdjError(t('Cáº§n xĂ¡c nháº­n trÆ°á»›c khi Ä‘iá»u chá»‰nh Ä‘Æ¡n Ä‘Ă£ hoĂ n táº¥t'))
                    return
                  }
                  if (adjReason.trim().length < 10) {
                    setAdjError(t('LĂ½ do pháº£i cĂ³ Ă­t nháº¥t 10 kĂ½ tá»±'))
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
                    notify(t('ÄĂ£ thĂªm Ä‘iá»u chá»‰nh tĂ i chĂ­nh'), { title: t('Äiá»u chá»‰nh'), variant: 'success' })
                  } catch (err) {
                    setAdjError(err instanceof Error ? err.message : t('KhĂ´ng thĂªm Ä‘Æ°á»£c Ä‘iá»u chá»‰nh'))
                  } finally {
                    setAdjSubmitting(false)
                  }
                }}
              >
                {t('ThĂªm Ä‘iá»u chá»‰nh')}
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
