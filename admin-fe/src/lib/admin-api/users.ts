import { type BackendStaffUserStatus, authorizedJsonRequest } from './client'

export type BackendStaffSystemRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SALES'
  | 'WAREHOUSE'
  | 'ACCOUNTANT'
  | 'CONTENT_EDITOR'

export type BackendStaffUserResponse = {
  id: number
  name: string
  role: string
  systemRole?: BackendStaffSystemRole | null
  status?: BackendStaffUserStatus | null
  username?: string | null
  email?: string | null
}

export type BackendStaffUserUpsertRequest = {
  email: string
  name: string
  role: string
  systemRole?: BackendStaffSystemRole
  status?: BackendStaffUserStatus
}

export const fetchAdminUsers = (token: string) =>
  authorizedJsonRequest<BackendStaffUserResponse[]>({
    path: '/admin/users',
    token,
  })

export const createAdminUser = (token: string, body: BackendStaffUserUpsertRequest) =>
  authorizedJsonRequest<BackendStaffUserResponse>({
    path: '/admin/users',
    token,
    method: 'POST',
    body,
  })

export const updateAdminUserStatus = (
  token: string,
  id: number,
  status: BackendStaffUserStatus,
) =>
  authorizedJsonRequest<BackendStaffUserResponse>({
    path: `/admin/users/${id}/status`,
    token,
    method: 'PATCH',
    body: { status },
  })

export const resetAdminUserPassword = (token: string, userId: number) =>
  authorizedJsonRequest<{ status: string }>({
    path: `/admin/users/${userId}/reset-password`,
    token,
    method: 'POST',
  })
