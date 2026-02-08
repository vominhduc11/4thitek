import {
  CheckCircle,
  Clock,
  Plus,
  Search,
  SlidersHorizontal,
  Tag,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const discountRules = [
  {
    id: 'WS-2026-01',
    label: 'Đơn từ 50 triệu',
    range: '50 - 100 triệu',
    percent: 3,
    status: 'Đang hoạt động',
    updated: '3 ngày trước',
  },
  {
    id: 'WS-2026-02',
    label: 'Đơn từ 100 triệu',
    range: '100 - 200 triệu',
    percent: 5,
    status: 'Đang hoạt động',
    updated: '1 tuần trước',
  },
  {
    id: 'WS-2026-03',
    label: 'Đơn từ 200 triệu',
    range: '>= 200 triệu',
    percent: 7,
    status: 'Chờ duyệt',
    updated: 'Hôm qua',
  },
  {
    id: 'WS-2026-Q2',
    label: 'Chương trình Q2',
    range: 'Áp dụng theo chiến dịch',
    percent: 2,
    status: 'Bản nháp',
    updated: 'Hôm nay',
  },
]

function WholesaleDiscountsPage() {
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
            {t('Chiết khấu bán sỉ')}
          </h3>
          <p className="text-sm text-slate-500">
            {t('Quản lý quy tắc chiết khấu bán sỉ theo ngưỡng doanh số.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-56 rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus:outline-none"
              placeholder={t('Tìm quy tắc...')}
              type="search"
            />
          </label>
          <button className={ghostButtonClass} type="button">
            <SlidersHorizontal className="h-4 w-4" />
            {t('Bộ lọc')}
          </button>
          <button className={ghostButtonClass} type="button">
            <Plus className="h-4 w-4" />
            {t('Thêm quy tắc')}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {t('Đang hoạt động')}
            </span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">2</p>
          <p className="text-xs text-slate-500">{t('Cập nhật gần đây')}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {t('Chờ duyệt')}
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">1</p>
          <p className="text-xs text-slate-500">{t('Cần phê duyệt')}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {t('Doanh số áp dụng')}
            </span>
            <Tag className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            200 triệu
          </p>
          <p className="text-xs text-slate-500">{t('Ngưỡng cao nhất')}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="hidden grid-cols-[1.2fr_0.9fr_0.6fr_0.7fr_0.7fr] gap-3 text-xs uppercase tracking-[0.2em] text-slate-400 md:grid">
          <span>{t('Quy tắc')}</span>
          <span>{t('Ngưỡng')}</span>
          <span>{t('Chiết khấu')}</span>
          <span>{t('Trạng thái')}</span>
          <span>{t('Cập nhật')}</span>
        </div>
        {discountRules.map((rule) => (
          <div
            className="grid gap-3 rounded-3xl border border-slate-200/70 bg-white/80 px-4 py-4 text-sm text-slate-700 shadow-sm backdrop-blur md:grid-cols-[1.2fr_0.9fr_0.6fr_0.7fr_0.7fr] md:items-center"
            key={rule.id}
          >
            <div>
            <p className="font-semibold text-slate-900">{t(rule.label)}</p>
              <p className="text-xs text-slate-500">{rule.id}</p>
            </div>
            <span className="text-slate-500">{t(rule.range)}</span>
            <span className="font-semibold text-[var(--accent)]">
              {rule.percent}%
            </span>
            <span
              className={
                rule.status === 'Đang hoạt động'
                  ? 'inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700'
                  : rule.status === 'Chờ duyệt'
                    ? 'inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700'
                  : 'inline-flex items-center gap-2 rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-slate-700'
              }
            >
              {rule.status === 'Đang hoạt động' ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <Clock className="h-3.5 w-3.5" />
              )}
              {t(rule.status)}
            </span>
            <span className="text-slate-500">{t(rule.updated)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default WholesaleDiscountsPage
