import { ArrowLeft, Phone, UserCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAdminData, type DealerStatus } from '../context/AdminDataContext'
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

function DealerDetailPage() {
  const { id = '' } = useParams()
  const dealerId = decodeURIComponent(id)
  const { notify } = useToast()
  const { dealers, updateDealerStatus } = useAdminData()
  const dealer = dealers.find((item) => item.id === dealerId)

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
