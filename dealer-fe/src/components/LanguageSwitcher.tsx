import { useLanguage } from '../context/LanguageContext'

const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage()
  const nextLanguage = language === 'vi' ? 'en' : 'vi'

  return (
    <button
      type="button"
      onClick={() => setLanguage(nextLanguage)}
      aria-label={t('common.toggleLanguage')}
      className="flex h-9 items-center gap-2 rounded-full border border-line bg-white/80 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft transition hover:text-brand"
    >
      {language === 'vi' ? 'VI' : 'EN'}
    </button>
  )
}

export default LanguageSwitcher
