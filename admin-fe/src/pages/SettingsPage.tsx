import { Bell, Save, Shield } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAdminData } from '../context/AdminDataContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { ErrorState, GhostButton, LoadingRows, PagePanel, PrimaryButton, inputClass } from '../components/ui-kit'

function SettingsPage() {
  const {
    settings,
    settingsState,
    isSettingsLoading,
    isSettingsSaving,
    updateSettings,
    reloadResource,
  } = useAdminData()
  const { t } = useLanguage()
  const { notify } = useToast()
  const [draft, setDraft] = useState(settings)
  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings), [draft, settings])

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  if (isSettingsLoading) {
    return (
      <PagePanel>
        <LoadingRows rows={4} />
      </PagePanel>
    )
  }

  if (settingsState.status === 'error') {
    return (
      <PagePanel>
        <ErrorState
          title={t('Không thể tải cài đặt')}
          message={settingsState.error || t('Không tải được cài đặt')}
          onRetry={() => void reloadResource('settings')}
        />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{t('Cài đặt')}</h3>
          <p className="text-sm text-slate-500">
            {t('Cấu hình bảo mật, thông báo và chính sách mặc định.')}
          </p>
        </div>
        <PrimaryButton
          disabled={isSettingsSaving || !isDirty}
          icon={<Save className="h-4 w-4" />}
          onClick={async () => {
            try {
              await updateSettings(draft)
              notify(t('Đã lưu cài đặt hệ thống'), { title: 'Settings', variant: 'success' })
            } catch (error) {
              notify(error instanceof Error ? error.message : t('Không lưu được cài đặt'), {
                title: 'Settings',
                variant: 'error',
              })
            }
          }}
          type="button"
        >
          {isSettingsSaving ? t('Đang lưu...') : t('Lưu thay đổi')}
        </PrimaryButton>
        {isDirty ? (
          <GhostButton onClick={() => setDraft(settings)} type="button">
            {t('Hoàn tác thay đổi')}
          </GhostButton>
        ) : null}
      </div>

      {isDirty ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="status">
          {t('Bạn có thay đổi chưa lưu trong cài đặt hệ thống.')}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Shield className="h-4 w-4 text-[var(--accent-strong)]" />
            {t('Bảo mật')}
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{t('Xác nhận email')}</p>
                <p className="text-xs text-slate-500">
                  {t('Yêu cầu admin xác nhận đăng nhập qua email.')}
                </p>
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

            <label className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{t('Hết phiên đăng nhập')}</p>
                <p className="text-xs text-slate-500">{t('Tự động đăng xuất sau {n} phút.', { n: draft.sessionTimeoutMinutes })}</p>
              </div>
              <select
                aria-label="Session timeout"
                className={`${inputClass} min-h-11 bg-white text-slate-700`}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    sessionTimeoutMinutes: Number(event.target.value),
                  }))
                }
                value={draft.sessionTimeoutMinutes}
              >
                <option value={15}>{t('{n} phút', { n: 15 })}</option>
                <option value={30}>{t('{n} phút', { n: 30 })}</option>
                <option value={45}>{t('{n} phút', { n: 45 })}</option>
                <option value={60}>{t('{n} phút', { n: 60 })}</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Bell className="h-4 w-4 text-[var(--accent-cool)]" />
            {t('Thông báo')}
          </div>
          <div className="mt-4 space-y-3">
            <label className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{t('Cảnh báo đơn hàng')}</p>
                <p className="text-xs text-slate-500">{t('Thông báo khi có đơn hàng giá trị cao.')}</p>
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
                <p className="text-sm font-semibold text-slate-900">{t('Cảnh báo tồn kho')}</p>
                <p className="text-xs text-slate-500">{t('Gửi thông báo khi tồn kho thấp.')}</p>
              </div>
              <input
                checked={draft.inventoryAlerts}
                className="mt-1 h-5 w-5 accent-[var(--accent)]"
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    inventoryAlerts: event.target.checked,
                  }))
                }
                type="checkbox"
              />
            </label>
          </div>
        </section>
      </div>
    </PagePanel>
  )
}

export default SettingsPage
