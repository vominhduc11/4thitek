import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { formatCurrency } from '../lib/format'

const ReportsPage = () => {
  const { t } = useLanguage()
  const [range, setRange] = useState('last6')
  const monthLabelText = t('reports.monthLabels')
  const monthLabels =
    monthLabelText === 'reports.monthLabels'
      ? ['T9', 'T10', 'T11', 'T12', 'T1', 'T2']
      : monthLabelText.split(',')
  const rangeLabels: Record<string, string> = {
    thisMonth: t('reports.rangeThisMonth'),
    thisQuarter: t('reports.rangeThisQuarter'),
    last6: t('reports.rangeLast6'),
  }
  const selectedRangeLabel = rangeLabels[range] ?? t('reports.rangeLast6')

  return (
    <section className="flex flex-col gap-6 rounded-[28px] border border-line bg-white/90 p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg text-ink">{t('reports.title')}</h2>
          <p className="text-sm text-ink-soft">
            {t('reports.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
            {t('reports.rangeLabel')}
          </label>
          <select
            className="rounded-full border border-line bg-white/90 px-3 py-2 text-xs font-semibold text-ink"
            value={range}
            onChange={(event) => setRange(event.target.value)}
          >
            <option value="thisMonth">{t('reports.rangeThisMonth')}</option>
            <option value="thisQuarter">{t('reports.rangeThisQuarter')}</option>
            <option value="last6">{t('reports.rangeLast6')}</option>
          </select>
          <button className="btn-secondary rounded-full px-3 py-2 text-xs">
            {t('reports.export')}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white/80 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">
            {t('reports.monthlyRevenue')}
          </p>
          <p className="mt-2 text-xl font-semibold text-ink">
            {formatCurrency(328000000)}
          </p>
          <p className="text-sm text-ink-soft">{t('reports.monthlyRevenueDelta')}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white/80 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">
            {t('reports.appliedDiscount')}
          </p>
          <p className="mt-2 text-xl font-semibold text-ink">
            {formatCurrency(18400000)}
          </p>
          <p className="text-sm text-ink-soft">{t('reports.discountNote')}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white/80 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">
            {t('reports.completedOrders')}
          </p>
          <p className="mt-2 text-xl font-semibold text-ink">92%</p>
          <p className="text-sm text-ink-soft">{t('reports.completedNote')}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-line bg-white/80 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base text-ink">{t('reports.trend')}</h3>
            <span className="text-xs text-ink-soft">{selectedRangeLabel}</span>
          </div>
          <div className="mt-4 flex h-40 items-end gap-3">
            {[45, 62, 58, 80, 72, 90].map((value, index) => (
              <div key={value + index} className="flex-1">
                <div
                  className="rounded-full bg-[linear-gradient(180deg,#2563EB,#1D4ED8)]"
                  style={{ height: `${value}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-6 text-center text-xs text-ink-muted">
            {monthLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white/80 p-5">
          <h3 className="font-display text-base text-ink">{t('reports.topProducts')}</h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-soft">
            <li className="flex items-center justify-between">
              <span>Tai nghe SCS AirBeat Pro ANC</span>
              <span className="font-semibold text-ink">28%</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Tai nghe SCS StudioMax</span>
              <span className="font-semibold text-ink">22%</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Tai nghe SCS GamePulse 7.1</span>
              <span className="font-semibold text-ink">18%</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Tai nghe SCS FitBuds</span>
              <span className="font-semibold text-ink">12%</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export default ReportsPage
