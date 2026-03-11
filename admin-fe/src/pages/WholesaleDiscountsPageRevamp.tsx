import { CheckCircle2, Clock3, Plus, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAdminData, type RuleStatus } from '../context/AdminDataContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import { ruleStatusLabel, ruleStatusTone } from '../lib/adminLabels'
import { formatDateTime } from '../lib/formatters'
import {
  EmptyState,
  ErrorState,
  GhostButton,
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
  labelClass,
  tableActionSelectClass,
  tableCardClass,
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
} from '../components/ui-kit'

const RULE_STATUS_OPTIONS: Array<{ value: 'all' | RuleStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: ruleStatusLabel.active },
  { value: 'pending', label: ruleStatusLabel.pending },
  { value: 'draft', label: ruleStatusLabel.draft },
]

const copyByLanguage = {
  vi: {
    title: 'Chiết khấu sỉ',
    description: 'Quản lý ngưỡng doanh số, phần trăm ưu đãi và trạng thái kích hoạt của từng quy tắc.',
    searchLabel: 'Tìm quy tắc',
    searchPlaceholder: 'Tìm theo tên hoặc mã quy tắc...',
    add: 'Thêm quy tắc',
    active: 'Đang hoạt động',
    pending: 'Chờ duyệt',
    highest: 'Mức cao nhất',
    createTitle: 'Tạo quy tắc mới',
    label: 'Tên quy tắc',
    range: 'Ngưỡng áp dụng',
    percent: 'Phần trăm ưu đãi',
    status: 'Trạng thái',
    save: 'Lưu quy tắc',
    cancel: 'Hủy',
    validate: 'Vui lòng nhập đủ tên, ngưỡng và phần trăm hợp lệ.',
    emptyTitle: 'Không có quy tắc phù hợp',
    emptyMessage: 'Thử thay đổi bộ lọc hoặc thêm quy tắc mới.',
    loadTitle: 'Không tải được quy tắc',
    loadFallback: 'Danh sách quy tắc chưa thể tải.',
    confirmTitle: 'Xác nhận đổi trạng thái quy tắc',
    confirmMessage: 'Chuyển quy tắc này sang trạng thái "{status}"?',
    actions: 'Thao tác',
    updated: 'Cập nhật',
  },
  en: {
    title: 'Wholesale discounts',
    description: 'Manage revenue thresholds, discount percentages, and activation status for each rule.',
    searchLabel: 'Search rules',
    searchPlaceholder: 'Search by label or rule id...',
    add: 'Add rule',
    active: 'Active',
    pending: 'Pending',
    highest: 'Highest value',
    createTitle: 'Create rule',
    label: 'Rule label',
    range: 'Threshold',
    percent: 'Discount percent',
    status: 'Status',
    save: 'Save rule',
    cancel: 'Cancel',
    validate: 'Enter a valid label, threshold, and percentage.',
    emptyTitle: 'No matching rules',
    emptyMessage: 'Try another filter or create a new rule.',
    loadTitle: 'Unable to load rules',
    loadFallback: 'The rule list could not be loaded.',
    confirmTitle: 'Confirm rule status change',
    confirmMessage: 'Change this rule to "{status}"?',
    actions: 'Actions',
    updated: 'Updated',
  },
} as const

function WholesaleDiscountsPageRevamp() {
  const { language } = useLanguage()
  const copy = copyByLanguage[language]
  const { notify } = useToast()
  const { confirm, confirmDialog } = useConfirmDialog()
  const { discountRules, discountRulesState, addDiscountRule, updateDiscountRuleStatus, reloadResource } =
    useAdminData()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | RuleStatus>('all')
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    label: '',
    range: '',
    percent: '',
    status: 'draft' as RuleStatus,
  })
  const toolbarSearchClass = 'w-full sm:max-w-sm lg:w-72 xl:w-80'

  const normalizedQuery = query.trim().toLowerCase()
  const filteredRules = useMemo(
    () =>
      discountRules.filter((rule) => {
        const matchesStatus = statusFilter === 'all' ? true : rule.status === statusFilter
        const matchesSearch =
          !normalizedQuery ||
          `${rule.id} ${rule.label} ${rule.range}`.toLowerCase().includes(normalizedQuery)
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
    setFormError('')
    const percent = Number(form.percent)
    if (!form.label.trim() || !form.range.trim() || Number.isNaN(percent) || percent <= 0 || percent > 100) {
      setFormError(copy.validate)
      return
    }

    try {
      await addDiscountRule({
        label: form.label,
        range: form.range,
        percent,
        status: form.status,
      })
      setShowForm(false)
      setForm({ label: '', range: '', percent: '', status: 'draft' })
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : copy.loadFallback)
    }
  }

  if (discountRulesState.status === 'loading' || discountRulesState.status === 'idle') {
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
          title={copy.loadTitle}
          message={discountRulesState.error || copy.loadFallback}
          onRetry={() => void reloadResource('discountRules')}
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
            id="discounts-search"
            label={copy.searchLabel}
            placeholder={copy.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={toolbarSearchClass}
          />
          <select
            aria-label={copy.status}
            className={`${inputClass} w-full sm:max-w-[14rem] lg:w-56`}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | RuleStatus)}
          >
            {RULE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <PrimaryButton icon={<Plus className="h-4 w-4" />} onClick={() => setShowForm((current) => !current)} type="button">
            {copy.add}
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={CheckCircle2} label={copy.active} value={stats.active} tone="success" />
        <StatCard icon={Clock3} label={copy.pending} value={stats.pending} tone="warning" />
        <StatCard icon={Tag} label={copy.highest} value={`${stats.highest}%`} tone="info" />
      </div>

      {showForm ? (
        <div className={`${formCardClass} mt-6`}>
          <p className="text-sm font-semibold text-[var(--ink)]">{copy.createTitle}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className={labelClass}>{copy.label}</span>
              <input
                className={inputClass}
                value={form.label}
                onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className={labelClass}>{copy.range}</span>
              <input
                className={inputClass}
                value={form.range}
                onChange={(event) => setForm((current) => ({ ...current, range: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className={labelClass}>{copy.percent}</span>
              <input
                className={inputClass}
                min="0"
                max="100"
                type="number"
                value={form.percent}
                onChange={(event) => setForm((current) => ({ ...current, percent: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className={labelClass}>{copy.status}</span>
              <select
                aria-label={copy.status}
                className={inputClass}
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as RuleStatus }))}
              >
                {RULE_STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {formError ? <p className="mt-2 text-sm text-rose-600">{formError}</p> : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <PrimaryButton className="w-full sm:w-auto" onClick={() => void handleCreateRule()} type="button">
              {copy.save}
            </PrimaryButton>
            <GhostButton
              className="w-full sm:w-auto"
              onClick={() => setShowForm(false)}
              type="button"
            >
              {copy.cancel}
            </GhostButton>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {filteredRules.length === 0 ? (
          <EmptyState icon={Tag} title={copy.emptyTitle} message={copy.emptyMessage} />
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {filteredRules.map((rule) => (
                <article key={rule.id} className={tableCardClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{rule.label}</p>
                      <p className={tableMetaClass}>{rule.id}</p>
                    </div>
                    <StatusBadge tone={ruleStatusTone[rule.status]}>{ruleStatusLabel[rule.status]}</StatusBadge>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.range}</span>
                      <span className="text-right text-[var(--ink)]">{rule.range}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.percent}</span>
                      <span className="text-right font-semibold text-[var(--accent)]">{rule.percent}%</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.updated}</span>
                      <span className="text-right text-[var(--ink)]">{formatDateTime(rule.updatedAt)}</span>
                    </div>
                  </div>
                  <select
                    aria-label={`${copy.status} ${rule.id}`}
                    className={`${inputClass} mt-4 w-full`}
                    value={rule.status}
                    onChange={async (event) => {
                      const next = event.target.value as RuleStatus
                      if (next === rule.status) return
                      const approved = await confirm({
                        title: copy.confirmTitle,
                        message: copy.confirmMessage.replace('{status}', ruleStatusLabel[next]),
                        tone: next === 'draft' ? 'info' : 'warning',
                        confirmLabel: ruleStatusLabel[next],
                      })
                      if (!approved) {
                        event.currentTarget.value = rule.status
                        return
                      }
                      try {
                        await updateDiscountRuleStatus(rule.id, next)
                      } catch (updateError) {
                        notify(updateError instanceof Error ? updateError.message : copy.loadFallback, {
                          title: copy.title,
                          variant: 'error',
                        })
                      }
                    }}
                  >
                    {RULE_STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                      <option key={`${rule.id}-${option.value}`} value={option.value}>
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
                    <th className="px-3 py-2 font-semibold">{copy.label}</th>
                    <th className="px-3 py-2 font-semibold">{copy.range}</th>
                    <th className="px-3 py-2 font-semibold">{copy.percent}</th>
                    <th className="px-3 py-2 font-semibold">{copy.status}</th>
                    <th className="px-3 py-2 font-semibold">{copy.updated}</th>
                    <th className="px-3 py-2 font-semibold">{copy.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.map((rule) => (
                    <tr key={rule.id} className={tableRowClass}>
                      <td className="rounded-l-2xl px-3 py-3">
                        <p className="font-semibold text-[var(--ink)]">{rule.label}</p>
                        <p className={tableMetaClass}>{rule.id}</p>
                      </td>
                      <td className="px-3 py-3">{rule.range}</td>
                      <td className="px-3 py-3 font-semibold text-[var(--accent)]">{rule.percent}%</td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={ruleStatusTone[rule.status]}>{ruleStatusLabel[rule.status]}</StatusBadge>
                      </td>
                      <td className="px-3 py-3 text-sm">{formatDateTime(rule.updatedAt)}</td>
                      <td className="rounded-r-2xl px-3 py-3">
                        <select
                          aria-label={`${copy.status} ${rule.id}`}
                          className={tableActionSelectClass}
                          value={rule.status}
                          onChange={async (event) => {
                            const next = event.target.value as RuleStatus
                            if (next === rule.status) return
                            const approved = await confirm({
                              title: copy.confirmTitle,
                              message: copy.confirmMessage.replace('{status}', ruleStatusLabel[next]),
                              tone: next === 'draft' ? 'info' : 'warning',
                              confirmLabel: ruleStatusLabel[next],
                            })
                            if (!approved) {
                              event.currentTarget.value = rule.status
                              return
                            }
                            try {
                              await updateDiscountRuleStatus(rule.id, next)
                            } catch (updateError) {
                              notify(updateError instanceof Error ? updateError.message : copy.loadFallback, {
                                title: copy.title,
                                variant: 'error',
                              })
                            }
                          }}
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
          </>
        )}
      </div>
      {confirmDialog}
    </PagePanel>
  )
}

export default WholesaleDiscountsPageRevamp
