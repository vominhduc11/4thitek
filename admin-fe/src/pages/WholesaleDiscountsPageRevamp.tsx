import { CheckCircle2, FileText, Pencil, Plus, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAdminData, type DiscountRule, type RuleStatus } from '../context/AdminDataContext'
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

type PageCopy = {
  title: string
  description: string
  searchLabel: string
  searchPlaceholder: string
  add: string
  edit: string
  active: string
  draft: string
  highest: string
  createTitle: string
  editTitle: string
  fromQuantity: string
  toQuantity: string
  openEnded: string
  openEndedHint: string
  percent: string
  status: string
  create: string
  update: string
  cancel: string
  validate: string
  emptyTitle: string
  emptyMessage: string
  loadTitle: string
  loadFallback: string
  confirmTitle: string
  confirmMessage: string
  actions: string
  updated: string
  rangeLabel: string
  infinity: string
  overlapHint: string
  fromColumn: string
  toColumn: string
}

const COPY: Record<'vi' | 'en', PageCopy> = {
  vi: {
    title: 'Chiết khấu sỉ',
    description:
      'Quản lý các bậc chiết khấu theo tổng số lượng sản phẩm của toàn đơn hàng bằng các mốc rõ ràng, không chồng lấn.',
    searchLabel: 'Tìm bậc chiết khấu',
    searchPlaceholder: 'Tìm theo khoảng số lượng, phần trăm hoặc mã quy tắc...',
    add: 'Thêm bậc',
    edit: 'Chỉnh sửa',
    active: 'Đang hoạt động',
    draft: 'Bản nháp',
    highest: 'Mức cao nhất',
    createTitle: 'Tạo bậc chiết khấu mới',
    editTitle: 'Chỉnh sửa bậc chiết khấu',
    fromQuantity: 'Từ số lượng',
    toQuantity: 'Đến số lượng',
    openEnded: 'Trở lên',
    openEndedHint: 'Bật để áp dụng từ mốc này trở lên và bỏ giới hạn trên.',
    percent: 'Phần trăm chiết khấu',
    status: 'Trạng thái',
    create: 'Tạo bậc',
    update: 'Cập nhật bậc',
    cancel: 'Hủy',
    validate:
      'Vui lòng nhập fromQuantity >= 1, toQuantity hợp lệ và phần trăm trong khoảng 1-100.',
    emptyTitle: 'Không có bậc chiết khấu phù hợp',
    emptyMessage: 'Thử đổi bộ lọc hoặc tạo thêm bậc chiết khấu mới.',
    loadTitle: 'Không tải được bậc chiết khấu',
    loadFallback: 'Danh sách bậc chiết khấu hiện chưa thể tải.',
    confirmTitle: 'Xác nhận đổi trạng thái bậc chiết khấu',
    confirmMessage: 'Chuyển bậc này sang trạng thái "{status}"?',
    actions: 'Thao tác',
    updated: 'Cập nhật',
    rangeLabel: 'Nhãn khoảng',
    infinity: '∞',
    overlapHint:
      'Backend sẽ chặn overlap ACTIVE, bậc open-ended trùng lặp và boundary mơ hồ.',
    fromColumn: 'Từ',
    toColumn: 'Đến',
  },
  en: {
    title: 'Wholesale discounts',
    description:
      'Manage whole-order quantity tiers with explicit quantity boundaries and no overlap.',
    searchLabel: 'Search quantity tiers',
    searchPlaceholder: 'Search by quantity range, percent, or rule id...',
    add: 'Add tier',
    edit: 'Edit',
    active: 'Active',
    draft: 'Draft',
    highest: 'Highest tier',
    createTitle: 'Create quantity tier',
    editTitle: 'Edit quantity tier',
    fromQuantity: 'From quantity',
    toQuantity: 'To quantity',
    openEnded: 'Open-ended',
    openEndedHint: 'Enable to apply from this quantity upward with no upper bound.',
    percent: 'Discount percent',
    status: 'Status',
    create: 'Create tier',
    update: 'Update tier',
    cancel: 'Cancel',
    validate:
      'Enter fromQuantity >= 1, a valid toQuantity, and a percent between 1 and 100.',
    emptyTitle: 'No quantity tiers match',
    emptyMessage: 'Adjust the filters or add another quantity tier.',
    loadTitle: 'Unable to load quantity tiers',
    loadFallback: 'The quantity tier list is currently unavailable.',
    confirmTitle: 'Confirm quantity tier status change',
    confirmMessage: 'Move this tier to "{status}"?',
    actions: 'Actions',
    updated: 'Updated',
    rangeLabel: 'Range label',
    infinity: '∞',
    overlapHint:
      'The backend rejects ACTIVE overlaps, duplicate open-ended tiers, and ambiguous boundaries.',
    fromColumn: 'From',
    toColumn: 'To',
  },
}

type RuleFormState = {
  fromQuantity: string
  toQuantity: string
  percent: string
  status: RuleStatus
  openEnded: boolean
}

const createInitialForm = (): RuleFormState => ({
  fromQuantity: '',
  toQuantity: '',
  percent: '',
  status: 'draft',
  openEnded: false,
})

const toFormState = (rule: DiscountRule): RuleFormState => ({
  fromQuantity: String(rule.fromQuantity),
  toQuantity: rule.toQuantity == null ? '' : String(rule.toQuantity),
  percent: String(rule.percent),
  status: rule.status,
  openEnded: rule.toQuantity == null,
})

function WholesaleDiscountsPageRevamp() {
  const { language, t } = useLanguage()
  const copy = COPY[language]
  const { notify } = useToast()
  const { confirm, confirmDialog } = useConfirmDialog()
  const {
    discountRules,
    discountRulesState,
    addDiscountRule,
    updateDiscountRule,
    updateDiscountRuleStatus,
    reloadResource,
  } = useAdminData()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | RuleStatus>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<RuleFormState>(createInitialForm())
  const toolbarSearchClass = 'w-full sm:max-w-sm lg:w-72 xl:w-80'

  const statusOptions: Array<{ value: 'all' | RuleStatus; label: string }> = [
    { value: 'all', label: language === 'vi' ? 'Tất cả' : 'All' },
    { value: 'active', label: copy.active },
    { value: 'draft', label: copy.draft },
  ]

  const normalizedQuery = query.trim().toLowerCase()
  const filteredRules = useMemo(
    () =>
      discountRules.filter((rule) => {
        const matchesStatus = statusFilter === 'all' || rule.status === statusFilter
        const matchesSearch =
          !normalizedQuery ||
          `${rule.id} ${rule.rangeLabel} ${rule.fromQuantity} ${rule.toQuantity ?? ''} ${rule.percent}`
            .toLowerCase()
            .includes(normalizedQuery)
        return matchesStatus && matchesSearch
      }),
    [discountRules, normalizedQuery, statusFilter],
  )

  const stats = useMemo(() => {
    const active = discountRules.filter((item) => item.status === 'active').length
    const draft = discountRules.filter((item) => item.status === 'draft').length
    const highest = discountRules.reduce((max, item) => Math.max(max, item.percent), 0)
    return { active, draft, highest }
  }, [discountRules])

  const resetForm = () => {
    setForm(createInitialForm())
    setEditingRuleId(null)
    setFormError('')
    setShowForm(false)
  }

  const openCreateForm = () => {
    setEditingRuleId(null)
    setForm(createInitialForm())
    setFormError('')
    setShowForm(true)
  }

  const openEditForm = (rule: DiscountRule) => {
    setEditingRuleId(rule.id)
    setForm(toFormState(rule))
    setFormError('')
    setShowForm(true)
  }

  const handleSaveRule = async () => {
    setFormError('')
    const fromQuantity = Number(form.fromQuantity)
    const toQuantity = form.openEnded ? null : Number(form.toQuantity)
    const percent = Number(form.percent)
    const invalidBasic =
      Number.isNaN(fromQuantity) ||
      fromQuantity < 1 ||
      Number.isNaN(percent) ||
      percent <= 0 ||
      percent > 100 ||
      (!form.openEnded &&
        (Number.isNaN(toQuantity) || toQuantity === null || toQuantity < fromQuantity))

    if (invalidBasic) {
      setFormError(copy.validate)
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        fromQuantity,
        toQuantity,
        percent,
        status: form.status,
      }
      if (editingRuleId) {
        await updateDiscountRule(editingRuleId, payload)
      } else {
        await addDiscountRule(payload)
      }
      resetForm()
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : copy.loadFallback)
    } finally {
      setIsSaving(false)
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
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <PrimaryButton icon={<Plus className="h-4 w-4" />} onClick={openCreateForm} type="button">
            {copy.add}
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={CheckCircle2} label={copy.active} value={stats.active} tone="success" />
        <StatCard icon={FileText} label={copy.draft} value={stats.draft} tone="warning" />
        <StatCard icon={Tag} label={copy.highest} value={`${stats.highest}%`} tone="info" />
      </div>

      {showForm ? (
        <div className={`${formCardClass} mt-6`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">
                {editingRuleId ? copy.editTitle : copy.createTitle}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">{copy.overlapHint}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-2">
              <span className={labelClass}>{copy.fromQuantity}</span>
              <input
                className={inputClass}
                min="1"
                type="number"
                value={form.fromQuantity}
                onChange={(event) =>
                  setForm((current) => ({ ...current, fromQuantity: event.target.value }))
                }
              />
            </label>
            <label className="space-y-2">
              <span className={labelClass}>{copy.toQuantity}</span>
              <input
                className={inputClass}
                disabled={form.openEnded}
                min={form.fromQuantity || '1'}
                type="number"
                value={form.toQuantity}
                onChange={(event) =>
                  setForm((current) => ({ ...current, toQuantity: event.target.value }))
                }
              />
            </label>
            <label className="space-y-2">
              <span className={labelClass}>{copy.percent}</span>
              <input
                className={inputClass}
                min="1"
                max="100"
                type="number"
                value={form.percent}
                onChange={(event) =>
                  setForm((current) => ({ ...current, percent: event.target.value }))
                }
              />
            </label>
            <label className="space-y-2">
              <span className={labelClass}>{copy.status}</span>
              <select
                aria-label={copy.status}
                className={inputClass}
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as RuleStatus,
                  }))
                }
              >
                {statusOptions
                  .filter((option) => option.value !== 'all')
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex items-end">
              <span className="flex min-h-[2.75rem] w-full items-center gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--ink)]">
                <input
                  checked={form.openEnded}
                  className="h-4 w-4 accent-[var(--accent)]"
                  type="checkbox"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      openEnded: event.target.checked,
                      toQuantity: event.target.checked ? '' : current.toQuantity,
                    }))
                  }
                />
                <span>
                  <span className="block font-medium">{copy.openEnded}</span>
                  <span className="block text-xs text-[var(--muted)]">{copy.openEndedHint}</span>
                </span>
              </span>
            </label>
          </div>
          {formError ? <p className="mt-3 text-sm text-rose-600">{formError}</p> : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <PrimaryButton
              className="w-full sm:w-auto"
              disabled={isSaving}
              onClick={() => void handleSaveRule()}
              type="button"
            >
              {editingRuleId ? copy.update : copy.create}
            </PrimaryButton>
            <GhostButton className="w-full sm:w-auto" onClick={resetForm} type="button">
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
                      <p className="font-semibold text-[var(--ink)]">{rule.rangeLabel}</p>
                      <p className={tableMetaClass}>{rule.id}</p>
                    </div>
                    <StatusBadge tone={ruleStatusTone[rule.status]}>
                      {t(ruleStatusLabel[rule.status])}
                    </StatusBadge>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.fromColumn}</span>
                      <span className="text-right text-[var(--ink)]">{rule.fromQuantity}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.toColumn}</span>
                      <span className="text-right text-[var(--ink)]">
                        {rule.toQuantity ?? copy.infinity}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.percent}</span>
                      <span className="text-right font-semibold text-[var(--accent)]">
                        {rule.percent}%
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.updated}</span>
                      <span className="text-right text-[var(--ink)]">
                        {formatDateTime(rule.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <GhostButton className="flex-1" onClick={() => openEditForm(rule)} type="button">
                      <Pencil className="h-4 w-4" />
                      {copy.edit}
                    </GhostButton>
                    <select
                      aria-label={`${copy.status} ${rule.id}`}
                      className={`${inputClass} flex-1`}
                      value={rule.status}
                      onChange={async (event) => {
                        const next = event.target.value as RuleStatus
                        if (next === rule.status) return
                        const approved = await confirm({
                          title: copy.confirmTitle,
                          message: copy.confirmMessage.replace('{status}', t(ruleStatusLabel[next])),
                          tone: next === 'draft' ? 'info' : 'warning',
                          confirmLabel: t(ruleStatusLabel[next]),
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
                      {statusOptions
                        .filter((option) => option.value !== 'all')
                        .map((option) => (
                          <option key={`${rule.id}-${option.value}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                    </select>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[72rem] border-separate border-spacing-y-2">
                <thead>
                  <tr className={tableHeadClass}>
                    <th className="w-28 px-3 py-2 font-semibold">{copy.fromColumn}</th>
                    <th className="w-28 px-3 py-2 font-semibold">{copy.toColumn}</th>
                    <th className="min-w-44 px-3 py-2 font-semibold">{copy.rangeLabel}</th>
                    <th className="w-28 px-3 py-2 font-semibold">{copy.percent}</th>
                    <th className="w-32 px-3 py-2 font-semibold">{copy.status}</th>
                    <th className="w-40 px-3 py-2 font-semibold">{copy.updated}</th>
                    <th className="w-56 px-3 py-2 font-semibold">{copy.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.map((rule) => (
                    <tr key={rule.id} className={tableRowClass}>
                      <td className="rounded-l-2xl px-3 py-3">{rule.fromQuantity}</td>
                      <td className="px-3 py-3">{rule.toQuantity ?? copy.infinity}</td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[var(--ink)]">{rule.rangeLabel}</p>
                        <p className={tableMetaClass}>{rule.id}</p>
                      </td>
                      <td className="px-3 py-3 font-semibold text-[var(--accent)]">
                        {rule.percent}%
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={ruleStatusTone[rule.status]}>
                          {t(ruleStatusLabel[rule.status])}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-3 text-sm">{formatDateTime(rule.updatedAt)}</td>
                      <td className="rounded-r-2xl px-3 py-3">
                        <div className="flex items-center gap-2">
                          <GhostButton onClick={() => openEditForm(rule)} type="button">
                            <Pencil className="h-4 w-4" />
                            {copy.edit}
                          </GhostButton>
                          <select
                            aria-label={`${copy.status} ${rule.id}`}
                            className={tableActionSelectClass}
                            value={rule.status}
                            onChange={async (event) => {
                              const next = event.target.value as RuleStatus
                              if (next === rule.status) return
                              const approved = await confirm({
                                title: copy.confirmTitle,
                                message: copy.confirmMessage.replace('{status}', t(ruleStatusLabel[next])),
                                tone: next === 'draft' ? 'info' : 'warning',
                                confirmLabel: t(ruleStatusLabel[next]),
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
                            {statusOptions
                              .filter((option) => option.value !== 'all')
                              .map((option) => (
                                <option key={`${rule.id}-${option.value}`} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                          </select>
                        </div>
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
