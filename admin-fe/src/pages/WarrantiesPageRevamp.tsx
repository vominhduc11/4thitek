import { Loader2, RefreshCw, ShieldCheck, ShieldOff } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchAllAdminWarranties,
  fetchAdminWarranties,
  updateAdminWarrantyStatus,
  type BackendWarrantyResponse,
  type BackendWarrantyStatus,
} from '../lib/adminApi'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { formatDateOnly } from '../lib/formatters'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PagePanel,
  PaginationNav,
  SearchInput,
  StatCard,
  StatusBadge,
  bodyTextClass,
  cardTitleClass,
  inputClass,
  tableCardClass,
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
} from '../components/ui-kit'

const STATUS_FILTER_OPTIONS: BackendWarrantyStatus[] = ['ACTIVE', 'EXPIRED', 'VOID']

const statusTone = {
  ACTIVE: 'success',
  EXPIRED: 'warning',
  VOID: 'neutral',
} as const

const copyByLanguage = {
  vi: {
    title: 'Bảo hành',
    description: 'Theo dõi thời hạn bảo hành, đại lý liên quan và xử lý ngoại lệ trực tiếp từ admin.',
    searchLabel: 'Tìm bảo hành',
    searchPlaceholder: 'Tìm mã bảo hành, serial, khách hàng, đại lý...',
    status: 'Trạng thái',
    all: 'Tất cả',
    active: 'Đang hiệu lực',
    expired: 'Hết hạn',
    voided: 'Đã hủy',
    code: 'Mã bảo hành',
    product: 'Sản phẩm',
    customer: 'Khách hàng',
    dealer: 'Đại lý',
    startDate: 'Ngày bắt đầu',
    endDate: 'Ngày hết hạn',
    remaining: 'Còn lại',
    days: 'ngày',
    notAvailable: '-',
    emptyTitle: 'Không có bảo hành phù hợp',
    emptyMessage: 'Thử đổi bộ lọc hoặc tải lại dữ liệu.',
    loadTitle: 'Không tải được bảo hành',
    loadFallback: 'Hệ thống chưa lấy được danh sách bảo hành.',
    next: 'Tiếp',
    previous: 'Trước',
    reload: 'Tải lại',
    loadingStats: 'Đang tải...',
    results: 'kết quả',
    voidWarranty: 'Hủy bảo hành',
    confirmVoidTitle: 'Xác nhận hủy bảo hành',
    confirmVoidMessage: 'Bảo hành "{code}" sẽ bị hủy vĩnh viễn. Khách hàng sẽ mất quyền bảo hành còn lại.',
    statusLabels: {
      ACTIVE: 'Đang hiệu lực',
      EXPIRED: 'Hết hạn',
      VOID: 'Đã hủy',
    } as Record<BackendWarrantyStatus, string>,
  },
  en: {
    title: 'Warranties',
    description: 'Track warranty terms, linked dealers, and exception handling from one screen.',
    searchLabel: 'Search warranties',
    searchPlaceholder: 'Search warranty code, serial, customer, dealer...',
    status: 'Status',
    all: 'All',
    active: 'Active',
    expired: 'Expired',
    voided: 'Voided',
    code: 'Warranty',
    product: 'Product',
    customer: 'Customer',
    dealer: 'Dealer',
    startDate: 'Start date',
    endDate: 'End date',
    remaining: 'Remaining',
    days: 'days',
    notAvailable: '-',
    emptyTitle: 'No warranties match',
    emptyMessage: 'Try changing filters or reload the data.',
    loadTitle: 'Unable to load warranties',
    loadFallback: 'The warranty list could not be loaded.',
    next: 'Next',
    previous: 'Previous',
    reload: 'Reload',
    loadingStats: 'Loading...',
    results: 'results',
    voidWarranty: 'Void warranty',
    confirmVoidTitle: 'Confirm void warranty',
    confirmVoidMessage: 'Warranty "{code}" will be permanently voided. The customer will lose remaining warranty coverage.',
    statusLabels: {
      ACTIVE: 'Active',
      EXPIRED: 'Expired',
      VOID: 'Void',
    } as Record<BackendWarrantyStatus, string>,
  },
} as const

const getRemainingLabel = (
  status: BackendWarrantyStatus | null | undefined,
  remainingDays: number | null | undefined,
  labels: { expired: string; days: string; notAvailable: string },
) =>
  status === 'VOID'
    ? labels.notAvailable
    : status === 'EXPIRED' || (remainingDays ?? 0) <= 0
    ? labels.expired
    : `${remainingDays} ${labels.days}`

function WarrantiesPageRevamp() {
  const { language } = useLanguage()
  const copy = copyByLanguage[language]
  const { accessToken } = useAuth()
  const { notify } = useToast()
  const { confirm, confirmDialog } = useConfirmDialog()
  const [items, setItems] = useState<BackendWarrantyResponse[]>([])
  const [allItems, setAllItems] = useState<BackendWarrantyResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | BackendWarrantyStatus>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasActiveFilters = query.trim().length > 0 || statusFilter !== 'ALL'

  const loadData = useCallback(async (nextPage: number) => {
    if (!accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchAdminWarranties(accessToken, { page: nextPage, size: 25 })
      setItems(response.items)
      setPage(response.page)
      setTotalPages(response.totalPages)
      setTotalItems(response.totalElements)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.loadFallback)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, copy.loadFallback])

  useEffect(() => {
    void loadData(page)
  }, [loadData, page])

  const loadAllItems = useCallback(async () => {
    if (!accessToken) return
    setIsFilterLoading(true)
    setError(null)
    try {
      const response = await fetchAllAdminWarranties(accessToken, 100)
      setAllItems(response)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.loadFallback)
    } finally {
      setIsFilterLoading(false)
    }
  }, [accessToken, copy.loadFallback])

  // Always load all items so stats are always accurate across all pages
  useEffect(() => {
    void loadAllItems()
  }, [loadAllItems])

  const sourceItems = hasActiveFilters ? allItems : items

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return sourceItems.filter((item) => {
      const matchesStatus = statusFilter === 'ALL' ? true : item.status === statusFilter
      const haystack = [
        item.warrantyCode,
        item.serial,
        item.productName,
        item.productSku,
        item.customerName,
        item.customerEmail,
        item.customerPhone,
        item.dealerName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery))
    })
  }, [query, sourceItems, statusFilter])

  const stats = useMemo(
    () => ({
      active: allItems.filter((item) => item.status === 'ACTIVE').length,
      expired: allItems.filter((item) => item.status === 'EXPIRED').length,
      voided: allItems.filter((item) => item.status === 'VOID').length,
    }),
    [allItems],
  )

  const handleReload = useCallback(async () => {
    await Promise.all([loadData(page), loadAllItems()])
  }, [loadAllItems, loadData, page])

  const handleVoidWarranty = async (item: BackendWarrantyResponse) => {
    const code = item.warrantyCode ?? `#${item.id}`
    const approved = await confirm({
      title: copy.confirmVoidTitle,
      message: copy.confirmVoidMessage.replace('{code}', code),
      tone: 'danger',
      confirmLabel: copy.voidWarranty,
    })
    if (!approved) return
    try {
      const updated = await updateAdminWarrantyStatus(accessToken!, item.id, 'VOID')
      setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)))
      setAllItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)))
    } catch (err) {
      notify(err instanceof Error ? err.message : copy.loadFallback, { title: copy.title, variant: 'error' })
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
        <ErrorState title={copy.loadTitle} message={error} onRetry={() => void handleReload()} />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className={cardTitleClass}>{copy.title}</h3>
          <p className={bodyTextClass}>{copy.description}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <SearchInput
            id="warranties-search"
            label={copy.searchLabel}
            placeholder={copy.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full sm:max-w-sm lg:w-72 xl:w-80"
          />
          <select
            aria-label={copy.status}
            className={`${inputClass} w-full sm:w-auto`}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'ALL' | BackendWarrantyStatus)}
          >
            <option value="ALL">{copy.all}</option>
            {STATUS_FILTER_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {copy.statusLabels[status]}
              </option>
            ))}
          </select>
          <GhostButton aria-label={copy.reload} icon={<RefreshCw className="h-4 w-4" />} onClick={() => void handleReload()} type="button">
            {copy.reload}
          </GhostButton>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={ShieldCheck} label={copy.active} value={isFilterLoading ? copy.loadingStats : stats.active} tone="success" />
        <StatCard icon={ShieldCheck} label={copy.expired} value={isFilterLoading ? copy.loadingStats : stats.expired} tone="warning" />
        <StatCard icon={ShieldCheck} label={copy.voided} value={isFilterLoading ? copy.loadingStats : stats.voided} tone="neutral" />
      </div>

      {/* Results area */}
      <div className="mt-6">
        {isFilterLoading && hasActiveFilters ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{copy.loadingStats}</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState icon={ShieldCheck} title={copy.emptyTitle} message={copy.emptyMessage} />
        ) : (
          <>
            {hasActiveFilters && (
              <p className="mb-3 text-sm text-slate-500">
                {filteredItems.length} {copy.results}
              </p>
            )}

            {/* Mobile cards */}
            <div className="grid gap-3 md:hidden">
              {filteredItems.map((item) => (
                <article key={item.id} className={tableCardClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{item.warrantyCode ?? `#${item.id}`}</p>
                      <p className={tableMetaClass}>{item.serial ?? copy.notAvailable}</p>
                    </div>
                    <StatusBadge tone={statusTone[item.status ?? 'ACTIVE']}>
                      {copy.statusLabels[item.status ?? 'ACTIVE']}
                    </StatusBadge>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.product}</span>
                      <span className="text-right text-[var(--ink)]">{item.productName ?? copy.notAvailable}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.customer}</span>
                      <span className="text-right text-[var(--ink)]">
                        {item.customerName ?? copy.notAvailable}
                        {item.customerPhone ? ` · ${item.customerPhone}` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.dealer}</span>
                      <span className="text-right text-[var(--ink)]">{item.dealerName ?? copy.notAvailable}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.startDate}</span>
                      <span className="text-right text-[var(--ink)]">
                        {item.warrantyStart ? formatDateOnly(item.warrantyStart) : copy.notAvailable}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.endDate}</span>
                      <span className="text-right text-[var(--ink)]">
                        {item.warrantyEnd ? formatDateOnly(item.warrantyEnd) : copy.notAvailable}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.remaining}</span>
                      <span className="text-right text-[var(--ink)]">
                        {getRemainingLabel(item.status, item.remainingDays, copy)}
                      </span>
                    </div>
                  </div>
                  {item.status !== 'VOID' && (
                    <button
                      type="button"
                      onClick={() => void handleVoidWarranty(item)}
                      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950"
                    >
                      <ShieldOff className="h-3.5 w-3.5" />
                      {copy.voidWarranty}
                    </button>
                  )}
                </article>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className={tableHeadClass}>
                    <th className="px-3 py-2 font-semibold">{copy.code}</th>
                    <th className="px-3 py-2 font-semibold">{copy.product}</th>
                    <th className="px-3 py-2 font-semibold">{copy.customer}</th>
                    <th className="px-3 py-2 font-semibold">{copy.dealer}</th>
                    <th className="px-3 py-2 font-semibold">{copy.status}</th>
                    <th className="px-3 py-2 font-semibold">{copy.endDate}</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={tableRowClass}>
                      <td className="rounded-l-2xl px-3 py-3">
                        <p className="font-semibold text-[var(--ink)]">{item.warrantyCode ?? `#${item.id}`}</p>
                        <p className={tableMetaClass}>{item.serial ?? copy.notAvailable}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p>{item.productName ?? copy.notAvailable}</p>
                        <p className={tableMetaClass}>{item.productSku ?? ''}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p>{item.customerName ?? copy.notAvailable}</p>
                        <p className={tableMetaClass}>{item.customerPhone ?? item.customerEmail ?? ''}</p>
                      </td>
                      <td className="px-3 py-3">{item.dealerName ?? copy.notAvailable}</td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={statusTone[item.status ?? 'ACTIVE']}>
                          {copy.statusLabels[item.status ?? 'ACTIVE']}
                        </StatusBadge>
                        <p className={`mt-1 ${tableMetaClass}`}>
                          {getRemainingLabel(item.status, item.remainingDays, copy)}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <p>{item.warrantyEnd ? formatDateOnly(item.warrantyEnd) : copy.notAvailable}</p>
                        {item.warrantyStart && (
                          <p className={tableMetaClass}>{copy.startDate}: {formatDateOnly(item.warrantyStart)}</p>
                        )}
                      </td>
                      <td className="rounded-r-2xl px-3 py-3">
                        {item.status !== 'VOID' && (
                          <button
                            type="button"
                            title={copy.voidWarranty}
                            onClick={() => void handleVoidWarranty(item)}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950"
                          >
                            <ShieldOff className="h-3.5 w-3.5" />
                            {copy.voidWarranty}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination (chỉ khi không filter) */}
      {!hasActiveFilters && (
        <PaginationNav
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={25}
          onPageChange={setPage}
          previousLabel={copy.previous}
          nextLabel={copy.next}
        />
      )}

      {confirmDialog}
    </PagePanel>
  )
}

export default WarrantiesPageRevamp
