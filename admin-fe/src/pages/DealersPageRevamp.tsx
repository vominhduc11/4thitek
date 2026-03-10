import { Bell, CheckCircle2, Clock3, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EmptyState,
  ErrorState,
  LoadingRows,
  PagePanel,
  PrimaryButton,
  SearchInput,
  StatCard,
  StatusBadge,
  bodyTextClass,
  cardTitleClass,
  formCardClass,
  inputClass,
  tableCardClass,
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
} from '../components/ui-kit'
import { useAdminData, type DealerStatus, type DealerTier } from '../context/AdminDataContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import {
  dealerStatusDescription,
  dealerStatusLabel,
  dealerStatusTone,
  dealerTierLabel,
  dealerTierTone,
} from '../lib/adminLabels'
import { formatCurrency, formatDateTime } from '../lib/formatters'

const DEALER_STATUS_OPTIONS: Array<{ value: 'all' | DealerStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: dealerStatusLabel.active },
  { value: 'under_review', label: dealerStatusLabel.under_review },
  { value: 'needs_attention', label: dealerStatusLabel.needs_attention },
]

const DEALER_TIERS: DealerTier[] = ['platinum', 'gold', 'silver', 'bronze']

const copyByLanguage = {
  vi: {
    title: '\u0110\u1ea1i l\u00fd',
    description:
      'Qu\u1ea3n l\u00fd h\u1ed3 s\u01a1 \u0111\u1ea1i l\u00fd, h\u1ea1n m\u1ee9c v\u00e0 tr\u1ea1ng th\u00e1i k\u00edch ho\u1ea1t t\u00e0i kho\u1ea3n.',
    searchLabel: 'T\u00ecm \u0111\u1ea1i l\u00fd',
    searchPlaceholder: 'T\u00ecm theo t\u00ean, m\u00e3 ho\u1eb7c email...',
    addDealer: 'Th\u00eam \u0111\u1ea1i l\u00fd',
    totalDealers: 'T\u1ed5ng \u0111\u1ea1i l\u00fd',
    activeDealers: '\u0110\u00e3 k\u00edch ho\u1ea1t',
    underReview: 'Ch\u1edd duy\u1ec7t',
    needsAttention: 'C\u1ea7n b\u1ed5 sung',
    totalRevenue: 'T\u1ed5ng doanh thu',
    createTitle: 'Th\u00eam \u0111\u1ea1i l\u00fd m\u1edbi',
    dealerName: 'T\u00ean \u0111\u1ea1i l\u00fd',
    email: 'Email',
    phone: 'S\u1ed1 \u0111i\u1ec7n tho\u1ea1i',
    revenue: 'Doanh thu hi\u1ec7n t\u1ea1i (VND)',
    creditLimit: 'H\u1ea1n m\u1ee9c c\u00f4ng n\u1ee3 (VND)',
    save: 'L\u01b0u \u0111\u1ea1i l\u00fd',
    cancel: 'H\u1ee7y',
    nameRequired:
      'Vui l\u00f2ng nh\u1eadp \u0111\u1ea7y \u0111\u1ee7 t\u00ean, email v\u00e0 s\u1ed1 \u0111i\u1ec7n tho\u1ea1i.',
    numberInvalid: 'Doanh thu v\u00e0 h\u1ea1n m\u1ee9c ph\u1ea3i l\u00e0 s\u1ed1 kh\u00f4ng \u00e2m.',
    emptyTitle: 'Kh\u00f4ng c\u00f3 \u0111\u1ea1i l\u00fd',
    emptyMessage: 'Th\u1eed \u0111i\u1ec1u ch\u1ec9nh b\u1ed9 l\u1ecdc ho\u1eb7c t\u1eeb kh\u00f3a t\u00ecm ki\u1ebfm.',
    loadTitle: 'Kh\u00f4ng th\u1ec3 t\u1ea3i \u0111\u1ea1i l\u00fd',
    loadFallback: 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c danh s\u00e1ch \u0111\u1ea1i l\u00fd',
    tier: 'H\u1ea1ng',
    status: 'Tr\u1ea1ng th\u00e1i',
    orders: '\u0110\u01a1n h\u00e0ng',
    revenueShort: 'Doanh thu',
    credit: 'H\u1ea1n m\u1ee9c',
    actions: 'Thao t\u00e1c',
    notSet: 'Ch\u01b0a \u0111\u1eb7t',
    confirmStatusTitle: 'X\u00e1c nh\u1eadn c\u1eadp nh\u1eadt tr\u1ea1ng th\u00e1i',
    confirmStatusMessage:
      'B\u1ea1n c\u00f3 ch\u1eafc mu\u1ed1n chuy\u1ec3n tr\u1ea1ng th\u00e1i \u0111\u1ea1i l\u00fd n\u00e0y sang "{status}" kh\u00f4ng?',
    updateFailed: 'Kh\u00f4ng c\u1eadp nh\u1eadt \u0111\u01b0\u1ee3c tr\u1ea1ng th\u00e1i \u0111\u1ea1i l\u00fd',
  },
  en: {
    title: 'Dealers',
    description: 'Manage dealer profiles, credit limits, and account activation status.',
    searchLabel: 'Search dealers',
    searchPlaceholder: 'Search by name, code, or email...',
    addDealer: 'Add dealer',
    totalDealers: 'Total dealers',
    activeDealers: 'Active',
    underReview: 'Under review',
    needsAttention: 'Needs attention',
    totalRevenue: 'Total revenue',
    createTitle: 'Create dealer',
    dealerName: 'Dealer name',
    email: 'Email',
    phone: 'Phone',
    revenue: 'Current revenue (VND)',
    creditLimit: 'Credit limit (VND)',
    save: 'Save dealer',
    cancel: 'Cancel',
    nameRequired: 'Name, email, and phone are required.',
    numberInvalid: 'Revenue and credit limit must be non-negative numbers.',
    emptyTitle: 'No dealers found',
    emptyMessage: 'Try adjusting filters or your search keywords.',
    loadTitle: 'Unable to load dealers',
    loadFallback: 'Could not load the dealer list',
    tier: 'Tier',
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
  const { dealers, dealersState, addDealer, updateDealerStatus, reloadResource } = useAdminData()
  const { confirm, confirmDialog } = useConfirmDialog()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | DealerStatus>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    name: '',
    tier: 'gold' as DealerTier,
    email: '',
    phone: '',
    revenue: '',
    creditLimit: '',
  })

  const normalizedQuery = query.trim().toLowerCase()
  const filteredDealers = useMemo(
    () =>
      dealers.filter((dealer) => {
        const matchesStatus = statusFilter === 'all' ? true : dealer.status === statusFilter
        const matchesSearch =
          !normalizedQuery ||
          dealer.name.toLowerCase().includes(normalizedQuery) ||
          dealer.id.toLowerCase().includes(normalizedQuery) ||
          dealer.email.toLowerCase().includes(normalizedQuery)
        return matchesStatus && matchesSearch
      }),
    [dealers, normalizedQuery, statusFilter],
  )

  const stats = useMemo(() => {
    const active = dealers.filter((item) => item.status === 'active').length
    const underReview = dealers.filter((item) => item.status === 'under_review').length
    const attention = dealers.filter((item) => item.status === 'needs_attention').length
    const totalRevenue = dealers.reduce((sum, item) => sum + item.revenue, 0)
    return { active, underReview, attention, totalRevenue }
  }, [dealers])

  const handleCreate = async () => {
    setFormError('')
    const revenue = Number(form.revenue || 0)
    const creditLimit = Number(form.creditLimit || 0)
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setFormError(copy.nameRequired)
      return
    }
    if (Number.isNaN(revenue) || Number.isNaN(creditLimit) || revenue < 0 || creditLimit < 0) {
      setFormError(copy.numberInvalid)
      return
    }

    try {
      await addDealer({
        name: form.name,
        tier: form.tier,
        email: form.email,
        phone: form.phone,
        revenue,
        creditLimit,
        orders: 0,
      })
      setShowCreateForm(false)
      setForm({
        name: '',
        tier: 'gold',
        email: '',
        phone: '',
        revenue: '',
        creditLimit: '',
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : copy.loadFallback)
    }
  }

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
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h3 className={cardTitleClass}>{copy.title}</h3>
          <p className={bodyTextClass}>{copy.description}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
          <SearchInput
            id="dealers-search"
            label={copy.searchLabel}
            placeholder={copy.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full sm:w-80"
          />
          <select
            aria-label={copy.status}
            className={`${inputClass} w-full sm:w-auto`}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | DealerStatus)}
            value={statusFilter}
          >
            {DEALER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <PrimaryButton
            className="w-full sm:w-auto"
            icon={<UserPlus className="h-4 w-4" />}
            onClick={() => setShowCreateForm((value) => !value)}
            type="button"
          >
            {copy.addDealer}
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label={copy.totalDealers} value={dealers.length} />
        <StatCard icon={CheckCircle2} label={copy.activeDealers} value={stats.active} tone="success" />
        <StatCard icon={Clock3} label={copy.underReview} value={stats.underReview} tone="info" />
        <StatCard icon={Bell} label={copy.needsAttention} value={stats.attention} tone="warning" />
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]">
        {copy.totalRevenue}:{' '}
        <span className="font-semibold text-[var(--accent)]">{formatCurrency(stats.totalRevenue)}</span>
      </p>

      {showCreateForm ? (
        <div className={`${formCardClass} mt-6`}>
          <p className="text-sm font-semibold text-[var(--ink)]">{copy.createTitle}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              className={inputClass}
              onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
              placeholder={copy.dealerName}
              value={form.name}
            />
            <select
              aria-label={copy.tier}
              className={inputClass}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, tier: event.target.value as DealerTier }))
              }
              value={form.tier}
            >
              {DEALER_TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {dealerTierLabel[tier]}
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
              placeholder={copy.email}
              type="email"
              value={form.email}
            />
            <input
              className={inputClass}
              onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))}
              placeholder={copy.phone}
              value={form.phone}
            />
            <input
              className={`${inputClass} md:col-span-2`}
              min="0"
              onChange={(event) =>
                setForm((previous) => ({ ...previous, revenue: event.target.value }))
              }
              placeholder={copy.revenue}
              type="number"
              value={form.revenue}
            />
            <input
              className={`${inputClass} md:col-span-2`}
              min="0"
              onChange={(event) =>
                setForm((previous) => ({ ...previous, creditLimit: event.target.value }))
              }
              placeholder={copy.creditLimit}
              type="number"
              value={form.creditLimit}
            />
          </div>
          {formError ? <p className="mt-2 text-sm text-rose-600">{formError}</p> : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <PrimaryButton className="w-full sm:w-auto" onClick={handleCreate} type="button">
              {copy.save}
            </PrimaryButton>
            <PrimaryButton
              className="w-full bg-slate-900 shadow-[0_16px_30px_rgba(15,23,42,0.22)] hover:bg-slate-800 sm:w-auto"
              onClick={() => setShowCreateForm(false)}
              type="button"
            >
              {copy.cancel}
            </PrimaryButton>
          </div>
        </div>
      ) : null}

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
                      </div>
                      <StatusBadge tone={dealerStatusTone[dealer.status]}>
                        {dealerStatusLabel[dealer.status]}
                      </StatusBadge>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-[var(--ink)]">
                      <div className="flex items-center justify-between">
                        <span className={tableMetaClass}>{copy.tier}</span>
                        <StatusBadge tone={dealerTierTone[dealer.tier]}>
                          {dealerTierLabel[dealer.tier]}
                        </StatusBadge>
                      </div>
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
                    className={`${inputClass} mt-4 w-full`}
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
                    <th className="px-3 py-2 font-semibold">{copy.tier}</th>
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
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={dealerTierTone[dealer.tier]}>
                          {dealerTierLabel[dealer.tier]}
                        </StatusBadge>
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
                          className={`${inputClass} h-9 w-full`}
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
