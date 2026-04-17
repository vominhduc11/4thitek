// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import DashboardPageRevamp from './DashboardPageRevamp'

const {
  fetchAdminDashboardMock,
  subscribeAdminDashboardRefreshMock,
  notifyMock,
  barMock,
  doughnutMock,
} = vi.hoisted(() => ({
  fetchAdminDashboardMock: vi.fn(),
  subscribeAdminDashboardRefreshMock: vi.fn(),
  notifyMock: vi.fn(),
  barMock: vi.fn(() => <div data-testid="trend-chart" />),
  doughnutMock: vi.fn(() => <div data-testid="order-status-chart" />),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    accessToken: 'admin-token',
  }),
}))

vi.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (value: string) => value,
  }),
}))

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    notify: notifyMock,
  }),
}))

vi.mock('../lib/adminApi', async () => {
  const actual = await vi.importActual('../lib/adminApi')
  return {
    ...actual,
    fetchAdminDashboard: fetchAdminDashboardMock,
  }
})

vi.mock('../lib/adminRealtime', () => ({
  subscribeAdminDashboardRefresh: subscribeAdminDashboardRefreshMock,
}))

vi.mock('react-chartjs-2', () => ({
  Bar: barMock,
  Doughnut: doughnutMock,
}))

describe('DashboardPageRevamp', () => {
  beforeEach(() => {
    fetchAdminDashboardMock.mockReset()
    subscribeAdminDashboardRefreshMock.mockReset()
    notifyMock.mockReset()
    subscribeAdminDashboardRefreshMock.mockReturnValue(() => {})
    fetchAdminDashboardMock.mockResolvedValue({
      revenue: { label: 'Doanh thu', value: 1200000, delta: '+12%', progress: 68 },
      orders: { total: 20, pending: 3, progress: 50 },
      lowStock: { skus: 4, restock: 2, progress: 40 },
      orderStatus: [
        { label: 'Pending', value: 3 },
        { label: 'Confirmed', value: 4 },
      ],
      topProducts: [{ name: 'Pin du phong 42', units: '12' }],
      system: [],
      trend: {
        title: 'Revenue',
        subtitle: 'Last 7 days',
        points: [{ label: 'Mon', value: 5 }],
      },
      unmatchedPendingCount: 0,
      settlementPendingCount: 0,
      staleOrdersCount: 0,
      shippingOverdueCount: 0,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders four KPI skeleton cards while dashboard data is loading', async () => {
    fetchAdminDashboardMock.mockImplementation(() => new Promise(() => {}))

    const { container } = render(
      <MemoryRouter>
        <DashboardPageRevamp />
      </MemoryRouter>,
    )

    expect(container.querySelectorAll('[class*="dashboard-stat-skeleton-"]')).toHaveLength(0)
    expect(container.querySelectorAll('.animate-pulse.h-28')).toHaveLength(4)
    await waitFor(() => expect(fetchAdminDashboardMock).toHaveBeenCalledWith('admin-token'))
  })

  it('routes the low-stock stat card to the filtered products view', async () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardPageRevamp />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(fetchAdminDashboardMock).toHaveBeenCalledWith('admin-token')
    })

    const lowStockLink = container.querySelector('a[href="/products?inventoryAlert=low"]')
    expect(lowStockLink).toBeTruthy()
  })

  it('routes the total-orders stat card to the full orders list', async () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardPageRevamp />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(fetchAdminDashboardMock).toHaveBeenCalledWith('admin-token')
    })

    const totalOrdersLink = Array.from(container.querySelectorAll('a[href="/orders"]')).find((element) =>
      element.textContent?.includes('Tổng đơn hàng'),
    )
    expect(totalOrdersLink).toBeTruthy()
  })

  it('routes stale-order alerts to the pending orders queue', async () => {
    fetchAdminDashboardMock.mockResolvedValue({
      revenue: { label: 'Doanh thu', value: 1200000, delta: '+12%', progress: 68 },
      orders: { total: 20, pending: 3, progress: 50 },
      lowStock: { skus: 4, restock: 2, progress: 40 },
      orderStatus: [
        { label: 'Pending', value: 3 },
        { label: 'Confirmed', value: 4 },
      ],
      topProducts: [{ name: 'Pin du phong 42', units: '12' }],
      system: [],
      trend: {
        title: 'Revenue',
        subtitle: 'Last 7 days',
        points: [{ label: 'Mon', value: 5 }],
      },
      unmatchedPendingCount: 0,
      settlementPendingCount: 0,
      staleOrdersCount: 2,
      shippingOverdueCount: 0,
    })

    const { container } = render(
      <MemoryRouter>
        <DashboardPageRevamp />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(fetchAdminDashboardMock).toHaveBeenCalledWith('admin-token')
    })

    const staleOrdersLink = container.querySelector('a[href="/orders?status=pending"]')
    expect(staleOrdersLink?.textContent).toContain('Đơn hàng cần xem xét')
  })

  it('uses the standard page heading and does not reuse the generic dashboard empty message for top products', async () => {
    fetchAdminDashboardMock.mockResolvedValue({
      revenue: { label: 'Doanh thu', value: 0, delta: '0%', progress: 0 },
      orders: { total: 0, pending: 0, progress: 0 },
      lowStock: { skus: 0, restock: 0, progress: 0 },
      orderStatus: [],
      topProducts: [],
      system: [],
      trend: {
        title: 'Revenue',
        subtitle: 'Last 7 days',
        points: [],
      },
      unmatchedPendingCount: 0,
      settlementPendingCount: 0,
      staleOrdersCount: 0,
      shippingOverdueCount: 0,
    })

    render(
      <MemoryRouter>
        <DashboardPageRevamp />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(fetchAdminDashboardMock).toHaveBeenCalledWith('admin-token')
    })

    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    expect(screen.queryByText(/Backend/i)).toBeNull()
  })
})
