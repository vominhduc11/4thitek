import { Bell, Save, Shield } from 'lucide-react'

function SettingsPage() {
  const panelClass =
    'rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]'
  const ghostButtonClass =
    'inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_26px_rgba(15,23,42,0.12)]'

  return (
    <section className={`${panelClass} animate-card-enter`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Settings</h3>
          <p className="text-sm text-slate-500">
            Configure security, notifications, and default policies.
          </p>
        </div>
        <button className={ghostButtonClass} type="button">
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Shield className="h-4 w-4 text-[var(--accent-strong)]" />
            Security
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Email confirmation
                </p>
                <p className="text-xs text-slate-500">
                  Require admins to confirm sign-ins via email.
                </p>
              </div>
              <button className={ghostButtonClass} type="button">
                Configure
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Session timeout
                </p>
                <p className="text-xs text-slate-500">
                  Auto logout after 30 minutes.
                </p>
              </div>
              <button className={ghostButtonClass} type="button">
                Adjust
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Bell className="h-4 w-4 text-[var(--accent-cool)]" />
            Notifications
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Order alerts
                </p>
                <p className="text-xs text-slate-500">
                  Notify when high value orders arrive.
                </p>
              </div>
              <button className={ghostButtonClass} type="button">
                Edit
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Inventory warnings
                </p>
                <p className="text-xs text-slate-500">
                  Send alerts when stock falls below threshold.
                </p>
              </div>
              <button className={ghostButtonClass} type="button">
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SettingsPage
