import { Bell, CheckCircle2, Clock3, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EmptyState,
  ErrorState,
  LoadingRows,
  PagePanel,
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
import { useAdminData, type DealerStatus } from '../context/AdminDataContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import {
  dealerStatusDescription,
  dealerStatusLabel,
  dealerStatusTone,
} from '../lib/adminLabels'
import { formatCurrency, formatDateTime } from '../lib/formatters'

const DEALER_STATUS_OPTIONS: Array<{ value: 'all' | DealerStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: dealerStatusLabel.active },
  { value: 'under_review', label: dealerStatusLabel.under_review },
  { value: 'suspended', label: dealerStatusLabel.suspended },
]

const copyByLanguage = {
  vi: {
    title: 'Đại lý',
    description:
      'Quản lý hồ sơ đại lý, hạn mức và trạng thái kích hoạt tài khoản.',
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
    credit: 'Hạn mức',
    actions: 'Thao tác',
    notSet: 'Chưa đặt',
    confirmStatusTitle: 'Xác nhận cập nhật trạng thái',
    confirmStatusMessage:
      'Bạn có chắc muốn chuyển trạng thái đại lý này sang "{status}" không?',
    updateFailed: 'Không cập nhật được trạng thái đại lý',
  },
  en: {
    title: 'Dealers',
    description: 'Manage dealer profiles, credit limits, and account activation status.',
    searchLabel: 'Search dealers',
    searchPlaceholder: 'Search by name, code, or email...',
    totalDealers: 'Total dealers',
    activeDealers: 'Active',
    underReview: 'Under review',
    suspended: 'Suspended',
    totalRevenue: 'Total revenue',
    emptyTitle: 'No dealers found',
    emptyMessage: 'Try adjusting filters or your search keywords.',
    loadTitle: 'Unable to load dealers',
    loadFallback: 'Could not load the dealer list',
    status: 'Status',
    orders: 'Orders',
    revenueShort: 'Revenue',
    credit: 'Credit',
    actions: 'Actions',
    notSet: 'Not set',
    confirmStatusTitle: 'Confirm status update',
    confirmStatusMessage: 'Change this dealer to "{status}"?',
    updateFailed: 'Could not update the dealer status',
  },
} as const

function DealersPageRevamp() {
  const { language } = useLanguage()
  const copy = copyByLanguage[language]
  const navigate = useNavigate()
  const { notify } = useToast()
  const { dealers, dealersState, updateDealerStatus, reloadResource } = useAdminData()
  const { confirm, confirmDialog } = useConfirmDialog()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | DealerStatus>('all')
  const toolbarSearchClass = 'w-full sm:max-w-sm lg:w-72 xl:w-80'

  const normalizedQuery = query.trim().toLowerCase()
  const filteredDealers = useMemo(
    () =>
      dealers.filter((dealer) => {
        const matchesStatus = statusFilter === 'all' ? true : dealer.status === statusFilter
        const matchesSearch =
          !normalizedQuery ||
          dealer.name.toLowerCase().includes(normalizedQuery) ||
          dealer.contactName.toLowerCase().includes(normalizedQuery) ||
          dealer.id.toLowerCase().includes(normalizedQuery) ||
          dealer.email.toLowerCase().includes(normalizedQuery)
        return matchesStatus && matchesSearch
      }),
    [dealers, normalizedQuery, statusFilter],
  )

  const stats = useMemo(() => {
    const active = dealers.filter((item) => item.status === 'active').length
    const underReview = dealers.filter((item) => item.status === 'under_review').length
    const attention = dealers.filter((item) => item.status === 'suspended').length
    const totalRevenue = dealers.reduce((sum, item) => sum + item.revenue, 0)
    return { active, underReview, attention, totalRevenue }
  }, [dealers])

  if (dealersState.status === 'loading' || dealersState.status === 'idle') {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    )
  }

  if (dealersState.status === 'error') {
    return (
      <PagePanel>
        <ErrorState
          title={copy.loadTitle}
          message={dealersState.error || copy.loadFallback}
          onRetry={() => void reloadResource('dealers')}
        />
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
            onChange={(event) => setStatusFilter(event.target.value as 'all' | DealerStatus)}
            value={statusFilter}
          >
            {DEALER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label={copy.totalDealers} value={dealers.length} />
        <StatCard icon={CheckCircle2} label={copy.activeDealers} value={stats.active} tone="success" />
        <StatCard icon={Clock3} label={copy.underReview} value={stats.underReview} tone="info" />
        <StatCard icon={Bell} label={copy.suspended} value={stats.attention} tone="warning" />
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]">
        {copy.totalRevenue}:{' '}
        <span className="font-semibold text-[var(--accent)]">{formatCurrency(stats.totalRevenue)}</span>
      </p>

      <div className="mt-6">
        {filteredDealers.length === 0 ? (
          <EmptyState icon={Users} title={copy.emptyTitle} message={copy.emptyMessage} />
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {filteredDealers.map((dealer) => (
                <article key={dealer.id} className={tableCardClass}>
                  <button
                    className="w-full text-left"
                    onClick={() => navigate(`/dealers/${encodeURIComponent(dealer.id)}`)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--ink)]">{dealer.name}</p>
                        <p className={tableMetaClass}>
                          {dealer.id} · {dealer.email}
                        </p>
                        <p className={tableMetaClass}>{dealer.contactName}</p>
                      </div>
                      <StatusBadge tone={dealerStatusTone[dealer.status]}>
                        {dealerStatusLabel[dealer.status]}
                      </StatusBadge>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-[var(--ink)]">
                      <div className="flex items-center justify-between">
                        <span className={tableMetaClass}>{copy.orders}</span>
                        <span>{dealer.orders}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={tableMetaClass}>{copy.revenueShort}</span>
                        <span className="font-semibold text-[var(--accent)]">
                          {formatCurrency(dealer.revenue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={tableMetaClass}>{copy.credit}</span>
                        <span>{dealer.creditLimit > 0 ? formatCurrency(dealer.creditLimit) : copy.notSet}</span>
                      </div>
                    </div>
                  </button>
                  <p className={`${tableMetaClass} mt-3`}>{dealerStatusDescription[dealer.status]}</p>
                  <select
                    aria-label={`${copy.status} ${dealer.id}`}
                    className={`mt-4 w-full ${tableActionSelectClass}`}
                    onChange={async (event) => {
                      const next = event.target.value as DealerStatus
                      if (next === dealer.status) {
                        return
                      }

                      const approved = await confirm({
                        title: copy.confirmStatusTitle,
                        message: copy.confirmStatusMessage.replace(
                          '{status}',
                          dealerStatusLabel[next],
                        ),
                        tone: 'warning',
                        confirmLabel: dealerStatusLabel[next],
                      })

                      if (!approved) {
                        event.currentTarget.value = dealer.status
                        return
                      }

                      try {
                        await updateDealerStatus(dealer.id, next)
                      } catch (error) {
                        notify(error instanceof Error ? error.message : copy.updateFailed, {
                          title: copy.title,
                          variant: 'error',
                        })
                      }
                    }}
                    value={dealer.status}
                  >
                    {DEALER_STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                      <option key={`${dealer.id}-${option.value}`} value={option.value}>
                        {option.label}
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
                    <th className="px-3 py-2 font-semibold">{copy.revenueShort}</th>
                    <th className="px-3 py-2 font-semibold">{copy.credit}</th>
                    <th className="px-3 py-2 font-semibold">{copy.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDealers.map((dealer) => (
                    <tr
                      className={tableRowClass}
                      key={dealer.id}
                      onClick={() => navigate(`/dealers/${encodeURIComponent(dealer.id)}`)}
                    >
                      <td className="rounded-l-2xl px-3 py-3">
                        <p className="font-semibold text-[var(--ink)]">{dealer.name}</p>
                        <p className={tableMetaClass}>
                          {dealer.id} · {dealer.email}
                        </p>
                        <p className={tableMetaClass}>{dealer.contactName}</p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={dealerStatusTone[dealer.status]}>
                          {dealerStatusLabel[dealer.status]}
                        </StatusBadge>
                        <p className={`mt-1 ${tableMetaClass}`}>{dealerStatusDescription[dealer.status]}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm text-[var(--ink)]">{dealer.orders}</div>
                        <div className={tableMetaClass}>{formatDateTime(dealer.lastOrderAt)}</div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-[var(--accent)]">
                        {formatCurrency(dealer.revenue)}
                      </td>
                      <td className="px-3 py-3 font-semibold text-[var(--ink)]">
                        {dealer.creditLimit > 0 ? formatCurrency(dealer.creditLimit) : copy.notSet}
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

                            const approved = await confirm({
                              title: copy.confirmStatusTitle,
                              message: copy.confirmStatusMessage.replace(
                                '{status}',
                                dealerStatusLabel[next],
                              ),
                              tone: 'warning',
                              confirmLabel: dealerStatusLabel[next],
                            })

                            if (!approved) {
                              event.currentTarget.value = dealer.status
                              return
                            }

                            try {
                              await updateDealerStatus(dealer.id, next)
                            } catch (error) {
                              notify(error instanceof Error ? error.message : copy.updateFailed, {
                                title: copy.title,
                                variant: 'error',
                              })
                            }
                          }}
                          value={dealer.status}
                        >
                          {DEALER_STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                            <option key={`${dealer.id}-${option.value}`} value={option.value}>
                              {option.label}
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
      {confirmDialog}
    </PagePanel>
  )
}

export default DealersPageRevamp
