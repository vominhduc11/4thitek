import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { formatCurrency } from '../lib/format'
import { useShop } from '../store/shopContext'

const CartPage = () => {
  const {
    displayItems,
    updateQuantity,
    removeItem,
    placeOrder,
    clearCart,
    isLocked,
    order,
    note,
    setNote,
    summary,
  } = useShop()
  const { t } = useLanguage()

  return (
    <section className="flex min-h-0 flex-col rounded-[28px] border border-line bg-white/90 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div>
          <h2 className="font-display text-lg text-ink">{t('cart.title')}</h2>
          <p className="text-sm text-ink-soft">
            {t('cart.subtitle')}
          </p>
        </div>
        <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold text-ink-soft">
          {t('cart.itemsCount', { count: displayItems.length })}
        </span>
      </div>

      {order && (
        <div className="border-b border-line bg-brand/10 px-6 py-3 text-sm text-brand">
          {t('cart.createdOrder')}{' '}
          <Link className="font-semibold underline" to="/checkout">
            {t('nav.checkout')}
          </Link>
          .
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {displayItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white/60 px-4 py-6 text-center text-sm text-ink-soft">
            <p className="font-semibold text-ink">{t('cart.emptyTitle')}</p>
            <p className="mt-2 text-sm text-ink-soft">{t('cart.emptySubtitle')}</p>
          </div>
        ) : (
          displayItems.map((item) => {
            const lineTotal = item.quantity * item.product.unitPrice
            return (
              <div
                key={item.product.id}
                className="rounded-2xl border border-line bg-white/80 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">{item.product.name}</p>
                    <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">
                      {item.product.sku} - {item.product.category}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {t('cart.unitPrice')}: {formatCurrency(item.product.unitPrice)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="h-8 w-8 rounded-full border border-line text-sm font-semibold text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                        disabled={isLocked || item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="min-w-[32px] text-center text-sm font-semibold text-ink">
                        {item.quantity}
                      </span>
                      <button
                        className="h-8 w-8 rounded-full border border-line text-sm font-semibold text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                        disabled={isLocked}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="text-xs font-semibold text-ink-soft transition hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => removeItem(item.product.id)}
                      disabled={isLocked}
                    >
                      {t('cart.remove')}
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{t('cart.lineTotal')}</span>
                  <span className="font-semibold text-ink">
                    {formatCurrency(lineTotal)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="space-y-4 border-t border-line px-6 py-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 text-ink-soft">
          <span>{t('summary.subtotal')}</span>
          <span className="font-semibold text-ink">
            {formatCurrency(summary.subtotal)}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-ink-soft">
          <span>{t('summary.discount')}</span>
          <span className="font-semibold text-brand">
            -{formatCurrency(summary.discount)}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-base font-semibold text-ink">
          <span>{t('cart.total')}</span>
          <span>{formatCurrency(summary.total)}</span>
        </div>

        <textarea
          className="min-h-[88px] w-full rounded-2xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:bg-white"
          placeholder={t('cart.notePlaceholder')}
          aria-label={t('cart.noteLabel')}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={isLocked}
        />

        <div className="flex flex-wrap gap-2">
          <button
            className="btn-primary rounded-full px-4 py-2 text-sm"
            onClick={placeOrder}
            disabled={displayItems.length === 0 || isLocked}
          >
            {t('cart.createOrder')}
          </button>
          <button
            className="btn-secondary rounded-full px-4 py-2 text-sm"
            onClick={clearCart}
            disabled={displayItems.length === 0 || isLocked}
          >
            {t('cart.clearCart')}
          </button>
        </div>
      </div>
    </section>
  )
}

export default CartPage
