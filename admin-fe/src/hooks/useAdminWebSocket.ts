import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useEffect, useRef } from 'react'
import { getBackendOrigin } from '../lib/backendApi'

export type AdminNewOrderEvent = {
  orderId: number
  orderCode: string
  dealerId: number
  dealerName: string
  createdAt: string
}

export type AdminNewSupportTicketEvent = {
  ticketId: number
  ticketCode: string
  dealerId: number
  dealerName: string
  category: string | null
  priority: string | null
  subject: string
  createdAt: string
}

export type AdminNewDealerEvent = {
  id: number
  username: string
  status: string
}

export type AdminNotificationEvent = {
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

type AdminWsCallbacks = {
  onNewOrder?: (event: AdminNewOrderEvent) => void
  onNewDealer?: (event: AdminNewDealerEvent) => void
  onNewSupportTicket?: (event: AdminNewSupportTicketEvent) => void
  onNotificationCreated?: (event: AdminNotificationEvent) => void
}

export function useAdminWebSocket(token: string | null, callbacks: AdminWsCallbacks) {
  const callbacksRef = useRef(callbacks)

  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  useEffect(() => {
    if (!token) {
      return
    }

    const origin = getBackendOrigin()
    if (!origin) {
      return
    }

    const wsUrl = `${origin}/ws`

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as WebSocket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/admin/new-orders', (message) => {
          try {
            const event = JSON.parse(message.body) as AdminNewOrderEvent
            callbacksRef.current.onNewOrder?.(event)
          } catch {
            // ignore parse errors
          }
        })

        client.subscribe('/topic/admin/support-tickets', (message) => {
          try {
            const event = JSON.parse(message.body) as AdminNewSupportTicketEvent
            callbacksRef.current.onNewSupportTicket?.(event)
          } catch {
            // ignore parse errors
          }
        })

        client.subscribe('/topic/dealer-registrations', (message) => {
          try {
            const event = JSON.parse(message.body) as AdminNewDealerEvent
            callbacksRef.current.onNewDealer?.(event)
          } catch {
            // ignore parse errors
          }
        })

        client.subscribe('/user/queue/notifications', (message) => {
          try {
            const event = JSON.parse(message.body) as AdminNotificationEvent
            callbacksRef.current.onNotificationCreated?.(event)
          } catch {
            // ignore parse errors
          }
        })
      },
    })

    client.activate()

    return () => {
      void client.deactivate()
    }
  }, [token])
}
