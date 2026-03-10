import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Package, ShoppingCart, TrendingUp } from 'lucide-react'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { EmptyState, ErrorState, LoadingRows, PagePanel, StatCard, StatusBadge, softCardClass } from '../components/ui-kit'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { fetchAdminDashboard, type BackendDashboardResponse } from '../lib/adminApi'
import { formatCurrency, formatNumber } from '../lib/formatters'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const copyByLanguage = {
  vi: {
    title: 'Tổng quan hệ thống',
    description: 'Toàn bộ chỉ số được lấy trực tiếp từ backend quản trị theo theme hiện tại.',
    loadTitle: 'Không tải được dashboard',
    emptyTitle: 'Chưa có dữ liệu',
    emptyMessage: 'Backend chưa trả về dữ liệu dashboard.',
    totalOrders: 'Tổng đơn hàng',
    lowStock: 'Tồn kho thấp',
    bestSeller: 'Sản phẩm bán chạy',
    orderStatus: 'Phân bổ trạng thái đơn hàng',
    topProducts: 'Sản phẩm nổi bật',
    operations: 'Hệ thống và vận hành',
    revenueProgress: 'Tiến độ',
    pendingOrders: 'đơn chờ xử lý',
    restock: 'SKU cần bổ sung',
  },
  en: {
    title: 'System overview',
    description: 'Metrics are loaded directly from the admin backend and adapt to the active theme.',
    loadTitle: 'Unable to load dashboard',
    emptyTitle: 'No data yet',
    emptyMessage: 'The backend has not returned dashboard data.',
    totalOrders: 'Total orders',
    lowStock: 'Low stock',
    bestSeller: 'Top product',
    orderStatus: 'Order status distribution',
    topProducts: 'Top products',
    operations: 'System and operations',
    revenueProgress: 'Progress',
    pendingOrders: 'pending',
    restock: 'restock',
  },
} as const

const getThemeTokens = () => {
  if (typeof window === 'undefined') {
    return {
      ink: '#0f172a',
      muted: '#64748b',
      border: '#e2e8f0',
      accent: '#2563eb',
      accentSoft: '#dbeafe',
      palette: ['#f59e0b', '#2563eb', '#22c55e', '#14b8a6', '#ef4444'],
    }
  }
  const styles = window.getComputedStyle(document.documentElement)
  const ink = styles.getPropertyValue('--ink').trim() || '#0f172a'
  const muted = styles.getPropertyValue('--muted').trim() || '#64748b'
  const border = styles.getPropertyValue('--border').trim() || '#e2e8f0'
  const accent = styles.getPropertyValue('--accent').trim() || '#2563eb'
  const accentSoft = styles.getPropertyValue('--accent-soft').trim() || '#dbeafe'
  return {
    ink,
    muted,
    border,
    accent,
    accentSoft,
    palette: ['#f59e0b', accent, '#22c55e', '#14b8a6', '#ef4444'],
  }
}

function DashboardPageRevamp() {
  const { language } = useLanguage()
  const copy = copyByLanguage[language]
  const { accessToken } = useAuth()
  const { notify } = useToast()
  const [dashboard, setDashboard] = useState<BackendDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [themeTokens, setThemeTokens] = useState(getThemeTokens)

  useEffect(() => {
    const updateThemeTokens = () => setThemeTokens(getThemeTokens())
    updateThemeTokens()
    const observer = new MutationObserver(updateThemeTokens)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!accessToken) {
      setDashboard(null)
      setLoading(false)
      setError(copy.loadTitle)
      return
    }

    let cancelled = false

    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const payload = await fetchAdminDashboard(accessToken)
        if (!cancelled) {
          setDashboard(payload)
        }
      } catch (loadError) {
        if (!cancelled) {
          const message = loadError instanceof Error ? loadError.message : copy.loadTitle
          setError(message)
          notify(message, { title: copy.title, variant: 'error' })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [accessToken, copy.loadTitle, copy.title, notify])

  const orderStatusChart = useMemo<ChartData<'doughnut'>>(
    () => ({
      labels: dashboard?.orderStatus.map((item) => item.label) ?? [],
      datasets: [
        {
          data: dashboard?.orderStatus.map((item) => item.value) ?? [],
          backgroundColor: themeTokens.palette,
          borderWidth: 0,
        },
      ],
    }),
    [dashboard, themeTokens.palette],
  )

  const orderStatusOptions = useMemo<ChartOptions<'doughnut'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
      },
    }),
    [],
  )

  const trendChart = useMemo<ChartData<'bar'>>(
    () => ({
      labels: dashboard?.trend.points.map((item) => item.label) ?? [],
      datasets: [
        {
          label: dashboard?.trend.title || 'Revenue',
          data: dashboard?.trend.points.map((item) => item.value) ?? [],
          backgroundColor: themeTokens.accent,
          borderRadius: 12,
          borderSkipped: false,
          maxBarThickness: 28,
        },
      ],
    }),
    [dashboard, themeTokens.accent],
  )

  const trendOptions = useMemo<ChartOptions<'bar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
          labels: { color: themeTokens.ink },
        },
      },
      scales: {
        x: {
          ticks: { color: themeTokens.muted },
          grid: { display: false },
          border: { color: themeTokens.border },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: themeTokens.muted,
            callback: (value) => formatNumber(Number(value)),
          },
          grid: { color: themeTokens.border },
          border: { color: themeTokens.border },
        },
      },
    }),
    [themeTokens.border, themeTokens.ink, themeTokens.muted],
  )

  if (loading) {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    )
  }

  if (error) {
    return (
      <PagePanel>
        <ErrorState title={copy.loadTitle} message={error} />
      </PagePanel>
    )
  }

  if (!dashboard) {
    return (
      <PagePanel>
        <EmptyState title={copy.emptyTitle} message={copy.emptyMessage} />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--ink)]">{copy.title}</h3>
          <p className="text-sm text-[var(--muted)]">{copy.description}</p>
        </div>
        <StatusBadge tone="info">{dashboard.revenue.delta}</StatusBadge>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label={dashboard.revenue.label}
          value={formatCurrency(Number(dashboard.revenue.value ?? 0))}
          hint={`${copy.revenueProgress} ${dashboard.revenue.progress}%`}
          tone="success"
        />
        <StatCard
          icon={ShoppingCart}
          label={copy.totalOrders}
          value={formatNumber(dashboard.orders.total)}
          hint={`${formatNumber(dashboard.orders.pending)} ${copy.pendingOrders}`}
          tone="info"
        />
        <StatCard
          icon={AlertTriangle}
          label={copy.lowStock}
          value={formatNumber(dashboard.lowStock.skus)}
          hint={`${formatNumber(dashboard.lowStock.restock)} ${copy.restock}`}
          tone="warning"
        />
        <StatCard
          icon={Package}
          label={copy.bestSeller}
          value={dashboard.topProducts[0]?.name || '-'}
          hint={dashboard.topProducts[0]?.units || '0'}
          tone="neutral"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className={softCardClass}>
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">{dashboard.trend.title}</p>
            <p className="text-xs text-[var(--muted)]">{dashboard.trend.subtitle}</p>
          </div>
          <div className="mt-4 h-72">
            <Bar data={trendChart} options={trendOptions} />
          </div>
        </div>

        <div className={softCardClass}>
          <p className="text-sm font-semibold text-[var(--ink)]">{copy.orderStatus}</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-[180px_1fr] xl:grid-cols-1">
            <div className="mx-auto h-44 w-44 xl:h-52 xl:w-52">
              <Doughnut data={orderStatusChart} options={orderStatusOptions} />
            </div>
            <div className="space-y-3">
              {dashboard.orderStatus.map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: themeTokens.palette[index % themeTokens.palette.length] }} />
                    <span className="font-medium text-[var(--ink)]">{item.label}</span>
                  </div>
                  <span className="font-semibold text-[var(--ink)]">{formatNumber(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className={softCardClass}>
          <p className="text-sm font-semibold text-[var(--ink)]">{copy.topProducts}</p>
          <div className="mt-4 space-y-3">
            {dashboard.topProducts.length === 0 ? (
              <EmptyState title={copy.emptyTitle} message={copy.emptyMessage} />
            ) : (
              dashboard.topProducts.map((item) => (
                <div key={`${item.name}-${item.units}`} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm">
                  <span className="font-medium text-[var(--ink)]">{item.name}</span>
                  <span className="font-semibold text-[var(--accent)]">{item.units}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={softCardClass}>
          <p className="text-sm font-semibold text-[var(--ink)]">{copy.operations}</p>
          <div className="mt-4 space-y-3">
            {dashboard.system.map((item) => (
              <div key={`${item.group}-${item.label}`} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{item.label}</p>
                    <p className="text-xs text-[var(--muted)]">{item.hint || '-'}</p>
                  </div>
                  <StatusBadge tone={item.tone === 'warn' ? 'warning' : item.tone === 'good' ? 'success' : 'neutral'}>
                    {item.value}
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PagePanel>
  )
}

export default DashboardPageRevamp
