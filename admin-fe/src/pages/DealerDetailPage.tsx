import { ArrowLeft, Phone, UserCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAdminData, type DealerStatus, type DealerTier } from '../context/AdminDataContext'
import { useToast } from '../context/ToastContext'
import {
  dealerStatusDescription,
  dealerStatusLabel,
  dealerStatusTone,
  dealerTierLabel,
  dealerTierTone,
} from '../lib/adminLabels'
import { formatCurrency, formatDateTime } from '../lib/formatters'
import { EmptyState, PagePanel, StatusBadge } from '../components/ui-kit'

const DEALER_STATUS_OPTIONS: DealerStatus[] = [
  'active',
  'under_review',
  'needs_attention',
]

const DEALER_TIERS: DealerTier[] = ['platinum', 'gold', 'silver', 'bronze']

function DealerDetailPage() {
  const { id = '' } = useParams()
  const dealerId = decodeURIComponent(id)
  const { notify } = useToast()
  const { dealers, updateDealer, updateDealerStatus } = useAdminData()
  const dealer = dealers.find((item) => item.id === dealerId)
  const [form, setForm] = useState({
    name: '',
    tier: 'gold' as DealerTier,
    email: '',
    phone: '',
    creditLimit: '',
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  useEffect(() => {
    if (!dealer) return
    setForm({
      name: dealer.name,
      tier: dealer.tier,
      email: dealer.email,
      phone: dealer.phone,
      creditLimit: dealer.creditLimit > 0 ? String(dealer.creditLimit) : '',
    })
  }, [dealer?.id, dealer?.name, dealer?.tier, dealer?.email, dealer?.phone, dealer?.creditLimit])

  if (!dealer) {
    return (
      <PagePanel>
        <EmptyState
          title="Không tìm thấy đại lý"
          message={`Đại lý ${dealerId} không tồn tại.`}
        />
      </PagePanel>
    )
  }

  const handleSaveProfile = async () => {
    const creditLimit = Number(form.creditLimit || 0)
    setIsSavingProfile(true)
    try {
      await updateDealer(dealer.id, {
        name: form.name,
        tier: form.tier,
        email: form.email,
        phone: form.phone,
        creditLimit: Number.isNaN(creditLimit) ? 0 : creditLimit,
      })
      notify(`Da cap nhat ${dealer.id}`, { title: 'Dealers', variant: 'success' })
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Khong cap nhat duoc dai ly', {
        title: 'Dealers',
        variant: 'error',
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900"
          to="/dealers"
        >
          <ArrowLeft className="h-4 w-4" />
          Ve dai ly
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={dealerTierTone[dealer.tier]}>
            {dealerTierLabel[dealer.tier]}
          </StatusBadge>
          <StatusBadge tone={dealerStatusTone[dealer.status]}>
            {dealerStatusLabel[dealer.status]}
          </StatusBadge>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <UserCircle className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{dealer.id}</p>
              <h3 className="text-xl font-semibold text-slate-900">{dealer.name}</h3>
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
              <p className="mt-1 font-semibold text-slate-900">{dealer.email}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Phone</p>
              <p className="mt-1 font-semibold text-slate-900">{dealer.phone}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Don hang</p>
              <p className="mt-1 font-semibold text-slate-900">{dealer.orders}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Doanh thu</p>
              <p className="mt-1 font-semibold text-[var(--accent)]">
                {formatCurrency(dealer.revenue)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Han muc cong no</p>
              <p className="mt-1 font-semibold text-slate-900">
                {dealer.creditLimit > 0 ? formatCurrency(dealer.creditLimit) : 'Chua dat'}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Lan mua gan nhat: {formatDateTime(dealer.lastOrderAt)}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5">
          <p className="text-sm font-semibold text-slate-900">Cap nhat trang thai ho so</p>
          <select
            aria-label={`Dealer status ${dealer.id}`}
            className="mt-3 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            onChange={async (event) => {
              const next = event.target.value as DealerStatus
              try {
                await updateDealerStatus(dealer.id, next)
                notify(`Cap nhat ${dealer.id} -> ${dealerStatusLabel[next]}`, {
                  title: 'Dealers',
                  variant: 'info',
                })
              } catch (error) {
                notify(error instanceof Error ? error.message : 'Không cập nhật được trạng thái đại lý', {
                  title: 'Dealers',
                  variant: 'error',
                })
              }
            }}
            value={dealer.status}
          >
            {DEALER_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {dealerStatusLabel[status]}
              </option>
            ))}
          </select>
          <p className="mt-3 text-xs text-slate-500">
            {dealerStatusDescription[dealer.status]}
          </p>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="text-sm font-semibold text-slate-900">Cap nhat thong tin dealer</p>
            <div className="mt-3 grid gap-3">
              <input
                className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Ten dai ly"
                value={form.name}
              />
              <select
                aria-label="Dealer tier"
                className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                onChange={(event) => setForm((prev) => ({ ...prev, tier: event.target.value as DealerTier }))}
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
                className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                onChange={(event) => setForm((prev) => ({ ...prev, creditLimit: event.target.value }))}
                placeholder="Han muc cong no (VND)"
                type="number"
                value={form.creditLimit}
              />
            </div>
            <button
              className="btn-stable mt-4 inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)]"
              disabled={isSavingProfile}
              onClick={() => void handleSaveProfile()}
              type="button"
            >
              {isSavingProfile ? 'Dang luu...' : 'Luu thong tin'}
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-3 text-sm text-slate-700">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Phone className="h-4 w-4" />
              Liên hệ nhanh
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Email: {dealer.email}
            </p>
            <p className="text-xs text-slate-500">Hotline: {dealer.phone}</p>
          </div>
        </div>
      </div>
    </PagePanel>
  )
}

export default DealerDetailPage
