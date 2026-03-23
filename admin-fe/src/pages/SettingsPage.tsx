import { Bell, Mail, Save, Shield, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ErrorState, GhostButton, LoadingRows, PagePanel, PrimaryButton, inputClass, labelClass } from '../components/ui-kit'
import { useAdminData } from '../context/AdminDataContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'

const copyByLanguage = {
  vi: {
    title: 'Cai dat he thong',
    description: 'Quan ly bao mat, thong bao, SePay, email va rate limit runtime.',
    save: 'Luu thay doi',
    saving: 'Dang luu...',
    reset: 'Hoan tac thay doi',
    dirtyNotice: 'Ban co thay doi chua luu trong cai dat he thong.',
    loadTitle: 'Khong the tai cai dat',
    loadFallback: 'Khong tai duoc cai dat he thong',
    saveSuccess: 'Da luu cai dat he thong',
    saveFailed: 'Khong luu duoc cai dat he thong',
    security: 'Bao mat',
    notifications: 'Thong bao',
    sepay: 'SePay',
    email: 'Email',
    rateLimit: 'Rate limit',
    emailConfirmation: 'Xac nhan email',
    emailConfirmationHelp: 'Bat buoc xac nhan email khi dang nhap admin.',
    sessionTimeout: 'Het phien dang nhap (phut)',
    orderAlerts: 'Canh bao don hang',
    orderAlertsHelp: 'Thong bao khi co don hang can xu ly.',
    inventoryAlerts: 'Canh bao ton kho',
    inventoryAlertsHelp: 'Thong bao khi ton kho xuong thap.',
    enabled: 'Bat',
    webhookToken: 'Webhook token',
    bankName: 'Ten ngan hang',
    accountNumber: 'So tai khoan',
    accountHolder: 'Chu tai khoan',
    fromEmail: 'Email gui',
    fromName: 'Ten nguoi gui',
    bucket: 'Bucket',
    requests: 'Requests',
    windowSeconds: 'Window (giay)',
    auth: 'Dang nhap',
    passwordReset: 'Quen mat khau',
    warrantyLookup: 'Tra cuu bao hanh',
    upload: 'Upload',
    webhook: 'Webhook',
  },
  en: {
    title: 'System settings',
    description: 'Manage security, notifications, SePay, email, and runtime rate-limit controls.',
    save: 'Save changes',
    saving: 'Saving...',
    reset: 'Reset changes',
    dirtyNotice: 'There are unsaved changes in system settings.',
    loadTitle: 'Unable to load settings',
    loadFallback: 'Could not load system settings',
    saveSuccess: 'System settings saved',
    saveFailed: 'Could not save system settings',
    security: 'Security',
    notifications: 'Notifications',
    sepay: 'SePay',
    email: 'Email',
    rateLimit: 'Rate limit',
    emailConfirmation: 'Email confirmation',
    emailConfirmationHelp: 'Require email confirmation when admins sign in.',
    sessionTimeout: 'Session timeout (minutes)',
    orderAlerts: 'Order alerts',
    orderAlertsHelp: 'Notify when new orders need attention.',
    inventoryAlerts: 'Inventory alerts',
    inventoryAlertsHelp: 'Notify when stock runs low.',
    enabled: 'Enabled',
    webhookToken: 'Webhook token',
    bankName: 'Bank name',
    accountNumber: 'Account number',
    accountHolder: 'Account holder',
    fromEmail: 'From email',
    fromName: 'From name',
    bucket: 'Bucket',
    requests: 'Requests',
    windowSeconds: 'Window (seconds)',
    auth: 'Auth',
    passwordReset: 'Password reset',
    warrantyLookup: 'Warranty lookup',
    upload: 'Upload',
    webhook: 'Webhook',
  },
} as const

type RateLimitBucketKey = 'auth' | 'passwordReset' | 'warrantyLookup' | 'upload' | 'webhook'

function SettingsPage() {
  const {
    settings,
    settingsState,
    isSettingsLoading,
    isSettingsSaving,
    updateSettings,
    reloadResource,
  } = useAdminData()
  const { language } = useLanguage()
  const { notify } = useToast()
  const copy = copyByLanguage[language]
  const [draft, setDraft] = useState(settings)
  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings), [draft, settings])

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  const updateBucket = (bucket: RateLimitBucketKey, field: 'requests' | 'windowSeconds', value: number) => {
    setDraft((previous) => ({
      ...previous,
      rateLimitOverrides: {
        ...previous.rateLimitOverrides,
        [bucket]: {
          ...previous.rateLimitOverrides[bucket],
          [field]: value,
        },
      },
    }))
  }

  if (isSettingsLoading) {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    )
  }

  if (settingsState.status === 'error') {
    return (
      <PagePanel>
        <ErrorState
          title={copy.loadTitle}
          message={settingsState.error || copy.loadFallback}
          onRetry={() => void reloadResource('settings')}
        />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{copy.title}</h3>
          <p className="text-sm text-slate-500">{copy.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PrimaryButton
            disabled={isSettingsSaving || !isDirty}
            icon={<Save className="h-4 w-4" />}
            onClick={async () => {
              try {
                await updateSettings(draft)
                notify(copy.saveSuccess, { title: copy.title, variant: 'success' })
              } catch (error) {
                notify(error instanceof Error ? error.message : copy.saveFailed, {
                  title: copy.title,
                  variant: 'error',
                })
              }
            }}
            type="button"
          >
            {isSettingsSaving ? copy.saving : copy.save}
          </PrimaryButton>
          {isDirty ? (
            <GhostButton onClick={() => setDraft(settings)} type="button">
              {copy.reset}
            </GhostButton>
          ) : null}
        </div>
      </div>

      {isDirty ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="status">
          {copy.dirtyNotice}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Shield className="h-4 w-4 text-[var(--accent-strong)]" />
            {copy.security}
          </div>
          <div className="mt-4 space-y-3">
            <label className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{copy.emailConfirmation}</p>
                <p className="text-xs text-slate-500">{copy.emailConfirmationHelp}</p>
              </div>
              <input
                checked={draft.emailConfirmation}
                className="mt-1 h-5 w-5 accent-[var(--accent)]"
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, emailConfirmation: event.target.checked }))
                }
                type="checkbox"
              />
            </label>

            <label className="block rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <span className={labelClass}>{copy.sessionTimeout}</span>
              <input
                className={`${inputClass} mt-2 bg-white text-slate-700`}
                min={5}
                max={480}
                type="number"
                value={draft.sessionTimeoutMinutes}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    sessionTimeoutMinutes: Number(event.target.value || previous.sessionTimeoutMinutes),
                  }))
                }
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Bell className="h-4 w-4 text-[var(--accent-cool)]" />
            {copy.notifications}
          </div>
          <div className="mt-4 space-y-3">
            <label className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{copy.orderAlerts}</p>
                <p className="text-xs text-slate-500">{copy.orderAlertsHelp}</p>
              </div>
              <input
                checked={draft.orderAlerts}
                className="mt-1 h-5 w-5 accent-[var(--accent)]"
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, orderAlerts: event.target.checked }))
                }
                type="checkbox"
              />
            </label>

            <label className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{copy.inventoryAlerts}</p>
                <p className="text-xs text-slate-500">{copy.inventoryAlertsHelp}</p>
              </div>
              <input
                checked={draft.inventoryAlerts}
                className="mt-1 h-5 w-5 accent-[var(--accent)]"
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, inventoryAlerts: event.target.checked }))
                }
                type="checkbox"
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Wallet className="h-4 w-4 text-[var(--accent)]" />
            {copy.sepay}
          </div>
          <div className="mt-4 space-y-3">
            <label className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <span className="text-sm font-semibold text-slate-900">{copy.enabled}</span>
              <input
                checked={draft.sepay.enabled}
                className="mt-1 h-5 w-5 accent-[var(--accent)]"
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    sepay: { ...previous.sepay, enabled: event.target.checked },
                  }))
                }
                type="checkbox"
              />
            </label>
            <label className="block rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <span className={labelClass}>{copy.webhookToken}</span>
              <input
                className={`${inputClass} mt-2 bg-white text-slate-700`}
                value={draft.sepay.webhookToken}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    sepay: { ...previous.sepay, webhookToken: event.target.value },
                  }))
                }
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
                <span className={labelClass}>{copy.bankName}</span>
                <input
                  className={`${inputClass} mt-2 bg-white text-slate-700`}
                  value={draft.sepay.bankName}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      sepay: { ...previous.sepay, bankName: event.target.value },
                    }))
                  }
                />
              </label>
              <label className="block rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
                <span className={labelClass}>{copy.accountNumber}</span>
                <input
                  className={`${inputClass} mt-2 bg-white text-slate-700`}
                  value={draft.sepay.accountNumber}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      sepay: { ...previous.sepay, accountNumber: event.target.value },
                    }))
                  }
                />
              </label>
            </div>
            <label className="block rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <span className={labelClass}>{copy.accountHolder}</span>
              <input
                className={`${inputClass} mt-2 bg-white text-slate-700`}
                value={draft.sepay.accountHolder}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    sepay: { ...previous.sepay, accountHolder: event.target.value },
                  }))
                }
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Mail className="h-4 w-4 text-[var(--accent-cool)]" />
            {copy.email}
          </div>
          <div className="mt-4 space-y-3">
            <label className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <span className="text-sm font-semibold text-slate-900">{copy.enabled}</span>
              <input
                checked={draft.emailSettings.enabled}
                className="mt-1 h-5 w-5 accent-[var(--accent)]"
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    emailSettings: { ...previous.emailSettings, enabled: event.target.checked },
                  }))
                }
                type="checkbox"
              />
            </label>
            <label className="block rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <span className={labelClass}>{copy.fromEmail}</span>
              <input
                className={`${inputClass} mt-2 bg-white text-slate-700`}
                type="email"
                value={draft.emailSettings.from}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    emailSettings: { ...previous.emailSettings, from: event.target.value },
                  }))
                }
              />
            </label>
            <label className="block rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <span className={labelClass}>{copy.fromName}</span>
              <input
                className={`${inputClass} mt-2 bg-white text-slate-700`}
                value={draft.emailSettings.fromName}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    emailSettings: { ...previous.emailSettings, fromName: event.target.value },
                  }))
                }
              />
            </label>
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Shield className="h-4 w-4 text-[var(--accent-strong)]" />
          {copy.rateLimit}
        </div>
        <div className="mt-4 space-y-3">
          <label className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
            <span className="text-sm font-semibold text-slate-900">{copy.enabled}</span>
            <input
              checked={draft.rateLimitOverrides.enabled}
              className="mt-1 h-5 w-5 accent-[var(--accent)]"
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  rateLimitOverrides: { ...previous.rateLimitOverrides, enabled: event.target.checked },
                }))
              }
              type="checkbox"
            />
          </label>
          {([
            ['auth', copy.auth],
            ['passwordReset', copy.passwordReset],
            ['warrantyLookup', copy.warrantyLookup],
            ['upload', copy.upload],
            ['webhook', copy.webhook],
          ] as Array<[RateLimitBucketKey, string]>).map(([bucket, label]) => (
            <div key={bucket} className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{label}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="space-y-2">
                  <span className={labelClass}>{copy.requests}</span>
                  <input
                    className={inputClass}
                    min={1}
                    type="number"
                    value={draft.rateLimitOverrides[bucket].requests}
                    onChange={(event) => updateBucket(bucket, 'requests', Number(event.target.value || 1))}
                  />
                </label>
                <label className="space-y-2">
                  <span className={labelClass}>{copy.windowSeconds}</span>
                  <input
                    className={inputClass}
                    min={1}
                    type="number"
                    value={draft.rateLimitOverrides[bucket].windowSeconds}
                    onChange={(event) => updateBucket(bucket, 'windowSeconds', Number(event.target.value || 1))}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PagePanel>
  )
}

export default SettingsPage
