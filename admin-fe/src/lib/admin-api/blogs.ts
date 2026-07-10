import { type BackendBlogStatus, authorizedJsonRequest } from './client'

export type BackendBlogResponse = {
  id: number
  categoryId?: number | null
  categoryName?: string | null
  title: string
  description: string
  image?: string | null
  introduction?: string | null
  status?: BackendBlogStatus | null
  scheduledAt?: string | null
  showOnHomepage?: boolean | null
  isDeleted?: boolean | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type BackendBlogUpsertRequest = {
  categoryId?: number
  categoryName?: string
  title?: string
  description?: string
  image?: string
  introduction?: string
  status?: BackendBlogStatus
  scheduledAt?: string | null
  showOnHomepage?: boolean
  isDeleted?: boolean
}

export type BackendCategory = {
  id: number
  name: string
}

export const fetchAdminBlogs = (token: string) =>
  authorizedJsonRequest<BackendBlogResponse[]>({
    path: '/admin/blogs',
    token,
  })

export const createAdminBlog = (token: string, body: BackendBlogUpsertRequest) =>
  authorizedJsonRequest<BackendBlogResponse>({
    path: '/admin/blogs',
    token,
    method: 'POST',
    body,
  })

export const updateAdminBlog = (token: string, id: number, body: BackendBlogUpsertRequest) =>
  authorizedJsonRequest<BackendBlogResponse>({
    path: `/admin/blogs/${id}`,
    token,
    method: 'PUT',
    body,
  })

export const deleteAdminBlog = (token: string, id: number) =>
  authorizedJsonRequest<{ status: string }>({
    path: `/admin/blogs/${id}`,
    token,
    method: 'DELETE',
  })

export const fetchAdminCategories = (token: string) =>
  authorizedJsonRequest<BackendCategory[]>({
    path: '/admin/categories',
    token,
  })
