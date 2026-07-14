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

// Dry-run xem trước: map bản nháp sang public shape (giống GET /blog/{id}) mà không lưu
// DB. Xem API_CONTRACT §5.1 "Live Preview".
export type PublicBlogPreviewResponse = {
  id: number | null
  title: string | null
  description: string | null
  image: string | null
  category: string | null
  createdAt: string | null
  updatedAt: string | null
  introduction: string | null
  showOnHomepage: boolean
}

export const previewAdminBlog = (token: string, body: BackendBlogUpsertRequest) =>
  authorizedJsonRequest<PublicBlogPreviewResponse>({
    path: '/admin/blogs/preview',
    token,
    method: 'POST',
    body,
  })
