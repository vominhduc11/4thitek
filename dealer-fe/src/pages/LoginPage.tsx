import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useLanguage } from '../context/LanguageContext'

type ThemeMode = 'light' | 'dark'

const SunIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M4.93 4.93l1.41 1.41" />
    <path d="M17.66 17.66l1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M4.93 19.07l1.41-1.41" />
    <path d="M17.66 6.34l1.41-1.41" />
  </svg>
)

const MoonIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
)

const LoginPage = () => {
  const [theme, setTheme] = useState<ThemeMode>('light')
  const { t } = useLanguage()

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial =
      stored === 'light' || stored === 'dark'
        ? stored
        : prefersDark
          ? 'dark'
          : 'light'

    setTheme(initial)
    document.documentElement.classList.toggle('dark', initial === 'dark')
  }, [])

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-paper text-ink">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[20vmax] -left-[12vmax] h-[46vmax] w-[46vmax] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.25),transparent_65%)] blur-2xl" />
        <div className="absolute -bottom-[22vmax] -right-[10vmax] h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.2),transparent_60%)] blur-2xl" />
        <div className="absolute inset-0 opacity-30 [background-size:120px_120px] [background-image:linear-gradient(to_right,rgba(15,30,45,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,30,45,0.08)_1px,transparent_1px)]" />
      </div>

      <main className="app-scrollbar relative mx-auto flex h-[100svh] w-full max-w-[1120px] items-start justify-center overflow-y-auto px-6 py-16 lg:items-center">
        <div className="absolute right-6 top-6 flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={handleToggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/80 text-ink transition hover:text-brand"
            aria-label={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
          >
            {theme === 'dark' ? (
              <SunIcon className="h-4 w-4" />
            ) : (
              <MoonIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[radial-gradient(circle_at_top,#60a5fa,#3b82f6_55%,#1d4ed8)] text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-[0_20px_50px_rgba(37,99,235,0.35)]">
                4I
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
                  {t('login.portal')}
                </p>
                <h1 className="font-display text-2xl text-ink">
                  {t('login.brand')}
                </h1>
              </div>
            </div>

            <p className="text-sm text-ink-soft">
              {t('login.description')}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-white/80 p-4 shadow-[0_12px_30px_rgba(15,30,45,0.08)]">
                <p className="text-xs uppercase tracking-[0.24em] text-ink-muted">
                  {t('login.featureOverviewTitle')}
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  {t('login.featureOverviewBody')}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 p-4 shadow-[0_12px_30px_rgba(15,30,45,0.08)]">
                <p className="text-xs uppercase tracking-[0.24em] text-ink-muted">
                  {t('login.featureSupportTitle')}
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  {t('login.featureSupportBody')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
              <span className="rounded-full border border-line px-3 py-1">
                {t('login.access')}
              </span>
              <span className="rounded-full border border-line px-3 py-1">
                {t('login.version')}
              </span>
            </div>
          </section>

          <section className="rounded-[32px] border border-line bg-white/90 p-8 shadow-card backdrop-blur">
            <header className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
                {t('login.sectionLabel')}
              </p>
              <h2 className="font-display text-2xl text-ink">
                {t('login.title')}
              </h2>
              <p className="text-sm text-ink-soft">
                {t('login.subtitle')}
              </p>
            </header>

            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => event.preventDefault()}
            >
              <label className="space-y-2 text-sm text-ink-soft">
                <span>{t('login.account')}</span>
                <input
                  className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
                  placeholder={t('login.accountPlaceholder')}
                  type="text"
                  autoComplete="username"
                />
              </label>

              <label className="space-y-2 text-sm text-ink-soft">
                <span>{t('login.password')}</span>
                <input
                  className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
                  placeholder={t('login.passwordPlaceholder')}
                  type="password"
                  autoComplete="current-password"
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
                <label className="flex items-center gap-2">
                  <input className="h-4 w-4 accent-brand" type="checkbox" />
                  <span>{t('login.remember')}</span>
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-brand hover:text-brand-dark"
                >
                  {t('login.forgot')}
                </button>
              </div>

              <button
                className="btn-primary w-full rounded-2xl px-4 py-3 text-sm shadow-[0_16px_30px_rgba(37,99,235,0.35)]"
                type="submit"
              >
                {t('login.submit')}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-xs text-ink-muted">
              <span>{t('login.copyright')}</span>
              <Link className="font-semibold text-brand hover:text-brand-dark" to="/dashboard">
                {t('login.goDashboard')}
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
