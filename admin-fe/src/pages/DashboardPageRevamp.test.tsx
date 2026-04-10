// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import DashboardPageRevamp from './DashboardPageRevamp'

const {
  fetchAdminDashboardMock,
  subscribeAdminRealtimeNotificationMock,
  notifyMock,
  barMock,
  doughnutMock,
} = vi.hoisted(() => ({
  fetchAdminDashboardMock: vi.fn(),
  subscribeAdminRealtimeNotificationMock: vi.fn(),
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
  subscribeAdminRealtimeNotification: subscribeAdminRealtimeNotificationMock,
}))

vi.mock('react-chartjs-2', () => ({
  Bar: barMock,
  Doughnut: doughnutMock,
}))

describe('DashboardPageRevamp', () => {
  beforeEach(() => {
    fetchAdminDashboardMock.mockReset()
    subscribeAdminRealtimeNotificationMock.mockReset()
    notifyMock.mockReset()
    subscribeAdminRealtimeNotificationMock.mockReturnValue(() => {})
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

  it('routes the low-stock stat card to the filtered products view', async () => {
    render(
      <MemoryRouter>
        <DashboardPageRevamp />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(fetchAdminDashboardMock).toHaveBeenCalledWith('admin-token')
    })

    const lowStockLink = screen.getByRole('link', { name: /Tồn kho thấp/i })
    expect(lowStockLink.getAttribute('href')).toBe('/products?inventoryAlert=low')
  })
})
