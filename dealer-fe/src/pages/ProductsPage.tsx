import { PRODUCTS } from '../data/products'
import { useLanguage } from '../context/LanguageContext'
import { formatCurrency } from '../lib/format'
import { useShop } from '../store/shopContext'

const ProductsPage = () => {
  const { cartLookup, addToCart, isLocked } = useShop()
  const { t } = useLanguage()

  return (
    <section className="flex min-h-0 flex-col rounded-[28px] border border-line bg-white/85 shadow-card backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div>
          <h2 className="font-display text-lg text-ink">{t('products.title')}</h2>
          <p className="text-sm text-ink-soft">
            {t('products.subtitle')}
          </p>
        </div>
        <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
          {t('products.demoBadge')}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PRODUCTS.map((product) => {
            const currentQty = cartLookup.get(product.id) ?? 0
            const initials = product.name
              .split(' ')
              .slice(0, 2)
              .map((word) => word[0])
              .join('')
            return (
              <div
                key={product.id}
                className="flex flex-col gap-4 rounded-2xl border border-line bg-white/80 p-4 shadow-[0_12px_30px_rgba(15,30,45,0.12)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.18em] text-ink-soft">
                    {product.category}
                  </span>
                  <span className="rounded-full bg-ink/10 px-2.5 py-1 text-xs font-semibold text-ink">
                    {product.sku}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563EB,#1E3A8A)] text-lg font-semibold text-white">
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-ink">
                      {product.name}
                    </h3>
                    <p className="text-xs text-ink-soft">
                      {t('products.packLabel')}: {product.packSize}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-ink-soft">
                  <span>{t('products.pricePerUnit', { unit: product.unitLabel })}</span>
                  <span className="font-semibold text-ink">
                    {formatCurrency(product.unitPrice)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-ink-soft">
                  <span>{t('products.stockLabel', { stock: product.stock })}</span>
                  <span>
                    {t('products.minOrderLabel', {
                      min: product.minOrder,
                      unit: product.unitLabel,
                    })}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <button
                    className="btn-secondary rounded-full px-3 py-1 text-xs"
                    onClick={() => addToCart(product, product.minOrder)}
                    disabled={isLocked}
                  >
                    {t('products.addQty', { qty: product.minOrder })}
                  </button>
                  <button
                    className="btn-primary rounded-full px-3 py-1 text-xs"
                    onClick={() => addToCart(product, 1)}
                    disabled={isLocked}
                  >
                    {t('products.addQty', { qty: 1 })}
                  </button>
                  {currentQty > 0 && (
                    <span className="text-xs text-ink-soft">
                      {t('products.inCart', { qty: currentQty })}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ProductsPage
