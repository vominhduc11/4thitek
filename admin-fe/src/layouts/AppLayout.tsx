import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Moon,
  Package,
  Percent,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Sun,
  UserCircle,
  Users,
} from 'lucide-react'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useLanguage } from '../context/LanguageContext'

function AppLayout() {
  const { t } = useLanguage()
  const getStoredTheme = (): 'dark' | 'light' | null => {
    if (typeof window === 'undefined') {
      return null
    }
    try {
      const stored = window.localStorage.getItem('theme')
      return stored === 'dark' || stored === 'light' ? stored : null
    } catch {
      return null
    }
  }

  const getPreferredTheme = (): 'dark' | 'light' => 'dark'

  const [theme, setTheme] = useState<'light' | 'dark'>(
    getStoredTheme() ?? getPreferredTheme(),
  )
  const [isManualTheme, setIsManualTheme] = useState<boolean>(
    () => Boolean(getStoredTheme()),
  )

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined' || isManualTheme) {
      return undefined
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light')
    }
    if (media.addEventListener) {
      media.addEventListener('change', handler)
      return () => media.removeEventListener('change', handler)
    }
    media.addListener(handler)
    return () => media.removeListener(handler)
  }, [isManualTheme])

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('theme', next)
        } catch {
          // ignore storage errors
        }
      }
      return next
    })
    setIsManualTheme(true)
  }

  const isDark = theme === 'dark'
  const ghostButtonClass =
    'btn-stable-sm inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]'

  const navLinkBase =
    'group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition'
  const navItems = [
    { to: '/', label: t('Tổng quan'), icon: LayoutDashboard },
    { to: '/products', label: t('Sản phẩm'), icon: Package },
    { to: '/orders', label: t('Đơn hàng'), icon: ShoppingCart },
    { to: '/blogs', label: t('Bài viết'), icon: FileText },
    { to: '/discounts', label: t('Chiết khấu sỉ'), icon: Percent },
    { to: '/customers', label: t('Khách hàng'), icon: UserCircle },
    { to: '/users', label: t('Quản trị'), icon: Users },
    { to: '/settings', label: t('Cài đặt'), icon: Settings },
  ]

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--ink)] lg:overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-[18vmax] left-[10vmax] h-[40vmax] w-[40vmax] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.18),transparent_65%)] animate-drift motion-reduce:animate-none" />
        <div className="absolute -bottom-[20vmax] right-[6vmax] h-[46vmax] w-[46vmax] rounded-full bg-[radial-gradient(circle_at_60%_40%,rgba(59,130,246,0.2),transparent_65%)] animate-drift-slow motion-reduce:animate-none" />
        <div className="absolute inset-0 opacity-40 [background-size:120px_120px] [background-image:linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)]" />
      </div>

      <div className="relative grid min-h-screen lg:h-screen lg:grid-cols-[280px_1fr] lg:overflow-hidden">
        <aside className="flex min-h-0 flex-col gap-6 border-r border-white/15 bg-[linear-gradient(160deg,#0f172a,#111827_55%,#0b1120)] px-6 py-7 text-slate-100 lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[radial-gradient(circle_at_top,#60a5fa,#3b82f6_60%,#1d4ed8)] text-sm font-semibold tracking-[0.35em] text-white shadow-[0_14px_30px_rgba(37,99,235,0.35)]">
              4T
            </span>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                4ThiTek Admin
                <Sparkles className="h-4 w-4 text-blue-300" />
              </div>
              <p className="text-xs text-slate-400">
                {t('Trung tâm vận hành')}
              </p>
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <nav className="app-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    [
                      navLinkBase,
                      isActive
                        ? 'border-l-2 border-[var(--accent)] bg-[color:rgba(37,99,235,0.18)] text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.45)]'
                        : 'border-l-2 border-transparent text-slate-400 hover:border-[var(--accent)] hover:bg-white/5 hover:text-white',
                    ].join(' ')
                  }
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-blue-200/90 transition group-hover:bg-white/10">
                      <Icon className="h-4 w-4" />
                    </span>
                    {item.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-white/30 transition group-hover:translate-x-0.5" />
                </NavLink>
              )
            })}
          </nav>

          <div className="space-y-4 border-t border-white/10 pt-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(34,197,94,0.18)]" />
              <span>{t('Hệ thống: Trực tuyến')}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {t('Trưởng ca')}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {t('Đội quản trị')}
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col lg:h-full lg:min-h-0">
          <header className="sticky top-0 z-10 flex flex-col gap-4 border-b border-white/60 bg-white/70 px-6 py-5 backdrop-blur md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {t('Không gian quản trị')}
              </p>
              <h2 className="mt-2 font-serif text-[1.35rem] text-slate-900">
                {t('Chào mừng, Admin')}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="h-11 w-56 rounded-2xl border border-white/80 bg-white/80 pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus:outline-none"
                  placeholder={t('Tìm đơn, SKU...')}
                />
              </label>
              <button
                aria-pressed={isDark}
                aria-label={
                  isDark ? t('Sáng') : t('Tối')
                }
                className={ghostButtonClass}
                onClick={handleToggleTheme}
                type="button"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                {isDark ? t('Sáng') : t('Tối')}
              </button>
              <LanguageSwitcher />
              <button className={ghostButtonClass} type="button">
                <Bell className="h-4 w-4" />
                {t('Cảnh báo')}
              </button>
              <button className={ghostButtonClass} type="button">
                <UserCircle className="h-4 w-4" />
                {t('Tài khoản')}
              </button>
            </div>
          </header>

          <main className="app-scroll flex-1 px-6 pb-12 pt-6 md:px-8 lg:min-h-0 lg:overflow-y-auto">
            <div className="mx-auto w-full max-w-[1200px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default AppLayout
