import { Bell, Save, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAdminData } from '../context/AdminDataContext'
import { useToast } from '../context/ToastContext'
import { ErrorState, LoadingRows, PagePanel, PrimaryButton } from '../components/ui-kit'

function SettingsPage() {
  const {
    settings,
    settingsState,
    isSettingsLoading,
    isSettingsSaving,
    updateSettings,
    reloadResource,
  } = useAdminData()
  const { notify } = useToast()
  const [draft, setDraft] = useState(settings)

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
          title="Khong the tai cai dat"
          message={settingsState.error || 'Khong tai duoc cai dat'}
          onRetry={() => void reloadResource('settings')}
        />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Cai dat</h3>
          <p className="text-sm text-slate-500">
            Cau hinh bao mat, thong bao va chinh sach mac dinh.
          </p>
        </div>
        <PrimaryButton
          disabled={isSettingsSaving}
          icon={<Save className="h-4 w-4" />}
          onClick={async () => {
            try {
              await updateSettings(draft)
              notify('Da luu cai dat he thong', { title: 'Settings', variant: 'success' })
            } catch (error) {
              notify(error instanceof Error ? error.message : 'Khong luu duoc cai dat', {
                title: 'Settings',
                variant: 'error',
              })
            }
          }}
          type="button"
        >
          {isSettingsSaving ? 'Dang luu...' : 'Luu thay doi'}
        </PrimaryButton>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Shield className="h-4 w-4 text-[var(--accent-strong)]" />
            Bao mat
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Xac nhan email</p>
                <p className="text-xs text-slate-500">
                  Yeu cau admin xac nhan dang nhap qua email.
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
                <p className="text-sm font-semibold text-slate-900">Het phien dang nhap</p>
                <p className="text-xs text-slate-500">Tu dong dang xuat sau so phut cau hinh.</p>
              </div>
              <select
                aria-label="Session timeout"
                className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    sessionTimeoutMinutes: Number(event.target.value),
                  }))
                }
                value={draft.sessionTimeoutMinutes}
              >
                <option value={15}>15 phut</option>
                <option value={30}>30 phut</option>
                <option value={45}>45 phut</option>
                <option value={60}>60 phut</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Bell className="h-4 w-4 text-[var(--accent-cool)]" />
            Thong bao
          </div>
          <div className="mt-4 space-y-3">
            <label className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Canh bao don hang</p>
                <p className="text-xs text-slate-500">Thong bao khi co don hang gia tri cao.</p>
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
                <p className="text-sm font-semibold text-slate-900">Canh bao ton kho</p>
                <p className="text-xs text-slate-500">Gui thong bao khi ton kho thap.</p>
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
