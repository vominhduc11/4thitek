import { CheckCircle, Clock, Search, UserPlus, Users } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const customers = [
  {
    id: 'C-1402',
    name: 'Đại lý SCS Hà Nội',
    tier: 'Bạch kim',
    status: 'Đang hoạt động',
    orders: 32,
    lastOrder: 'Hôm qua',
    revenue: 324800000,
  },
  {
    id: 'C-1411',
    name: 'Audio Minh Long',
    tier: 'Vàng',
    status: 'Đang hoạt động',
    orders: 18,
    lastOrder: '3 ngày trước',
    revenue: 158400000,
  },
  {
    id: 'C-1420',
    name: 'An Phát Retail',
    tier: 'Bạc',
    status: 'Đang xem xét',
    orders: 6,
    lastOrder: '1 tuần trước',
    revenue: 68400000,
  },
  {
    id: 'C-1433',
    name: 'Hoàng Gia Media',
    tier: 'Đồng',
    status: 'Cần chăm sóc',
    orders: 3,
    lastOrder: '21 ngày trước',
    revenue: 21900000,
  },
]

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const formatCurrency = (value: number) => currencyFormatter.format(value)

function CustomersPage() {
  const { t } = useLanguage()
  const panelClass =
    'rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]'
  const ghostButtonClass =
    'btn-stable inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_26px_rgba(15,23,42,0.12)]'

  return (
    <section className={`${panelClass} animate-card-enter`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {t('Khách hàng')}
          </h3>
          <p className="text-sm text-slate-500">
            {t('Quản lý đại lý, hạn mức và trạng thái mua hàng.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-48 rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus:outline-none"
              placeholder={t('Tìm khách hàng...')}
              type="search"
            />
          </label>
          <button className={ghostButtonClass} type="button">
            <UserPlus className="h-4 w-4" />
            {t('Thêm khách hàng')}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {t('Tổng đại lý')}
            </span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">146</p>
          <p className="text-xs text-slate-500">{t('+6 trong 30 ngày')}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {t('Đang hoạt động')}
            </span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">118</p>
          <p className="text-xs text-slate-500">
            {t('87% doanh thu tháng này')}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {t('Cần chăm sóc')}
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">14</p>
          <p className="text-xs text-slate-500">
            {t('Không mua trong 14 ngày')}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="hidden grid-cols-[1.3fr_0.7fr_0.8fr_0.8fr_0.7fr] gap-3 text-xs uppercase tracking-[0.2em] text-slate-400 md:grid">
          <span>{t('Khách hàng')}</span>
          <span>{t('Hạng')}</span>
          <span>{t('Trạng thái')}</span>
          <span>{t('Lần mua gần nhất')}</span>
          <span>{t('Doanh thu')}</span>
        </div>
        {customers.map((customer) => (
          <div
            className="grid gap-3 rounded-3xl border border-slate-200/70 bg-white/80 px-4 py-4 text-sm text-slate-700 shadow-sm backdrop-blur md:grid-cols-[1.3fr_0.7fr_0.8fr_0.8fr_0.7fr] md:items-center"
            key={customer.id}
          >
            <div>
              <p className="font-semibold text-slate-900">{customer.name}</p>
              <p className="text-xs text-slate-500">{customer.id}</p>
            </div>
            <span
              className={
                customer.tier === 'Bạch kim'
                  ? 'inline-flex items-center justify-center rounded-full bg-[var(--accent-cool-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-cool)]'
                  : customer.tier === 'Vàng'
                    ? 'inline-flex items-center justify-center rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700'
                    : customer.tier === 'Bạc'
                      ? 'inline-flex items-center justify-center rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-slate-700'
                      : 'inline-flex items-center justify-center rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-700'
              }
            >
              {t(customer.tier)}
            </span>
            <span
              className={
                customer.status === 'Đang hoạt động'
                  ? 'inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700'
                  : 'inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700'
              }
            >
              {customer.status === 'Đang hoạt động' ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <Clock className="h-3.5 w-3.5" />
              )}
              {t(customer.status)}
            </span>
            <span className="text-slate-500">{t(customer.lastOrder)}</span>
            <div className="text-right font-semibold text-[var(--accent)]">
              {formatCurrency(customer.revenue)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default CustomersPage
