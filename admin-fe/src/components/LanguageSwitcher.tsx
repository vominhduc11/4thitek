import { useLanguage } from '../context/LanguageContext'

const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage()
  const nextLanguage = language === 'vi' ? 'en' : 'vi'

  return (
    <button
      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
      onClick={() => setLanguage(nextLanguage)}
      type="button"
      aria-label={t('Chuyển ngôn ngữ')}
    >
      {language === 'vi' ? 'VI' : 'EN'}
    </button>
  )
}

export default LanguageSwitcher
