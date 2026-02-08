import { CheckCircle, Clock, Plus, Search, Truck } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const orders = [
  {
    id: '#SO-2408',
    status: 'Đóng gói',
    customer: 'Đại lý An Phát',
    total: 38900000,
  },
  {
    id: '#SO-2409',
    status: 'Chờ xử lý',
    customer: 'Audio Minh Long',
    total: 21450000,
  },
  {
    id: '#SO-2410',
    status: 'Đang giao',
    customer: 'SCS Hà Nội',
    total: 56800000,
  },
  {
    id: '#SO-2411',
    status: 'Đang giao',
    customer: 'Hoàng Gia Media',
    total: 27900000,
  },
]

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const formatCurrency = (value: number) => currencyFormatter.format(value)

function OrdersPage() {
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
            {t('Đơn hàng')}
          </h3>
          <p className="text-sm text-slate-500">
            {t('Theo dõi xử lý đơn và ưu tiên giao hàng.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-48 rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus:outline-none"
              placeholder={t('Tìm mã đơn...')}
              type="search"
            />
          </label>
          <button className={ghostButtonClass} type="button">
            <Plus className="h-4 w-4" />
            {t('Tạo đơn')}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="hidden grid-cols-[1.1fr_1fr_1.2fr_0.8fr] gap-3 text-xs uppercase tracking-[0.2em] text-slate-400 md:grid">
          <span>{t('Đơn hàng')}</span>
          <span>{t('Trạng thái')}</span>
          <span>{t('Khách hàng')}</span>
          <span>{t('Tổng')}</span>
        </div>
        {orders.map((order) => (
          <div
            className="grid gap-3 rounded-3xl border border-slate-200/70 bg-white/80 px-4 py-4 text-sm text-slate-700 shadow-sm backdrop-blur md:grid-cols-[1.1fr_1fr_1.2fr_0.8fr] md:items-center"
            key={order.id}
          >
            <span className="font-semibold text-slate-900">{order.id}</span>
            <span
              className={
                order.status === 'Đóng gói'
                  ? 'inline-flex items-center gap-2 rounded-full bg-[var(--accent-cool-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-cool)]'
                  : order.status === 'Chờ xử lý'
                    ? 'inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700'
                    : 'inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700'
              }
            >
              {order.status === 'Đóng gói' ? (
                <CheckCircle className="h-4 w-4" />
              ) : order.status === 'Chờ xử lý' ? (
                <Clock className="h-4 w-4" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              {t(order.status)}
            </span>
            <span>{order.customer}</span>
            <span className="font-semibold text-[var(--accent)]">
              {formatCurrency(order.total)}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default OrdersPage
