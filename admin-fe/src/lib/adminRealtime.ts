export const ADMIN_NOTIFICATION_EVENT = 'admin:notification-created'
export const ADMIN_DASHBOARD_REFRESH_EVENT = 'admin:dashboard-refresh'

export type AdminRealtimeNotification = {
  id: number
  accountId: number | null
  title: string
  body: string
  isRead: boolean | null
  type: string | null
  link: string | null
  deepLink: string | null
  createdAt: string | null
}

export const emitAdminRealtimeNotification = (notification: AdminRealtimeNotification) => {
  if (typeof window === 'undefined') {
    return
  }
  window.dispatchEvent(
    new CustomEvent<AdminRealtimeNotification>(ADMIN_NOTIFICATION_EVENT, {
      detail: notification,
    }),
  )
}

export const subscribeAdminRealtimeNotification = (
  listener: (notification: AdminRealtimeNotification) => void,
) => {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<AdminRealtimeNotification>).detail
    if (detail) {
      listener(detail)
    }
  }

  window.addEventListener(ADMIN_NOTIFICATION_EVENT, handler as EventListener)
  return () => window.removeEventListener(ADMIN_NOTIFICATION_EVENT, handler as EventListener)
}

export const emitAdminDashboardRefresh = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent(ADMIN_DASHBOARD_REFRESH_EVENT))
}

export const subscribeAdminDashboardRefresh = (listener: () => void) => {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handler = () => {
    listener()
  }

  window.addEventListener(ADMIN_DASHBOARD_REFRESH_EVENT, handler)
  return () => window.removeEventListener(ADMIN_DASHBOARD_REFRESH_EVENT, handler)
}
