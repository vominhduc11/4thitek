import { formatCurrency } from '../lib/format'
import { useShop } from '../store/shopContext'
import { useLanguage } from '../context/LanguageContext'

const SummaryPanel = () => {
  const { summary, totalQuantity, order } = useShop()
  const { t } = useLanguage()
  const ruleKey = summary.ruleId ? `discountRules.${summary.ruleId}` : ''
  const translatedRule = ruleKey ? t(ruleKey) : ''
  const ruleLabel =
    ruleKey && translatedRule !== ruleKey ? translatedRule : summary.label

  return (
    <section className="flex flex-col gap-3 rounded-[28px] border border-line bg-white/90 p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-ink">{t('summary.title')}</h3>
          <p className="text-sm text-ink-soft">
            {t('summary.subtitle')}
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

      <div className="rounded-2xl border border-line/60 bg-white/70 p-4 text-sm">
        <div className="flex items-center justify-between text-ink-soft">
          <span>{t('summary.cartQty')}</span>
          <span className="font-semibold text-ink">{totalQuantity}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-ink-soft">
          <span>{t('summary.subtotal')}</span>
          <span className="font-semibold text-ink">
            {formatCurrency(summary.subtotal)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-ink-soft">
          <span>{t('summary.discount')}</span>
          <span className="font-semibold text-brand">
            -{formatCurrency(summary.discount)}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-base font-semibold text-ink">
          <span>{t('summary.total')}</span>
          <span>{formatCurrency(summary.total)}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-line bg-white/70 px-4 py-3 text-xs text-ink-soft">
        {summary.percent > 0 ? (
          <span>
            {t('summary.applying')}{' '}
            <strong className="text-ink">{ruleLabel}</strong>
          </span>
        ) : (
          <span>{t('summary.notEligible')}</span>
        )}
      </div>
    </section>
  )
}

export default SummaryPanel
