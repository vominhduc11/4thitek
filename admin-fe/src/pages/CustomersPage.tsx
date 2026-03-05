import { CheckCircle2, Clock3, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useAdminData,
  type CustomerStatus,
  type CustomerTier,
} from '../context/AdminDataContext'
import { useToast } from '../context/ToastContext'
import {
  customerStatusLabel,
  customerStatusTone,
  customerTierLabel,
  customerTierTone,
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

const CUSTOMER_STATUS_OPTIONS: Array<{ value: 'all' | CustomerStatus; label: string }> = [
  { value: 'all', label: 'Tat ca' },
  { value: 'active', label: customerStatusLabel.active },
  { value: 'under_review', label: customerStatusLabel.under_review },
  { value: 'needs_attention', label: customerStatusLabel.needs_attention },
]

const CUSTOMER_TIERS: CustomerTier[] = ['platinum', 'gold', 'silver', 'bronze']

function CustomersPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { customers, addCustomer, updateCustomerStatus } = useAdminData()
  const { isLoading } = useSimulatedPageLoad('customers-page')

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerStatus>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    name: '',
    tier: 'gold' as CustomerTier,
    email: '',
    phone: '',
    revenue: '',
  })

  const normalizedQuery = query.trim().toLowerCase()
  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        const matchesStatus = statusFilter === 'all' ? true : customer.status === statusFilter
        const matchesSearch =
          !normalizedQuery ||
          customer.name.toLowerCase().includes(normalizedQuery) ||
          customer.id.toLowerCase().includes(normalizedQuery) ||
          customer.email.toLowerCase().includes(normalizedQuery)
        return matchesStatus && matchesSearch
      }),
    [customers, normalizedQuery, statusFilter],
  )

  const stats = useMemo(() => {
    const active = customers.filter((item) => item.status === 'active').length
    const attention = customers.filter((item) => item.status === 'needs_attention').length
    const totalRevenue = customers.reduce((sum, item) => sum + item.revenue, 0)
    return { active, attention, totalRevenue }
  }, [customers])

  const handleCreate = () => {
    setFormError('')
    const revenue = Number(form.revenue || 0)
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setFormError('Vui long nhap day du ten, email va so dien thoai')
      return
    }
    const created = addCustomer({
      name: form.name,
      tier: form.tier,
      email: form.email,
      phone: form.phone,
      revenue: Number.isNaN(revenue) ? 0 : revenue,
      orders: 0,
    })

    notify(`Da them khach ${created.id}`, { title: 'Customers', variant: 'success' })
    setShowCreateForm(false)
    setForm({
      name: '',
      tier: 'gold',
      email: '',
      phone: '',
      revenue: '',
    })
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
          <h3 className="text-lg font-semibold text-slate-900">Khach hang</h3>
          <p className="text-sm text-slate-500">
            Quan ly dai ly, han muc va trang thai mua hang.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            id="customers-search"
            label="Search customers"
            placeholder="Tim khach hang..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-60 max-w-full"
          />
          <select
            aria-label="Customer status filter"
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | CustomerStatus)
            }
            value={statusFilter}
          >
            {CUSTOMER_STATUS_OPTIONS.map((option) => (
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
            Them khach
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label="Tong dai ly" value={customers.length} />
        <StatCard icon={CheckCircle2} label="Dang hoat dong" value={stats.active} tone="success" />
        <StatCard icon={Clock3} label="Can cham soc" value={stats.attention} tone="warning" />
      </div>
      <p className="mt-3 text-sm text-slate-500">
        Tong doanh thu: <span className="font-semibold text-[var(--accent)]">{formatCurrency(stats.totalRevenue)}</span>
      </p>

      {showCreateForm ? (
        <div className="mt-6 rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-4">
          <p className="text-sm font-semibold text-slate-900">Them khach hang moi</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Ten khach hang"
              value={form.name}
            />
            <select
              aria-label="Customer tier"
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tier: event.target.value as CustomerTier }))
              }
              value={form.tier}
            >
              {CUSTOMER_TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {customerTierLabel[tier]}
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
              Luu khach hang
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
        {filteredCustomers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Khong co khach hang"
            message="Thu doi bo loc hoac them khach moi."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-3 py-2 font-semibold">Khach hang</th>
                  <th className="px-3 py-2 font-semibold">Hang</th>
                  <th className="px-3 py-2 font-semibold">Trang thai</th>
                  <th className="px-3 py-2 font-semibold">Don hang</th>
                  <th className="px-3 py-2 font-semibold">Doanh thu</th>
                  <th className="px-3 py-2 font-semibold">Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    className="cursor-pointer rounded-2xl bg-white/80 text-sm text-slate-700 shadow-sm transition hover:bg-[var(--accent-soft)]/40"
                    key={customer.id}
                    onClick={() =>
                      navigate(`/customers/${encodeURIComponent(customer.id)}`)
                    }
                  >
                    <td className="rounded-l-2xl px-3 py-3">
                      <p className="font-semibold text-slate-900">{customer.name}</p>
                      <p className="text-xs text-slate-500">
                        {customer.id} · {customer.email}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge tone={customerTierTone[customer.tier]}>
                        {customerTierLabel[customer.tier]}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge tone={customerStatusTone[customer.status]}>
                        {customerStatusLabel[customer.status]}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-slate-700">{customer.orders} don</div>
                      <div className="text-xs text-slate-500">
                        {formatDateTime(customer.lastOrderAt)}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-[var(--accent)]">
                      {formatCurrency(customer.revenue)}
                    </td>
                    <td
                      className="rounded-r-2xl px-3 py-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <select
                        aria-label={`Customer status ${customer.id}`}
                        className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                        onChange={(event) => {
                          const next = event.target.value as CustomerStatus
                          updateCustomerStatus(customer.id, next)
                          notify(
                            `Cap nhat ${customer.id} -> ${customerStatusLabel[next]}`,
                            { title: 'Customers', variant: 'info' },
                          )
                        }}
                        value={customer.status}
                      >
                        {CUSTOMER_STATUS_OPTIONS.filter((option) => option.value !== 'all').map(
                          (option) => (
                            <option key={`${customer.id}-${option.value}`} value={option.value}>
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

export default CustomersPage
