import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { formatCurrency } from '../lib/format'
import { useShop } from '../store/shopContext'

const CheckoutPage = () => {
  const { order, paymentStatus, payOrder, startNewOrder, summary } = useShop()
  const { t, language } = useLanguage()
  const locale = language === 'vi' ? 'vi-VN' : 'en-US'

  return (
    <section className="flex flex-col gap-4 rounded-[28px] border border-line bg-white/90 p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-ink">{t('checkout.title')}</h2>
          <p className="text-sm text-ink-soft">
            {t('checkout.subtitle')}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            order ? 'bg-brand/10 text-brand' : 'bg-ink/10 text-ink-soft'
          }`}
        >
          {order ? t('summary.orderReady') : t('summary.orderPending')}
        </span>
      </div>

      {!order ? (
        <div className="rounded-2xl border border-dashed border-line bg-white/70 px-4 py-5 text-sm text-ink-soft">
          {t('checkout.hint')}{' '}
          <Link className="font-semibold text-brand underline" to="/cart">
            {t('checkout.linkCart')}
          </Link>
          .
        </div>
      ) : (
        <div className="rounded-2xl border border-line/60 bg-white/70 p-4 text-sm">
          <div className="flex items-center justify-between text-ink-soft">
            <span>{t('checkout.orderId')}</span>
            <span className="font-semibold text-ink">{order.id}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-ink-soft">
            <span>{t('checkout.createdAt')}</span>
            <span className="font-semibold text-ink">
              {new Date(order.createdAt).toLocaleString(locale)}
            </span>
          </div>
          {order.note && (
            <div className="mt-2 text-ink-soft">
              <span>{t('checkout.noteLabel')}:</span>{' '}
              <span className="font-semibold text-ink">{order.note}</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between text-ink-soft">
          <span>{t('checkout.subtotal')}</span>
          <span>{formatCurrency(summary.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-ink-soft">
          <span>{t('checkout.discount')}</span>
          <span className="font-semibold text-brand">
            -{formatCurrency(summary.discount)}
          </span>
        </div>
        <div className="flex items-center justify-between text-base font-semibold text-ink">
          <span>{t('checkout.total')}</span>
          <span>{formatCurrency(summary.total)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="btn-primary rounded-full px-4 py-2 text-sm"
          onClick={payOrder}
          disabled={!order || paymentStatus === 'success'}
        >
          {paymentStatus === 'success' ? t('checkout.paid') : t('checkout.pay')}
        </button>
        {order && (
          <button
            className="btn-secondary rounded-full px-4 py-2 text-sm"
            onClick={startNewOrder}
          >
            {t('checkout.startNew')}
          </button>
        )}
      </div>

      {paymentStatus === 'success' && (
        <div className="rounded-2xl bg-brand/10 px-4 py-3 text-sm text-brand">
          {t('checkout.success')}{' '}
          <strong>{formatCurrency(summary.total)}</strong>
        </div>
      )}
    </section>
  )
}

export default CheckoutPage
