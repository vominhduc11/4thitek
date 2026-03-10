import { CheckCircle2, Clock3, Plus, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAdminData, type RuleStatus } from '../context/AdminDataContext'
import { useToast } from '../context/ToastContext'
import { ruleStatusLabel, ruleStatusTone } from '../lib/adminLabels'
import { formatDateTime } from '../lib/formatters'
import { useSimulatedPageLoad } from '../hooks/useSimulatedPageLoad'
import {
  EmptyState,
  ErrorState,
  LoadingRows,
  PagePanel,
  PrimaryButton,
  SearchInput,
  StatCard,
  StatusBadge,
} from '../components/ui-kit'

const RULE_STATUS_OPTIONS: Array<{ value: 'all' | RuleStatus; label: string }> = [
  { value: 'all', label: 'Tat ca' },
  { value: 'active', label: ruleStatusLabel.active },
  { value: 'pending', label: ruleStatusLabel.pending },
  { value: 'draft', label: ruleStatusLabel.draft },
]

function WholesaleDiscountsPage() {
  const { notify } = useToast()
  const { discountRules, discountRulesState, addDiscountRule, updateDiscountRuleStatus, reloadResource } =
    useAdminData()
  const { isLoading } = useSimulatedPageLoad('discounts-page')

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | RuleStatus>('all')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    label: '',
    range: '',
    percent: '',
    status: 'draft' as RuleStatus,
  })

  const normalizedQuery = query.trim().toLowerCase()
  const filteredRules = useMemo(
    () =>
      discountRules.filter((rule) => {
        const matchesStatus = statusFilter === 'all' ? true : rule.status === statusFilter
        const matchesSearch =
          !normalizedQuery ||
          rule.id.toLowerCase().includes(normalizedQuery) ||
          rule.label.toLowerCase().includes(normalizedQuery)
        return matchesStatus && matchesSearch
      }),
    [discountRules, normalizedQuery, statusFilter],
  )

  const stats = useMemo(() => {
    const active = discountRules.filter((item) => item.status === 'active').length
    const pending = discountRules.filter((item) => item.status === 'pending').length
    const highest = discountRules.reduce((max, item) => Math.max(max, item.percent), 0)
    return { active, pending, highest }
  }, [discountRules])

  const handleCreateRule = async () => {
    setError('')
    const percent = Number(form.percent)
    if (!form.label.trim() || !form.range.trim() || Number.isNaN(percent) || percent <= 0) {
      setError('Vui long nhap day du quy tac, nguong va phan tram')
      return
    }
    try {
      const created = await addDiscountRule({
        label: form.label,
        range: form.range,
        percent,
        status: form.status,
      })
      notify(`Da them quy tac ${created.id}`, { title: 'Discounts', variant: 'success' })
      setShowForm(false)
      setForm({ label: '', range: '', percent: '', status: 'draft' })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Khong tao duoc quy tac')
    }
  }

  if (isLoading || discountRulesState.status === 'loading' || discountRulesState.status === 'idle') {
    return (
      <PagePanel>
        <LoadingRows rows={5} />
      </PagePanel>
    )
  }

  if (discountRulesState.status === 'error') {
    return (
      <PagePanel>
        <ErrorState
          title="Khong the tai quy tac chiet khau"
          message={discountRulesState.error || 'Khong tai duoc quy tac'}
          onRetry={() => void reloadResource('discountRules')}
        />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Chiet khau ban si</h3>
          <p className="text-sm text-slate-500">
            Quan ly quy tac chiet khau ban si theo nguong doanh so.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            id="discounts-search"
            label="Search discount rules"
            placeholder="Tim quy tac..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-60 max-w-full"
          />
          <select
            aria-label="Discount status filter"
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            onChange={(event) => setStatusFilter(event.target.value as 'all' | RuleStatus)}
            value={statusFilter}
          >
            {RULE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <PrimaryButton
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowForm((value) => !value)}
            type="button"
          >
            Them quy tac
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={CheckCircle2} label="Dang hoat dong" value={stats.active} tone="success" />
        <StatCard icon={Clock3} label="Cho phe duyet" value={stats.pending} tone="warning" />
        <StatCard icon={Tag} label="Muc cao nhat" value={`${stats.highest}%`} tone="info" />
      </div>

      {showForm ? (
        <div className="mt-6 rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-4">
          <p className="text-sm font-semibold text-slate-900">Them quy tac moi</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) => setForm((previous) => ({ ...previous, label: event.target.value }))}
              placeholder="Ten quy tac"
              value={form.label}
            />
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) => setForm((previous) => ({ ...previous, range: event.target.value }))}
              placeholder="Nguong ap dung"
              value={form.range}
            />
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) => setForm((previous) => ({ ...previous, percent: event.target.value }))}
              placeholder="Ty le (%)"
              type="number"
              value={form.percent}
            />
            <select
              aria-label="Rule status"
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) =>
                setForm((previous) => ({ ...previous, status: event.target.value as RuleStatus }))
              }
              value={form.status}
            >
              {RULE_STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <PrimaryButton onClick={handleCreateRule} type="button">
              Luu quy tac
            </PrimaryButton>
            <button
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[var(--accent)]"
              onClick={() => setShowForm(false)}
              type="button"
            >
              Huy
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {filteredRules.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="Khong co quy tac"
            message="Thu doi bo loc hoac them quy tac moi."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-3 py-2 font-semibold">Quy tac</th>
                  <th className="px-3 py-2 font-semibold">Nguong</th>
                  <th className="px-3 py-2 font-semibold">Ty le</th>
                  <th className="px-3 py-2 font-semibold">Trang thai</th>
                  <th className="px-3 py-2 font-semibold">Cap nhat</th>
                  <th className="px-3 py-2 font-semibold">Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule) => (
                  <tr className="rounded-2xl bg-white/80 text-sm text-slate-700 shadow-sm" key={rule.id}>
                    <td className="rounded-l-2xl px-3 py-3">
                      <p className="font-semibold text-slate-900">{rule.label}</p>
                      <p className="text-xs text-slate-500">{rule.id}</p>
                    </td>
                    <td className="px-3 py-3">{rule.range}</td>
                    <td className="px-3 py-3 font-semibold text-[var(--accent)]">{rule.percent}%</td>
                    <td className="px-3 py-3">
                      <StatusBadge tone={ruleStatusTone[rule.status]}>
                        {ruleStatusLabel[rule.status]}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">{formatDateTime(rule.updatedAt)}</td>
                    <td className="rounded-r-2xl px-3 py-3">
                      <select
                        aria-label={`Rule status ${rule.id}`}
                        className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                        onChange={async (event) => {
                          const next = event.target.value as RuleStatus
                          try {
                            await updateDiscountRuleStatus(rule.id, next)
                            notify(`Cap nhat ${rule.id} -> ${ruleStatusLabel[next]}`, {
                              title: 'Discounts',
                              variant: 'info',
                            })
                          } catch (error) {
                            notify(error instanceof Error ? error.message : 'Khong cap nhat duoc quy tac', {
                              title: 'Discounts',
                              variant: 'error',
                            })
                          }
                        }}
                        value={rule.status}
                      >
                        {RULE_STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                          <option key={`${rule.id}-${option.value}`} value={option.value}>
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
        )}
      </div>
    </PagePanel>
  )
}

export default WholesaleDiscountsPage
