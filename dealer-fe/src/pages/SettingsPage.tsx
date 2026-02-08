import { useLanguage } from '../context/LanguageContext'

const SettingsPage = () => {
  const { t } = useLanguage()

  return (
    <section className="flex flex-col gap-6 rounded-[28px] border border-line bg-white/90 p-6 shadow-card">
      <div>
        <h2 className="font-display text-lg text-ink">{t('settings.title')}</h2>
        <p className="text-sm text-ink-soft">
          {t('settings.subtitle')}
        </p>
      </div>

      <form
        className="rounded-2xl border border-line bg-white/80 p-5"
        onSubmit={(event) => event.preventDefault()}
      >
        <h3 className="font-display text-base text-ink">{t('settings.dealerInfo')}</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-ink-soft">
            <span>{t('settings.name')}</span>
            <input
              className="w-full rounded-2xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:bg-white"
              defaultValue="Đại lý Bình Minh"
            />
          </label>
          <label className="space-y-2 text-sm text-ink-soft">
            <span>{t('settings.dealerId')}</span>
            <input
              className="w-full rounded-2xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:bg-white"
              defaultValue="DL-0425"
            />
          </label>
          <label className="space-y-2 text-sm text-ink-soft">
            <span>{t('settings.email')}</span>
            <input
              className="w-full rounded-2xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:bg-white"
              defaultValue="daily.scs@4thitek.vn"
            />
          </label>
          <label className="space-y-2 text-sm text-ink-soft">
            <span>{t('settings.phone')}</span>
            <input
              className="w-full rounded-2xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:bg-white"
              defaultValue="0909 222 333"
            />
          </label>
        </div>

        <div className="mt-6 border-t border-line pt-4">
          <h4 className="font-display text-sm text-ink">{t('settings.notification')}</h4>
          <div className="mt-3 space-y-2 text-sm text-ink-soft">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand" />
              {t('settings.orderAlerts')}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand" />
              {t('settings.promotions')}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-brand" />
              {t('settings.weeklyReport')}
            </label>
          </div>
        </div>

        <button className="btn-primary mt-5 rounded-full px-4 py-2 text-sm">
          {t('settings.save')}
        </button>
      </form>
    </section>
  )
}

export default SettingsPage
