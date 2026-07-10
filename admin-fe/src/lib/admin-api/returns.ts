import {
  BackendReturnRequestType,
  BackendReturnRequestStatus,
  BackendReturnRequestResolution,
  BackendReturnRequestItemStatus,
  BackendReturnRequestItemCondition,
  BackendReturnRequestItemFinalResolution,
  BackendReturnRequestAttachmentCategory,
  BackendRmaAction,
  BackendPagedResponse,
  authorizedJsonRequest,
} from './client'

export type BackendReturnRequestSummaryResponse = {
  id: number
  requestCode?: string | null
  dealerId?: number | null
  dealerName?: string | null
  orderId?: number | null
  orderCode?: string | null
  type?: BackendReturnRequestType | null
  status?: BackendReturnRequestStatus | null
  requestedResolution?: BackendReturnRequestResolution | null
  reasonCode?: string | null
  reasonDetail?: string | null
  supportTicketId?: number | null
  requestedAt?: string | null
  reviewedAt?: string | null
  receivedAt?: string | null
  completedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  totalItems?: number | null
  requestedItems?: number | null
  approvedItems?: number | null
  rejectedItems?: number | null
  resolvedItems?: number | null
}

export type BackendReturnRequestItemResponse = {
  id: number
  orderItemId?: number | null
  productId?: number | null
  productName?: string | null
  productSku?: string | null
  productSerialId?: number | null
  serialSnapshot?: string | null
  itemStatus?: BackendReturnRequestItemStatus | null
  conditionOnRequest?: BackendReturnRequestItemCondition | null
  adminDecisionNote?: string | null
  inspectionNote?: string | null
  finalResolution?: BackendReturnRequestItemFinalResolution | null
  replacementOrderId?: number | null
  replacementSerialId?: number | null
  refundAmount?: number | string | null
  creditAmount?: number | string | null
  orderAdjustmentId?: number | null
}

export type BackendReturnRequestAttachmentResponse = {
  id: number
  itemId?: number | null
  mediaAssetId?: number | null
  url?: string | null
  fileName?: string | null
  category?: BackendReturnRequestAttachmentCategory | null
}

export type BackendReturnRequestEventResponse = {
  id: number
  eventType?: string | null
  actor?: string | null
  actorRole?: string | null
  payloadJson?: string | null
  createdAt?: string | null
}

export type BackendReturnRequestDetailResponse = {
  id: number
  requestCode?: string | null
  dealerId?: number | null
  dealerName?: string | null
  orderId?: number | null
  orderCode?: string | null
  type?: BackendReturnRequestType | null
  status?: BackendReturnRequestStatus | null
  requestedResolution?: BackendReturnRequestResolution | null
  reasonCode?: string | null
  reasonDetail?: string | null
  supportTicketId?: number | null
  requestedAt?: string | null
  reviewedAt?: string | null
  receivedAt?: string | null
  completedAt?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  items?: BackendReturnRequestItemResponse[] | null
  attachments?: BackendReturnRequestAttachmentResponse[] | null
  events?: BackendReturnRequestEventResponse[] | null
}

export type BackendAdminReviewReturnItemDecisionRequest = {
  itemId: number
  approved: boolean
  decisionNote?: string
}

export type BackendAdminReviewReturnRequest = {
  decisions: BackendAdminReviewReturnItemDecisionRequest[]
  awaitingReceipt?: boolean
}

export type BackendAdminReceiveReturnRequest = {
  itemIds?: number[] | null
  note?: string | null
}

export type BackendAdminInspectReturnItemRequest = {
  rmaAction: BackendRmaAction
  reason: string
  proofUrls?: string[]
  finalResolution?: BackendReturnRequestItemFinalResolution
  replacementOrderId?: number
  refundAmount?: number
  creditAmount?: number
}

export type BackendAdminCompleteReturnRequest = {
  note?: string | null
}

export const fetchAdminReturnsPaged = (
  token: string,
  params?: {
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
    status?: BackendReturnRequestStatus
    type?: BackendReturnRequestType
    dealer?: string
    orderCode?: string
    serial?: string
  },
) =>
  authorizedJsonRequest<BackendPagedResponse<BackendReturnRequestSummaryResponse>>({
    path: '/admin/returns/page',
    token,
    params,
  })

export const fetchAdminReturnDetail = (token: string, requestId: number) =>
  authorizedJsonRequest<BackendReturnRequestDetailResponse>({
    path: `/admin/returns/${requestId}`,
    token,
  })

export const reviewAdminReturnRequest = (
  token: string,
  requestId: number,
  body: BackendAdminReviewReturnRequest,
) =>
  authorizedJsonRequest<BackendReturnRequestDetailResponse>({
    path: `/admin/returns/${requestId}/review`,
    token,
    method: 'PATCH',
    body,
  })

export const receiveAdminReturnRequest = (
  token: string,
  requestId: number,
  body?: BackendAdminReceiveReturnRequest,
) =>
  authorizedJsonRequest<BackendReturnRequestDetailResponse>({
    path: `/admin/returns/${requestId}/receive`,
    token,
    method: 'PATCH',
    body: body ?? {},
  })

export const inspectAdminReturnItem = (
  token: string,
  requestId: number,
  itemId: number,
  body: BackendAdminInspectReturnItemRequest,
) =>
  authorizedJsonRequest<BackendReturnRequestDetailResponse>({
    path: `/admin/returns/${requestId}/items/${itemId}/inspect`,
    token,
    method: 'PATCH',
    body,
  })

export const completeAdminReturnRequest = (
  token: string,
  requestId: number,
  body?: BackendAdminCompleteReturnRequest,
) =>
  authorizedJsonRequest<BackendReturnRequestDetailResponse>({
    path: `/admin/returns/${requestId}/complete`,
    token,
    method: 'PATCH',
    body: body ?? {},
  })
