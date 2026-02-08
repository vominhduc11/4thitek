import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  Download,
  Package,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { useLanguage } from '../context/LanguageContext'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
)

const DAY_TREND_COUNT = 14
const MONTH_TREND_COUNT = 12
const YEAR_TREND_COUNT = 5

const revenueOptions = [
  { value: 'day', label: 'Ngày' },
  { value: 'month', label: 'Tháng' },
  { value: 'year', label: 'Năm' },
  { value: 'custom', label: 'Tùy chỉnh' },
] as const

type RevenuePeriod = (typeof revenueOptions)[number]['value']

const revenuePeriodLabelMap: Record<RevenuePeriod, string> = {
  day: 'Ngày',
  month: 'Tháng',
  year: 'Năm',
  custom: 'Tùy chỉnh',
}

const revenuePeriodHintMap: Record<RevenuePeriod, string> = {
  day: 'Hôm nay',
  month: `${MONTH_TREND_COUNT} tháng gần nhất`,
  year: `${YEAR_TREND_COUNT} năm gần nhất`,
  custom: 'Tùy chỉnh',
}

const mockLowStock = {
  skus: 9,
  restock: 3,
  progress: 40,
} as const

type SystemGroup = 'sales' | 'ops'

type SystemItem = {
  label: string
  value: string
  hint?: string
  tone?: 'good' | 'warn' | 'neutral'
  group?: SystemGroup
}

type OverviewData = {
  revenueLabel: string
  revenue: { value: number; delta: string; progress: number }
  orders: { total: number; pending: number; progress: number }
  orderStatus: { label: string; value: number }[]
  topProducts: { name: string; units: string }[]
  system: SystemItem[]
  trend: {
    title: string
    subtitle: string
    points: { label: string; value: number }[]
  }
}

type StaticPeriod = Exclude<RevenuePeriod, 'custom'>

const mockOverviewByPeriod: Record<StaticPeriod, OverviewData> = {
  day: {
    revenueLabel: 'Doanh thu hôm nay',
    revenue: { value: 24890, delta: '+12%', progress: 82 },
    orders: { total: 184, pending: 42, progress: 60 },
    orderStatus: [
      { label: 'Chờ xử lý', value: 42 },
      { label: 'Đang giao', value: 56 },
      { label: 'Hoàn tất', value: 78 },
      { label: 'Hủy', value: 8 },
    ],
    topProducts: [
      { name: 'SCS SX Pro Elite', units: '1,240 sp' },
      { name: 'SCS SX Wireless Pro', units: '980 sp' },
      { name: 'SCS Professional Studio', units: '740 sp' },
    ],
    system: [
      { label: 'Đại lý', value: '3 mới', hint: '2 chờ duyệt', tone: 'warn', group: 'sales' },
      { label: 'Chiết khấu bán sỉ', value: '3 chương trình', hint: '1 sắp hết hạn', tone: 'warn', group: 'sales' },
      { label: 'Sản phẩm', value: '2 xuất bản', hint: '5 bản nháp', tone: 'neutral', group: 'sales' },
      { label: 'Quản trị', value: '4 tài khoản', hint: '1 chờ duyệt', tone: 'neutral', group: 'ops' },
      { label: 'Bài viết', value: '6 xuất bản', hint: '2 bản nháp', tone: 'neutral', group: 'ops' },
    ],
    trend: {
      title: 'Xu hướng doanh số',
      subtitle: '7 ngày gần nhất',
      points: [
        { label: 'T2', value: 42 },
        { label: 'T3', value: 58 },
        { label: 'T4', value: 64 },
        { label: 'T5', value: 51 },
        { label: 'T6', value: 76 },
        { label: 'T7', value: 68 },
        { label: 'CN', value: 88 },
      ],
    },
  },
  month: {
    revenueLabel: 'Doanh thu 12 tháng gần nhất',
    revenue: { value: 412300, delta: '+8%', progress: 72 },
    orders: { total: 2940, pending: 210, progress: 68 },
    orderStatus: [
      { label: 'Chờ xử lý', value: 210 },
      { label: 'Đang giao', value: 640 },
      { label: 'Hoàn tất', value: 1960 },
      { label: 'Hủy', value: 130 },
    ],
    topProducts: [
      { name: 'SCS SX Pro Elite', units: '12,480 sp' },
      { name: 'SCS Professional Studio', units: '9,160 sp' },
      { name: 'SCS SX Wireless Pro', units: '7,840 sp' },
    ],
    system: [
      { label: 'Đại lý', value: '18 mới', hint: '6 chờ duyệt', tone: 'warn', group: 'sales' },
      { label: 'Chiết khấu bán sỉ', value: '5 chương trình', hint: '2 sắp hết hạn', tone: 'warn', group: 'sales' },
      { label: 'Sản phẩm', value: '24 xuất bản', hint: '11 bản nháp', tone: 'neutral', group: 'sales' },
      { label: 'Quản trị', value: '4 tài khoản', hint: '1 chờ duyệt', tone: 'neutral', group: 'ops' },
      { label: 'Bài viết', value: '22 xuất bản', hint: '7 bản nháp', tone: 'neutral', group: 'ops' },
    ],
    trend: {
      title: 'Xu hướng doanh số',
      subtitle: '12 tháng gần nhất',
      points: [
        { label: 'M1', value: 35 },
        { label: 'M2', value: 48 },
        { label: 'M3', value: 62 },
        { label: 'M4', value: 58 },
        { label: 'M5', value: 74 },
        { label: 'M6', value: 81 },
        { label: 'M7', value: 68 },
        { label: 'M8', value: 72 },
        { label: 'M9', value: 79 },
        { label: 'M10', value: 83 },
        { label: 'M11', value: 77 },
        { label: 'M12', value: 85 },
      ],
    },
  },
  year: {
    revenueLabel: 'Doanh thu 5 năm gần nhất',
    revenue: { value: 4890000, delta: '+15%', progress: 85 },
    orders: { total: 32480, pending: 1420, progress: 76 },
    orderStatus: [
      { label: 'Chờ xử lý', value: 1420 },
      { label: 'Đang giao', value: 7480 },
      { label: 'Hoàn tất', value: 22340 },
      { label: 'Hủy', value: 1240 },
    ],
    topProducts: [
      { name: 'SCS SX Pro Elite', units: '142,800 sp' },
      { name: 'SCS Professional Studio', units: '118,400 sp' },
      { name: 'SCS SX Wireless Pro', units: '104,300 sp' },
    ],
    system: [
      { label: 'Đại lý', value: '160 mới', hint: '12 chờ duyệt', tone: 'warn', group: 'sales' },
      { label: 'Chiết khấu bán sỉ', value: '12 chương trình', hint: '4 sắp hết hạn', tone: 'warn', group: 'sales' },
      { label: 'Sản phẩm', value: '210 xuất bản', hint: '38 bản nháp', tone: 'neutral', group: 'sales' },
      { label: 'Quản trị', value: '4 tài khoản', hint: '1 chờ duyệt', tone: 'neutral', group: 'ops' },
      { label: 'Bài viết', value: '180 xuất bản', hint: '24 bản nháp', tone: 'neutral', group: 'ops' },
    ],
    trend: {
      title: 'Xu hướng doanh số',
      subtitle: '5 năm gần nhất',
      points: [
        { label: 'Y1', value: 45 },
        { label: 'Y2', value: 52 },
        { label: 'Y3', value: 60 },
        { label: 'Y4', value: 76 },
        { label: 'Y5', value: 84 },
      ],
    },
  },
}


const numberFormatter = new Intl.NumberFormat('vi-VN')
const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const formatCurrency = (value: number) =>
  currencyFormatter.format(Math.round(value))

const formatNumber = (value: number) => numberFormatter.format(value)

const formatUnits = (value: number) => `${numberFormatter.format(value)} sp`

const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const hashString = (input: string) => {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 1000
  }
  return hash
}

const toInputDate = (date: Date) => {
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60000)
  return localDate.toISOString().slice(0, 10)
}

const normalizeRange = (start: string, end: string) => {
  if (!start || !end) {
    return { start, end }
  }
  return start <= end ? { start, end } : { start: end, end: start }
}

const getRangeDays = (start: string, end: string) => {
  if (!start || !end) {
    return 1
  }
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)
  if (!startYear || !startMonth || !startDay || !endYear || !endMonth || !endDay) {
    return 1
  }
  const startDate = new Date(startYear, startMonth - 1, startDay)
  const endDate = new Date(endYear, endMonth - 1, endDay)
  const diff = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000)
  return Math.max(1, diff + 1)
}

const parseInputDate = (value: string) => {
  if (!value) {
    return null
  }
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }
  return new Date(year, month - 1, day)
}

const addDays = (date: Date, amount: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

const addMonths = (date: Date, amount: number) => {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

const formatDayLabel = (date: Date, includeYear = false) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return includeYear ? `${day}/${month}/${date.getFullYear()}` : `${day}/${month}`
}

const formatMonthLabel = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${month}/${date.getFullYear()}`
}

const buildTrendSeries = (
  labels: string[],
  seed: number,
  title: string,
  subtitle: string,
) => ({
  title,
  subtitle,
  points: labels.map((label, index) => ({
    label,
    value: 35 + ((seed + index * 7) % 55),
  })),
})

const buildTrendForPeriod = (
  period: RevenuePeriod,
  range: { start: string; end: string },
  today: Date,
  translate: (key: string, vars?: Record<string, string | number>) => string,
) => {
  const title = translate('Xu hướng doanh số')
  if (period === 'day') {
    const count = DAY_TREND_COUNT
    const startDate = addDays(today, -(count - 1))
    const labels = Array.from({ length: count }, (_, index) =>
      formatDayLabel(addDays(startDate, index)),
    )
    const seed = hashString(toInputDate(today))
    return buildTrendSeries(
      labels,
      seed,
      title,
      translate('{count} ngày gần nhất', { count }),
    )
  }

  if (period === 'month') {
    const count = MONTH_TREND_COUNT
    const startDate = new Date(today.getFullYear(), today.getMonth() - (count - 1), 1)
    const labels = Array.from({ length: count }, (_, index) =>
      formatMonthLabel(addMonths(startDate, index)),
    )
    const seed = hashString(
      `${startDate.getFullYear()}-${startDate.getMonth() + 1}|${today.getFullYear()}-${today.getMonth() + 1}`,
    )
    return buildTrendSeries(
      labels,
      seed,
      title,
      translate('{count} tháng gần nhất', { count }),
    )
  }

  if (period === 'year') {
    const count = YEAR_TREND_COUNT
    const startYear = today.getFullYear() - (count - 1)
    const labels = Array.from({ length: count }, (_, index) =>
      String(startYear + index),
    )
    const seed = hashString(`${startYear}|${today.getFullYear()}`)
    return buildTrendSeries(
      labels,
      seed,
      title,
      translate('{count} năm gần nhất', { count }),
    )
  }

  const normalizedRange = normalizeRange(range.start, range.end)
  const seed = hashString(`${normalizedRange.start}|${normalizedRange.end}`)
  const days = getRangeDays(normalizedRange.start, normalizedRange.end)
  const startDate = parseInputDate(normalizedRange.start) ?? today
  const endDate = parseInputDate(normalizedRange.end) ?? today
  const includeYear = startDate.getFullYear() !== endDate.getFullYear()
  const rangeSubtitle = translate('Từ {start} đến {end}', {
    start: normalizedRange.start,
    end: normalizedRange.end,
  })

  if (days <= 31) {
    const labels = Array.from({ length: days }, (_, index) =>
      formatDayLabel(addDays(startDate, index), includeYear),
    )
    return buildTrendSeries(labels, seed, title, rangeSubtitle)
  }

  if (days <= 120) {
    const count = Math.ceil(days / 7)
    const labels = Array.from({ length: count }, (_, index) => `W${index + 1}`)
    return buildTrendSeries(labels, seed, title, rangeSubtitle)
  }

  const count = Math.ceil(days / 30)
  const labels = Array.from({ length: count }, (_, index) => `M${index + 1}`)
  return buildTrendSeries(labels, seed, title, rangeSubtitle)
}

const buildCustomOverview = (
  start: string,
  end: string,
  trend: OverviewData['trend'],
): OverviewData => {
  const range = normalizeRange(start, end)
  const days = getRangeDays(range.start, range.end)
  const seed = hashString(`${range.start}|${range.end}`)
  const revenueFactor = 0.85 + (seed % 20) / 100
  const revenueValue = 24890 * days * revenueFactor
  const revenueDelta = `+${Math.min(18, 4 + (seed % 15))}%`
  const revenueProgress = clampValue(60 + (seed % 30), 45, 95)

  const ordersTotal = Math.max(
    1,
    Math.round(184 * days * (0.75 + (seed % 20) / 100)),
  )
  const pendingOrders = Math.max(
    1,
    Math.round(ordersTotal * (0.2 + (seed % 5) / 100)),
  )
  const ordersProgress = clampValue(45 + (seed % 40), 35, 90)

  const weights = [0.22, 0.3, 0.43, 0.05]
  const shift = (seed % 5) / 100
  weights[0] += shift
  weights[2] -= shift
  const statusValues = weights.map((weight) => Math.round(ordersTotal * weight))
  statusValues[statusValues.length - 1] =
    ordersTotal - statusValues.slice(0, -1).reduce((sum, value) => sum + value, 0)

  const unitScale = Math.max(1, Math.round(days / 7))
  const topProducts = [
    { name: 'SCS SX Pro Elite', units: formatUnits(1240 * unitScale) },
    { name: 'SCS SX Wireless Pro', units: formatUnits(980 * unitScale) },
    { name: 'SCS Professional Studio', units: formatUnits(740 * unitScale) },
  ]

  const dealersNew = Math.max(1, Math.round(days * 0.2 + (seed % 4)))
  const dealersPending = Math.max(0, Math.round(dealersNew * 0.4))
  const adminsTotal = 4
  const adminsPending = 1
  const wholesalePrograms = Math.max(2, Math.round(days * 0.04 + (seed % 3)))
  const wholesaleExpiring = Math.max(0, Math.round(wholesalePrograms * 0.3))
  const productsPublished = Math.max(1, Math.round(days * 0.18 + (seed % 5)))
  const productsDraft = Math.max(0, Math.round(productsPublished * 0.4))
  const blogsPublished = Math.max(1, Math.round(days * 0.35 + (seed % 6)))
  const blogsDraft = Math.max(0, Math.round(blogsPublished * 0.3))

  return {
    revenueLabel: 'Doanh thu trong khoảng',
    revenue: {
      value: revenueValue,
      delta: revenueDelta,
      progress: revenueProgress,
    },
    orders: {
      total: ordersTotal,
      pending: pendingOrders,
      progress: ordersProgress,
    },
    orderStatus: [
      { label: 'Chờ xử lý', value: statusValues[0] },
      { label: 'Đang giao', value: statusValues[1] },
      { label: 'Hoàn tất', value: statusValues[2] },
      { label: 'Hủy', value: statusValues[3] },
    ],
    topProducts,
    system: [
      {
        label: 'Đại lý',
        value: `${formatNumber(dealersNew)} mới`,
        hint: `${formatNumber(dealersPending)} chờ duyệt`,
        tone: 'warn',
        group: 'sales',
      },
      {
        label: 'Chiết khấu bán sỉ',
        value: `${formatNumber(wholesalePrograms)} chương trình`,
        hint: `${formatNumber(wholesaleExpiring)} sắp hết hạn`,
        tone: 'warn',
        group: 'sales',
      },
      {
        label: 'Sản phẩm',
        value: `${formatNumber(productsPublished)} xuất bản`,
        hint: `${formatNumber(productsDraft)} bản nháp`,
        tone: 'neutral',
        group: 'sales',
      },
      {
        label: 'Quản trị',
        value: `${formatNumber(adminsTotal)} tài khoản`,
        hint: `${formatNumber(adminsPending)} chờ duyệt`,
        tone: 'neutral',
        group: 'ops',
      },
      {
        label: 'Bài viết',
        value: `${formatNumber(blogsPublished)} xuất bản`,
        hint: `${formatNumber(blogsDraft)} bản nháp`,
        tone: 'neutral',
        group: 'ops',
      },
    ],
    trend,
  }
}

function DashboardPage() {
  const panelClass =
    'rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]'
  const statCardClass =
    'group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-white/80 p-5 shadow-[0_16px_30px_rgba(15,23,42,0.06)] backdrop-blur'
  const softCardClass =
    'rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4'
  const { t, language } = useLanguage()

  const today = new Date()
  const todayInput = toInputDate(today)
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('day')
  const [customRange, setCustomRange] = useState(() => ({
    start: todayInput,
    end: todayInput,
  }))
  const [isRevenueOpen, setIsRevenueOpen] = useState(false)
  const revenueDropdownRef = useRef<HTMLDivElement | null>(null)
  const revenuePeriodLabel = t(revenuePeriodLabelMap[revenuePeriod])
  const range = normalizeRange(
    customRange.start || todayInput,
    customRange.end || todayInput,
  )
  const isCustomPeriod = revenuePeriod === 'custom'
  const revenuePeriodHint = isCustomPeriod
    ? t('Từ {start} đến {end}', { start: range.start, end: range.end })
    : t(revenuePeriodHintMap[revenuePeriod])
  const updatedAtLabel = new Intl.DateTimeFormat(
    language === 'en' ? 'en-US' : 'vi-VN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(today)
  const trend = buildTrendForPeriod(revenuePeriod, range, today, t)
  const baseOverview = isCustomPeriod
    ? buildCustomOverview(range.start, range.end, trend)
    : mockOverviewByPeriod[revenuePeriod as StaticPeriod]
  const overview = { ...baseOverview, trend }
  const lowStock = mockLowStock
  const revenueLabel = t(overview.revenueLabel)
  const trendLabels = overview.trend.points.map((point) => point.label)
  const trendValues = overview.trend.points.map((point) => point.value)
  const trendAverage = trendValues.length
    ? trendValues.reduce((sum, value) => sum + value, 0) / trendValues.length
    : 0
  const trendAverageSeries = trendValues.map(() => trendAverage)
  const trendBorderWidths = trendValues.map((_, index) =>
    index === trendValues.length - 1 ? 2 : 0,
  )
  const orderStatusTotal = overview.orderStatus.reduce(
    (sum, item) => sum + item.value,
    0,
  )
  const orderStatusLabels = overview.orderStatus.map((item) => t(item.label))
  const orderStatusValues = overview.orderStatus.map((item) => item.value)
  const orderStatusColors = ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444']
  const translateCountText = (value: string) => {
    const match = value.match(/^([\\d.,]+)\\s+(.+)$/)
    if (!match) return t(value)
    return `${match[1]} ${t(match[2])}`
  }
  const cardSurfaceMutedClass =
    'border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]'
  const systemToneClasses: Record<
    NonNullable<OverviewData['system'][number]['tone']>,
    string
  > = {
    good: 'text-emerald-600 dark:text-emerald-300',
    warn: 'text-amber-600 dark:text-amber-300',
    neutral: 'text-slate-700 dark:text-slate-200',
  }
  const systemGroups = [
    { id: 'sales', label: 'Kênh bán & ưu đãi' },
    { id: 'ops', label: 'Nội bộ & nội dung' },
  ] as const
  const groupedSystem = systemGroups
    .map((group) => ({
      ...group,
      items: overview.system.filter(
        (item) => (item.group ?? 'sales') === group.id,
      ),
    }))
    .filter((group) => group.items.length > 0)

  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
  const accentColor = (() => {
    if (typeof window === 'undefined') {
      return '#2563eb'
    }
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent')
      .trim()
    return value || '#2563eb'
  })()
  const mutedColor = (() => {
    if (typeof window === 'undefined') {
      return '#64748b'
    }
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue('--muted')
      .trim()
    return value || '#64748b'
  })()
  const highlightColor = isDark ? 'rgba(248,250,252,0.7)' : 'rgba(15,23,42,0.35)'
  const averageLineColor = isDark ? 'rgba(148,163,184,0.8)' : 'rgba(100,116,139,0.85)'
  const trendBorderColors = trendValues.map((_, index) =>
    index === trendValues.length - 1 ? highlightColor : 'transparent',
  )

  const trendChartData: ChartData<'bar' | 'line', number[], string> = {
    labels: trendLabels,
    datasets: [
      {
        type: 'bar' as const,
        label: t('Doanh số'),
        data: trendValues,
        backgroundColor: accentColor,
        borderColor: trendBorderColors,
        borderRadius: 12,
        borderSkipped: false,
        maxBarThickness: 22,
        borderWidth: trendBorderWidths,
      },
      {
        type: 'line' as const,
        label: t('Trung bình'),
        data: trendAverageSeries,
        borderColor: averageLineColor,
        borderWidth: 2,
        borderDash: [6, 6],
        pointRadius: 0,
        tension: 0.35,
      },
    ],
  }

  const trendChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: isDark
          ? 'rgba(15,23,42,0.9)'
          : 'rgba(15,23,42,0.85)',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        displayColors: false,
        padding: 10,
        callbacks: {
          title: (items) => items[0]?.label ?? '',
          label: (context) => {
            const name = context.dataset.label
            const value = formatCurrency(context.parsed.y ?? 0)
            return name ? `${name}: ${value}` : value
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: mutedColor,
          autoSkip: true,
          maxTicksLimit: 8,
          maxRotation: 0,
          minRotation: 0,
          font: { size: 10, weight: 600, family: 'Be Vietnam Pro' },
        },
        border: { display: false },
      },
      y: {
        display: false,
        beginAtZero: true,
        suggestedMax: 100,
      },
    },
  }

  const orderStatusChartData = {
    labels: orderStatusLabels,
    datasets: [
      {
        data: orderStatusValues,
        backgroundColor: orderStatusColors,
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }

  const orderStatusChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: isDark
          ? 'rgba(15,23,42,0.9)'
          : 'rgba(15,23,42,0.85)',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        displayColors: false,
        padding: 10,
      },
    },
  }

  const formatCsvValue = (value: string | number) => {
    const raw = String(value)
    const escaped = raw.replace(/"/g, '""')
    const safe =
      escaped.startsWith('=') ||
      escaped.startsWith('+') ||
      escaped.startsWith('-') ||
      escaped.startsWith('@')
        ? `'${escaped}`
        : escaped
    return `"${safe}"`
  }

  const buildCsv = (rows: Array<Array<string | number>>) =>
    rows.map((row) => row.map(formatCsvValue).join(',')).join('\r\n')

  const handleExportReport = () => {
    const rows: Array<Array<string | number>> = [
      [t('Báo cáo tổng quan')],
      [t('Kỳ'), revenuePeriodHint],
      [t('Cập nhật lúc'), updatedAtLabel],
      [],
      [t('Chỉ số chính')],
      [t('Doanh thu'), formatCurrency(overview.revenue.value)],
      [t('Biến động'), overview.revenue.delta],
      [t('Đơn hàng'), overview.orders.total],
      [t('Đơn hàng chờ xử lý'), overview.orders.pending],
      [t('Tồn kho thấp (hiện tại)'), `${lowStock.skus} SKUs`],
      [t('Cần bổ sung'), lowStock.restock],
      [],
      [t('Đơn hàng theo trạng thái')],
      ...overview.orderStatus.map((item) => [t(item.label), item.value]),
      [],
      [t('Sản phẩm nổi bật')],
      ...overview.topProducts.map((item) => [item.name, item.units]),
      [],
      [t('Tổng quan hệ thống')],
      ...overview.system.map((item) => [
        t(item.label),
        item.hint
          ? `${translateCountText(item.value)} (${translateCountText(item.hint)})`
          : translateCountText(item.value),
      ]),
      [],
      [t('Xu hướng doanh số'), overview.trend.subtitle],
      ...overview.trend.points.map((point) => [point.label, point.value]),
    ]

    const csv = buildCsv(rows)
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const timestamp = new Date()
      .toISOString()
      .replace(/[:T]/g, '')
      .slice(0, 12)
    anchor.href = url
    anchor.download = `bao-cao-${revenuePeriod}-${timestamp}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!revenueDropdownRef.current) {
        return
      }
      if (!revenueDropdownRef.current.contains(event.target as Node)) {
        setIsRevenueOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsRevenueOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <section className={`${panelClass} animate-card-enter`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {t('Tổng quan')}
          </h3>
          <p className="text-sm text-slate-500">
            {t('Tổng quan doanh số, đơn hàng, tồn kho và thống kê toàn hệ thống.')}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {t('Kỳ: {period} - Cập nhật lúc {time}', {
              period: revenuePeriodHint,
              time: updatedAtLabel,
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex flex-col gap-3">
            <div className="relative" ref={revenueDropdownRef}>
              <span className="block text-xs uppercase tracking-[0.3em] text-slate-400">
                {t('Kỳ báo cáo')}
              </span>
              <button
                aria-expanded={isRevenueOpen}
                aria-haspopup="listbox"
                className="mt-2 inline-flex h-10 w-44 items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-ghost)] px-4 text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:border-[var(--accent)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] focus:outline-none"
                onClick={() => setIsRevenueOpen((prev) => !prev)}
                type="button"
              >
                <span>{revenuePeriodLabel}</span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition ${
                    isRevenueOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isRevenueOpen && (
                <div
                  aria-label={t('Chọn kỳ báo cáo')}
                  className="absolute right-0 z-20 mt-2 w-44 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
                  role="listbox"
                >
                  {revenueOptions.map((option) => {
                    const isActive = option.value === revenuePeriod
                    return (
                      <button
                        aria-selected={isActive}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                          isActive
                            ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                            : 'text-[var(--muted)] hover:bg-[var(--surface-muted)]'
                        }`}
                        key={option.value}
                        onClick={() => {
                          setRevenuePeriod(option.value)
                          setIsRevenueOpen(false)
                        }}
                        role="option"
                        type="button"
                      >
                        {t(option.label)}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <button
            className="btn-stable inline-flex h-10 items-center gap-2 self-end rounded-2xl bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0"
            onClick={handleExportReport}
            type="button"
          >
            <Download className="h-4 w-4" />
            {t('Xuất báo cáo')}
          </button>
        </div>
      </div>
      {revenuePeriod === "custom" && (
        <div className="mt-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {t('Khoảng thời gian tùy chỉnh')}
              </p>
              <p className="text-xs text-slate-500">
                {t('Chọn ngày bắt đầu và kết thúc (đến hôm nay).')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold text-slate-500">
                {t('Từ ngày')}
                <input
                  className="mt-2 h-10 w-44 rounded-2xl border border-[var(--border)] bg-[var(--surface-ghost)] px-3 text-sm text-[var(--ink)] shadow-sm focus:outline-none"
                  max={todayInput}
                  onChange={(event) => {
                    const nextValue = event.target.value || todayInput
                    const safeStart = nextValue > todayInput ? todayInput : nextValue
                    setCustomRange((prev) => {
                      const prevEnd = prev.end || safeStart
                      const boundedEnd = prevEnd > todayInput ? todayInput : prevEnd
                      return {
                        start: safeStart,
                        end: boundedEnd >= safeStart ? boundedEnd : safeStart,
                      }
                    })
                  }}
                  type="date"
                  value={customRange.start}
                />
              </label>
              <label className="text-xs font-semibold text-slate-500">
                {t('Đến ngày')}
                <input
                  className="mt-2 h-10 w-44 rounded-2xl border border-[var(--border)] bg-[var(--surface-ghost)] px-3 text-sm text-[var(--ink)] shadow-sm focus:outline-none"
                  min={customRange.start}
                  max={todayInput}
                  onChange={(event) => {
                    const nextValue = event.target.value || todayInput
                    const safeEnd = nextValue > todayInput ? todayInput : nextValue
                    setCustomRange((prev) => ({
                      start: prev.start && prev.start <= safeEnd ? prev.start : safeEnd,
                      end: safeEnd,
                    }))
                  }}
                  type="date"
                  value={customRange.end}
                />
              </label>
            </div>
          </div>
        </div>
      )}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className={statCardClass}>
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--accent-soft)] opacity-70 transition group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {revenueLabel}
                  </p>
                  <h4 className="mt-1 text-2xl font-semibold text-[var(--accent)]">
                    {formatCurrency(overview.revenue.value)}
                  </h4>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                {overview.revenue.delta}
              </span>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${overview.revenue.progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className={statCardClass}>
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--accent-cool-soft)] opacity-70 transition group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent-cool-soft)] text-[var(--accent-cool)]">
                  <ShoppingCart className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {t('Đơn hàng')}
                  </p>
                  <h4 className="mt-1 text-2xl font-semibold text-slate-900">
                    {overview.orders.total}
                  </h4>
                </div>
              </div>
              <span className="rounded-full bg-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-200/10 dark:text-slate-300">
                {t('{count} chờ xử lý', {
                  count: overview.orders.pending,
                })}
              </span>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[var(--accent-cool)]"
                style={{ width: `${overview.orders.progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className={statCardClass}>
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-200/50 opacity-70 transition group-hover:scale-110 dark:bg-amber-500/20" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-200/60 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {t('Tồn kho thấp - hiện tại')}
                  </p>
                  <h4 className="mt-1 text-2xl font-semibold text-slate-900">
                    {lowStock.skus} SKUs
                  </h4>
                </div>
              </div>
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                {t('{count} cần bổ sung', { count: lowStock.restock })}
              </span>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${lowStock.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid min-w-0 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className={`${softCardClass} min-w-0 overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {overview.trend.title}
              </p>
              <p className="text-xs text-slate-500">{overview.trend.subtitle}</p>
            </div>
          </div>
          <div className="mt-4 h-28 w-full min-w-0 overflow-hidden">
            <Bar
              aria-label={t('Xu hướng doanh số {subtitle}', {
                subtitle: overview.trend.subtitle,
              })}
              className="w-full"
              data={trendChartData as ChartData<'bar', number[], string>}
              options={trendChartOptions}
              role="img"
            />
          </div>
        </div>

        <div className={`${softCardClass} min-w-0 overflow-hidden`}>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {t('Đơn hàng theo trạng thái')}
            </p>
            <p className="text-xs text-slate-500">
              {t('Phân bổ đơn hàng theo kỳ đã chọn')}
            </p>
          </div>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-[140px_1fr] sm:items-center">
            <div className="relative mx-auto h-36 w-36">
              <Doughnut
                aria-label={t('Đơn hàng theo trạng thái')}
                className="w-full"
                data={orderStatusChartData}
                options={orderStatusChartOptions}
                role="img"
              />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {t('Tổng')}
                </span>
                <span className="text-lg font-semibold text-[var(--ink)]">
                  {overview.orders.total}
                </span>
              </div>
            </div>
            <div className="min-w-0 space-y-2 text-sm text-slate-600">
              {overview.orderStatus.map((item, index) => {
                const percentage = orderStatusTotal
                  ? Math.round((item.value / orderStatusTotal) * 100)
                  : 0
                return (
                  <div className="flex items-center justify-between" key={item.label}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: orderStatusColors[index] }}
                      />
                      <span>{t(item.label)}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {item.value} - {percentage}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={softCardClass}>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Package className="h-4 w-4 text-[var(--accent-strong)]" />
            {t('Sản phẩm nổi bật')}
          </div>
          <ul className="app-scroll mt-4 h-[300px] space-y-3 overflow-y-auto pr-1 text-sm text-slate-600">
            {overview.topProducts.map((item) => (
              <li
                className={`flex items-center justify-between rounded-2xl px-4 py-3 ${cardSurfaceMutedClass}`}
                key={item.name}
              >
                <span>{item.name}</span>
                <span className="text-xs font-semibold text-slate-400">
                  {item.units}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={softCardClass}>
          <div className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
            <span>{t('Tổng quan hệ thống')}</span>
            <span className="text-xs text-slate-400">{revenuePeriodHint}</span>
          </div>
          <div className="app-scroll mt-4 h-[300px] overflow-y-auto pr-1">
            <div className="grid gap-4 md:grid-cols-2">
              {groupedSystem.map((group) => (
                <div className="space-y-3" key={group.id}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {t(group.label)}
                  </p>
                  <div className="grid gap-3">
                    {group.items.map((item) => {
                      const tone = item.tone ?? 'neutral'
                      return (
                        <div
                          className={`rounded-2xl p-4 ${cardSurfaceMutedClass}`}
                          key={`${group.id}-${item.label}`}
                        >
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            {t(item.label)}
                          </p>
                          <div className="mt-2 flex items-baseline justify-between gap-2">
                            <span
                              className={`text-lg font-semibold ${systemToneClasses[tone]}`}
                            >
                              {translateCountText(item.value)}
                            </span>
                            {item.hint && (
                              <span className="text-xs text-slate-400">
                                {translateCountText(item.hint)}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DashboardPage
