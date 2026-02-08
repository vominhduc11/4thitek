import { useLanguage } from '../context/LanguageContext'

const SupportPage = () => {
  const { t } = useLanguage()

  return (
    <section className="flex flex-col gap-6 rounded-[28px] border border-line bg-white/90 p-6 shadow-card">
      <div>
        <h2 className="font-display text-lg text-ink">{t('support.title')}</h2>
        <p className="text-sm text-ink-soft">
          {t('support.subtitle')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white/80 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">
            {t('support.infoPhone')}
          </p>
          <p className="mt-2 text-lg font-semibold text-ink">1900 0000</p>
          <p className="text-sm text-ink-soft">{t('support.hotlineHours')}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white/80 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">
            {t('support.infoEmail')}
          </p>
          <p className="mt-2 text-lg font-semibold text-ink">
            scs@4thitek.vn
          </p>
          <p className="text-sm text-ink-soft">{t('support.emailResponse')}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white/80 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">
            {t('support.infoChat')}
          </p>
          <p className="mt-2 text-lg font-semibold text-ink">{t('support.chatValue')}</p>
          <p className="text-sm text-ink-soft">{t('support.chatHours')}</p>
        </div>
      </div>

      <form
        className="rounded-2xl border border-line bg-white/80 p-5"
        onSubmit={(event) => event.preventDefault()}
      >
        <h3 className="font-display text-base text-ink">{t('support.formTitle')}</h3>
        <p className="text-sm text-ink-soft">
          {t('support.formSubtitle')}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-ink-soft">
            <span>{t('support.name')}</span>
            <input
              className="w-full rounded-2xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:bg-white"
              placeholder={t('support.namePlaceholder')}
            />
          </label>
          <label className="space-y-2 text-sm text-ink-soft">
            <span>{t('support.phone')}</span>
            <input
              className="w-full rounded-2xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:bg-white"
              placeholder={t('support.phonePlaceholder')}
            />
          </label>
          <label className="space-y-2 text-sm text-ink-soft md:col-span-2">
            <span>{t('support.message')}</span>
            <textarea
              className="min-h-[120px] w-full rounded-2xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:bg-white"
              placeholder={t('support.messagePlaceholder')}
            />
          </label>
        </div>
        <button className="btn-primary mt-4 rounded-full px-4 py-2 text-sm">
          {t('support.send')}
        </button>
      </form>
    </section>
  )
}

export default SupportPage
