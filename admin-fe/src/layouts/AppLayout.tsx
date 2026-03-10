import {
  Barcode,
  Bell,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Package,
  Percent,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Sun,
  UserCircle,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import logoMark from '../assets/images/logo-4t.png'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'

type NavItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

const NAV_LINK_BASE =
  'group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition'

const GHOST_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2'

const ALERTS = [
  'Don SO-2412 can xac nhan gia',
  'Ton kho thap: SCS SX Wireless Pro',
  '1 bai viet cho lich dang 18:00',
]

function AppLayout() {
  const { t } = useLanguage()
  const { user, logout, hasRole } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

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
  const [isManualTheme, setIsManualTheme] = useState<boolean>(() => Boolean(getStoredTheme()))
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAlertsOpen, setIsAlertsOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [globalQuery, setGlobalQuery] = useState('')

  const alertsRef = useRef<HTMLDivElement | null>(null)
  const accountRef = useRef<HTMLDivElement | null>(null)

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      { to: '/', label: t('Tổng quan'), icon: LayoutDashboard },
      { to: '/products', label: t('Sản phẩm'), icon: Package },
      { to: '/orders', label: t('Đơn hàng'), icon: ShoppingCart },
      { to: '/support-tickets', label: 'Support tickets', icon: LifeBuoy },
      { to: '/warranties', label: 'Warranties', icon: ShieldCheck },
      { to: '/serials', label: 'Serials', icon: Barcode },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/reports', label: 'Reports', icon: FileText },
      { to: '/blogs', label: t('Bài viết'), icon: FileText },
      { to: '/discounts', label: t('Chiết khấu sỉ'), icon: Percent },
      { to: '/dealers', label: t('Đại lý'), icon: UserCircle },
      { to: '/settings', label: t('Cài đặt'), icon: Settings },
    ]

    if (hasRole('SUPER_ADMIN')) {
      items.splice(items.length - 1, 0, { to: '/users', label: t('Quản trị'), icon: Users })
    }

    return items
  }, [hasRole, t])

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsSidebarOpen(false)
      setIsAlertsOpen(false)
      setIsAccountOpen(false)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (alertsRef.current && !alertsRef.current.contains(target)) {
        setIsAlertsOpen(false)
      }
      if (accountRef.current && !accountRef.current.contains(target)) {
        setIsAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const handleGlobalSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = globalQuery.trim().toLowerCase()
    if (!query) return

    const matched = navItems.find((item) => item.label.toLowerCase().includes(query))
    if (matched) {
      navigate(matched.to)
      return
    }

    notify('Không tìm thấy trang phù hợp', { title: 'Search', variant: 'info' })
  }

  const renderSidebar = (mobile = false) => (
    <aside
      className={
        mobile
          ? 'flex h-full min-h-0 flex-col gap-6 border-r border-white/15 bg-[linear-gradient(160deg,#0f172a,#111827_55%,#0b1120)] px-6 py-7 text-slate-100'
          : 'hidden min-h-0 flex-col gap-6 border-r border-white/15 bg-[linear-gradient(160deg,#0f172a,#111827_55%,#0b1120)] px-6 py-7 text-slate-100 lg:flex lg:w-[280px] lg:shrink-0'
      }
    >
      <div className="flex items-center gap-3">
        <img
          src={logoMark}
          alt="4ThiTek"
          className="h-11 w-auto max-w-[168px] object-contain drop-shadow-[0_10px_24px_rgba(37,99,235,0.22)]"
        />
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            Admin Portal
            <Sparkles className="h-4 w-4 text-blue-300" />
          </div>
          <p className="text-xs text-slate-400">{t('Trung tâm vận hành')}</p>
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
                  NAV_LINK_BASE,
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
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('Trưởng ca')}</p>
          <p className="mt-1 text-sm font-semibold text-white">{t('Đội quản trị')}</p>
        </div>
      </div>
    </aside>
  )

  const isDark = theme === 'dark'

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--ink)] lg:overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-[18vmax] left-[10vmax] h-[40vmax] w-[40vmax] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.18),transparent_65%)] animate-drift motion-reduce:animate-none" />
        <div className="absolute -bottom-[20vmax] right-[6vmax] h-[46vmax] w-[46vmax] rounded-full bg-[radial-gradient(circle_at_60%_40%,rgba(59,130,246,0.2),transparent_65%)] animate-drift-slow motion-reduce:animate-none" />
        <div className="absolute inset-0 opacity-40 [background-size:120px_120px] [background-image:linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)]" />
      </div>

      <div className="relative flex min-h-screen lg:h-screen">
        {renderSidebar()}

        <div className="flex min-h-screen flex-1 flex-col lg:h-full lg:min-h-0">
          <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-white/60 bg-white/70 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('Không gian quản trị')}</p>
                <h2 className="mt-1 font-serif text-[1.2rem] text-slate-900 sm:text-[1.35rem]">
                  {t('Chào mừng, Admin')}
                </h2>
              </div>
              <button
                aria-label="Toggle navigation menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[var(--accent)] hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
                type="button"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <form className="relative min-w-0 flex-1 sm:flex-none" onSubmit={handleGlobalSearch}>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  aria-label={t('Tìm đơn, SKU...')}
                  className="h-11 w-full min-w-[180px] rounded-2xl border border-white/80 bg-white/80 pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:w-56"
                  onChange={(event) => setGlobalQuery(event.target.value)}
                  placeholder={t('Tìm đơn, SKU...')}
                  value={globalQuery}
                />
              </form>

              <button
                aria-pressed={isDark}
                aria-label={isDark ? t('Sáng') : t('Tối')}
                className={GHOST_BUTTON_CLASS}
                onClick={handleToggleTheme}
                type="button"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="hidden sm:inline">{isDark ? t('Sáng') : t('Tối')}</span>
              </button>

              <LanguageSwitcher />

              <div className="relative" ref={alertsRef}>
                <button
                  aria-expanded={isAlertsOpen}
                  aria-haspopup="menu"
                  className={GHOST_BUTTON_CLASS}
                  onClick={() => setIsAlertsOpen((value) => !value)}
                  type="button"
                >
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('Cảnh báo')}</span>
                </button>
                {isAlertsOpen ? (
                  <div
                    className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
                    role="menu"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {t('Cảnh báo')}
                    </p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                      {ALERTS.map((item) => (
                        <li key={item} className="rounded-xl bg-[var(--surface-muted)] px-3 py-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <div className="relative" ref={accountRef}>
                <button
                  aria-expanded={isAccountOpen}
                  aria-haspopup="menu"
                  className={GHOST_BUTTON_CLASS}
                  onClick={() => setIsAccountOpen((value) => !value)}
                  type="button"
                >
                  <UserCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('Tài khoản')}</span>
                </button>
                {isAccountOpen ? (
                  <div
                    className="absolute right-0 z-30 mt-2 w-60 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
                    role="menu"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">User</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{user?.username ?? 'Admin'}</p>
                    <p className="text-xs text-slate-500">{user?.role ?? 'Admin'}</p>
                    <button
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      onClick={() => {
                        logout()
                        notify('Da dang xuat', { title: 'Auth', variant: 'info' })
                        navigate('/login')
                      }}
                      type="button"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className="app-scroll flex-1 px-4 pb-12 pt-6 sm:px-6 md:px-8 lg:min-h-0 lg:overflow-y-auto">
            <div className="mx-auto w-full max-w-[1200px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <div
        aria-hidden={!isSidebarOpen}
        className={`fixed inset-0 z-40 bg-slate-950/45 transition lg:hidden ${
          isSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[280px] transform transition duration-300 ease-out lg:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <button
            aria-label="Close navigation menu"
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white"
            onClick={() => setIsSidebarOpen(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
          {renderSidebar(true)}
        </div>
      </div>
    </div>
  )
}

export default AppLayout
