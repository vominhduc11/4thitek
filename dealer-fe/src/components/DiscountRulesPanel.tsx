import { DISCOUNT_RULES } from '../data/discounts'
import { useShop } from '../store/shopContext'
import { useLanguage } from '../context/LanguageContext'

const DiscountRulesPanel = () => {
  const { summary } = useShop()
  const { t } = useLanguage()

  return (
    <section className="rounded-[28px] border border-line bg-white/90 p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-ink">{t('discountRules.title')}</h3>
        <span className="text-xs uppercase tracking-[0.18em] text-ink-soft">
          {t('discountRules.badge')}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        {t('discountRules.subtitle')}
      </p>
      <ul className="mt-4 space-y-2 text-xs">
        {DISCOUNT_RULES.map((rule) => {
          const isActive = summary.ruleId === rule.id
          const translatedLabel = t(`discountRules.${rule.id}`)
          const label =
            translatedLabel !== `discountRules.${rule.id}`
              ? translatedLabel
              : rule.label
          return (
            <li
              key={rule.id}
              className={`flex items-center justify-between rounded-full px-3 py-2 ${
                isActive ? 'bg-brand/10 text-brand' : 'bg-white/70 text-ink-soft'
              }`}
            >
              <span>{label}</span>
              <span className="font-semibold">{rule.percent}%</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default DiscountRulesPanel
