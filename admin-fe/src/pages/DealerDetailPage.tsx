import { ArrowLeft, Phone, UserCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PagePanel,
  PrimaryButton,
  StatusBadge,
  fieldErrorClass,
  inputClass,
  labelClass,
} from '../components/ui-kit'
import { useConfirmDialog } from '../hooks/useConfirmDialog'

const DEALER_STATUS_OPTIONS: DealerStatus[] = ['active', 'under_review', 'needs_attention']
const DEALER_TIERS: DealerTier[] = ['platinum', 'gold', 'silver', 'bronze']

function DealerDetailPage() {
  const { id = '' } = useParams()
  const dealerId = decodeURIComponent(id)
  const { notify } = useToast()
  const { dealers, dealersState, updateDealer, updateDealerStatus, reloadResource } = useAdminData()
  const { confirm, confirmDialog } = useConfirmDialog()
  const dealer = dealers.find((item) => item.id === dealerId)
  const [form, setForm] = useState({
    name: '',
    tier: 'gold' as DealerTier,
    email: '',
    phone: '',
    creditLimit: '',
  })
  const [formErrors, setFormErrors] = useState<Partial<Record<'name' | 'email' | 'phone' | 'creditLimit', string>>>({})
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const isDirty = useMemo(
    () =>
      Boolean(
        dealer &&
          (form.name !== dealer.name ||
            form.tier !== dealer.tier ||
            form.email !== dealer.email ||
            form.phone !== dealer.phone ||
            form.creditLimit !== (dealer.creditLimit > 0 ? String(dealer.creditLimit) : '')),
      ),
    [dealer, form],
  )

  const validateForm = (value: typeof form) => {
    const errors: Partial<Record<'name' | 'email' | 'phone' | 'creditLimit', string>> = {}

    if (!value.name.trim()) {
      errors.name = 'Vui long nhap ten dai ly.'
    }

    if (!value.email.trim()) {
      errors.email = 'Vui long nhap email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) {
      errors.email = 'Email khong hop le.'
    }

    const phoneDigits = value.phone.replace(/\D/g, '')
    if (!value.phone.trim()) {
      errors.phone = 'Vui long nhap so dien thoai.'
    } else if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      errors.phone = 'So dien thoai khong hop le.'
    }

    if (value.creditLimit.trim()) {
      const nextCreditLimit = Number(value.creditLimit)
      if (Number.isNaN(nextCreditLimit) || nextCreditLimit < 0) {
        errors.creditLimit = 'Han muc cong no phai la so khong am.'
      }
    }

    return errors
  }

  const updateFormField = <K extends keyof typeof form>(field: K, nextValue: (typeof form)[K]) => {
    setForm((previous) => {
      const next = { ...previous, [field]: nextValue }
      setFormErrors(validateForm(next))
      return next
    })
  }

  useEffect(() => {
    if (!dealer) {
      return
    }
    setForm({
      name: dealer.name,
      tier: dealer.tier,
      email: dealer.email,
      phone: dealer.phone,
      creditLimit: dealer.creditLimit > 0 ? String(dealer.creditLimit) : '',
    })
  }, [dealer?.creditLimit, dealer?.email, dealer?.id, dealer?.name, dealer?.phone, dealer?.tier])

  if (dealersState.status === 'loading' || dealersState.status === 'idle') {
    return (
      <PagePanel>
        <LoadingRows rows={4} />
      </PagePanel>
    )
  }

  if (dealersState.status === 'error') {
    return (
      <PagePanel>
        <ErrorState
          title="Khong the tai dai ly"
          message={dealersState.error || 'Khong tai duoc dai ly'}
          onRetry={() => void reloadResource('dealers')}
        />
      </PagePanel>
    )
  }

  if (!dealer) {
    return (
      <PagePanel>
        <EmptyState
          title="Khong tim thay dai ly"
          message={`Dai ly ${dealerId} khong ton tai.`}
        />
      </PagePanel>
    )
  }

  const handleSaveProfile = async () => {
    const nextErrors = validateForm(form)
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const creditLimit = form.creditLimit.trim() ? Number(form.creditLimit) : 0
    setIsSavingProfile(true)
    try {
      await updateDealer(dealer.id, {
        name: form.name.trim(),
        tier: form.tier,
        email: form.email.trim(),
        phone: form.phone.trim(),
        creditLimit,
      })
      setFormErrors({})
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
          <StatusBadge tone={dealerTierTone[dealer.tier]}>{dealerTierLabel[dealer.tier]}</StatusBadge>
          <StatusBadge tone={dealerStatusTone[dealer.status]}>{dealerStatusLabel[dealer.status]}</StatusBadge>
        </div>
      </div>

      {isDirty ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="status">
          Co thay doi chua luu trong ho so dai ly.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.95fr)] xl:grid-cols-[1.3fr_1fr]">
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
              <p className="mt-1 font-semibold text-[var(--accent)]">{formatCurrency(dealer.revenue)}</p>
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
            className={`${inputClass} mt-3 w-full bg-white text-slate-700`}
            onChange={async (event) => {
              const next = event.target.value as DealerStatus
              if (next === dealer.status) {
                return
              }

              const approved = await confirm({
                title: 'Xac nhan doi trang thai',
                message: `Chuyen dai ly nay sang trang thai "${dealerStatusLabel[next]}"?`,
                tone: next === 'needs_attention' ? 'warning' : 'info',
                confirmLabel: dealerStatusLabel[next],
              })

              if (!approved) {
                event.currentTarget.value = dealer.status
                return
              }

              try {
                await updateDealerStatus(dealer.id, next)
                notify(`Cap nhat ${dealer.id} -> ${dealerStatusLabel[next]}`, {
                  title: 'Dealers',
                  variant: 'info',
                })
              } catch (error) {
                notify(error instanceof Error ? error.message : 'Khong cap nhat duoc trang thai dai ly', {
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
          <p className="mt-3 text-xs text-slate-500">{dealerStatusDescription[dealer.status]}</p>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="text-sm font-semibold text-slate-900">Cap nhat thong tin dealer</p>
            <div className="mt-3 grid gap-3">
              <label className="space-y-2">
                <span className={labelClass}>Ten dai ly</span>
                <input
                  aria-describedby={formErrors.name ? 'dealer-name-error' : undefined}
                  aria-invalid={Boolean(formErrors.name)}
                  className={`${inputClass} bg-white text-slate-700 ${formErrors.name ? 'border-rose-300' : ''}`}
                  onChange={(event) => updateFormField('name', event.target.value)}
                  value={form.name}
                />
                {formErrors.name ? (
                  <p className={fieldErrorClass} id="dealer-name-error">
                    {formErrors.name}
                  </p>
                ) : null}
              </label>
              <label className="space-y-2">
                <span className={labelClass}>Hang dealer</span>
                <select
                  aria-label="Dealer tier"
                  className={`${inputClass} bg-white text-slate-700`}
                  onChange={(event) => updateFormField('tier', event.target.value as DealerTier)}
                  value={form.tier}
                >
                  {DEALER_TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {dealerTierLabel[tier]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className={labelClass}>Email</span>
                <input
                  aria-describedby={formErrors.email ? 'dealer-email-error' : undefined}
                  aria-invalid={Boolean(formErrors.email)}
                  className={`${inputClass} bg-white text-slate-700 ${formErrors.email ? 'border-rose-300' : ''}`}
                  onChange={(event) => updateFormField('email', event.target.value)}
                  type="email"
                  value={form.email}
                />
                {formErrors.email ? (
                  <p className={fieldErrorClass} id="dealer-email-error">
                    {formErrors.email}
                  </p>
                ) : null}
              </label>
              <label className="space-y-2">
                <span className={labelClass}>So dien thoai</span>
                <input
                  aria-describedby={formErrors.phone ? 'dealer-phone-error' : undefined}
                  aria-invalid={Boolean(formErrors.phone)}
                  className={`${inputClass} bg-white text-slate-700 ${formErrors.phone ? 'border-rose-300' : ''}`}
                  onChange={(event) => updateFormField('phone', event.target.value)}
                  value={form.phone}
                />
                {formErrors.phone ? (
                  <p className={fieldErrorClass} id="dealer-phone-error">
                    {formErrors.phone}
                  </p>
                ) : null}
              </label>
              <label className="space-y-2">
                <span className={labelClass}>Han muc cong no (VND)</span>
                <input
                  aria-describedby={formErrors.creditLimit ? 'dealer-credit-error' : undefined}
                  aria-invalid={Boolean(formErrors.creditLimit)}
                  className={`${inputClass} bg-white text-slate-700 ${formErrors.creditLimit ? 'border-rose-300' : ''}`}
                  onChange={(event) => updateFormField('creditLimit', event.target.value)}
                  type="number"
                  value={form.creditLimit}
                />
                {formErrors.creditLimit ? (
                  <p className={fieldErrorClass} id="dealer-credit-error">
                    {formErrors.creditLimit}
                  </p>
                ) : null}
              </label>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <PrimaryButton
                disabled={isSavingProfile || !isDirty}
                onClick={() => void handleSaveProfile()}
                type="button"
              >
                {isSavingProfile ? 'Dang luu...' : 'Luu thong tin'}
              </PrimaryButton>
              {isDirty ? (
                <GhostButton
                  onClick={() => {
                    setForm({
                      name: dealer.name,
                      tier: dealer.tier,
                      email: dealer.email,
                      phone: dealer.phone,
                      creditLimit: dealer.creditLimit > 0 ? String(dealer.creditLimit) : '',
                    })
                    setFormErrors({})
                  }}
                  type="button"
                >
                  Hoan tac
                </GhostButton>
              ) : null}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-3 text-sm text-slate-700">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Phone className="h-4 w-4" />
              Lien he nhanh
            </div>
            <p className="mt-2 text-xs text-slate-500">Email: {dealer.email}</p>
            <p className="text-xs text-slate-500">Hotline: {dealer.phone}</p>
          </div>
        </div>
      </div>
      {confirmDialog}
    </PagePanel>
  )
}

export default DealerDetailPage
