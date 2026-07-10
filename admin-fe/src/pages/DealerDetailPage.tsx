import { ArrowLeft, Pencil, Phone, Save, UserCircle, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAdminData, type DealerProfileUpdate, type DealerStatus } from '../context/AdminDataContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import {
  dealerStatusDescription,
  dealerStatusLabel,
  dealerStatusTone,
  resolveAllowedDealerStatuses,
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
  inputClass,
  labelClass,
  textareaClass,
} from '../components/ui-kit'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import { useSaveShortcut } from '../hooks/useSaveShortcut'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'

const buildDealerForm = (dealer: DealerProfileUpdate): DealerProfileUpdate => ({
  businessName: dealer.businessName,
  contactName: dealer.contactName,
  email: dealer.email,
  phone: dealer.phone,
  taxCode: dealer.taxCode,
  addressLine: dealer.addressLine,
  ward: dealer.ward,
  district: dealer.district,
  city: dealer.city,
  country: dealer.country,
  avatarUrl: dealer.avatarUrl,
  salesPolicy: dealer.salesPolicy,
})

function DealerDetailPage() {
  const { id = '' } = useParams()
  const dealerId = decodeURIComponent(id)
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { notify } = useToast()
  const { dealers, dealersState, updateDealerProfile, updateDealerStatus, reloadResource } = useAdminData()
  const { confirm, prompt, confirmDialog, promptDialog } = useConfirmDialog()
  const dealer = dealers.find((item) => item.id === dealerId)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileDraft, setProfileDraft] = useState<DealerProfileUpdate | null>(null)
  const profileForm = useMemo(
    () => (dealer ? buildDealerForm(dealer) : null),
    [dealer],
  )

  useEffect(() => {
    if (!profileForm || isEditingProfile) {
      return
    }
    setProfileDraft(profileForm)
  }, [isEditingProfile, profileForm])

  const updateDraftField = (field: keyof DealerProfileUpdate, value: string) => {
    setProfileDraft((current) => (current ? { ...current, [field]: value } : current))
  }

  const handleSaveProfile = async () => {
    if (!dealer || !profileDraft) {
      return
    }
    setIsSavingProfile(true)
    try {
      await updateDealerProfile(dealer.id, profileDraft)
      notify(t('Da cap nhat ho so dai ly.'), {
        title: t('Dai ly'),
        variant: 'success',
      })
      setIsEditingProfile(false)
    } catch (error) {
      notify(error instanceof Error ? error.message : t('Khong cap nhat duoc ho so dai ly'), {
        title: t('Dai ly'),
        variant: 'error',
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const isProfileDirty =
    isEditingProfile &&
    profileDraft != null &&
    profileForm != null &&
    JSON.stringify(profileDraft) !== JSON.stringify(profileForm)

  // Ctrl/Cmd+S saves the profile edit; warn on tab close while dirty.
  useSaveShortcut(isProfileDirty && !isSavingProfile, () => {
    void handleSaveProfile()
  })
  useUnsavedChanges(isProfileDirty)

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
          title={t('Không thể tải đại lý')}
          message={dealersState.error || t('Không tải được đại lý')}
          onRetry={() => void reloadResource('dealers')}
        />
      </PagePanel>
    )
  }

  if (!dealer) {
    return (
      <PagePanel>
        <EmptyState
          title={t('Không tìm thấy đại lý')}
          message={t('Đại lý {id} không tồn tại.', { id: dealerId })}
        />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <GhostButton
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/dealers')}
          type="button"
        >
          {t('Về danh sách đại lý')}
        </GhostButton>
        <div className="flex flex-wrap items-center gap-2">
          <GhostButton
            icon={isEditingProfile ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            onClick={() => {
              if (isEditingProfile) {
                setProfileDraft(profileForm)
                setIsEditingProfile(false)
                return
              }
              setProfileDraft(profileForm)
              setIsEditingProfile(true)
            }}
            type="button"
          >
            {isEditingProfile ? t('Huy sua') : t('Sua ho so')}
          </GhostButton>
          <StatusBadge tone={dealerStatusTone[dealer.status]}>{t(dealerStatusLabel[dealer.status])}</StatusBadge>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.95fr)] xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <UserCircle className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{dealer.id}</p>
              <h3 className="text-xl font-semibold text-[var(--ink)]">{dealer.businessName}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{dealer.contactName}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Email</p>
              <p className="mt-1 font-semibold text-[var(--ink)]">{dealer.email || '—'}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Phone</p>
              <p className="mt-1 font-semibold text-[var(--ink)]">{dealer.phone || '—'}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Đơn hàng')}</p>
              <p className="mt-1 font-semibold text-[var(--ink)]">{dealer.orders}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Doanh thu')}</p>
              <p className="mt-1 font-semibold text-[var(--accent)]">{formatCurrency(dealer.revenue)}</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-[var(--muted)]">
            {t('Lần mua gần nhất')}: {formatDateTime(dealer.lastOrderAt)}
          </p>

          {isEditingProfile && profileDraft ? (
            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  ['businessName', 'Ten doanh nghiep'],
                  ['contactName', 'Nguoi lien he'],
                  ['email', 'Email'],
                  ['phone', 'So dien thoai'],
                  ['taxCode', 'Ma so thue'],
                  ['city', 'Thanh pho'],
                  ['ward', 'Phuong xa'],
                  ['district', 'Quan huyen'],
                  ['country', 'Quoc gia'],
                  ['avatarUrl', 'Avatar URL'],
                ] as Array<[keyof DealerProfileUpdate, string]>).map(([field, label]) => (
                  <label className="space-y-1" key={field}>
                    <span className={labelClass}>{t(label)}</span>
                    <input
                      className={inputClass}
                      type={field === 'email' ? 'email' : 'text'}
                      value={profileDraft[field]}
                      onChange={(event) => updateDraftField(field, event.target.value)}
                    />
                  </label>
                ))}
                <label className="space-y-1 sm:col-span-2">
                  <span className={labelClass}>{t('Dia chi')}</span>
                  <input
                    className={inputClass}
                    value={profileDraft.addressLine}
                    onChange={(event) => updateDraftField('addressLine', event.target.value)}
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className={labelClass}>{t('Chinh sach ban hang')}</span>
                  <textarea
                    className={textareaClass}
                    value={profileDraft.salesPolicy}
                    onChange={(event) => updateDraftField('salesPolicy', event.target.value)}
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <PrimaryButton
                  disabled={isSavingProfile}
                  icon={<Save className="h-4 w-4" />}
                  onClick={() => void handleSaveProfile()}
                  type="button"
                >
                  {isSavingProfile ? t('Dang luu...') : t('Luu ho so')}
                </PrimaryButton>
                <GhostButton
                  disabled={isSavingProfile}
                  onClick={() => {
                    setProfileDraft(profileForm)
                    setIsEditingProfile(false)
                  }}
                  type="button"
                >
                  {t('Huy')}
                </GhostButton>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
              <p className="font-semibold text-[var(--ink)]">{t('Ho so day du')}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <p className="text-[var(--muted)]">{t('Ma so thue')}: <span className="text-[var(--ink)]">{dealer.taxCode || '-'}</span></p>
                <p className="text-[var(--muted)]">{t('Thanh pho')}: <span className="text-[var(--ink)]">{dealer.city || '-'}</span></p>
                <p className="text-[var(--muted)]">{t('Phuong xa')}: <span className="text-[var(--ink)]">{dealer.ward || '-'}</span></p>
                <p className="text-[var(--muted)]">{t('Quan huyen')}: <span className="text-[var(--ink)]">{dealer.district || '-'}</span></p>
                <p className="text-[var(--muted)] sm:col-span-2">{t('Dia chi')}: <span className="text-[var(--ink)]">{dealer.addressLine || '-'}</span></p>
                <p className="text-[var(--muted)] sm:col-span-2">{t('Chinh sach ban hang')}: <span className="text-[var(--ink)]">{dealer.salesPolicy || '-'}</span></p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
          <p className="text-sm font-semibold text-[var(--ink)]">{t('Cập nhật trạng thái hồ sơ')}</p>
          <select
            aria-label={t('Trạng thái đại lý {id}', { id: dealer.id })}
            className={`${inputClass} mt-3 w-full`}
            onChange={async (event) => {
              const next = event.target.value as DealerStatus
              if (next === dealer.status) {
                return
              }

              let reason: string | undefined
              if (next === 'suspended') {
                const input = await prompt({
                  title: t('Xác nhận đổi trạng thái'),
                  message: t('Chuyển đại lý này sang trạng thái "{status}"?', {
                    status: t(dealerStatusLabel[next]),
                  }),
                  tone: 'danger',
                  confirmLabel: t(dealerStatusLabel[next]),
                  inputLabel: t('Lý do tạm khóa'),
                  inputPlaceholder: t('Nhập lý do tạm khóa đại lý...'),
                })
                if (input === null) {
                  event.currentTarget.value = dealer.status
                  return
                }
                reason = input
              } else {
                const approved = await confirm({
                  title: t('Xác nhận đổi trạng thái'),
                  message: t('Chuyển đại lý này sang trạng thái "{status}"?', {
                    status: t(dealerStatusLabel[next]),
                  }),
                  tone: 'info',
                  confirmLabel: t(dealerStatusLabel[next]),
                })
                if (!approved) {
                  event.currentTarget.value = dealer.status
                  return
                }
              }

              try {
                await updateDealerStatus(dealer.id, next, reason)
                notify(t('Cập nhật {id} -> {status}', { id: dealer.id, status: t(dealerStatusLabel[next]) }), {
                  title: t('Đại lý'),
                  variant: 'info',
                })
              } catch (error) {
                notify(
                  error instanceof Error ? error.message : t('Không cập nhật được trạng thái đại lý'),
                  {
                    title: t('Đại lý'),
                    variant: 'error',
                  },
                )
              }
            }}
            value={dealer.status}
          >
            {resolveAllowedDealerStatuses(
              dealer.status,
              dealer.allowedTransitions,
            ).map((status) => (
              <option key={status} value={status}>
                {t(dealerStatusLabel[status])}
              </option>
            ))}
          </select>
          <p className="mt-3 text-xs text-[var(--muted)]">{t(dealerStatusDescription[dealer.status])}</p>

          <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm text-[var(--ink)]">
            <div className="flex items-center gap-2 font-semibold text-[var(--ink)]">
              <Phone className="h-4 w-4" />
              {t('Liên hệ nhanh')}
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">Email: {dealer.email || '—'}</p>
            <p className="text-xs text-[var(--muted)]">{t('Hotline')}: {dealer.phone || '—'}</p>
          </div>
        </div>
      </div>
      {confirmDialog}
      {promptDialog}
    </PagePanel>
  )
}

export default DealerDetailPage
