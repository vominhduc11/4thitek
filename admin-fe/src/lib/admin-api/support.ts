import {
  BackendSupportCategory,
  BackendSupportPriority,
  BackendSupportTicketStatus,
  BackendSupportMessageAuthorRole,
  BackendMediaType,
  BackendPagedResponse,
  authorizedJsonRequest,
  fetchAllPagedItems,
} from './client'

export type BackendSupportTicketResponse = {
  id: number
  dealerId?: number | null
  dealerName?: string | null
  ticketCode?: string | null
  category?: BackendSupportCategory | null
  priority?: BackendSupportPriority | null
  status?: BackendSupportTicketStatus | null
  subject?: string | null
  message?: string | null
  contextData?: {
    returnRequestId?: number | null
    returnRequestCode?: string | null
    returnStatus?: string | null
    orderId?: number | null
    orderCode?: string | null
    transactionCode?: string | null
    paidAmount?: number | string | null
    paymentReference?: string | null
    serial?: string | null
    returnReason?: string | null
  } | null
  assigneeId?: number | null
  assigneeName?: string | null
  messages?: Array<{
    id: number
    authorRole: BackendSupportMessageAuthorRole
    authorName?: string | null
    internalNote?: boolean | null
    message: string
    attachments?: Array<{
      id?: number | null
      url: string
      accessUrl?: string | null
      fileName?: string | null
      mediaType?: BackendMediaType | null
      contentType?: string | null
      sizeBytes?: number | null
      createdAt?: string | null
    }> | null
    createdAt?: string | null
  }> | null
  createdAt?: string | null
  updatedAt?: string | null
  resolvedAt?: string | null
  closedAt?: string | null
}

export const fetchAdminSupportTickets = (
  token: string,
  params?: { page?: number; size?: number },
) =>
  authorizedJsonRequest<BackendPagedResponse<BackendSupportTicketResponse>>({
    path: '/admin/support-tickets',
    token,
    params,
  })

export const fetchAdminSupportTicket = (token: string, id: number) =>
  authorizedJsonRequest<BackendSupportTicketResponse>({
    path: `/admin/support-tickets/${id}`,
    token,
  })

export const fetchAllAdminSupportTickets = (token: string, size?: number) =>
  fetchAllPagedItems((params) => fetchAdminSupportTickets(token, params), size)

export const updateAdminSupportTicket = (
  token: string,
  id: number,
  body: {
    status: BackendSupportTicketStatus
    assigneeId?: number | null
  },
) =>
  authorizedJsonRequest<BackendSupportTicketResponse>({
    path: `/admin/support-tickets/${id}`,
    token,
    method: 'PATCH',
    body,
  })

export const createAdminSupportTicketMessage = (
  token: string,
  id: number,
  body: {
    message: string
    internalNote?: boolean
    attachments?: Array<{
      url: string
      fileName?: string
    }>
    mediaAssetIds?: number[]
  },
) =>
  authorizedJsonRequest<BackendSupportTicketResponse>({
    path: `/admin/support-tickets/${id}/messages`,
    token,
    method: 'POST',
    body,
  })
