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
import { EmptyState, ErrorState, LoadingRows, PagePanel, StatCard, StatusBadge } from '../components/ui-kit'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { fetchAdminDashboard, type BackendDashboardResponse } from '../lib/adminApi'
import { formatCurrency, formatNumber } from '../lib/formatters'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const orderStatusColors = ['#f59e0b', '#3b82f6', '#22c55e', '#10b981', '#ef4444']

function DashboardPage() {
  const { accessToken } = useAuth()
  const { notify } = useToast()
  const [dashboard, setDashboard] = useState<BackendDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) {
      setDashboard(null)
      setLoading(false)
      setError('Admin session is not available')
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
          const message = loadError instanceof Error ? loadError.message : 'Không tải được dashboard'
          setError(message)
          notify(message, { title: 'Dashboard', variant: 'error' })
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
  }, [accessToken, notify])

  const orderStatusChart = useMemo<ChartData<'doughnut'>>(() => ({
    labels: dashboard?.orderStatus.map((item) => item.label) ?? [],
    datasets: [
      {
        data: dashboard?.orderStatus.map((item) => item.value) ?? [],
        backgroundColor: orderStatusColors,
        borderWidth: 0,
      },
    ],
  }), [dashboard])

  const orderStatusOptions = useMemo<ChartOptions<'doughnut'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
    },
  }), [])

  const trendChart = useMemo<ChartData<'bar'>>(() => ({
    labels: dashboard?.trend.points.map((item) => item.label) ?? [],
    datasets: [
      {
        label: dashboard?.trend.title || 'Doanh thu',
        data: dashboard?.trend.points.map((item) => item.value) ?? [],
        backgroundColor: '#2563eb',
        borderRadius: 12,
        borderSkipped: false,
        maxBarThickness: 28,
      },
    ],
  }), [dashboard])

  const trendOptions = useMemo<ChartOptions<'bar'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatNumber(Number(value)),
        },
      },
    },
  }), [])

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
        <ErrorState title="Không thể tải dashboard" message={error} />
      </PagePanel>
    )
  }

  if (!dashboard) {
    return (
      <PagePanel>
        <EmptyState title="Không có dữ liệu" message="Dashboard backend chưa trả về dữ liệu." />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Tong quan he thong</h3>
          <p className="text-sm text-slate-500">Tat ca chi so duoc lay truc tiep tu backend admin.</p>
        </div>
        <StatusBadge tone="info">{dashboard.revenue.delta}</StatusBadge>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label={dashboard.revenue.label}
          value={formatCurrency(Number(dashboard.revenue.value ?? 0))}
          hint={`Tien do ${dashboard.revenue.progress}%`}
          tone="success"
        />
        <StatCard
          icon={ShoppingCart}
          label="Tổng đơn hàng"
          value={formatNumber(dashboard.orders.total)}
          hint={`${formatNumber(dashboard.orders.pending)} don cho xu ly`}
          tone="info"
        />
        <StatCard
          icon={AlertTriangle}
          label="Ton kho thap"
          value={formatNumber(dashboard.lowStock.skus)}
          hint={`${formatNumber(dashboard.lowStock.restock)} SKU can bo sung`}
          tone="warning"
        />
        <StatCard
          icon={Package}
          label="San pham ban chay"
          value={dashboard.topProducts[0]?.name || 'Chua co'}
          hint={dashboard.topProducts[0]?.units || '0 sp'}
          tone="neutral"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{dashboard.trend.title}</p>
              <p className="text-xs text-slate-500">{dashboard.trend.subtitle}</p>
            </div>
          </div>
          <div className="mt-4 h-72">
            <Bar data={trendChart} options={trendOptions} />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Phân bổ trạng thái đơn hàng</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-[180px_1fr] xl:grid-cols-1">
            <div className="mx-auto h-44 w-44 xl:h-52 xl:w-52">
              <Doughnut data={orderStatusChart} options={orderStatusOptions} />
            </div>
            <div className="space-y-3">
              {dashboard.orderStatus.map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: orderStatusColors[index % orderStatusColors.length] }} />
                    <span className="font-medium text-slate-700">{item.label}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{formatNumber(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">San pham noi bat</p>
          <div className="mt-4 space-y-3">
            {dashboard.topProducts.length === 0 ? (
              <EmptyState title="Chưa có đơn hàng" message="Backend chưa có dữ liệu bán hàng để xếp hạng." />
            ) : (
              dashboard.topProducts.map((item) => (
                <div key={`${item.name}-${item.units}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <span className="font-semibold text-[var(--accent)]">{item.units}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">He thong va van hanh</p>
          <div className="mt-4 space-y-3">
            {dashboard.system.map((item) => (
              <div key={`${item.group}-${item.label}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.hint || 'Không có ghi chú thêm'}</p>
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

export default DashboardPage
