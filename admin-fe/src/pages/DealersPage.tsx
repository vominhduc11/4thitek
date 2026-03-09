import { Bell, CheckCircle2, Clock3, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useAdminData,
  type DealerStatus,
  type DealerTier,
} from '../context/AdminDataContext'
import { useToast } from '../context/ToastContext'
import {
  dealerStatusDescription,
  dealerStatusLabel,
  dealerStatusTone,
  dealerTierLabel,
  dealerTierTone,
} from '../lib/adminLabels'
import { formatCurrency, formatDateTime } from '../lib/formatters'
import { useSimulatedPageLoad } from '../hooks/useSimulatedPageLoad'
import {
  EmptyState,
  LoadingRows,
  PagePanel,
  PrimaryButton,
  SearchInput,
  StatCard,
  StatusBadge,
} from '../components/ui-kit'

const DEALER_STATUS_OPTIONS: Array<{ value: 'all' | DealerStatus; label: string }> = [
  { value: 'all', label: 'Tat ca' },
  { value: 'active', label: dealerStatusLabel.active },
  { value: 'under_review', label: dealerStatusLabel.under_review },
  { value: 'needs_attention', label: dealerStatusLabel.needs_attention },
]

const DEALER_TIERS: DealerTier[] = ['platinum', 'gold', 'silver', 'bronze']

function DealersPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { dealers, addDealer, updateDealerStatus } = useAdminData()
  const { isLoading } = useSimulatedPageLoad('dealers-page')

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
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setFormError('Vui long nhap day du ten, email va so dien thoai')
      return
    }
    try {
      const created = await addDealer({
        name: form.name,
        tier: form.tier,
        email: form.email,
        phone: form.phone,
        revenue: Number.isNaN(revenue) ? 0 : revenue,
        orders: 0,
      })

      notify(`Da them dai ly ${created.id}`, { title: 'Dealers', variant: 'success' })
      setShowCreateForm(false)
      setForm({
        name: '',
        tier: 'gold',
        email: '',
        phone: '',
        revenue: '',
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Khong tao duoc dai ly')
    }
  }

  if (isLoading) {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Dai ly</h3>
          <p className="text-sm text-slate-500">
            Quan ly ho so dai ly, han muc va trang thai kich hoat tai khoan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            id="dealers-search"
            label="Search dealers"
            placeholder="Tim dai ly..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-60 max-w-full"
          />
          <select
            aria-label="Dealer status filter"
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
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
          <PrimaryButton
            icon={<UserPlus className="h-4 w-4" />}
            onClick={() => setShowCreateForm((value) => !value)}
            type="button"
          >
            Them dai ly
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Tong dai ly" value={dealers.length} />
        <StatCard icon={CheckCircle2} label="Da kich hoat" value={stats.active} tone="success" />
        <StatCard icon={Clock3} label="Cho duyet ho so" value={stats.underReview} tone="info" />
        <StatCard icon={Bell} label="Can bo sung ho so" value={stats.attention} tone="warning" />
      </div>
      <p className="mt-3 text-sm text-slate-500">
        Tong doanh thu: <span className="font-semibold text-[var(--accent)]">{formatCurrency(stats.totalRevenue)}</span>
      </p>

      {showCreateForm ? (
        <div className="mt-6 rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-4">
          <p className="text-sm font-semibold text-slate-900">Them dai ly moi</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Ten dai ly"
              value={form.name}
            />
            <select
              aria-label="Dealer tier"
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tier: event.target.value as DealerTier }))
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
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Email"
              type="email"
              value={form.email}
            />
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="So dien thoai"
              value={form.phone}
            />
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] md:col-span-2"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, revenue: event.target.value }))
              }
              placeholder="Doanh thu hien tai (VND)"
              type="number"
              value={form.revenue}
            />
          </div>
          {formError ? <p className="mt-2 text-sm text-rose-600">{formError}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <PrimaryButton onClick={handleCreate} type="button">
              Luu dai ly
            </PrimaryButton>
            <button
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[var(--accent)]"
              onClick={() => setShowCreateForm(false)}
              type="button"
            >
              Huy
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {filteredDealers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Khong co dai ly"
            message="Thu doi bo loc hoac them dai ly moi."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-3 py-2 font-semibold">Dai ly</th>
                  <th className="px-3 py-2 font-semibold">Hang</th>
                  <th className="px-3 py-2 font-semibold">Trang thai</th>
                  <th className="px-3 py-2 font-semibold">Don hang</th>
                  <th className="px-3 py-2 font-semibold">Doanh thu</th>
                  <th className="px-3 py-2 font-semibold">Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {filteredDealers.map((dealer) => (
                  <tr
                    className="cursor-pointer rounded-2xl bg-white/80 text-sm text-slate-700 shadow-sm transition hover:bg-[var(--accent-soft)]/40"
                    key={dealer.id}
                    onClick={() =>
                      navigate(`/dealers/${encodeURIComponent(dealer.id)}`)
                    }
                  >
                    <td className="rounded-l-2xl px-3 py-3">
                      <p className="font-semibold text-slate-900">{dealer.name}</p>
                      <p className="text-xs text-slate-500">
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
                      <p className="mt-1 text-xs text-slate-500">
                        {dealerStatusDescription[dealer.status]}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-slate-700">{dealer.orders} don</div>
                      <div className="text-xs text-slate-500">
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
                        aria-label={`Dealer status ${dealer.id}`}
                        className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                        onChange={async (event) => {
                          const next = event.target.value as DealerStatus
                          try {
                            await updateDealerStatus(dealer.id, next)
                            notify(
                              `Cap nhat ${dealer.id} -> ${dealerStatusLabel[next]}`,
                              { title: 'Dealers', variant: 'info' },
                            )
                          } catch (error) {
                            notify(
                              error instanceof Error
                                ? error.message
                                : 'Khong cap nhat duoc trang thai dai ly',
                              { title: 'Dealers', variant: 'error' },
                            )
                          }
                        }}
                        value={dealer.status}
                      >
                        {DEALER_STATUS_OPTIONS.filter((option) => option.value !== 'all').map(
                          (option) => (
                            <option key={`${dealer.id}-${option.value}`} value={option.value}>
                              {option.label}
                            </option>
                          ),
                        )}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PagePanel>
  )
}

export default DealersPage
