import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { formatCurrency } from '../lib/format'
import { useShop } from '../store/shopContext'

const DashboardPage = () => {
  const { summary, totalQuantity } = useShop()
  const { t } = useLanguage()
  const ruleKey = summary.ruleId ? `discountRules.${summary.ruleId}` : ''
  const translatedRule = ruleKey ? t(ruleKey) : ''
  const ruleLabel =
    ruleKey && translatedRule !== ruleKey ? translatedRule : summary.label
  const statusLabels = {
    shipping: t('dashboard.statusShipping'),
    processing: t('dashboard.statusProcessing'),
    completed: t('dashboard.statusCompleted'),
  }

  return (
    <section className="flex min-h-0 flex-col gap-6">
      <div className="rounded-[28px] bg-[linear-gradient(120deg,#1E3A8A,#2563EB_55%,#1E40AF)] p-6 text-white shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              {t('dashboard.promoLabel')}
            </p>
            <h2 className="font-display text-2xl leading-tight sm:text-3xl">
              {t('dashboard.promoTitle')}
            </h2>
            <p className="text-sm text-white/75">
              {t('dashboard.promoSubtitle')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/products"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
              >
                {t('dashboard.viewProducts')}
              </Link>
              <Link
                to="/cart"
                className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                {t('dashboard.createOrder')}
              </Link>
            </div>
          </div>
          <div className="grid w-full max-w-md grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                {t('dashboard.statCartValue')}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatCurrency(summary.total)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                {t('dashboard.statProducts')}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {totalQuantity}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                {t('dashboard.statDiscount')}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatCurrency(summary.discount)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                {t('dashboard.statTier')}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {t('dashboard.tierValue')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-line bg-white/90 p-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">
            {t('dashboard.ordersThisMonth')}
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">18</p>
          <p className="mt-1 text-sm text-ink-soft">
            {t('dashboard.ordersDelta')}
          </p>
        </div>
        <div className="rounded-[24px] border border-line bg-white/90 p-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">
            {t('dashboard.revenueEstimate')}
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {formatCurrency(328000000)}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {t('dashboard.revenueUpdated')}
          </p>
        </div>
        <div className="rounded-[24px] border border-line bg-white/90 p-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">
            {t('dashboard.discountRate')}
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {summary.percent || 0}%
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {summary.ruleId ? ruleLabel : t('summary.notEligible')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-line bg-white/90 p-6 shadow-card">
          <h3 className="font-display text-lg text-ink">{t('dashboard.recentOrdersTitle')}</h3>
          <p className="text-sm text-ink-soft">
            {t('dashboard.recentOrdersSubtitle')}
          </p>
          <div className="mt-4 space-y-3">
            {[
              { id: 'DH-202602-2310', status: 'shipping', total: 64200000 },
              { id: 'DH-202602-2189', status: 'processing', total: 38400000 },
              { id: 'DH-202601-2042', status: 'completed', total: 51800000 },
            ].map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-2xl border border-line/60 bg-white/70 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-ink">{order.id}</p>
                  <p className="text-xs text-ink-soft">
                    {statusLabels[order.status as keyof typeof statusLabels] ??
                      order.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">
                    {formatCurrency(order.total)}
                  </p>
                  <Link
                    to="/orders"
                    className="text-xs font-semibold text-brand hover:text-brand-dark"
                  >
                    {t('dashboard.viewDetail')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-[28px] border border-line bg-white/90 p-6 shadow-card">
            <h3 className="font-display text-lg text-ink">{t('dashboard.tasksTitle')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
                {t('dashboard.task1')}
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
                {t('dashboard.task2')}
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
                {t('dashboard.task3')}
              </li>
            </ul>
            <Link
              to="/support"
              className="btn-secondary mt-5 inline-flex rounded-full px-4 py-2 text-xs"
            >
              {t('dashboard.contactSupport')}
            </Link>
          </div>

          <div className="rounded-[28px] border border-line bg-white/90 p-6 shadow-card">
            <h3 className="font-display text-lg text-ink">{t('dashboard.reportsTitle')}</h3>
            <p className="mt-2 text-sm text-ink-soft">
              {t('dashboard.reportsSubtitle')}
            </p>
            <Link
              to="/reports"
              className="btn-primary mt-4 inline-flex rounded-full px-4 py-2 text-xs"
            >
              {t('dashboard.reportsCta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DashboardPage
