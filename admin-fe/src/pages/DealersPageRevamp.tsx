import { Bell, CheckCircle2, Clock3, Users } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
  PagePanel,
  PaginationNav,
  SearchInput,
  StatCard,
  StatusBadge,
  inputClass,
  tableActionSelectClass,
  tableCardClass,
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
} from '../components/ui-kit'
import { useAdminData, type Dealer, type DealerStatus } from '../context/AdminDataContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { translateCopy } from '../lib/i18n'
import { useToast } from '../context/ToastContext'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import {
  dealerStatusDescription,
  dealerStatusLabel,
  dealerStatusTone,
  resolveAllowedDealerStatuses,
} from '../lib/adminLabels'
import { formatCurrency, formatDateTime } from '../lib/formatters'
import {
  fetchAdminDealerAccountsPaged,
  fetchAdminDealerAccountSummary,
} from '../lib/adminApi'
import { mapDealer, toBackendDealerAccountStatus } from '../lib/adminDataMappers'

const PAGE_SIZE = 25

const copyKeys = {
  title: 'Đại lý',
  description:
    'Quản lý hồ sơ đại lý, doanh thu và trạng thái kích hoạt tài khoản.',
  searchLabel: 'Tìm đại lý',
  searchPlaceholder: 'Tìm theo tên, mã hoặc email...',
  totalDealers: 'Tổng đại lý',
  activeDealers: 'Đã kích hoạt',
  underReview: 'Chờ duyệt',
  suspended: 'Tạm khóa',
  totalRevenue: 'Tổng doanh thu',
  emptyTitle: 'Không có đại lý',
  emptyMessage: 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.',
  loadTitle: 'Không thể tải đại lý',
  loadFallback: 'Không tải được danh sách đại lý',
  status: 'Trạng thái',
  orders: 'Đơn hàng',
  revenueShort: 'Doanh thu',
  actions: 'Thao tác',
  confirmStatusTitle: 'Xác nhận cập nhật trạng thái',
  confirmStatusMessage:
    'Bạn có chắc muốn chuyển trạng thái đại lý này sang "{status}" không?',
  updateFailed: 'Không cập nhật được trạng thái đại lý',
} as const

function DealersPageRevamp() {
  const { t } = useLanguage()
  const copy = translateCopy(copyKeys, t)
  const DEALER_STATUS_OPTIONS: Array<{
    value: 'all' | DealerStatus
    label: string
  }> = [
    { value: 'all', label: t('Tất cả') },
    { value: 'active', label: copy.activeDealers },
    { value: 'under_review', label: copy.underReview },
    { value: 'suspended', label: copy.suspended },
  ]
  const navigate = useNavigate()
  const { notify } = useToast()
  const { accessToken } = useAuth()
  const { updateDealerStatus } = useAdminData()
  const { confirm, prompt, confirmDialog, promptDialog } = useConfirmDialog()

  const [dealers, setDealers] = useState<Dealer[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    underReview: 0,
    suspended: 0,
    totalRevenue: 0,
  })
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | DealerStatus>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const toolbarSearchClass = 'w-full sm:max-w-sm lg:w-72 xl:w-80'
  const requestIdRef = useRef(0)
  const summaryRequestIdRef = useRef(0)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query])

  const loadSummary = useCallback(async () => {
    if (!accessToken) {
      return
    }

    const requestId = ++summaryRequestIdRef.current

    try {
      const summary = await fetchAdminDealerAccountSummary(accessToken)
      if (summaryRequestIdRef.current !== requestId) {
        return
      }

      setStats({
        total: Number(summary.total ?? 0),
        active: Number(summary.active ?? 0),
        underReview: Number(summary.underReview ?? 0),
        suspended: Number(summary.suspended ?? 0),
        totalRevenue: Number(summary.totalRevenue ?? 0),
      })
    } catch {
      if (summaryRequestIdRef.current !== requestId) {
        return
      }

      setStats({
        total: 0,
        active: 0,
        underReview: 0,
        suspended: 0,
        totalRevenue: 0,
      })
    }
  }, [accessToken])

  const loadPage = useCallback(
    async (nextPage: number) => {
      if (!accessToken) {
        return
      }

      const requestId = ++requestIdRef.current
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchAdminDealerAccountsPaged(accessToken, {
          page: nextPage,
          size: PAGE_SIZE,
          status:
            statusFilter === 'all'
              ? undefined
              : toBackendDealerAccountStatus(statusFilter),
          query: debouncedQuery || undefined,
        })

        if (requestIdRef.current !== requestId) {
          return
        }

        setDealers(response.items.map(mapDealer))
        setPage(response.page)
        setTotalPages(response.totalPages)
        setTotalItems(response.totalElements)
      } catch (loadError) {
        if (requestIdRef.current !== requestId) {
          return
        }

        const message =
          loadError instanceof Error ? loadError.message : copy.loadFallback
        setError(message)
        notify(message, { title: copy.title, variant: 'error' })
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false)
        }
      }
    },
    [accessToken, copy.loadFallback, copy.title, debouncedQuery, notify, statusFilter],
  )

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  useEffect(() => {
    void loadPage(0)
  }, [loadPage])

  const reloadCurrentPage = useCallback(
    async (nextPage?: number) => {
      const pageToLoad = nextPage ?? page
      await Promise.all([loadPage(pageToLoad), loadSummary()])
    },
    [loadPage, loadSummary, page],
  )

  if (isLoading && totalItems === 0 && dealers.length === 0) {
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
          onRetry={() => void reloadCurrentPage()}
        />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <PageHeader
        title={copy.title}
        subtitle={copy.description}
        actions={
          <>
            <SearchInput
              id="dealers-search"
              label={copy.searchLabel}
              placeholder={copy.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={toolbarSearchClass}
            />
            <select
              aria-label={copy.status}
              className={`${inputClass} w-full sm:max-w-[14rem] lg:w-56`}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'all' | DealerStatus)
              }
              value={statusFilter}
            >
              {DEALER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label={copy.totalDealers} value={stats.total} />
        <StatCard
          icon={CheckCircle2}
          label={copy.activeDealers}
          value={stats.active}
          tone="success"
        />
        <StatCard
          icon={Clock3}
          label={copy.underReview}
          value={stats.underReview}
          tone="info"
        />
        <StatCard
          icon={Bell}
          label={copy.suspended}
          value={stats.suspended}
          tone="warning"
        />
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]">
        {copy.totalRevenue}:{' '}
        <span className="font-semibold text-[var(--accent)]">
          {formatCurrency(stats.totalRevenue)}
        </span>
      </p>

      <div className="mt-6">
        {isLoading ? (
          <LoadingRows rows={6} />
        ) : dealers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={copy.emptyTitle}
            message={copy.emptyMessage}
          />
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {dealers.map((dealer) => (
                <article key={dealer.id} className={tableCardClass}>
                  <button
                    className="w-full text-left"
                    onClick={() =>
                      navigate(`/dealers/${encodeURIComponent(dealer.id)}`)
                    }
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--ink)]">
                          {dealer.name}
                        </p>
                        <p className={tableMetaClass}>
                          {dealer.id} · {dealer.email}
                        </p>
                        <p className={tableMetaClass}>{dealer.contactName}</p>
                      </div>
                      <StatusBadge tone={dealerStatusTone[dealer.status]}>
                        {t(dealerStatusLabel[dealer.status])}
                      </StatusBadge>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-[var(--ink)]">
                      <div className="flex items-center justify-between">
                        <span className={tableMetaClass}>{copy.orders}</span>
                        <span>{dealer.orders}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={tableMetaClass}>
                          {copy.revenueShort}
                        </span>
                        <span className="font-semibold text-[var(--accent)]">
                          {formatCurrency(dealer.revenue)}
                        </span>
                      </div>
                    </div>
                  </button>
                  <p className={`${tableMetaClass} mt-3`}>
                    {t(dealerStatusDescription[dealer.status])}
                  </p>
                  <select
                    aria-label={`${copy.status} ${dealer.id}`}
                    className={`mt-4 w-full ${tableActionSelectClass}`}
                    onChange={async (event) => {
                      const next = event.target.value as DealerStatus
                      if (next === dealer.status) {
                        return
                      }

                      let reason: string | undefined
                      if (next === 'suspended') {
                        const input = await prompt({
                          title: copy.confirmStatusTitle,
                          message: copy.confirmStatusMessage.replace(
                            '{status}',
                            t(dealerStatusLabel[next]),
                          ),
                          tone: 'danger',
                          confirmLabel: t(dealerStatusLabel[next]),
                          inputLabel: t('Lý do tạm khóa'),
                          inputPlaceholder: t('Nhập lý do tạm khóa đại lý...'),
                        })
                        if (input === null) {
                          event.currentTarget.value = dealer.status
                          return
                        }
                        reason = input
                      } else {
                        const approved = await confirm({
                          title: copy.confirmStatusTitle,
                          message: copy.confirmStatusMessage.replace(
                            '{status}',
                            t(dealerStatusLabel[next]),
                          ),
                          tone: 'warning',
                          confirmLabel: t(dealerStatusLabel[next]),
                        })
                        if (!approved) {
                          event.currentTarget.value = dealer.status
                          return
                        }
                      }

                      try {
                        await updateDealerStatus(dealer.id, next, reason)
                        await reloadCurrentPage()
                      } catch (updateError) {
                        notify(
                          updateError instanceof Error
                            ? updateError.message
                            : copy.updateFailed,
                          {
                            title: copy.title,
                            variant: 'error',
                          },
                        )
                        event.currentTarget.value = dealer.status
                      }
                    }}
                    value={dealer.status}
                  >
                    {resolveAllowedDealerStatuses(
                      dealer.status,
                      dealer.allowedTransitions,
                    ).map((status) => (
                      <option key={`${dealer.id}-${status}`} value={status}>
                        {t(dealerStatusLabel[status])}
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
                    <th className="px-3 py-2 font-semibold">{copy.title}</th>
                    <th className="px-3 py-2 font-semibold">{copy.status}</th>
                    <th className="px-3 py-2 font-semibold">{copy.orders}</th>
                    <th className="px-3 py-2 font-semibold">
                      {copy.revenueShort}
                    </th>
                    <th className="px-3 py-2 font-semibold">{copy.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {dealers.map((dealer) => (
                    <tr
                      className={tableRowClass}
                      key={dealer.id}
                      onClick={() =>
                        navigate(`/dealers/${encodeURIComponent(dealer.id)}`)
                      }
                    >
                      <td className="rounded-l-2xl px-3 py-3">
                        <p className="font-semibold text-[var(--ink)]">
                          {dealer.name}
                        </p>
                        <p className={tableMetaClass}>
                          {dealer.id} · {dealer.email}
                        </p>
                        <p className={tableMetaClass}>{dealer.contactName}</p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={dealerStatusTone[dealer.status]}>
                          {t(dealerStatusLabel[dealer.status])}
                        </StatusBadge>
                        <p className={`mt-1 ${tableMetaClass}`}>
                          {t(dealerStatusDescription[dealer.status])}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm text-[var(--ink)]">
                          {dealer.orders}
                        </div>
                        <div className={tableMetaClass}>
                          {formatDateTime(dealer.lastOrderAt)}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-[var(--accent)]">
                        {formatCurrency(dealer.revenue)}
                      </td>
                      <td
                        className="rounded-r-2xl px-3 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <select
                          aria-label={`${copy.status} ${dealer.id}`}
                          className={`w-full ${tableActionSelectClass}`}
                          onChange={async (event) => {
                            const next = event.target.value as DealerStatus
                            if (next === dealer.status) {
                              return
                            }

                            let reason: string | undefined
                            if (next === 'suspended') {
                              const input = await prompt({
                                title: copy.confirmStatusTitle,
                                message: copy.confirmStatusMessage.replace(
                                  '{status}',
                                  t(dealerStatusLabel[next]),
                                ),
                                tone: 'danger',
                                confirmLabel: t(dealerStatusLabel[next]),
                                inputLabel: t('Lý do tạm khóa'),
                                inputPlaceholder: t('Nhập lý do tạm khóa đại lý...'),
                              })
                              if (input === null) {
                                event.currentTarget.value = dealer.status
                                return
                              }
                              reason = input
                            } else {
                              const approved = await confirm({
                                title: copy.confirmStatusTitle,
                                message: copy.confirmStatusMessage.replace(
                                  '{status}',
                                  t(dealerStatusLabel[next]),
                                ),
                                tone: 'warning',
                                confirmLabel: t(dealerStatusLabel[next]),
                              })
                              if (!approved) {
                                event.currentTarget.value = dealer.status
                                return
                              }
                            }

                            try {
                              await updateDealerStatus(dealer.id, next, reason)
                              await reloadCurrentPage()
                            } catch (updateError) {
                              notify(
                                updateError instanceof Error
                                  ? updateError.message
                                  : copy.updateFailed,
                                {
                                  title: copy.title,
                                  variant: 'error',
                                },
                              )
                              event.currentTarget.value = dealer.status
                            }
                          }}
                          value={dealer.status}
                        >
                          {resolveAllowedDealerStatuses(
                            dealer.status,
                            dealer.allowedTransitions,
                          ).map((status) => (
                            <option
                              key={`${dealer.id}-${status}`}
                              value={status}
                            >
                              {t(dealerStatusLabel[status])}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationNav
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              onPageChange={(nextPage) => {
                void loadPage(nextPage)
              }}
              previousLabel={t('Trước')}
              nextLabel={t('Sau')}
            />
          </>
        )}
      </div>
      {confirmDialog}
      {promptDialog}
    </PagePanel>
  )
}

export default DealersPageRevamp
