import { CircleDollarSign, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchAdminUnmatchedPayments,
  resolveAdminUnmatchedPayment,
  type BackendUnmatchedPaymentResponse,
  type BackendUnmatchedPaymentStatus,
} from '../lib/adminApi'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { formatCurrency, formatDateTime } from '../lib/formatters'
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PagePanel,
  PaginationNav,
  PrimaryButton,
  StatCard,
  StatusBadge,
  bodyTextClass,
  cardTitleClass,
  inputClass,
  softCardClass,
  tableActionSelectClass,
  textareaClass,
} from '../components/ui-kit'

const STATUS_OPTIONS: BackendUnmatchedPaymentStatus[] = ['PENDING', 'MATCHED', 'REFUNDED', 'WRITTEN_OFF']

const STATUS_RESOLVE_OPTIONS: BackendUnmatchedPaymentStatus[] = ['MATCHED', 'REFUNDED', 'WRITTEN_OFF']

const statusTone = {
  PENDING: 'warning',
  MATCHED: 'success',
  REFUNDED: 'info',
  WRITTEN_OFF: 'neutral',
} as const

const copyByLanguage = {
  vi: {
    title: 'Thanh toán không khớp',
    description: 'Các giao dịch SePay không khớp đơn hàng nào. Xem xét và xử lý từng trường hợp.',
    status: 'Trạng thái',
    all: 'Tất cả',
    pending: 'Chờ xử lý',
    matched: 'Đã khớp',
    refunded: 'Đã hoàn tiền',
    writtenOff: 'Đã xóa sổ',
    txCode: 'Mã giao dịch',
    amount: 'Số tiền',
    sender: 'Người gửi',
    reason: 'Lý do',
    receivedAt: 'Thời điểm nhận',
    orderHint: 'Gợi ý đơn hàng',
    resolution: 'Ghi chú xử lý',
    resolvedBy: 'Xử lý bởi',
    resolvedAt: 'Thời điểm xử lý',
    matchedOrder: 'Đơn đã khớp',
    newStatus: 'Trạng thái mới',
    resolutionNote: 'Ghi chú',
    resolutionPlaceholder: 'Mô tả cách xử lý giao dịch này...',
    save: 'Lưu xử lý',
    reload: 'Tải lại',
    emptyTitle: 'Không có giao dịch phù hợp',
    emptyMessage: 'Thử thay đổi bộ lọc hoặc tải lại dữ liệu.',
    loadTitle: 'Không tải được danh sách',
    loadFallback: 'Danh sách giao dịch chưa thể tải.',
    saveError: 'Không lưu được thay đổi.',
    statPending: 'Chờ xử lý',
    reasons: {
      ORDER_NOT_FOUND: 'Không tìm thấy đơn',
      AMOUNT_MISMATCH: 'Số tiền sai',
      ORDER_ALREADY_SETTLED: 'Đơn đã thanh toán',
      ORDER_CANCELLED: 'Đơn đã huỷ',
    },
  },
  en: {
    title: 'Unmatched payments',
    description: 'SePay transactions that could not be matched to any order. Review and resolve each case.',
    status: 'Status',
    all: 'All',
    pending: 'Pending',
    matched: 'Matched',
    refunded: 'Refunded',
    writtenOff: 'Written off',
    txCode: 'Transaction code',
    amount: 'Amount',
    sender: 'Sender',
    reason: 'Reason',
    receivedAt: 'Received at',
    orderHint: 'Order hint',
    resolution: 'Resolution',
    resolvedBy: 'Resolved by',
    resolvedAt: 'Resolved at',
    matchedOrder: 'Matched order',
    newStatus: 'New status',
    resolutionNote: 'Note',
    resolutionPlaceholder: 'Describe how this transaction was handled...',
    save: 'Save resolution',
    reload: 'Reload',
    emptyTitle: 'No matching transactions',
    emptyMessage: 'Try another filter or reload the data.',
    loadTitle: 'Unable to load list',
    loadFallback: 'The transaction list could not be loaded.',
    saveError: 'Could not save changes.',
    statPending: 'Pending',
    reasons: {
      ORDER_NOT_FOUND: 'Order not found',
      AMOUNT_MISMATCH: 'Amount mismatch',
      ORDER_ALREADY_SETTLED: 'Already settled',
      ORDER_CANCELLED: 'Order cancelled',
    },
  },
} as const

const PAGE_SIZE = 20

function UnmatchedPaymentsPageRevamp() {
  const { language } = useLanguage()
  const copy = copyByLanguage[language]
  const { accessToken } = useAuth()
  const { notify } = useToast()

  const [items, setItems] = useState<BackendUnmatchedPaymentResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'ALL' | BackendUnmatchedPaymentStatus>('ALL')

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [statusDraft, setStatusDraft] = useState<BackendUnmatchedPaymentStatus>('MATCHED')
  const [resolutionDraft, setResolutionDraft] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPage = useCallback(
    async (nextPage: number, status: 'ALL' | BackendUnmatchedPaymentStatus) => {
      if (!accessToken) return
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetchAdminUnmatchedPayments(accessToken, {
          page: nextPage,
          size: PAGE_SIZE,
          status: status === 'ALL' ? undefined : status,
        })
        setItems(response.items)
        setPage(response.page)
        setTotalPages(response.totalPages)
        setTotalItems(response.totalElements)
        setSelectedId((current) =>
          response.items.find((item) => item.id === current)?.id ?? null,
        )
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : copy.loadFallback)
      } finally {
        setIsLoading(false)
      }
    },
    [accessToken, copy.loadFallback],
  )

  useEffect(() => {
    void loadPage(0, statusFilter)
  }, [loadPage, statusFilter])

  const handlePageChange = (nextPage: number) => {
    void loadPage(nextPage, statusFilter)
  }

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  )

  const handleSelect = (item: BackendUnmatchedPaymentResponse) => {
    setSelectedId(item.id)
    setStatusDraft(
      item.status === 'PENDING' ? 'MATCHED' : (item.status ?? 'MATCHED'),
    )
    setResolutionDraft(item.resolution ?? '')
  }

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === 'PENDING').length,
    [items],
  )

  const handleSave = async () => {
    if (!accessToken || !selectedItem) return
    setIsSaving(true)
    try {
      const updated = await resolveAdminUnmatchedPayment(accessToken, selectedItem.id, {
        status: statusDraft,
        resolution: resolutionDraft.trim() || undefined,
      })
      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setSelectedId(updated.id)
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : copy.saveError, {
        title: copy.title,
        variant: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    )
  }

  if (error) {
    return (
      <PagePanel>
        <ErrorState
          title={copy.loadTitle}
          message={error}
          onRetry={() => void loadPage(page, statusFilter)}
        />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className={cardTitleClass}>{copy.title}</h3>
          <p className={bodyTextClass}>{copy.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <select
            aria-label={copy.status}
            className={`${inputClass} w-auto`}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'ALL' | BackendUnmatchedPaymentStatus)
            }
          >
            <option value="ALL">{copy.all}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {copy[s === 'PENDING' ? 'pending' : s === 'MATCHED' ? 'matched' : s === 'REFUNDED' ? 'refunded' : 'writtenOff']}
              </option>
            ))}
          </select>
          <GhostButton
            onClick={() => void loadPage(page, statusFilter)}
            aria-label={copy.reload}
          >
            <RefreshCw className="h-4 w-4" />
          </GhostButton>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CircleDollarSign}
          label={copy.statPending}
          value={String(totalItems)}
          hint={`${pendingCount} ${copy.pending}`}
          tone="warning"
        />
      </div>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={copy.emptyTitle} message={copy.emptyMessage} />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-start">
          {/* List */}
          <div className="min-w-0 flex-1">
            <div className={`${softCardClass} overflow-hidden`}>
              <div className="divide-y divide-[var(--border)]">
                {items.map((item) => {
                  const isSelected = item.id === selectedId
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={[
                        'w-full px-4 py-3 text-left transition',
                        isSelected
                          ? 'bg-[var(--accent-soft)]/40'
                          : 'hover:bg-[var(--surface)]',
                      ].join(' ')}
                      onClick={() => handleSelect(item)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--ink)]">
                            {item.transactionCode ?? `#${item.id}`}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {item.reason ? copy.reasons[item.reason] : '—'}
                            {item.orderCodeHint ? ` · ${item.orderCodeHint}` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-sm font-semibold text-[var(--ink)]">
                            {item.amount != null ? formatCurrency(Number(item.amount)) : '—'}
                          </span>
                          <StatusBadge
                            tone={statusTone[item.status ?? 'PENDING']}
                          >
                            {item.status ?? 'PENDING'}
                          </StatusBadge>
                        </div>
                      </div>
                      {item.receivedAt && (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {copy.receivedAt}: {formatDateTime(item.receivedAt)}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            {totalPages > 1 && (
              <div className="mt-4">
                <PaginationNav
                  page={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={PAGE_SIZE}
                  onPageChange={handlePageChange}
                  previousLabel={language === 'vi' ? 'Trước' : 'Previous'}
                  nextLabel={language === 'vi' ? 'Tiếp' : 'Next'}
                />
              </div>
            )}
          </div>

          {/* Detail / resolve panel */}
          {selectedItem && (
            <div className={`${softCardClass} w-full xl:w-96 xl:shrink-0`}>
              <p className="text-sm font-semibold text-[var(--ink)]">
                {selectedItem.transactionCode ?? `#${selectedItem.id}`}
              </p>

              <dl className="mt-4 space-y-2 text-sm">
                {[
                  { label: copy.amount, value: selectedItem.amount != null ? formatCurrency(Number(selectedItem.amount)) : '—' },
                  { label: copy.sender, value: selectedItem.senderInfo ?? '—' },
                  { label: copy.orderHint, value: selectedItem.orderCodeHint ?? '—' },
                  { label: copy.reason, value: selectedItem.reason ? copy.reasons[selectedItem.reason] : '—' },
                  { label: copy.receivedAt, value: selectedItem.receivedAt ? formatDateTime(selectedItem.receivedAt) : '—' },
                  ...(selectedItem.resolution ? [{ label: copy.resolution, value: selectedItem.resolution }] : []),
                  ...(selectedItem.resolvedBy ? [{ label: copy.resolvedBy, value: selectedItem.resolvedBy }] : []),
                  ...(selectedItem.resolvedAt ? [{ label: copy.resolvedAt, value: formatDateTime(selectedItem.resolvedAt) }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-[var(--muted)]">{label}</dt>
                    <dd className="text-right font-medium text-[var(--ink)]">{value}</dd>
                  </div>
                ))}
              </dl>

              {selectedItem.status === 'PENDING' && (
                <div className="mt-5 space-y-3 border-t border-[var(--border)] pt-4">
                  <div>
                    <label
                      htmlFor="resolve-status"
                      className="mb-1 block text-xs font-semibold text-[var(--muted)]"
                    >
                      {copy.newStatus}
                    </label>
                    <select
                      id="resolve-status"
                      className={`${tableActionSelectClass} w-full`}
                      value={statusDraft}
                      onChange={(e) =>
                        setStatusDraft(e.target.value as BackendUnmatchedPaymentStatus)
                      }
                    >
                      {STATUS_RESOLVE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s === 'MATCHED' ? copy.matched : s === 'REFUNDED' ? copy.refunded : copy.writtenOff}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="resolve-note"
                      className="mb-1 block text-xs font-semibold text-[var(--muted)]"
                    >
                      {copy.resolutionNote}
                    </label>
                    <textarea
                      id="resolve-note"
                      className={textareaClass}
                      placeholder={copy.resolutionPlaceholder}
                      value={resolutionDraft}
                      onChange={(e) => setResolutionDraft(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <PrimaryButton
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                    className="w-full"
                  >
                    {copy.save}
                  </PrimaryButton>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PagePanel>
  )
}

export default UnmatchedPaymentsPageRevamp
