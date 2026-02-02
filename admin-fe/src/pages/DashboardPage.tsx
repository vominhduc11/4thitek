import {
  AlertTriangle,
  Download,
  Package,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react'

function DashboardPage() {
  const panelClass =
    'rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]'
  const statCardClass =
    'group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-white/80 p-5 shadow-[0_16px_30px_rgba(15,23,42,0.06)] backdrop-blur'
  const softCardClass =
    'rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4'

  return (
    <section className={`${panelClass} animate-card-enter`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Dashboard</h3>
          <p className="text-sm text-slate-500">
            Overview of sales, orders, and inventory health.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0"
          type="button"
        >
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className={statCardClass}>
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--accent-soft)] opacity-70 transition group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Today Revenue
                  </p>
                  <h4 className="mt-1 text-2xl font-semibold text-[var(--accent)]">
                    $24,890
                  </h4>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700">
                +12%
              </span>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-slate-200">
              <div className="h-full w-4/5 rounded-full bg-[var(--accent)]" />
            </div>
          </div>
        </div>

        <div className={statCardClass}>
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--accent-cool-soft)] opacity-70 transition group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent-cool-soft)] text-[var(--accent-cool)]">
                  <ShoppingCart className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Orders
                  </p>
                  <h4 className="mt-1 text-2xl font-semibold text-slate-900">
                    184
                  </h4>
                </div>
              </div>
              <span className="rounded-full bg-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-600">
                42 pending
              </span>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-slate-200">
              <div className="h-full w-3/5 rounded-full bg-[var(--accent-cool)]" />
            </div>
          </div>
        </div>

        <div className={statCardClass}>
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-200/50 opacity-70 transition group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-200/60 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Low Stock
                  </p>
                  <h4 className="mt-1 text-2xl font-semibold text-slate-900">
                    9 SKUs
                  </h4>
                </div>
              </div>
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700">
                3 reorder
              </span>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-slate-200">
              <div className="h-full w-2/5 rounded-full bg-amber-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={softCardClass}>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Package className="h-4 w-4 text-[var(--accent-strong)]" />
            Top Products
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {[
              { name: 'SCS Pro Max', units: '1,240 units' },
              { name: 'SCS Lite', units: '980 units' },
              { name: 'SCS Studio', units: '740 units' },
            ].map((item) => (
              <li
                className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white px-4 py-3"
                key={item.name}
              >
                <span>{item.name}</span>
                <span className="text-xs font-semibold text-slate-400">
                  {item.units}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={softCardClass}>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Operations Pulse
          </div>
          <div className="mt-4 space-y-3">
            {[
              { label: 'Shipping SLA', value: '98.4%' },
              { label: 'Support Tickets', value: '12 open' },
              { label: 'Payment Success', value: '99.1%' },
            ].map((item) => (
              <div
                className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm text-slate-600"
                key={item.label}
              >
                <span>{item.label}</span>
                <strong className="text-slate-900">{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default DashboardPage
