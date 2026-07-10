import { authorizedJsonRequest } from './client'

export type BackendDashboardResponse = {
  revenue: {
    label: string
    value: number | string
    delta: string
    progress: number
  }
  orders: {
    total: number
    pending: number
    progress: number
  }
  lowStock: {
    skus: number
    restock: number
    progress: number
  }
  orderStatus: Array<{
    label: string
    value: number
  }>
  topProducts: Array<{
    name: string
    units: string
  }>
  system: Array<{
    label: string
    value: string
    hint: string
    tone: 'warn' | 'good' | 'neutral'
    group: 'sales' | 'ops'
  }>
  trend: {
    title: string
    subtitle: string
    points: Array<{
      label: string
      value: number
    }>
  }
  unmatchedPendingCount: number
  settlementPendingCount: number
  staleOrdersCount: number
  shippingOverdueCount: number
}

export const fetchAdminDashboard = (token: string) =>
  authorizedJsonRequest<BackendDashboardResponse>({
    path: '/admin/dashboard',
    token,
  })
