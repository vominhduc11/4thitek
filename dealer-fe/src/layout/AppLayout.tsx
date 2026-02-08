import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useLanguage } from '../context/LanguageContext'
import { PRODUCTS } from '../data/products'
import { formatCurrency } from '../lib/format'
import { useShop } from '../store/shopContext'

type IconProps = {
  className?: string
}

const HomeIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 10.5L12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9 21v-6h6v6" />
  </svg>
)

const BoxIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 8.5V15.5L12 21L3 15.5V8.5L12 3L21 8.5Z" />
    <path d="M12 21V12" />
    <path d="M21 8.5L12 13.5L3 8.5" />
  </svg>
)

const CartIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 6h15l-1.6 7.5a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.5L5 3H2" />
    <circle cx="9" cy="19" r="1.5" />
    <circle cx="17" cy="19" r="1.5" />
  </svg>
)

const ClipboardIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="8" y="3" width="8" height="4" rx="1" />
    <path d="M6 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1" />
  </svg>
)

const CreditCardIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 9h18" />
    <path d="M7 15h4" />
  </svg>
)

const ChartIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3v18h18" />
    <path d="M7 14l3-3 4 4 5-6" />
  </svg>
)

const SupportIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4.5 12a7.5 7.5 0 0 1 15 0" />
    <path d="M4.5 12v3a2 2 0 0 0 2 2h1" />
    <path d="M19.5 12v3a2 2 0 0 1-2 2h-1" />
    <path d="M12 19v2" />
  </svg>
)

const SettingsIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.8 1.8 0 0 0 .3 2l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.8 1.8 0 0 0-2-.3 1.8 1.8 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.2a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-2 .3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.8 1.8 0 0 0 .3-2 1.8 1.8 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.2a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.3-2l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.8 1.8 0 0 0 2 .3h.1a1.8 1.8 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.2a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 2-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.8 1.8 0 0 0-.3 2v.1a1.8 1.8 0 0 0 1.6 1H21a2 2 0 0 1 0 4h-.2a1.8 1.8 0 0 0-1.6 1Z" />
  </svg>
)

const SearchIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
)

const SunIcon = ({ className }: IconProps) => (
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

const MoonIcon = ({ className }: IconProps) => (
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

const topNavClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-brand/10 text-brand ring-1 ring-brand/20'
      : 'bg-white/80 text-ink-soft hover:text-ink'
  }`

const sideNavClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-2xl border border-transparent border-l-4 px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'border-l-brand bg-brand/10 text-brand shadow-sm'
      : 'text-ink-soft hover:bg-white/70 hover:text-ink'
  }`

const ChevronDownIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
)

const AppLayout = () => {
  const { totalQuantity, summary } = useShop()
  const { t } = useLanguage()
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const initial =
      stored === 'light' || stored === 'dark'
        ? stored
        : 'dark'

    setTheme(initial)
    document.documentElement.classList.toggle('dark', initial === 'dark')
  }, [])


  useEffect(() => {
    if (!isAccountOpen) return

    const handlePointer = (event: PointerEvent) => {
      if (!accountRef.current) return
      if (!accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false)
      }
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAccountOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isAccountOpen])

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const sideNav = [
    { label: t('nav.dashboard'), to: '/dashboard', icon: HomeIcon },
    { label: t('nav.products'), to: '/products', icon: BoxIcon },
    { label: t('nav.orders'), to: '/orders', icon: ClipboardIcon },
    { label: t('nav.checkout'), to: '/checkout', icon: CreditCardIcon },
    { label: t('nav.reports'), to: '/reports', icon: ChartIcon },
    { label: t('nav.support'), to: '/support', icon: SupportIcon },
    { label: t('nav.settings'), to: '/settings', icon: SettingsIcon },
  ]

  return (
    <div className="relative h-[100svh] overflow-hidden bg-paper text-ink">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#fff7e9,transparent_60%),radial-gradient(circle_at_18%_20%,rgba(232,135,75,0.18),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(42,127,123,0.2),transparent_45%)] opacity-80" />

      <div className="relative z-10 flex h-[100svh] min-h-0 flex-col">
        <header className="relative z-40 border-b border-brand/20 bg-white/70 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  4I
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-muted">
                    {t('header.portal')}
                  </p>
                  <p className="text-sm font-semibold text-ink">
                    {t('header.brand')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-line bg-white/80 px-3 py-1.5 text-sm text-ink-soft shadow-sm md:flex">
                <SearchIcon className="h-4 w-4" />
                <input
                  className="w-48 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
                  placeholder={t('header.searchPlaceholder')}
                />
              </div>
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/80 text-ink md:hidden">
                <SearchIcon className="h-4 w-4" />
              </button>
              <LanguageSwitcher />
              <button
                type="button"
                onClick={handleToggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/80 text-ink transition hover:text-brand"
                aria-label={
                  theme === 'dark' ? t('theme.toLight') : t('theme.toDark')
                }
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-4 w-4" />
                ) : (
                  <MoonIcon className="h-4 w-4" />
                )}
              </button>
              <NavLink
                to="/cart"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/80 text-ink"
                aria-label={t('header.cart')}
              >
                <CartIcon className="h-4 w-4" />
                {totalQuantity > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1 text-xs font-semibold text-white">
                    {totalQuantity}
                  </span>
                )}
              </NavLink>
              <div ref={accountRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={isAccountOpen}
                  className="flex items-center gap-2 rounded-full border border-line bg-white/80 px-2.5 py-1 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                    DL
                  </span>
                  <span className="hidden sm:inline">{t('header.dealerName')}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 transition ${isAccountOpen ? 'rotate-180 text-brand' : 'text-ink-muted'}`}
                  />
                </button>
                {isAccountOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-line bg-white/95 p-2 text-sm text-ink shadow-card backdrop-blur"
                  >
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                      {t('common.account')}
                    </div>
                    <Link
                      to="/settings"
                      role="menuitem"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 font-semibold text-ink transition hover:bg-brand/10 hover:text-brand"
                    >
                      {t('nav.settings')}
                    </Link>
                    <Link
                      to="/support"
                      role="menuitem"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 font-semibold text-ink transition hover:bg-brand/10 hover:text-brand"
                    >
                      {t('nav.support')}
                    </Link>
                    <div className="my-2 h-px bg-line" />
                    <Link
                      to="/login"
                      role="menuitem"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 font-semibold text-ink transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      {t('common.logout')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[1440px] flex-nowrap gap-2 overflow-x-auto px-6 pb-4 lg:hidden">
            {sideNav
              .filter((item) => item.to !== '/cart')
              .map((item) => (
              <NavLink key={item.to} to={item.to} className={topNavClass}>
                {item.label}
              </NavLink>
              ))}
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="mx-auto flex w-full max-w-[1440px] min-h-0 flex-1">
            <aside className="hidden w-[260px] flex-col gap-6 border-r border-line bg-white/60 px-6 py-6 backdrop-blur lg:flex">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                  {t('sidebar.navigation')}
                </p>
                <div className="mt-4 space-y-1">
                  {sideNav.map((item) => (
                    <NavLink key={item.to} to={item.to} className={sideNavClass}>
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 p-4 text-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">
                  {t('quickStats.title')}
                </p>
                <div className="mt-3 space-y-2 text-ink-soft">
                  <div className="flex items-center justify-between">
                    <span>{t('quickStats.products')}</span>
                    <span className="font-semibold text-ink">{PRODUCTS.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('quickStats.inCart')}</span>
                    <span className="font-semibold text-ink">{totalQuantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('quickStats.totalValue')}</span>
                    <span className="font-semibold text-ink">
                      {formatCurrency(summary.total)}
                    </span>
                  </div>
                </div>
              </div>
            </aside>

            <div className="app-scrollbar relative z-10 min-h-0 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-6 px-6 py-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex flex-col gap-6">
                    <Outlet />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppLayout

