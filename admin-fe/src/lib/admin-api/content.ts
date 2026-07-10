import { authorizedJsonRequest } from './client'

export type BackendPublicContentSectionResponse = {
  id: number
  section: string
  locale: string
  payload: string
  published: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

export type BackendPublicContentSectionUpdateRequest = {
  locale: string
  payload: string
  published: boolean
}

export const fetchAdminPublicContentSections = (token: string) =>
  authorizedJsonRequest<BackendPublicContentSectionResponse[]>({
    path: '/admin/content',
    token,
  })

export const fetchAdminPublicContentSection = (
  token: string,
  section: string,
  locale: string,
) =>
  authorizedJsonRequest<BackendPublicContentSectionResponse>({
    path: `/admin/content/${encodeURIComponent(section)}`,
    token,
    params: { lang: locale },
  })

export const updateAdminPublicContentSection = (
  token: string,
  section: string,
  body: BackendPublicContentSectionUpdateRequest,
) =>
  authorizedJsonRequest<BackendPublicContentSectionResponse>({
    path: `/admin/content/${encodeURIComponent(section)}`,
    token,
    method: 'PUT',
    body,
  })
