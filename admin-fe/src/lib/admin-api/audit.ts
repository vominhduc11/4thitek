import { type BackendPagedResponse, authorizedJsonRequest } from './client'

export type BackendAuditLogResponse = {
  id: number
  createdAt?: string | null
  actor?: string | null
  actorRole?: string | null
  action?: string | null
  requestMethod?: string | null
  requestPath?: string | null
  entityType?: string | null
  entityId?: string | null
  ipAddress?: string | null
}

export const fetchAdminAuditLogs = (
  token: string,
  page?: number,
  size?: number,
  filters?: { from?: string; to?: string; actor?: string; action?: string; entityType?: string; entityId?: string },
) =>
  authorizedJsonRequest<BackendPagedResponse<BackendAuditLogResponse>>({
    path: '/admin/audit-logs',
    token,
    params: {
      page: page ?? 0,
      size: size ?? 50,
      from: filters?.from,
      to: filters?.to,
      actor: filters?.actor,
      action: filters?.action,
      entityType: filters?.entityType,
      entityId: filters?.entityId,
    },
  })
