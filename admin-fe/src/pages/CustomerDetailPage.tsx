import { ArrowLeft, Phone, UserCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAdminData, type CustomerStatus } from '../context/AdminDataContext'
import { useToast } from '../context/ToastContext'
import {
  customerStatusLabel,
  customerStatusTone,
  customerTierLabel,
  customerTierTone,
} from '../lib/adminLabels'
import { formatCurrency, formatDateTime } from '../lib/formatters'
import { EmptyState, PagePanel, StatusBadge } from '../components/ui-kit'

const CUSTOMER_STATUS_OPTIONS: CustomerStatus[] = [
  'active',
  'under_review',
  'needs_attention',
]

function CustomerDetailPage() {
  const { id = '' } = useParams()
  const customerId = decodeURIComponent(id)
  const { notify } = useToast()
  const { customers, updateCustomerStatus } = useAdminData()
  const customer = customers.find((item) => item.id === customerId)

  if (!customer) {
    return (
      <PagePanel>
        <EmptyState
          title="Khong tim thay khach hang"
          message={`Khach ${customerId} khong ton tai.`}
        />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900"
          to="/customers"
        >
          <ArrowLeft className="h-4 w-4" />
          Ve khach hang
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={customerTierTone[customer.tier]}>
            {customerTierLabel[customer.tier]}
          </StatusBadge>
          <StatusBadge tone={customerStatusTone[customer.status]}>
            {customerStatusLabel[customer.status]}
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
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{customer.id}</p>
              <h3 className="text-xl font-semibold text-slate-900">{customer.name}</h3>
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
              <p className="mt-1 font-semibold text-slate-900">{customer.email}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Phone</p>
              <p className="mt-1 font-semibold text-slate-900">{customer.phone}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Don hang</p>
              <p className="mt-1 font-semibold text-slate-900">{customer.orders}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Doanh thu</p>
              <p className="mt-1 font-semibold text-[var(--accent)]">
                {formatCurrency(customer.revenue)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Lan mua gan nhat: {formatDateTime(customer.lastOrderAt)}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5">
          <p className="text-sm font-semibold text-slate-900">Cap nhat trang thai cham soc</p>
          <select
            aria-label={`Customer status ${customer.id}`}
            className="mt-3 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            onChange={(event) => {
              const next = event.target.value as CustomerStatus
              updateCustomerStatus(customer.id, next)
              notify(`Cap nhat ${customer.id} -> ${customerStatusLabel[next]}`, {
                title: 'Customers',
                variant: 'info',
              })
            }}
            value={customer.status}
          >
            {CUSTOMER_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {customerStatusLabel[status]}
              </option>
            ))}
          </select>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-3 text-sm text-slate-700">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Phone className="h-4 w-4" />
              Contact nhanh
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Email: {customer.email}
            </p>
            <p className="text-xs text-slate-500">Hotline: {customer.phone}</p>
          </div>
        </div>
      </div>
    </PagePanel>
  )
}

export default CustomerDetailPage
