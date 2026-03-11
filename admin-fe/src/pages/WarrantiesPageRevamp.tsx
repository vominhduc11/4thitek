import { RefreshCw, ShieldCheck } from 'lucide-react'
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
import { formatDateTime } from '../lib/formatters'
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
  tableActionSelectClass,
  tableCardClass,
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
} from '../components/ui-kit'

const STATUS_OPTIONS: BackendWarrantyStatus[] = ['ACTIVE', 'EXPIRED', 'VOID']

const statusTone = {
  ACTIVE: 'success',
  EXPIRED: 'warning',
  VOID: 'danger',
} as const

const getRemainingLabel = (
  remainingDays: number | null | undefined,
  labels: { expired: string; days: string },
) =>
  remainingDays != null && remainingDays <= 0
    ? labels.expired
    : `${remainingDays ?? 0} ${labels.days}`

const copyByLanguage = {
  vi: {
    title: 'Bảo hành',
    description: 'Theo dõi thời hạn bảo hành, đại lý liên quan và xử lý ngoại lệ trực tiếp từ admin.',
    searchLabel: 'Tìm bảo hành',
    searchPlaceholder: 'Tìm mã bảo hành, serial, khách hàng...',
    status: 'Trạng thái',
    all: 'Tất cả',
    active: 'Đang hiệu lực',
    expired: 'Hết hạn',
    voided: 'Đã hủy',
    code: 'Mã bảo hành',
    product: 'Sản phẩm',
    customer: 'Khách hàng',
    dealer: 'Đại lý',
    endDate: 'Ngày hết hạn',
    actions: 'Thao tác',
    emptyTitle: 'Không có bảo hành phù hợp',
    emptyMessage: 'Thử đổi bộ lọc hoặc tải lại dữ liệu.',
    loadTitle: 'Không tải được bảo hành',
    loadFallback: 'Hệ thống chưa lấy được danh sách bảo hành.',
    confirmTitle: 'Xác nhận đổi trạng thái bảo hành',
    confirmMessage: 'Chuyển bảo hành này sang trạng thái "{status}"?',
    next: 'Tiếp',
    previous: 'Trước',
    remaining: 'Còn lại',
    days: 'ngày',
    notAvailable: 'Chưa có',
    reload: 'Tải lại',
  },
  en: {
    title: 'Warranties',
    description: 'Track warranty terms, linked dealers, and exception handling from one screen.',
    searchLabel: 'Search warranties',
    searchPlaceholder: 'Search by warranty code, serial, or customer...',
    status: 'Status',
    all: 'All',
    active: 'Active',
    expired: 'Expired',
    voided: 'Void',
    code: 'Warranty',
    product: 'Product',
    customer: 'Customer',
    dealer: 'Dealer',
    endDate: 'End date',
    actions: 'Actions',
    emptyTitle: 'No warranties match',
    emptyMessage: 'Try changing filters or reload the data.',
    loadTitle: 'Unable to load warranties',
    loadFallback: 'The warranty list could not be loaded.',
    confirmTitle: 'Confirm warranty status change',
    confirmMessage: 'Change this warranty to "{status}"?',
    next: 'Next',
    previous: 'Previous',
    remaining: 'Remaining',
    days: 'days',
    notAvailable: 'N/A',
    reload: 'Reload',
  },
} as const

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

  useEffect(() => {
    if (!hasActiveFilters) {
      setAllItems([])
      setIsFilterLoading(false)
      setError(null)
      return
    }

    void loadAllItems()
  }, [hasActiveFilters, loadAllItems])

  const sourceItems = hasActiveFilters ? allItems : items

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return sourceItems.filter((item) => {
      const matchesStatus = statusFilter === 'ALL' ? true : item.status === statusFilter
      const haystack = [
        item.warrantyCode,
        item.serial,
        item.productName,
        item.customerName,
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
      active: sourceItems.filter((item) => item.status === 'ACTIVE').length,
      expired: sourceItems.filter((item) => item.status === 'EXPIRED').length,
      voided: sourceItems.filter((item) => item.status === 'VOID').length,
    }),
    [sourceItems],
  )

  const handleReload = useCallback(async () => {
    await loadData(page)
    if (hasActiveFilters) {
      await loadAllItems()
    }
  }, [hasActiveFilters, loadAllItems, loadData, page])

  if (isLoading || isFilterLoading) {
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
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <GhostButton aria-label={copy.reload} icon={<RefreshCw className="h-4 w-4" />} onClick={() => void handleReload()} type="button">
            {copy.reload}
          </GhostButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={ShieldCheck} label={copy.active} value={stats.active} tone="success" />
        <StatCard icon={ShieldCheck} label={copy.expired} value={stats.expired} tone="warning" />
        <StatCard icon={ShieldCheck} label={copy.voided} value={stats.voided} tone="warning" />
      </div>

      <div className="mt-6">
        {filteredItems.length === 0 ? (
          <EmptyState icon={ShieldCheck} title={copy.emptyTitle} message={copy.emptyMessage} />
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {filteredItems.map((item) => (
                <article key={item.id} className={tableCardClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{item.warrantyCode ?? `#${item.id}`}</p>
                      <p className={tableMetaClass}>{item.serial ?? copy.notAvailable}</p>
                    </div>
                    <StatusBadge tone={statusTone[item.status ?? 'ACTIVE']}>
                      {item.status ?? 'ACTIVE'}
                    </StatusBadge>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.product}</span>
                      <span className="text-right text-[var(--ink)]">{item.productName ?? copy.notAvailable}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.customer}</span>
                      <span className="text-right text-[var(--ink)]">{item.customerName ?? copy.notAvailable}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.dealer}</span>
                      <span className="text-right text-[var(--ink)]">{item.dealerName ?? copy.notAvailable}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.endDate}</span>
                      <span className="text-right text-[var(--ink)]">
                        {item.warrantyEnd ? formatDateTime(item.warrantyEnd) : copy.notAvailable}
                      </span>
                    </div>
                  </div>
                  <p className={`mt-3 ${tableMetaClass}`}>
                    {copy.remaining}: {getRemainingLabel(item.remainingDays, copy)}
                  </p>
                  <select
                    aria-label={`${copy.status} ${item.id}`}
                    className={`mt-4 w-full ${tableActionSelectClass}`}
                    value={item.status ?? 'ACTIVE'}
                    onChange={async (event) => {
                      const next = event.target.value as BackendWarrantyStatus
                      if (next === item.status) return
                      const approved = await confirm({
                        title: copy.confirmTitle,
                        message: copy.confirmMessage.replace('{status}', next),
                        tone: next === 'VOID' ? 'danger' : 'warning',
                        confirmLabel: next,
                      })
                      if (!approved) {
                        event.currentTarget.value = item.status ?? 'ACTIVE'
                        return
                      }
                      try {
                        const updated = await updateAdminWarrantyStatus(accessToken!, item.id, next)
                        setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)))
                        setAllItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)))
                      } catch (updateError) {
                        notify(updateError instanceof Error ? updateError.message : copy.loadFallback, {
                          title: copy.title,
                          variant: 'error',
                        })
                      }
                    }}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={`${item.id}-${status}`} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
            </div>

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
                    <th className="px-3 py-2 font-semibold">{copy.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={tableRowClass}>
                      <td className="rounded-l-2xl px-3 py-3">
                        <p className="font-semibold text-[var(--ink)]">{item.warrantyCode ?? `#${item.id}`}</p>
                        <p className={tableMetaClass}>{item.serial ?? copy.notAvailable}</p>
                      </td>
                      <td className="px-3 py-3">{item.productName ?? copy.notAvailable}</td>
                      <td className="px-3 py-3">
                        <p>{item.customerName ?? copy.notAvailable}</p>
                        <p className={tableMetaClass}>{item.customerPhone ?? item.customerEmail ?? copy.notAvailable}</p>
                      </td>
                      <td className="px-3 py-3">{item.dealerName ?? copy.notAvailable}</td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={statusTone[item.status ?? 'ACTIVE']}>
                          {item.status ?? 'ACTIVE'}
                        </StatusBadge>
                        <p className={`mt-1 ${tableMetaClass}`}>
                          {copy.remaining}: {getRemainingLabel(item.remainingDays, copy)}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {item.warrantyEnd ? formatDateTime(item.warrantyEnd) : copy.notAvailable}
                      </td>
                      <td className="rounded-r-2xl px-3 py-3">
                        <select
                          aria-label={`${copy.status} ${item.id}`}
                          className={tableActionSelectClass}
                          value={item.status ?? 'ACTIVE'}
                          onChange={async (event) => {
                            const next = event.target.value as BackendWarrantyStatus
                            if (next === item.status) return
                            const approved = await confirm({
                              title: copy.confirmTitle,
                              message: copy.confirmMessage.replace('{status}', next),
                              tone: next === 'VOID' ? 'danger' : 'warning',
                              confirmLabel: next,
                            })
                            if (!approved) {
                              event.currentTarget.value = item.status ?? 'ACTIVE'
                              return
                            }
                      try {
                        const updated = await updateAdminWarrantyStatus(accessToken!, item.id, next)
                        setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)))
                        setAllItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)))
                      } catch (updateError) {
                        notify(updateError instanceof Error ? updateError.message : copy.loadFallback, {
                          title: copy.title,
                                variant: 'error',
                              })
                            }
                          }}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={`${item.id}-${status}`} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {!hasActiveFilters ? (
        <PaginationNav
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={25}
          onPageChange={setPage}
          previousLabel={copy.previous}
          nextLabel={copy.next}
        />
      ) : null}
      {confirmDialog}
    </PagePanel>
  )
}

export default WarrantiesPageRevamp
