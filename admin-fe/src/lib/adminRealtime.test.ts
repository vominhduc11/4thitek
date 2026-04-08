// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'
import {
  ADMIN_NOTIFICATION_EVENT,
  emitAdminRealtimeNotification,
  subscribeAdminRealtimeNotification,
} from './adminRealtime'

describe('adminRealtime', () => {
  it('broadcasts admin notification refresh events', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeAdminRealtimeNotification(listener)

    emitAdminRealtimeNotification({
      id: 10,
      accountId: 1,
      title: 'Finance update',
      body: 'Settlement pending review',
      isRead: false,
      type: 'ORDER',
      link: '/financial-settlements',
      deepLink: null,
      createdAt: '2026-04-08T10:00:00Z',
    })

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 10,
        title: 'Finance update',
        link: '/financial-settlements',
      }),
    )

    unsubscribe()
    window.dispatchEvent(new CustomEvent(ADMIN_NOTIFICATION_EVENT))
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
