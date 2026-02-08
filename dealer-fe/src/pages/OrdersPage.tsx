import { formatCurrency } from '../lib/format'
import { useLanguage } from '../context/LanguageContext'

const ORDERS = [
  {
    id: 'DH-202602-2401',
    date: '2026-02-05T09:15:00',
    status: 'shipping',
    total: 74800000,
    items: 24,
  },
  {
    id: 'DH-202602-2366',
    date: '2026-02-04T14:40:00',
    status: 'processing',
    total: 46200000,
    items: 16,
  },
  {
    id: 'DH-202602-2309',
    date: '2026-02-01T10:05:00',
    status: 'completed',
    total: 58900000,
    items: 20,
  },
  {
    id: 'DH-202601-2180',
    date: '2026-01-26T16:30:00',
    status: 'completed',
    total: 32400000,
    items: 11,
  },
  {
    id: 'DH-202601-2055',
    date: '2026-01-18T11:22:00',
    status: 'cancelled',
    total: 12800000,
    items: 4,
  },
]

const statusClass = (status: string) => {
  switch (status) {
    case 'shipping':
      return 'bg-blue-100 text-blue-700'
    case 'processing':
      return 'bg-amber-100 text-amber-700'
    case 'completed':
      return 'bg-emerald-100 text-emerald-700'
    case 'cancelled':
      return 'bg-rose-100 text-rose-700'
    default:
      return 'bg-ink/10 text-ink-soft'
  }
}

const OrdersPage = () => {
  const { t, language } = useLanguage()
  const locale = language === 'vi' ? 'vi-VN' : 'en-US'
  const statusLabels = {
    shipping: t('orders.statusShipping'),
    processing: t('orders.statusProcessing'),
    completed: t('orders.statusCompleted'),
    cancelled: t('orders.statusCancelled'),
  }

  return (
    <section className="flex min-h-0 flex-col rounded-[28px] border border-line bg-white/90 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div>
          <h2 className="font-display text-lg text-ink">{t('orders.title')}</h2>
          <p className="text-sm text-ink-soft">
            {t('orders.subtitle')}
          </p>
        </div>
        <button className="btn-secondary rounded-full px-3 py-1 text-xs">
          {t('orders.exportReport')}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto px-6 py-5">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-ink-muted">
            <tr>
              <th className="pb-3">{t('orders.id')}</th>
              <th className="pb-3">{t('orders.date')}</th>
              <th className="pb-3">{t('orders.products')}</th>
              <th className="pb-3">{t('orders.status')}</th>
              <th className="pb-3 text-right">{t('orders.total')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {ORDERS.map((order) => (
              <tr key={order.id} className="text-sm text-ink">
                <td className="py-4 font-semibold text-ink">{order.id}</td>
                <td className="py-4 text-ink-soft">
                  {new Date(order.date).toLocaleString(locale)}
                </td>
                <td className="py-4 text-ink-soft">
                  {t('orders.itemsLabel', { count: order.items })}
                </td>
                <td className="py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                      order.status,
                    )}`}
                  >
                    {statusLabels[order.status as keyof typeof statusLabels] ??
                      order.status}
                  </span>
                </td>
                <td className="py-4 text-right font-semibold text-ink">
                  {formatCurrency(order.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default OrdersPage
