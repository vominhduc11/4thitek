export const ADMIN_NOTIFICATION_EVENT = 'admin:notification-created'
export const ADMIN_DASHBOARD_REFRESH_EVENT = 'admin:dashboard-refresh'
export const ADMIN_SUPPORT_EVENT = 'admin:support-refresh'

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

export type AdminRealtimeSupportEvent = {
  ticketId: number
  ticketCode: string
  dealerId: number
  dealerName: string
  category: string | null
  priority: string | null
  subject: string
  createdAt: string
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

export const emitAdminSupportRefresh = (event: AdminRealtimeSupportEvent) => {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent<AdminRealtimeSupportEvent>(ADMIN_SUPPORT_EVENT, {
      detail: event,
    }),
  )
}

export const subscribeAdminSupportRefresh = (
  listener: (event: AdminRealtimeSupportEvent) => void,
) => {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<AdminRealtimeSupportEvent>).detail
    if (detail) {
      listener(detail)
    }
  }

  window.addEventListener(ADMIN_SUPPORT_EVENT, handler as EventListener)
  return () => window.removeEventListener(ADMIN_SUPPORT_EVENT, handler as EventListener)
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
