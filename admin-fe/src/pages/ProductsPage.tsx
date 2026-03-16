import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Archive,
  Eye,
  FileDown,
  GripVertical,
  Package,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Star,
  Home,
  X,
} from 'lucide-react'
import Modal, { type Styles } from 'react-modal'
import { ProductVideoPreview } from '../components/ProductVideoPreview'
import Quill from 'quill'
import { RichTextEditor } from '../components/RichTextEditor'
import { ErrorState, LoadingRows, PaginationNav } from '../components/ui-kit'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../context/ProductsContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import type { Product } from '../types/product'
import { resolveBackendAssetUrl } from '../lib/backendApi'
import { deleteStoredFileReference, storeFileReference } from '../lib/upload'

type ProductFilter = 'all' | 'active' | 'lowStock' | 'outOfStock' | 'draft' | 'deleted'
type FeaturedFilter = 'all' | 'featured' | 'nonFeatured'
type HomepageFilter = 'all' | 'homepage' | 'nonHomepage'

type GalleryItem = {
  url: string
}

type ProductSpecificationItem = {
  label: string
  value: string
}

type ProductVideoItem = {
  title: string
  descriptions: string
  url: string
}

type NewProductDraft = {
  name: string
  sku: string
  shortDescription: string
  descriptions: DescriptionItem[]
  specifications: ProductSpecificationItem[]
  videos: ProductVideoItem[]
  retailPrice: string
  warrantyPeriod: string
  publishStatus: 'DRAFT' | 'PUBLISHED'
  isFeatured: boolean
  showOnHomepage: boolean
  imageUrl: string
}

type DescriptionItem = {
  type: 'description' | 'image' | 'gallery' | 'video'
  text?: string
  url?: string
  caption?: string
  gallery?: GalleryItem[]
}

type CreateProductErrorField = 'name' | 'sku' | 'retailPrice' | 'warrantyPeriod' | 'videos'

const createProductErrorFieldOrder: CreateProductErrorField[] = [
  'name',
  'sku',
  'retailPrice',
  'warrantyPeriod',
  'videos',
]

const createProductErrorTabMap: Record<
  CreateProductErrorField,
  'basic' | 'description' | 'specs' | 'videos'
> = {
  name: 'basic',
  sku: 'basic',
  retailPrice: 'basic',
  warrantyPeriod: 'basic',
  videos: 'videos',
}

const createDescriptionTemplate = (): DescriptionItem[] => [
  { type: 'description', text: '' },
  { type: 'image', url: '', caption: '' },
  { type: 'gallery', gallery: [] },
  { type: 'video', url: '', caption: '' },
]

const createDescriptionBlock = (type: DescriptionItem['type']): DescriptionItem => {
  switch (type) {
    case 'description':
      return { type, text: '' }
    case 'image':
    case 'video':
      return { type, url: '', caption: '' }
    case 'gallery':
      return { type, gallery: [], caption: '' }
  }
}

const createSpecificationTemplate = () => [
  { label: 'Driver', value: '' },
  { label: 'Đáp tần', value: '' },
  { label: 'Trở kháng', value: '' },
  { label: 'Độ nhạy', value: '' },
  { label: 'Cổng kết nối', value: '' },
  { label: 'Kết nối không dây', value: '' },
  { label: 'Thời lượng pin', value: '' },
  { label: 'Chống ồn', value: '' },
  { label: 'Micro', value: '' },
  { label: 'Trọng lượng', value: '' },
  { label: 'Bảo hành', value: '' },
]

const createVideoTemplate = (): ProductVideoItem[] => [
  { title: '', descriptions: '', url: '' },
]

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message.trim() ? error.message : fallback

const hasDescriptionContent = (items: DescriptionItem[]) =>
  items.some((item) => {
    if ((item.text ?? '').trim()) return true
    if ((item.url ?? '').trim()) return true
    if ((item.caption ?? '').trim()) return true
    return (item.gallery ?? []).some((galleryItem) => galleryItem.url.trim())
  })

const hasSpecificationContent = (items: Array<{ label: string; value: string }>) =>
  items.some((item) => item.label.trim() || item.value.trim())

const hasVideoContent = (
  items: ProductVideoItem[],
) => items.some((item) => item.title.trim() || item.descriptions.trim() || item.url.trim())

const isValidRemoteUrl = (value: string) => {
  try {
    const parsed = new URL(value.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const moveListItem = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items
  }

  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

const moveIndexedRecord = <T,>(record: Record<number, T>, fromIndex: number, toIndex: number) => {
  const next: Record<number, T> = {}

  Object.entries(record).forEach(([key, value]) => {
    const index = Number(key)
    if (Number.isNaN(index)) {
      return
    }

    if (index === fromIndex) {
      next[toIndex] = value
      return
    }

    if (fromIndex < toIndex && index > fromIndex && index <= toIndex) {
      next[index - 1] = value
      return
    }

    if (fromIndex > toIndex && index >= toIndex && index < fromIndex) {
      next[index + 1] = value
      return
    }

    next[index] = value
  })

  return next
}

const suggestedSpecificationLabels = [
  'Driver',
  'Đáp tần',
  'Trở kháng',
  'Độ nhạy',
  'Cổng kết nối',
  'Kết nối không dây',
  'Thời lượng pin',
  'Chống ồn',
  'Micro',
  'Trọng lượng',
  'Bảo hành',
  'Màu sắc',
  'Chất liệu',
]

const sanitizeDescriptionItem = (item: DescriptionItem): DescriptionItem | null => {
  if (item.type === 'description') {
    const text = item.text?.trim() ?? ''
    return text ? { type: item.type, text } : null
  }

  if (item.type === 'image' || item.type === 'video') {
    const url = item.url?.trim() ?? ''
    const caption = item.caption?.trim() ?? ''
    if (!url && !caption) {
      return null
    }

    return {
      type: item.type,
      ...(url ? { url } : {}),
      ...(caption ? { caption } : {}),
    }
  }

  const gallery = (item.gallery ?? [])
    .map((galleryItem) => ({ url: galleryItem.url.trim() }))
    .filter((galleryItem) => galleryItem.url)
  const caption = item.caption?.trim() ?? ''

  if (gallery.length === 0 && !caption) {
    return null
  }

  return {
    type: 'gallery',
    ...(gallery.length > 0 ? { gallery } : {}),
    ...(caption ? { caption } : {}),
  }
}

const sanitizeDescriptionItems = (items: DescriptionItem[]) =>
  items
    .map((item) => sanitizeDescriptionItem(item))
    .filter((item): item is DescriptionItem => Boolean(item))

const createInitialNewProduct = (): NewProductDraft => ({
  name: '',
  sku: '',
  shortDescription: '',
  descriptions: [],
  specifications: [],
  videos: [],
  retailPrice: '',
  warrantyPeriod: '12',
  publishStatus: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  isFeatured: false,
  showOnHomepage: false,
  imageUrl: '',
})

const imageUrlCache = new Map<string, string>()

const getImageUrl = (image: string) => {
  const cached = imageUrlCache.get(image)
  if (cached) {
    return cached
  }

  let resolved = ''
  try {
    const parsed = JSON.parse(image) as { imageUrl?: string }
    resolved = resolveBackendAssetUrl(parsed.imageUrl || image)
  } catch {
    resolved = resolveBackendAssetUrl(image)
  }
  imageUrlCache.set(image, resolved)
  return resolved
}

const formatPriceVND = (value: number | string) => {
  const num = typeof value === 'number' ? value : Number(value || 0)
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

const toDigitsOnly = (value: string) => value.replace(/\D/g, '')

const formatNumberInput = (value: string) => {
  if (!value) return ''
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ITEMS_PER_PAGE = 15

const modalStyles: Styles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    zIndex: 50,
  },
  content: {
    position: 'relative',
    inset: 'auto',
    border: 'none',
    background: 'transparent',
    padding: 0,
    overflow: 'visible',
  },
}

function ProductsPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { notify } = useToast()
  const { accessToken } = useAuth()
  const { confirm, confirmDialog } = useConfirmDialog()
  const {
    products,
    isLoading: isProductsLoading,
    error: productsError,
    archiveProduct,
    restoreProduct,
    togglePublishStatus,
    deleteProduct,
    addProduct,
  } = useProducts()
  const [filter, setFilter] = useState<ProductFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFeatured, setFilterFeatured] = useState<FeaturedFilter>('all')
  const [filterHomepage, setFilterHomepage] = useState<HomepageFilter>('all')
  const [showModal, setShowModal] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  type SortField = 'name' | 'retailPrice' | 'availableStock' | 'updatedAt'
  type SortDir = 'asc' | 'desc'
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const warrantyInputRef = useRef<HTMLInputElement | null>(null)
  const skuInputRef = useRef<HTMLInputElement | null>(null)
  const videoUrlInputRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const createUploadedAssetUrlsRef = useRef<Set<string>>(new Set())
  const tabRefs = useRef<
    Record<'basic' | 'description' | 'specs' | 'videos', HTMLButtonElement | null>
  >({
    basic: null,
    description: null,
    specs: null,
    videos: null,
  })
  const retailPriceInputRef = useRef<HTMLInputElement | null>(null)

  const retailPriceCaretRef = useRef<number | null>(null)
  const descriptionDragIndexRef = useRef<number | null>(null)
  const specDragIndexRef = useRef<number | null>(null)
  const [selectedImageName, setSelectedImageName] = useState('')
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [imageError, setImageError] = useState('')
  const [descriptionImageErrors, setDescriptionImageErrors] = useState<Record<number, string>>({})
  const [productVideoErrors, setProductVideoErrors] = useState<Record<number, string>>({})
  const [debouncedDescriptionVideoUrls, setDebouncedDescriptionVideoUrls] = useState<
    Record<number, string>
  >({})
  const [debouncedProductVideoUrls, setDebouncedProductVideoUrls] = useState<Record<number, string>>(
    {},
  )
  const [activeTab, setActiveTab] = useState<'basic' | 'description' | 'specs' | 'videos'>('basic')
  const [currentPage, setCurrentPage] = useState(0)
  const [actionMessage, setActionMessage] = useState('')
  const [newProduct, setNewProduct] = useState(createInitialNewProduct)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isCreating, setIsCreating] = useState(false)
  const tabOrder = ['basic', 'description', 'specs', 'videos'] as const

  const normalizedSearch = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm])
  const {
    activeProducts,
    lowStockProducts,
    draftProducts,
    visibleProducts,
    filterCounts,
  } = useMemo(() => {
    const activeProductsList = products.filter((product) => !product.isDeleted && product.status === 'Active')
    const lowStockProductsList = products.filter(
      (product) => !product.isDeleted && product.availableStock > 0 && product.availableStock < 20,
    )
    const draftProductsList = products.filter((product) => !product.isDeleted && product.status === 'Draft')

    const filteredProducts = products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.sku.toLowerCase().includes(normalizedSearch)

      const matchesFeatured =
        filterFeatured === 'all'
          ? true
          : filterFeatured === 'featured'
            ? !!product.isFeatured
            : !product.isFeatured

      const matchesHomepage =
        filterHomepage === 'all'
          ? true
          : filterHomepage === 'homepage'
            ? !!product.showOnHomepage
            : !product.showOnHomepage

      return matchesSearch && matchesFeatured && matchesHomepage
    })

    const counts = filteredProducts.reduce(
      (acc, product) => {
        if (product.isDeleted) {
          acc.deleted += 1
          return acc
        }

        acc.all += 1
        if (product.status === 'Active') acc.active += 1
        if (product.status === 'Draft') acc.draft += 1
        if (product.availableStock === 0) acc.outOfStock += 1
        if (product.availableStock > 0 && product.availableStock < 20) acc.lowStock += 1
        return acc
      },
      {
        all: 0,
        active: 0,
        lowStock: 0,
        outOfStock: 0,
        draft: 0,
        deleted: 0,
      },
    )

    const filteredByTab = filteredProducts.filter((product) => {
      switch (filter) {
        case 'active':
          return !product.isDeleted && product.status === 'Active'
        case 'lowStock':
          return !product.isDeleted && product.availableStock > 0 && product.availableStock < 20
        case 'outOfStock':
          return !product.isDeleted && product.availableStock === 0
        case 'draft':
          return !product.isDeleted && product.status === 'Draft'
        case 'deleted':
          return product.isDeleted
        default:
          return !product.isDeleted
      }
    })

    const sortedProducts = [...filteredByTab].sort((a, b) => {
      let comparison = 0
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name, 'vi')
      } else if (sortField === 'retailPrice') {
        comparison = (a.retailPrice ?? 0) - (b.retailPrice ?? 0)
      } else if (sortField === 'availableStock') {
        comparison = (a.availableStock ?? 0) - (b.availableStock ?? 0)
      } else {
        comparison = new Date(a.updatedAt ?? 0).getTime() - new Date(b.updatedAt ?? 0).getTime()
      }
      return sortDir === 'asc' ? comparison : -comparison
    })

    return {
      activeProducts: activeProductsList,
      lowStockProducts: lowStockProductsList,
      draftProducts: draftProductsList,
      visibleProducts: sortedProducts,
      filterCounts: counts,
    }
  }, [filter, filterFeatured, filterHomepage, normalizedSearch, products, sortField, sortDir])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurrentPage(0)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [normalizedSearch, filter, filterFeatured, filterHomepage])

  useEffect(() => {
    if (!actionMessage) return
    notify(actionMessage, { title: 'Products', variant: 'info' })
    const timer = window.setTimeout(() => setActionMessage(''), 3000)
    return () => window.clearTimeout(timer)
  }, [actionMessage, notify])

  useEffect(() => {
    if (!imagePreviewUrl || !imagePreviewUrl.startsWith('blob:')) {
      return
    }

    return () => {
      URL.revokeObjectURL(imagePreviewUrl)
    }
  }, [imagePreviewUrl])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextUrls = newProduct.descriptions.reduce<Record<number, string>>((acc, item, index) => {
        if (item.type !== 'video') {
          return acc
        }

        const url = item.url?.trim() ?? ''
        if (url) {
          acc[index] = url
        }

        return acc
      }, {})
      setDebouncedDescriptionVideoUrls(nextUrls)
    }, 400)

    return () => {
      window.clearTimeout(timer)
    }
  }, [newProduct.descriptions])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextUrls = newProduct.videos.reduce<Record<number, string>>((acc, item, index) => {
        const url = item.url.trim()
        if (url) {
          acc[index] = url
        }

        return acc
      }, {})
      setDebouncedProductVideoUrls(nextUrls)
    }, 400)

    return () => {
      window.clearTimeout(timer)
    }
  }, [newProduct.videos])

  const isCreateFormDirty = useMemo(
    () => JSON.stringify(newProduct) !== JSON.stringify(createInitialNewProduct()),
    [newProduct],
  )

  const createTabHasError = useMemo(
    () => ({
      basic: Boolean(
        imageError ||
          errors.name ||
          errors.sku ||
          errors.retailPrice ||
          errors.warrantyPeriod,
      ),
      description: Object.keys(descriptionImageErrors).length > 0,
      specs: false,
      videos: Object.keys(productVideoErrors).length > 0,
    }),
    [descriptionImageErrors, errors, imageError, productVideoErrors],
  )
  const hasZeroRetailPrice = newProduct.retailPrice.trim() === '0'

  const pageCount = Math.ceil(visibleProducts.length / ITEMS_PER_PAGE)
  const pagedProducts = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE
    return visibleProducts.slice(start, start + ITEMS_PER_PAGE)
  }, [visibleProducts, currentPage])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (pageCount === 0) {
        if (currentPage !== 0) setCurrentPage(0)
        return
      }
      if (currentPage > pageCount - 1) {
        setCurrentPage(pageCount - 1)
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [pageCount, currentPage])

  const panelClass =
    'rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]'
  const primaryButtonClass =
    'btn-stable inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60'
  const secondaryButtonClass =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'
  const subtleActionButtonClass =
    'inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]'
  const filterBaseClass =
    'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition whitespace-nowrap'

  const uploadImageAsset = async (file: File) =>
    storeFileReference({
      file,
      category: 'products',
      accessToken,
    })

  const getTrackedCreateUploadUrls = (urls: Array<string | null | undefined>) =>
    Array.from(
      new Set(
        urls
          .map((url) => url?.trim() ?? '')
          .filter((url) => url && createUploadedAssetUrlsRef.current.has(url)),
      ),
    )

  const getTrackedCreateUploadUrlsFromDescriptionItem = (item?: DescriptionItem) =>
    getTrackedCreateUploadUrls([item?.url, ...(item?.gallery ?? []).map((galleryItem) => galleryItem.url)])

  const getTrackedCreateUploadUrlsFromDescriptionItems = (items: DescriptionItem[]) =>
    getTrackedCreateUploadUrls(
      items.flatMap((item) => [item.url, ...(item.gallery ?? []).map((galleryItem) => galleryItem.url)]),
    )

  const trackCreateUploadedAsset = (url: string) => {
    const normalized = url.trim()
    if (normalized) {
      createUploadedAssetUrlsRef.current.add(normalized)
    }
  }

  const clearCreateUploadedAssetTracking = () => {
    createUploadedAssetUrlsRef.current.clear()
  }

  const cleanupCreateUploadedAssets = useCallback(
    async (urls: Array<string | null | undefined>) => {
      const trackedUrls = getTrackedCreateUploadUrls(urls)
      if (trackedUrls.length === 0) {
        return
      }

      const results = await Promise.allSettled(
        trackedUrls.map(async (url) => {
          await deleteStoredFileReference({
            url,
            accessToken,
          })
          return url
        }),
      )

      const failedUrls: string[] = []
      results.forEach((result, index) => {
        const url = trackedUrls[index]
        if (result.status === 'fulfilled') {
          createUploadedAssetUrlsRef.current.delete(url)
          return
        }
        failedUrls.push(url)
      })

      if (failedUrls.length > 0) {
        notify(t('Không thể dọn một số ảnh tạm trên máy chủ. Vui lòng thử lại.'), {
          title: 'Products',
          variant: 'error',
        })
      }
    },
    [accessToken, notify, t],
  )

  useEffect(() => {
    return () => {
      if (createUploadedAssetUrlsRef.current.size > 0) {
        void cleanupCreateUploadedAssets(Array.from(createUploadedAssetUrlsRef.current))
      }
    }
  }, [cleanupCreateUploadedAssets])

  const clearDescriptionImage = (index: number) => {
    const currentUrl = newProduct.descriptions[index]?.url?.trim() ?? ''

    setNewProduct((prev) => {
      const copy = [...prev.descriptions]
      const currentItem = copy[index] ?? { type: 'image' as const }
      copy[index] = { ...currentItem, type: 'image', url: '' }
      return { ...prev, descriptions: copy }
    })
    setDescriptionImageErrors((prev) => {
      if (!(index in prev)) {
        return prev
      }
      const next = { ...prev }
      delete next[index]
      return next
    })
    void cleanupCreateUploadedAssets([currentUrl])
  }

  const clearGalleryItemImage = (index: number, itemIndex: number, removeItem = false) => {
    const current = newProduct.descriptions[index]
    const galleryEntry = current?.gallery?.[itemIndex]
    const currentUrl = galleryEntry?.url?.trim() ?? ''

    setNewProduct((prev) => {
      const copy = [...prev.descriptions]
      const currentItem = copy[index] ?? { type: 'gallery' as const, gallery: [] as GalleryItem[] }
      const nextGallery = [...(currentItem.gallery ?? [])]

      if (removeItem) {
        nextGallery.splice(itemIndex, 1)
      } else {
        const existing = nextGallery[itemIndex] ?? { url: '' }
        nextGallery[itemIndex] = { ...existing, url: '' }
      }

      copy[index] = { ...currentItem, type: 'gallery', gallery: nextGallery }
      return { ...prev, descriptions: copy }
    })
    setDescriptionImageErrors((prev) => {
      if (!(index in prev)) {
        return prev
      }
      const next = { ...prev }
      delete next[index]
      return next
    })
    void cleanupCreateUploadedAssets([currentUrl])
  }

  const getCreateFieldError = (
    field: Exclude<CreateProductErrorField, 'videos'>,
    draft: NewProductDraft = newProduct,
  ) => {
    if (field === 'name') {
      return draft.name.trim() ? '' : t('Vui lòng nhập tên sản phẩm')
    }

    if (field === 'sku') {
      const normalizedSku = draft.sku.trim()
      if (!normalizedSku) {
        return t('Vui lòng nhập SKU')
      }

      return products.some((product) => product.sku.toLowerCase() === normalizedSku.toLowerCase()) ? t('SKU đã tồn tại') : ''
    }

    if (field === 'retailPrice') {
      if (!draft.retailPrice.trim()) {
        return t('Vui lòng nhập giá bán lẻ')
      }

      const priceNum = Number(draft.retailPrice)
      return Number.isNaN(priceNum) || priceNum < 0 ? t('Giá phải là số không âm') : ''
    }

    if (field === 'warrantyPeriod') {
      const warrantyPeriodNum = Number(draft.warrantyPeriod)
      if (Number.isNaN(warrantyPeriodNum) || warrantyPeriodNum <= 0 || !Number.isInteger(warrantyPeriodNum)) {
        return t('Thời hạn bảo hành phải là số nguyên dương')
      }
      if (warrantyPeriodNum > 120) {
        return t('Tối đa 120 tháng')
      }
      return ''
    }

    return ''
  }

  const setCreateFieldError = (
    field: Exclude<CreateProductErrorField, 'videos'>,
    message: string,
  ) => {
    setErrors((prev) => {
      if (!message) {
        if (!(field in prev)) return prev
        const next = { ...prev }
        delete next[field]
        return next
      }

      if (prev[field] === message) {
        return prev
      }

      return {
        ...prev,
        [field]: message,
      }
    })
  }

  const validateCreateFieldOnBlur = (
    field: Exclude<CreateProductErrorField, 'videos'>,
    draft: NewProductDraft = newProduct,
  ) => {
    setCreateFieldError(field, getCreateFieldError(field, draft))
  }

  const getProductVideoError = (video: ProductVideoItem) => {
    const hasVideoValues =
      video.title.trim() || video.descriptions.trim() || video.url.trim()

    if (!hasVideoValues) {
      return ''
    }

    if (!video.url.trim()) {
      return t('Vui lòng nhập URL video')
    }

    return isValidRemoteUrl(video.url) ? '' : t('URL video không hợp lệ')
  }

  const validateProductVideoOnBlur = (
    index: number,
    video: ProductVideoItem = newProduct.videos[index] ?? createVideoTemplate()[0],
  ) => {
    setProductVideoErrors((prev) => {
      const message = getProductVideoError(video)
      if (!message) {
        if (!(index in prev)) return prev
        const next = { ...prev }
        delete next[index]
        return next
      }

      if (prev[index] === message) {
        return prev
      }

      return {
        ...prev,
        [index]: message,
      }
    })
  }

  const focusCreateField = (field: CreateProductErrorField) => {
    const target =
      field === 'name'
        ? nameInputRef.current
        : field === 'warrantyPeriod'
          ? warrantyInputRef.current
          : field === 'sku'
            ? skuInputRef.current
            : field === 'retailPrice'
              ? retailPriceInputRef.current
              : null

    target?.focus()
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const confirmTemplateReplacement = async (hasContent: boolean) => {
    if (!hasContent) {
      return true
    }

    return confirm({
      title: t('Thay thế dữ liệu hiện tại?'),
      message: t(
        'Mẫu sẽ ghi đè nội dung bạn đang nhập trong mục này.',
      ),
      confirmLabel: t('Ghi đè'),
      cancelLabel: t('Giữ lại'),
      tone: 'warning',
    })
  }

  const applyDescriptionTemplate = async () => {
    const approved = await confirmTemplateReplacement(hasDescriptionContent(newProduct.descriptions))
    if (!approved) {
      return
    }

    const previousUrls = getTrackedCreateUploadUrlsFromDescriptionItems(newProduct.descriptions)
    setDescriptionImageErrors({})
    setNewProduct((prev) => ({
      ...prev,
      descriptions: createDescriptionTemplate(),
    }))
    void cleanupCreateUploadedAssets(previousUrls)
  }

  const applySpecificationTemplate = async () => {
    const approved = await confirmTemplateReplacement(
      hasSpecificationContent(newProduct.specifications),
    )
    if (!approved) {
      return
    }

    setNewProduct((prev) => ({
      ...prev,
      specifications: createSpecificationTemplate(),
    }))
  }

  const applyVideoTemplate = async () => {
    const approved = await confirmTemplateReplacement(hasVideoContent(newProduct.videos))
    if (!approved) {
      return
    }

    setProductVideoErrors({})
    setNewProduct((prev) => ({
      ...prev,
      videos: createVideoTemplate(),
    }))
  }

  const resetFilters = () => {
    setFilter('all')
    setSearchTerm('')
    setFilterFeatured('all')
    setFilterHomepage('all')
  }

  const descriptionBlockOptions: Array<{
    id: DescriptionItem['type']
    label: string
    addLabel: string
  }> = [
    { id: 'description', label: t('Mô tả'), addLabel: t('+ Mô tả') },
    { id: 'image', label: t('Hình ảnh'), addLabel: t('+ Hình ảnh') },
    { id: 'gallery', label: t('Nhiều hình ảnh'), addLabel: t('+ Nhiều hình ảnh') },
    { id: 'video', label: t('Video'), addLabel: t('+ Video') },
  ]

  const getDescriptionBlockLabel = (type: DescriptionItem['type']) =>
    descriptionBlockOptions.find((option) => option.id === type)?.label ?? type

  const descriptionEditorModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'link'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['divider', 'clean'],
        ],
        handlers: {
          divider(this: { quill: Quill }) {
            const range = this.quill.getSelection(true)
            this.quill.insertEmbed(range.index, 'divider', true, 'user')
            this.quill.setSelection(range.index + 1, 0, 'silent')
          },
        },
      },
    }),
    [],
  )

  const descriptionEditorFormats = useMemo(
    () => ['header', 'bold', 'italic', 'link', 'list', 'divider'],
    [],
  )

  const appendDescriptionBlock = (type: DescriptionItem['type']) => {
    setNewProduct((prev) => ({
      ...prev,
      descriptions: [...prev.descriptions, createDescriptionBlock(type)],
    }))
  }

  const moveDescriptionItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newProduct.descriptions.length) {
      return
    }

    setNewProduct((prev) => ({
      ...prev,
      descriptions: moveListItem(prev.descriptions, index, targetIndex),
    }))
    setDescriptionImageErrors((prev) => moveIndexedRecord(prev, index, targetIndex))
  }

  const moveSpecificationItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newProduct.specifications.length) {
      return
    }

    setNewProduct((prev) => ({
      ...prev,
      specifications: moveListItem(prev.specifications, index, targetIndex),
    }))
  }

  const moveVideoItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newProduct.videos.length) {
      return
    }

    setNewProduct((prev) => ({
      ...prev,
      videos: moveListItem(prev.videos, index, targetIndex),
    }))
    setProductVideoErrors((prev) => moveIndexedRecord(prev, index, targetIndex))
    videoUrlInputRefs.current = moveIndexedRecord(videoUrlInputRefs.current, index, targetIndex)
  }

  const applySuggestedSpecificationLabel = (label: string) => {
    setNewProduct((prev) => {
      const emptyLabelIndex = prev.specifications.findIndex((item) => !item.label.trim())
      const copy = [...prev.specifications]

      if (emptyLabelIndex >= 0) {
        copy[emptyLabelIndex] = { ...copy[emptyLabelIndex], label }
        return { ...prev, specifications: copy }
      }

      return {
        ...prev,
        specifications: [...copy, { label, value: '' }],
      }
    })
  }

  const handleDescriptionImageFile = async (index: number, file: File | null) => {
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setDescriptionImageErrors((prev) => ({
        ...prev,
        [index]: t('Ảnh tối đa 10MB'),
      }))
      return
    }
    try {
      const previousUrl = newProduct.descriptions[index]?.url?.trim() ?? ''
      const stored = await uploadImageAsset(file)
      trackCreateUploadedAsset(stored.url)
      setNewProduct((prev) => {
        const copy = [...prev.descriptions]
        const current = copy[index] ?? { type: 'image' as const }
        copy[index] = { ...current, type: 'image', url: stored.url }
        return { ...prev, descriptions: copy }
      })
      setDescriptionImageErrors((prev) => {
        const next = { ...prev }
        delete next[index]
        return next
      })
      void cleanupCreateUploadedAssets([previousUrl])
    } catch (error) {
      const message = getErrorMessage(
        error,
        t('Không thể tải ảnh lên. Vui lòng thử lại.'),
      )
      setDescriptionImageErrors((prev) => ({
        ...prev,
        [index]: message,
      }))
      notify(message, { title: 'Products', variant: 'error' })
    }
  }

  const handleDescriptionGalleryFiles = async (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileList = Array.from(files)
    const oversized = fileList.find((file) => file.size > MAX_IMAGE_BYTES)
    if (oversized) {
      setDescriptionImageErrors((prev) => ({
        ...prev,
        [index]: t('Ảnh tối đa 10MB'),
      }))
    }
    const validFiles = fileList.filter((file) => file.size <= MAX_IMAGE_BYTES)
    if (validFiles.length === 0) return
    try {
      const storedItems = await Promise.all(
        validFiles.map((file) => uploadImageAsset(file)),
      )
      storedItems.forEach((item) => trackCreateUploadedAsset(item.url))
      const newItems = storedItems.filter((item) => item.url).map((item) => ({ url: item.url }))
      setNewProduct((prev) => {
        const copy = [...prev.descriptions]
        const current = copy[index] ?? { type: 'gallery' as const, gallery: [] as GalleryItem[] }
        const nextGallery = [...(current.gallery ?? []), ...newItems]
        copy[index] = { ...current, type: 'gallery', gallery: nextGallery }
        return { ...prev, descriptions: copy }
      })
      setDescriptionImageErrors((prev) => {
        const next = { ...prev }
        delete next[index]
        return next
      })
    } catch (error) {
      const message = getErrorMessage(
        error,
        t('Không thể tải ảnh lên. Vui lòng thử lại.'),
      )
      setDescriptionImageErrors((prev) => ({
        ...prev,
        [index]: message,
      }))
      notify(message, { title: 'Products', variant: 'error' })
    }
  }

  const handleGalleryItemFile = async (index: number, itemIndex: number, file: File | null) => {
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setDescriptionImageErrors((prev) => ({
        ...prev,
        [index]: t('Ảnh tối đa 10MB'),
      }))
      return
    }
    try {
      const previousUrl = newProduct.descriptions[index]?.gallery?.[itemIndex]?.url?.trim() ?? ''
      const stored = await uploadImageAsset(file)
      trackCreateUploadedAsset(stored.url)
      setNewProduct((prev) => {
        const copy = [...prev.descriptions]
        const current = copy[index] ?? { type: 'gallery' as const, gallery: [] as GalleryItem[] }
        const nextGallery = [...(current.gallery ?? [])]
        const existing = nextGallery[itemIndex] ?? { url: '' }
        nextGallery[itemIndex] = { ...existing, url: stored.url }
        copy[index] = { ...current, type: 'gallery', gallery: nextGallery }
        return { ...prev, descriptions: copy }
      })
      setDescriptionImageErrors((prev) => {
        const next = { ...prev }
        delete next[index]
        return next
      })
      void cleanupCreateUploadedAssets([previousUrl])
    } catch (error) {
      const message = getErrorMessage(
        error,
        t('Không thể tải ảnh lên. Vui lòng thử lại.'),
      )
      setDescriptionImageErrors((prev) => ({
        ...prev,
        [index]: message,
      }))
      notify(message, { title: 'Products', variant: 'error' })
    }
  }

  const removeDescriptionItem = (index: number) => {
    const removedItem = newProduct.descriptions[index]
    setNewProduct((prev) => ({
      ...prev,
      descriptions: prev.descriptions.filter((_, i) => i !== index),
    }))
    setDescriptionImageErrors((prev) => {
      const next: Record<number, string> = {}
      Object.entries(prev).forEach(([key, value]) => {
        const idx = Number(key)
        if (Number.isNaN(idx)) return
        if (idx < index) {
          next[idx] = value
        } else if (idx > index) {
          next[idx - 1] = value
        }
      })
      return next
    })
    void cleanupCreateUploadedAssets(getTrackedCreateUploadUrlsFromDescriptionItem(removedItem))
  }

  const resetCreateForm = () => {
    setActiveTab('basic')
    retailPriceCaretRef.current = null
    setDescriptionImageErrors({})
    setProductVideoErrors({})
    setDebouncedDescriptionVideoUrls({})
    setDebouncedProductVideoUrls({})
    videoUrlInputRefs.current = {}
    setImagePreviewUrl('')
    setImageError('')
    setSelectedImageName('')
    setErrors({})
    setIsCreating(false)
    setNewProduct(createInitialNewProduct())
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const closeModal = () => {
    resetCreateForm()
    setShowModal(false)
  }

  const requestCloseModal = async () => {
    if (isCreating) {
      return
    }
    if (isCreateFormDirty) {
      const approved = await confirm({
        title: t('Đóng biểu mẫu tạo sản phẩm?'),
        message: t('Mọi thay đổi chưa lưu sẽ bị mất.'),
        confirmLabel: t('Tiếp tục đóng'),
        cancelLabel: t('Ở lại'),
        tone: 'warning',
      })
      if (!approved) {
        return
      }
    }
    await cleanupCreateUploadedAssets(Array.from(createUploadedAssetUrlsRef.current))
    closeModal()
  }

  useLayoutEffect(() => {
    if (retailPriceCaretRef.current === null) return
    const input = retailPriceInputRef.current
    if (!input) return
    const caret = retailPriceCaretRef.current
    retailPriceCaretRef.current = null
    input.setSelectionRange(caret, caret)
  }, [newProduct.retailPrice])

  const validateCreateProduct = () => {
    const nextErrors: Record<string, string> = {}
    const nextProductVideoErrors: Record<number, string> = {}
    const basicFields: Array<Exclude<CreateProductErrorField, 'videos'>> = [
      'name',
      'sku',
      'retailPrice',
      'warrantyPeriod',
    ]

    basicFields.forEach((field) => {
      const message = getCreateFieldError(field)
      if (message) {
        nextErrors[field] = message
      }
    })

    const priceNum = Number(newProduct.retailPrice)
    const warrantyPeriodNum = Number(newProduct.warrantyPeriod)

    newProduct.videos.forEach((video, index) => {
      const message = getProductVideoError(video)
      if (message) {
        nextProductVideoErrors[index] = message
      }
    })

    const firstVideoErrorIndex =
      Object.keys(nextProductVideoErrors)
        .map((key) => Number(key))
        .find((index) => !Number.isNaN(index)) ?? null

    const sanitizedDescriptions = sanitizeDescriptionItems(newProduct.descriptions)

    const firstErrorField =
      createProductErrorFieldOrder.find((field) =>
        field === 'videos' ? firstVideoErrorIndex !== null : Boolean(nextErrors[field]),
      ) ?? null

    const sanitizedSpecifications = newProduct.specifications
      .map((item) => ({
        label: item.label.trim(),
        value: item.value.trim(),
      }))
      .filter((item) => item.label || item.value)

    const sanitizedVideos = newProduct.videos
      .map((video) => ({
        title: video.title.trim(),
        descriptions: video.descriptions.trim(),
        url: video.url.trim(),
      }))
      .filter((video) => video.title || video.descriptions || video.url)

    return {
      nextErrors,
      nextProductVideoErrors,
      firstErrorField,
      firstVideoErrorIndex,
      priceNum,
      sanitizedDescriptions,
      sanitizedSpecifications,
      sanitizedVideos,
      warrantyPeriodNum,
    }
  }

  const handleCreateProductSubmit = () => {
    if (isCreating) {
      return
    }

    const {
      nextErrors,
      nextProductVideoErrors,
      firstErrorField,
      firstVideoErrorIndex,
      priceNum,
      sanitizedDescriptions,
      sanitizedSpecifications,
      sanitizedVideos,
      warrantyPeriodNum,
    } = validateCreateProduct()

    setErrors(nextErrors)
    setProductVideoErrors(nextProductVideoErrors)

    if (firstErrorField) {
      const targetTab = createProductErrorTabMap[firstErrorField]
      setActiveTab(targetTab)
      window.setTimeout(() => {
        tabRefs.current[targetTab]?.focus()
        if (firstErrorField === 'videos' && firstVideoErrorIndex !== null) {
          const target = videoUrlInputRefs.current[firstVideoErrorIndex]
          target?.focus()
          target?.scrollIntoView({ block: 'center', behavior: 'smooth' })
          return
        }
        focusCreateField(firstErrorField)
      }, 0)
      notify(t('Vui lòng kiểm tra lại các trường bắt buộc'), {
        title: 'Products',
        variant: 'error',
      })
      return
    }

    const descJson = JSON.stringify(sanitizedDescriptions)
    const specJson = JSON.stringify(sanitizedSpecifications)
    const videoJson = JSON.stringify(sanitizedVideos)

    void (async () => {
      if (newProduct.retailPrice.trim() === '0') {
        const approved = await confirm({
          title: t('Tạo sản phẩm với giá 0 VND?'),
          message: t(
            'Sản phẩm sẽ được lưu với giá bán lẻ bằng 0. Hãy xác nhận nếu đây là chủ đích của bạn.',
          ),
          confirmLabel: t('Vẫn tạo'),
          cancelLabel: t('Xem lại giá'),
          tone: 'warning',
        })

        if (!approved) {
          setActiveTab('basic')
          window.setTimeout(() => {
            retailPriceInputRef.current?.focus()
            retailPriceInputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
          }, 0)
          return
        }
      }

      setIsCreating(true)
      try {
        await addProduct({
          name: newProduct.name.trim(),
          sku: newProduct.sku.trim(),
          shortDescription: newProduct.shortDescription.trim(),
          retailPrice: priceNum || 0,
          warrantyPeriod: warrantyPeriodNum,
          publishStatus: newProduct.publishStatus,
          isFeatured: newProduct.isFeatured,
          showOnHomepage: newProduct.showOnHomepage,
          image: newProduct.imageUrl
            ? JSON.stringify({ imageUrl: newProduct.imageUrl })
            : undefined,
          descriptions: descJson,
          specifications: specJson,
          videos: videoJson,
        })
        clearCreateUploadedAssetTracking()
        closeModal()
      } catch (error) {
        notify(error instanceof Error ? error.message : t('Không thể tạo sản phẩm'), {
          title: 'Products',
          variant: 'error',
        })
      } finally {
        setIsCreating(false)
      }
    })()
  }

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    const previousImageUrl = newProduct.imageUrl.trim()
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(t('Ảnh tối đa 10MB'))
      setSelectedImageName('')
      setImagePreviewUrl('')
      event.target.value = ''
      return
    }
    setImageError('')
    setSelectedImageName(file.name)
    setImagePreviewUrl(URL.createObjectURL(file))
    try {
      const stored = await uploadImageAsset(file)
      trackCreateUploadedAsset(stored.url)
      setNewProduct((prev) => ({ ...prev, imageUrl: stored.url }))
      void cleanupCreateUploadedAssets([previousImageUrl])
    } catch (error) {
      const message = getErrorMessage(
        error,
        t('Không thể xử lý tệp đã chọn'),
      )
      setImageError(message)
      setSelectedImageName('')
      event.target.value = ''
      setImagePreviewUrl('')
      notify(message, { title: 'Products', variant: 'error' })
    }
  }

  const handleClearImage = () => {
    const currentImageUrl = newProduct.imageUrl.trim()
    setImagePreviewUrl('')
    setImageError('')
    setSelectedImageName('')
    setNewProduct((prev) => ({ ...prev, imageUrl: '' }))
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
    void cleanupCreateUploadedAssets([currentImageUrl])
  }

  const handleDelete = useCallback(async (sku: string) => {
    const approved = await confirm({
      title: t('Xóa vĩnh viễn sản phẩm'),
      message: t('Xóa vĩnh viễn sản phẩm này?'),
      tone: 'danger',
      confirmLabel: t('Xóa'),
    })
    if (!approved) {
      return
    }
    try {
      await deleteProduct(sku)
      setActionMessage(t('Đã xóa vĩnh viễn sản phẩm.'))
    } catch (error) {
      notify(error instanceof Error ? error.message : t('Không thể xóa sản phẩm'), {
        title: 'Products',
        variant: 'error',
      })
    }
  }, [confirm, deleteProduct, notify, t])

  const handleArchiveToggle = useCallback(async (product: Product) => {
    if (product.isDeleted) {
      try {
        await restoreProduct(product.sku)
        setActionMessage(t('Đã khôi phục sản phẩm về bản nháp.'))
      } catch (error) {
        notify(error instanceof Error ? error.message : t('Không thể khôi phục sản phẩm'), {
          title: 'Products',
          variant: 'error',
        })
      }
      return
    }
    const approved = await confirm({
      title: t('Ẩn sản phẩm'),
      message: t('Ẩn sản phẩm này khỏi danh mục?'),
      tone: 'warning',
      confirmLabel: t('Ẩn sản phẩm'),
    })
    if (!approved) {
      return
    }
    try {
      await archiveProduct(product.sku)
      setActionMessage(t('Đã ẩn sản phẩm khỏi danh mục.'))
    } catch (error) {
      notify(error instanceof Error ? error.message : t('Không thể ẩn sản phẩm'), {
        title: 'Products',
        variant: 'error',
      })
    }
  }, [archiveProduct, confirm, notify, restoreProduct, t])

  const handlePublishToggle = useCallback(async (product: Product) => {
    if (product.isDeleted) {
      return
    }
    if (product.publishStatus === "PUBLISHED") {
      const approved = await confirm({
        title: t('Hủy xuất bản'),
        message: t('Hủy xuất bản sản phẩm này?'),
        tone: 'warning',
        confirmLabel: t('Hủy xuất bản'),
      })
      if (!approved) {
        return
      }
    } else {
      const approved = await confirm({
        title: t('Xuất bản sản phẩm'),
        message: t('Xuất bản "{name}"?', { name: product.name }),
        tone: 'info',
        confirmLabel: t('Xuất bản'),
      })
      if (!approved) {
        return
      }
    }
    try {
      await togglePublishStatus(product.sku)
      setActionMessage(
        product.publishStatus === "PUBLISHED"
          ? t('Đã hủy xuất bản sản phẩm.')
          : t('Đã xuất bản sản phẩm.'),
      )
    } catch (error) {
      notify(error instanceof Error ? error.message : t('Không thể cập nhật trạng thái xuất bản'), {
        title: 'Products',
        variant: 'error',
      })
    }
  }, [confirm, notify, t, togglePublishStatus])

  const filters = useMemo(() => ([
    { value: 'all', label: 'Tất cả', count: filterCounts.all },
    { value: 'active', label: 'Đang bán', count: filterCounts.active },
    { value: 'lowStock', label: 'Tồn kho thấp', count: filterCounts.lowStock },
    { value: 'outOfStock', label: 'Hết hàng', count: filterCounts.outOfStock },
    { value: 'draft', label: 'Bản nháp', count: filterCounts.draft },
    {
      value: 'deleted',
      label: 'Đã xóa',
      count: filterCounts.deleted,
    },
  ] as const), [filterCounts])

  const listContent = (() => {
    if (visibleProducts.length === 0) {
      return (
        <div className="rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] px-6 py-10 text-center text-sm text-slate-500">
          <Package className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-4 text-base font-semibold text-slate-900">
            {t('Không tìm thấy sản phẩm')}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {t('Thử đổi bộ lọc hoặc từ khóa tìm kiếm.')}
          </p>
        </div>
      )
    }

    return pagedProducts.map((product) => (
      <div
        key={product.sku}
        className="grid gap-4 rounded-3xl border border-slate-200/70 bg-white/80 px-4 py-4 text-sm text-slate-700 shadow-sm backdrop-blur transition hover:border-[var(--accent-soft)] hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] md:grid-cols-[2fr_1fr_0.9fr] md:items-center"
      >
        <div className="flex items-center gap-3">
          <img
            className="h-12 w-12 rounded-2xl border border-slate-200 bg-white object-cover"
            src={getImageUrl(product.image)}
            alt={product.name}
            loading="lazy"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{product.name}</p>
              <div className="flex items-center gap-1">
                {product.isFeatured && (
                  <span
                    aria-label={t('Nổi bật')}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-700"
                    role="img"
                    title={t('Nổi bật')}
                  >
                    <Star aria-hidden="true" className="h-3 w-3" />
                  </span>
                )}
                {product.showOnHomepage && (
                  <span
                    aria-label={t('Trang chủ')}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 text-blue-700"
                    role="img"
                    title={t('Trang chủ')}
                  >
                    <Home aria-hidden="true" className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500">
              <span className="uppercase tracking-[0.2em] text-slate-400">
                SKU {product.sku}
              </span>
              <span className="px-2 text-slate-300">|</span>
              <span className="font-semibold text-slate-700">
                {formatPriceVND(product.retailPrice || 0)}
              </span>
              <span className="px-2 text-slate-300">|</span>
              <span>{t('Tồn')}: {product.availableStock > 999 ? '999+' : product.availableStock}</span>
            </p>
          </div>
        </div>
        <div>
          <button
            type="button"
            className={
              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ' +
              (product.isDeleted
                ? 'cursor-default bg-slate-200 text-slate-600'
                : product.publishStatus === 'PUBLISHED'
                  ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25'
                  : 'bg-slate-900/5 text-slate-700 hover:bg-slate-900/10')
            }
            disabled={product.isDeleted}
            onClick={() => !product.isDeleted && handlePublishToggle(product)}
            title={
              product.isDeleted
                ? undefined
                : product.publishStatus === 'DRAFT'
                  ? t('Xuất bản')
                  : t('Hủy xuất bản')
            }
          >
            {product.isDeleted
              ? t('Đã xóa')
              : product.publishStatus === 'PUBLISHED'
                ? t('Đã xuất bản')
                : t('Bản nháp')}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <Link
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 px-2 text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
            to={`/products/${product.sku}`}
            aria-label={t('Chi tiết')}
            title={t('Chi tiết')}
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">{t('Chi tiết')}</span>
          </Link>
          <button
            className={
              product.isDeleted
                ? 'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-2xl border border-emerald-200 px-2 text-emerald-700 transition hover:border-emerald-400'
                : 'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-2xl border border-amber-200 px-2 text-amber-700 transition hover:border-amber-400'
            }
            type="button"
            onClick={() => handleArchiveToggle(product)}
            aria-label={
              product.isDeleted
                ? t('Khôi phục')
                : t('Ẩn sản phẩm')
            }
            title={
              product.isDeleted
                ? t('Khôi phục')
                : t('Ẩn sản phẩm')
            }
          >
            {product.isDeleted ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{product.isDeleted ? t('Khôi phục') : t('Ẩn')}</span>
          </button>
          <button
            className={
              product.isDeleted
                ? 'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-2xl border border-rose-200 px-2 text-rose-700 transition hover:border-rose-400'
                : 'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 px-2 text-slate-400'
            }
            type="button"
            onClick={() => handleDelete(product.sku)}
            disabled={!product.isDeleted}
            aria-label={t('Xóa')}
            title={
              product.isDeleted
                ? t('Xóa vĩnh viễn')
                : t('Cần ẩn sản phẩm trước khi xóa vĩnh viễn')
            }
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('Xóa')}</span>
          </button>
        </div>
      </div>
    ))
  })()

  if (isProductsLoading) {
    return (
      <section className={`${panelClass} animate-card-enter`}>
        <LoadingRows rows={6} />
      </section>
    )
  }

  if (productsError && products.length === 0) {
    return (
      <section className={`${panelClass} animate-card-enter`}>
        <ErrorState title="Products" message={productsError} />
      </section>
    )
  }

  return (
    <section className={`${panelClass} animate-card-enter`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {t('Sản phẩm')}
          </h3>
          <p className="text-sm text-slate-500">
            {t('Quản lý sản phẩm và tồn kho.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-full max-w-sm rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
              placeholder={t('Tìm tên, SKU...')}
              aria-label={t('Tìm tên, SKU...')}
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showAdvancedFilters ? t('Ẩn bộ lọc') : t('Bộ lọc nâng cao')}
          </button>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            type="button"
            onClick={resetFilters}
          >
            <RotateCcw className="h-4 w-4" />
            {t('Đặt lại')}
          </button>
          {showAdvancedFilters && (
            <div className="flex w-full flex-wrap gap-2">
              <select
                className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                value={filterFeatured}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterFeatured(e.target.value as FeaturedFilter)}
              >
                <option value="all">{t('Nổi bật: Tất cả')}</option>
                <option value="featured">{t('Nổi bật')}</option>
                <option value="nonFeatured">{t('Không nổi bật')}</option>
              </select>
              <select
                className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                value={filterHomepage}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterHomepage(e.target.value as HomepageFilter)}
              >
                <option value="all">{t('Trang chủ: Tất cả')}</option>
                <option value="homepage">{t('Trang chủ')}</option>
                <option value="nonHomepage">{t('Không ở trang chủ')}</option>
              </select>
            </div>
          )}
          <div className="flex w-full flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-1.5">
            {filters.map((option) => {
              const isActive = filter === option.value
              return (
                <button
                  key={option.value}
                  className={
                    isActive
                      ? `${filterBaseClass} bg-[var(--accent)] text-white shadow-sm`
                      : `${filterBaseClass} text-slate-500 hover:text-slate-900`
                  }
                  type="button"
                  onClick={() => setFilter(option.value)}
                >
                  <span>{t(option.label)}</span>
                  <span
                    className={
                      isActive
                        ? 'rounded-full bg-white/20 px-2 py-0.5 text-xs'
                        : 'rounded-full bg-white px-2 py-0.5 text-xs text-slate-500'
                    }
                  >
                    {option.count}
                  </span>
                </button>
              )
            })}
          </div>
          <button
            className="btn-stable ml-auto inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            type="button"
            onClick={() => {
              const header = [
                t('Tên sản phẩm'),
                'SKU',
                t('Giá'),
                t('Tồn kho'),
                t('Xuất bản'),
                t('Nổi bật'),
                t('Trang chủ'),
              ]
              const rows = visibleProducts.map((p) => [
                p.name,
                p.sku,
                p.retailPrice ?? 0,
                p.availableStock,
                p.publishStatus,
                p.isFeatured ? t('Có') : t('Không'),
                p.showOnHomepage ? t('Có') : t('Không')
              ])
              const csv = [header, ...rows]
                .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
                .join('\n')
              const csvContent = `﻿${csv}`
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = 'products-export.csv'
              link.click()
              URL.revokeObjectURL(url)
            }}
          >
            <FileDown className="h-4 w-4" />
            {t('Xuất CSV')}
          </button>
          <button
            className={primaryButtonClass}
            type="button"
            onClick={() => navigate('/products/new')}
          >
            <Plus className="h-4 w-4" />
            {t('Thêm sản phẩm')}
          </button>
        </div>
      </div>
      {actionMessage && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {actionMessage}
        </div>
      )}

      <div className="mt-6 hidden flex-wrap items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-xs md:flex">
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-[0.2em] text-slate-400">
            {t('Tổng SKU')}
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {products.filter((product) => !product.isDeleted).length}
          </span>
          <span className="text-slate-500">
            {t('{count} bản nháp', { count: draftProducts.length })}
          </span>
        </div>
        <span className="h-4 w-px bg-[var(--border)]" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-[0.2em] text-slate-400">
            {t('Tồn kho thấp')}
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {lowStockProducts.length}
          </span>
          <span className="text-slate-500">{t('Cần bổ sung')}</span>
        </div>
        <span className="h-4 w-px bg-[var(--border)]" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-[0.2em] text-slate-400">
            {t('Đang bán')}
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {activeProducts.length}
          </span>
          <span className="text-slate-500">{t('Đang kinh doanh')}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('Sắp xếp')}:</span>
        {([
          ['updatedAt', t('Mới nhất')],
          ['name', t('Tên')],
          ['retailPrice', t('Giá')],
          ['availableStock', t('Tồn kho')],
        ] as [SortField, string][]).map(([field, label]) => (
          <button
            key={field}
            type="button"
            onClick={() => {
              if (sortField === field) {
                setSortDir(d => d === 'asc' ? 'desc' : 'asc')
              } else {
                setSortField(field)
                setSortDir('desc')
              }
            }}
            className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              sortField === field
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-slate-200 bg-white text-slate-600 hover:border-[var(--accent)] hover:text-[var(--accent)]'
            }`}
          >
            {label}
            {sortField === field && (
              <span className="text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3">
        <div className="hidden items-center gap-3 rounded-2xl border border-slate-200/70 bg-[var(--surface-muted)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400 md:grid md:grid-cols-[2fr_1fr_0.9fr]">
          <span>{t('Sản phẩm')}</span>
          <span>{t('Trạng thái')}</span>
          <span>{t('Thao tác')}</span>
        </div>
        {listContent}
      </div>
      {pageCount > 1 && (
        <PaginationNav
          page={currentPage}
          totalPages={pageCount}
          totalItems={visibleProducts.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          previousLabel={t('Trước')}
          nextLabel={t('Tiếp')}
        />
      )}

      <Modal
        isOpen={showModal}
        onRequestClose={() => {
          void requestCloseModal()
        }}
        onAfterOpen={() => {
          tabRefs.current.basic?.focus()
        }}
        style={modalStyles}
        contentLabel={t('Tạo sản phẩm')}
      >
        <div
          aria-busy={isCreating}
          className="app-scroll modal-form w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">
                {t('Tạo sản phẩm')}
              </h4>
              <button
                type="button"
                className="rounded-full p-2 hover:bg-slate-100"
                disabled={isCreating}
                onClick={() => {
                  void requestCloseModal()
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label={t('Các tab sản phẩm')}>
              {[
                { id: 'basic', label: 'Thông tin', errorTitle: 'Thiếu tên, SKU hoặc giá bán' },
                { id: 'description', label: 'Mô tả chi tiết', errorTitle: 'Có lỗi ở ảnh mô tả' },
                { id: 'specs', label: 'Thông số', errorTitle: 'Có lỗi ở thông số' },
                { id: 'videos', label: 'Video', errorTitle: 'URL video không hợp lệ' },
              ].map((tab) => {
                const tabId = tab.id as typeof activeTab
                const isTabActive = activeTab === tabId
                const tabHasError = createTabHasError[tabId]

                return (
                  <button
                    key={tab.id}
                    ref={(node) => {
                      tabRefs.current[tabId] = node
                    }}
                    id={`product-tab-${tab.id}`}
                    className={
                      isTabActive
                        ? `inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white shadow ${tabHasError ? 'ring-2 ring-rose-200 ring-offset-2 ring-offset-white' : ''}`
                        : `inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${tabHasError ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-700'}`
                    }
                    role="tab"
                    aria-selected={isTabActive}
                    aria-controls={`product-tabpanel-${tab.id}`}
                    tabIndex={isTabActive ? 0 : -1}
                    title={tabHasError ? t(tab.errorTitle) : undefined}
                    onKeyDown={(event) => {
                      const currentIndex = tabOrder.indexOf(activeTab)
                      let nextIndex = currentIndex

                      switch (event.key) {
                        case 'ArrowRight':
                        case 'ArrowDown':
                          nextIndex = (currentIndex + 1) % tabOrder.length
                          break
                        case 'ArrowLeft':
                        case 'ArrowUp':
                          nextIndex = (currentIndex - 1 + tabOrder.length) % tabOrder.length
                          break
                        case 'Home':
                          nextIndex = 0
                          break
                        case 'End':
                          nextIndex = tabOrder.length - 1
                          break
                        default:
                          return
                      }

                      event.preventDefault()
                      const nextTab = tabOrder[nextIndex]
                      setActiveTab(nextTab)
                      tabRefs.current[nextTab]?.focus()
                    }}
                    onClick={() => setActiveTab(tabId)}
                  >
                    <span>{t(tab.label)}</span>
                    {tabHasError ? <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
                  </button>
                )
              })}
            </div>

                        {isCreateFormDirty ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="status">
                {t('Bạn có thay đổi chưa lưu trong biểu mẫu tạo sản phẩm.')}
              </div>
            ) : null}

            {activeTab === 'basic' && (
              <div
                id="product-tabpanel-basic"
                role="tabpanel"
                aria-labelledby="product-tab-basic"
                className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.9fr]"
              >
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('Thông tin cơ bản')}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <label className="text-sm text-slate-700">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {t('Tên sản phẩm')} <span className="text-rose-500">*</span>
                        </span>
                        <input
                          ref={nameInputRef}
                          aria-invalid={Boolean(errors.name)}
                          className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm ${errors.name ? 'border-rose-300' : 'border-slate-200'}`}
                          placeholder={t('Nhập tên sản phẩm')}
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          onBlur={(e) =>
                            validateCreateFieldOnBlur('name', {
                              ...newProduct,
                              name: e.target.value,
                            })
                          }
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                      </label>
                      <label className="text-sm text-slate-700">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {t('Thời hạn bảo hành (tháng)')}
                        </span>
                        <input
                          ref={warrantyInputRef}
                          type="text"
                          aria-invalid={Boolean(errors.warrantyPeriod)}
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="12"
                          className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm ${errors.warrantyPeriod ? 'border-rose-300' : 'border-slate-200'}`}
                          value={newProduct.warrantyPeriod}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              warrantyPeriod: toDigitsOnly(e.target.value),
                            })
                          }
                          onBlur={(e) =>
                            validateCreateFieldOnBlur('warrantyPeriod', {
                              ...newProduct,
                              warrantyPeriod: toDigitsOnly(e.target.value),
                            })
                          }
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          {t('Mặc định là 12 tháng nếu bạn không thay đổi.')}
                        </p>
                        {errors.warrantyPeriod && (
                          <p className="mt-1 text-xs text-red-500">{errors.warrantyPeriod}</p>
                        )}
                      </label>
                      <label className="text-sm text-slate-700">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">SKU *</span>
                        <input
                          ref={skuInputRef}
                          aria-invalid={Boolean(errors.sku)}
                          className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm ${errors.sku ? 'border-rose-300' : 'border-slate-200'}`}
                          placeholder={t('Nhập SKU')}
                          value={newProduct.sku}
                          onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                          onBlur={(e) =>
                            validateCreateFieldOnBlur('sku', {
                              ...newProduct,
                              sku: e.target.value,
                            })
                          }
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          {t('Gợi ý: dùng chữ in hoa, số và dấu gạch ngang để dễ tìm kiếm.')}
                        </p>
                        {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku}</p>}
                      </label>
                      <label className="text-sm text-slate-700 md:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {t('Mô tả ngắn')}
                        </span>
                        <textarea
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          placeholder={t('Nhập mô tả ngắn')}
                          rows={3}
                          maxLength={500}
                          value={newProduct.shortDescription}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, shortDescription: e.target.value })
                          }
                        />
                        <p className="mt-0.5 text-right text-xs text-slate-400">
                          {newProduct.shortDescription.length}/500
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {t(
                            'Đoạn này dùng cho phần tóm tắt ngắn. Nội dung đầy đủ được xây dựng ở tab "Mô tả chi tiết".',
                          )}
                        </p>
                      </label>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('Hiển thị')}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={newProduct.isFeatured}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, isFeatured: e.target.checked })
                          }
                        />
                        {t('Nổi bật')}
                      </label>
                      <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={newProduct.showOnHomepage}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, showOnHomepage: e.target.checked })
                          }
                        />
                        {t('Trang chủ')}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('Giá & trạng thái')}</p>
                    <div className="mt-4 grid gap-3">
                      <label className="text-sm text-slate-700">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {t('Giá bán lẻ')} <span className="text-rose-500">*</span>
                        </span>
                        <div className="relative mt-2">
                          <input
                            ref={retailPriceInputRef}
                            type="text"
                            aria-invalid={Boolean(errors.retailPrice)}
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder={t('Nhập giá bán lẻ')}
                            className={`w-full rounded-xl border px-3 py-2 pr-12 text-sm ${errors.retailPrice ? 'border-rose-300' : 'border-slate-200'}`}
                            value={formatNumberInput(newProduct.retailPrice)}
                            onChange={(e) => {
                              const rawValue = e.target.value
                              const selectionStart = e.target.selectionStart ?? rawValue.length
                              const digitsOnly = toDigitsOnly(rawValue)
                              const digitsBefore = toDigitsOnly(rawValue.slice(0, selectionStart)).length
                              const formattedNext = formatNumberInput(digitsOnly)
                              let caretPosition = formattedNext.length

                              if (digitsBefore === 0) {
                                caretPosition = 0
                              } else {
                                let digitCount = 0
                                for (let i = 0; i < formattedNext.length; i += 1) {
                                  if (/\d/.test(formattedNext[i])) {
                                    digitCount += 1
                                    if (digitCount === digitsBefore) {
                                      caretPosition = i + 1
                                      break
                                    }
                                  }
                                }
                              }

                              retailPriceCaretRef.current = caretPosition
                              setNewProduct({ ...newProduct, retailPrice: digitsOnly })
                            }}
                            onBlur={(e) =>
                              validateCreateFieldOnBlur('retailPrice', {
                                ...newProduct,
                                retailPrice: toDigitsOnly(e.target.value),
                              })
                            }
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                            VND
                          </span>
                        </div>
                        {hasZeroRetailPrice ? (
                          <p className="mt-1 text-xs text-amber-600">
                            {t('Giá 0 VND vẫn được phép, nhưng hệ thống sẽ hỏi xác nhận khi tạo.')}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-slate-500">
                            {t('Nhập giá bán lẻ thực tế của sản phẩm.')}
                          </p>
                        )}
                        {errors.retailPrice && (
                          <p className="mt-1 text-xs text-red-500">{errors.retailPrice}</p>
                        )}
                      </label>
                      <label className="text-sm text-slate-700">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {t('Trạng thái xuất bản')}
                        </span>
                        <select
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          value={newProduct.publishStatus}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              publishStatus: e.target.value as 'DRAFT' | 'PUBLISHED',
                            })
                          }
                        >
                          <option value="DRAFT">{t('Bản nháp')}</option>
                          <option value="PUBLISHED">{t('Đã xuất bản')}</option>
                        </select>
                      </label>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-[var(--surface-muted)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{t('Ảnh sản phẩm')}</p>
                        <p className="text-xs text-slate-500">{t('PNG/JPG, tối đa 10MB')}</p>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          ref={imageInputRef}
                          onChange={handleImageChange}
                        />
                        {t('Chọn ảnh')}
                      </label>
                    </div>
                    {(selectedImageName || imagePreviewUrl || newProduct.imageUrl) && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        {selectedImageName && (
                          <span>
                            {t('Đã chọn')}{': '}
                            <span className="font-semibold text-slate-800">{selectedImageName}</span>
                          </span>
                        )}
                        {(imagePreviewUrl || newProduct.imageUrl) && (
                          <button
                            type="button"
                            onClick={handleClearImage}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                          >
                            <X className="h-3 w-3" />
                            {t('Xóa ảnh')}
                          </button>
                        )}
                      </div>
                    )}
                    {imageError && (
                      <p className="mt-2 text-xs text-rose-500">{imageError}</p>
                    )}
                    {(imagePreviewUrl || newProduct.imageUrl) && (
                      <div className="group relative mt-3 overflow-hidden rounded-2xl border bg-white">
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="absolute right-2 top-2 inline-flex min-h-11 items-center gap-1 rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-sm opacity-100 transition hover:border-rose-300 hover:text-rose-700 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                        >
                          <X className="h-3 w-3" />
                          {t('Xóa ảnh')}
                        </button>
                        <img
                          src={imagePreviewUrl || resolveBackendAssetUrl(newProduct.imageUrl)}
                          alt={t('Xem trước')}
                          className="h-40 w-full object-cover"
                          onError={(ev) => ((ev.target as HTMLImageElement).style.display = 'none')}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'description' && (
              <div
                id="product-tabpanel-description"
                role="tabpanel"
                aria-labelledby="product-tab-description"
                className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-[var(--surface-muted)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900">{t('Mô tả chi tiết')}</p>
                    <p className="max-w-2xl text-xs text-slate-500">
                      {t(
                        'Xây dựng phần mô tả chi tiết bằng các khối nội dung. Thứ tự các khối cũng là thứ tự hiển thị trên trang sản phẩm.',
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={subtleActionButtonClass}
                    onClick={() => {
                      void applyDescriptionTemplate()
                    }}
                  >
                    {t('Dùng mẫu')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {descriptionBlockOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={subtleActionButtonClass}
                      onClick={() => appendDescriptionBlock(option.id)}
                    >
                      {option.addLabel}
                    </button>
                  ))}
                </div>
                {newProduct.descriptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    <p className="font-semibold text-slate-700">{t('Chưa có khối nội dung nào.')}</p>
                    <p className="mt-2">
                      {t(
                        'Chọn loại khối ở phía trên để thêm tiêu đề, đoạn mô tả, hình ảnh, bộ ảnh hoặc video vào trang chi tiết sản phẩm.',
                      )}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {t('Nút "Dùng mẫu" sẽ tạo sẵn một bố cục cơ bản để bạn chỉnh sửa nhanh hơn.')}
                    </p>
                  </div>
                ) : (
                  newProduct.descriptions.map((d, idx) => (
                    <div
                      key={idx}
                      className="space-y-3 rounded-xl border border-slate-200 bg-white p-3"
                      draggable
                      onDragStart={() => {
                        descriptionDragIndexRef.current = idx
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        const fromIdx = descriptionDragIndexRef.current
                        if (fromIdx === null || fromIdx === idx) return
                        setNewProduct((prev) => ({
                          ...prev,
                          descriptions: moveListItem(prev.descriptions, fromIdx, idx),
                        }))
                        setDescriptionImageErrors((prev) => moveIndexedRecord(prev, fromIdx, idx))
                        descriptionDragIndexRef.current = null
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="cursor-grab text-slate-300 active:cursor-grabbing"
                            aria-hidden="true"
                            title={t('Kéo để sắp xếp')}
                          >
                            <GripVertical className="h-4 w-4" />
                          </span>
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                              {t('Khối')} {idx + 1}
                            </p>
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                              {getDescriptionBlockLabel(d.type)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() => moveDescriptionItem(idx, -1)}
                          >
                            {t('Lên')}
                          </button>
                          <button
                            type="button"
                            disabled={idx === newProduct.descriptions.length - 1}
                            className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() => moveDescriptionItem(idx, 1)}
                          >
                            {t('Xuống')}
                          </button>
                          <button
                            type="button"
                            className="min-h-11 rounded-lg px-3 py-2 text-xs font-semibold text-red-500"
                            onClick={() => removeDescriptionItem(idx)}
                          >
                            {t('Xóa')}
                          </button>
                        </div>
                      </div>
                      {d.type === 'description' && (
                        <div className="richtext-editor">
                          <RichTextEditor
                            ariaLabel={t('Trình soạn thảo mô tả chi tiết')}
                            value={d.text ?? ''}
                            modules={descriptionEditorModules}
                            formats={descriptionEditorFormats}
                            placeholder={t('Nhập mô tả')}
                            onChange={(value) => {
                              const copy = [...newProduct.descriptions]
                              copy[idx] = { ...copy[idx], text: value }
                              setNewProduct({ ...newProduct, descriptions: copy })
                            }}
                          />
                        </div>
                      )}
                      {d.type === 'image' && (
                        <div className="grid gap-2 md:grid-cols-[1.4fr_1fr]">
                          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) =>
                                handleDescriptionImageFile(idx, e.target.files?.[0] ?? null)
                              }
                            />
                            {t('Chọn ảnh')}
                          </label>
                          <label className="block">
                            <span className="sr-only">{t('Chú thích hình ảnh')}</span>
                            <input
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                              placeholder={t('Nhập chú thích')}
                              value={d.caption ?? ''}
                              onChange={(e) => {
                                const copy = [...newProduct.descriptions]
                                copy[idx] = { ...copy[idx], caption: e.target.value }
                                setNewProduct({ ...newProduct, descriptions: copy })
                              }}
                            />
                          </label>
                          {descriptionImageErrors[idx] && (
                            <p className="text-xs text-rose-500">{descriptionImageErrors[idx]}</p>
                          )}
                          {d.url && (
                            <div className="group relative overflow-hidden rounded-lg border border-slate-200 md:col-span-2">
                              <img
                                src={resolveBackendAssetUrl(d.url)}
                                alt={t('Xem trước')}
                                className="h-40 w-full object-cover"
                              />
                              <button
                                type="button"
                                className="absolute right-2 top-2 inline-flex min-h-11 items-center rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                                onClick={() => clearDescriptionImage(idx)}
                              >
                                {t('Xóa ảnh')}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {d.type === 'gallery' && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="sr-only"
                                onChange={(e) => handleDescriptionGalleryFiles(idx, e.target.files)}
                              />
                              {t('Chọn nhiều ảnh')}
                            </label>
                            <button
                              type="button"
                              className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                              onClick={() => {
                                const copy = [...newProduct.descriptions]
                                const current = { ...copy[idx] }
                                const nextGallery = [...(current.gallery ?? []), { url: '' }]
                                current.gallery = nextGallery
                                copy[idx] = current
                                setNewProduct({ ...newProduct, descriptions: copy })
                              }}
                            >
                              {t('Thêm hình ảnh')}
                            </button>
                          </div>
                          {descriptionImageErrors[idx] && (
                            <p className="text-xs text-rose-500">{descriptionImageErrors[idx]}</p>
                          )}
                          <label className="text-sm text-slate-700">
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              {t('Chú thích bộ ảnh')}
                            </span>
                            <input
                              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                              placeholder={t('Nhập chú thích bộ ảnh')}
                              value={d.caption ?? ''}
                              onChange={(e) => {
                                const copy = [...newProduct.descriptions]
                                copy[idx] = { ...copy[idx], caption: e.target.value }
                                setNewProduct({ ...newProduct, descriptions: copy })
                              }}
                            />
                          </label>
                          {(d.gallery ?? []).length === 0 && (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                              <p className="font-semibold text-slate-700">{t('Chưa có hình ảnh nào.')}</p>
                              <button
                                type="button"
                                className="mt-2 text-xs font-semibold text-[var(--accent)]"
                                onClick={() => {
                                  const copy = [...newProduct.descriptions]
                                  const current = { ...copy[idx] }
                                  const nextGallery = [...(current.gallery ?? []), { url: '' }]
                                  current.gallery = nextGallery
                                  copy[idx] = current
                                  setNewProduct({ ...newProduct, descriptions: copy })
                                }}
                              >
                                {t('Thêm hình ảnh đầu tiên')}
                              </button>
                            </div>
                          )}
                          {(d.gallery ?? []).map((item, itemIdx) => (
                            <div key={itemIdx} className="rounded-lg border border-slate-200 bg-white p-3">
                              <div className="grid gap-3 lg:grid-cols-[180px_1fr] lg:items-start">
                                <div className="space-y-2">
                                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="sr-only"
                                      onChange={(e) =>
                                        handleGalleryItemFile(idx, itemIdx, e.target.files?.[0] ?? null)
                                      }
                                    />
                                    {item.url ? t('Chọn ảnh') : t('Chọn ảnh')}
                                  </label>
                                  {item.url && (
                                    <div className="group relative overflow-hidden rounded-lg border border-slate-200">
                                      <img
                                        src={resolveBackendAssetUrl(item.url)}
                                        alt={t('Xem trước')}
                                        className="h-24 w-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        className="absolute right-2 top-2 inline-flex min-h-11 items-center rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                                        onClick={() => clearGalleryItemImage(idx, itemIdx)}
                                      >
                                        {t('Xóa ảnh')}
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-start justify-end">
                                  <button
                                    type="button"
                                    className="text-xs text-red-500"
                                    onClick={() => clearGalleryItemImage(idx, itemIdx, true)}
                                  >
                                    {t('Xóa ảnh')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {d.type === 'video' && (
                        <div className="grid gap-2 md:grid-cols-[1.4fr_1fr]">
                          <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder={t('Nhập URL video YouTube hoặc file video công khai')}
                            value={d.url ?? ''}
                            onChange={(e) => {
                              const copy = [...newProduct.descriptions]
                              copy[idx] = { ...copy[idx], url: e.target.value }
                              setNewProduct({ ...newProduct, descriptions: copy })
                            }}
                          />
                          <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder={t('Nhập chú thích')}
                            value={d.caption ?? ''}
                            onChange={(e) => {
                              const copy = [...newProduct.descriptions]
                              copy[idx] = { ...copy[idx], caption: e.target.value }
                              setNewProduct({ ...newProduct, descriptions: copy })
                            }}
                          />
                          <p className="text-xs text-slate-500 md:col-span-2">
                            {t(
                              'Video này hiển thị xen kẽ trong mô tả chi tiết. Nếu muốn có khu vực video riêng cho sản phẩm, dùng tab "Video".',
                            )}
                          </p>
                          {debouncedDescriptionVideoUrls[idx] &&
                          isValidRemoteUrl(debouncedDescriptionVideoUrls[idx]) ? (
                            <div className="group relative overflow-hidden rounded-lg border border-slate-200 md:col-span-2">
                              <ProductVideoPreview
                                url={debouncedDescriptionVideoUrls[idx]}
                                title={d.caption}
                              />
                              <button
                                type="button"
                                className="absolute right-2 top-2 inline-flex min-h-11 items-center rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                                onClick={() => {
                                  const copy = [...newProduct.descriptions]
                                  copy[idx] = { ...copy[idx], url: '' }
                                  setNewProduct({ ...newProduct, descriptions: copy })
                                }}
                              >
                                {t('Xóa video')}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {newProduct.descriptions.length > 0 && newProduct.descriptions.some((item) => {
                  if (item.type === 'description') return !(item.text ?? '').trim()
                  if (item.type === 'image' || item.type === 'video') return !(item.url ?? '').trim()
                  if (item.type === 'gallery') return (item.gallery ?? []).every((g) => !g.url.trim())
                  return false
                }) && (
                  <p className="text-xs italic text-slate-400">
                    {t('Các khối trống sẽ bị bỏ qua khi lưu.')}
                  </p>
                )}
                {newProduct.descriptions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {descriptionBlockOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={subtleActionButtonClass}
                        onClick={() => appendDescriptionBlock(option.id)}
                      >
                        {option.addLabel}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div
                id="product-tabpanel-specs"
                role="tabpanel"
                aria-labelledby="product-tab-specs"
                className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-[var(--surface-muted)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900">{t('Thông số')}</p>
                    <p className="text-xs text-slate-500">
                      {t('Thêm các thông số kỹ thuật quan trọng.')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {suggestedSpecificationLabels.map((label) => (
                        <button
                          key={label}
                          type="button"
                          className="min-h-11 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                          onClick={() => applySuggestedSpecificationLabel(label)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={subtleActionButtonClass}
                    onClick={() => {
                      void applySpecificationTemplate()
                    }}
                  >
                    {t('Dùng mẫu')}
                  </button>
                </div>
                {newProduct.specifications.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    <p className="font-semibold text-slate-700">{t('Chưa có thông số nào.')}</p>
                    <button
                      type="button"
                      className={`mt-2 ${subtleActionButtonClass}`}
                      onClick={() =>
                        setNewProduct({
                          ...newProduct,
                          specifications: [{ label: '', value: '' }],
                        })
                      }
                    >
                      {t('Thêm thông số đầu tiên')}
                    </button>
                  </div>
                ) : (
                  newProduct.specifications.map((s, idx) => (
                    <div
                      key={idx}
                      className="grid gap-2 md:grid-cols-[auto_1fr_1fr_auto] md:items-center"
                      draggable
                      onDragStart={() => {
                        specDragIndexRef.current = idx
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        const fromIdx = specDragIndexRef.current
                        if (fromIdx === null || fromIdx === idx) return
                        setNewProduct((prev) => ({
                          ...prev,
                          specifications: moveListItem(prev.specifications, fromIdx, idx),
                        }))
                        specDragIndexRef.current = null
                      }}
                    >
                      <span
                        className="hidden cursor-grab self-center text-slate-300 active:cursor-grabbing md:flex"
                        aria-hidden="true"
                        title={t('Kéo để sắp xếp')}
                      >
                        <GripVertical className="h-4 w-4" />
                      </span>
                      <label className="block">
                        <span className="sr-only">{t('Nhãn thông số')}</span>
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder={t('Nhập nhãn')}
                          value={s.label}
                          onChange={(e) => {
                            const copy = [...newProduct.specifications]
                            copy[idx] = { ...copy[idx], label: e.target.value }
                            setNewProduct({ ...newProduct, specifications: copy })
                          }}
                        />
                      </label>
                      <label className="block">
                        <span className="sr-only">{t('Giá trị thông số')}</span>
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder={t('Nhập giá trị')}
                          value={s.value}
                          onChange={(e) => {
                            const copy = [...newProduct.specifications]
                            copy[idx] = { ...copy[idx], value: e.target.value }
                            setNewProduct({ ...newProduct, specifications: copy })
                          }}
                        />
                      </label>
                      <div className="flex items-center justify-end gap-2 md:justify-self-auto">
                        <button
                          type="button"
                          disabled={idx === 0}
                          className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => moveSpecificationItem(idx, -1)}
                        >
                          {t('Lên')}
                        </button>
                        <button
                          type="button"
                          disabled={idx === newProduct.specifications.length - 1}
                          className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => moveSpecificationItem(idx, 1)}
                        >
                          {t('Xuống')}
                        </button>
                        <button
                          type="button"
                          className="min-h-11 px-3 py-2 text-xs font-semibold text-red-500"
                          onClick={() => {
                            const copy = newProduct.specifications.filter((_, i) => i !== idx)
                            setNewProduct({ ...newProduct, specifications: copy })
                          }}
                        >
                          {t('Xóa')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
                {newProduct.specifications.length > 0 && (
                  <button
                    type="button"
                    className={subtleActionButtonClass}
                    onClick={() =>
                      setNewProduct({
                        ...newProduct,
                        specifications: [...newProduct.specifications, { label: '', value: '' }],
                      })
                    }
                  >
                    {t('+ Thêm thông số')}
                  </button>
                )}
              </div>
            )}

            {activeTab === 'videos' && (
              <div
                id="product-tabpanel-videos"
                role="tabpanel"
                aria-labelledby="product-tab-videos"
                className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-[var(--surface-muted)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900">{t('Video')}</p>
                    <p className="max-w-2xl text-xs text-slate-500">
                      {t(
                        'Các video ở tab này hiển thị thành khu vực video riêng trên trang sản phẩm. Video chèn giữa nội dung dùng ở tab "Mô tả chi tiết".',
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={subtleActionButtonClass}
                    onClick={() => {
                      void applyVideoTemplate()
                    }}
                  >
                    {t('Dùng mẫu')}
                  </button>
                </div>
                {newProduct.videos.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    <p className="font-semibold text-slate-700">{t('Chưa có video nào.')}</p>
                    <button
                      type="button"
                      className={`mt-2 ${subtleActionButtonClass}`}
                      onClick={() =>
                        setNewProduct({
                          ...newProduct,
                          videos: createVideoTemplate(),
                        })
                      }
                    >
                      {t('Thêm video đầu tiên')}
                    </button>
                  </div>
                ) : (
                  newProduct.videos.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3">
                      <label className="block">
                        <span className="sr-only">{t('Tiêu đề video')}</span>
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder={t('Nhập tiêu đề')}
                          value={v.title}
                          onChange={(e) => {
                            const copy = [...newProduct.videos]
                            copy[idx] = { ...copy[idx], title: e.target.value }
                            setNewProduct({ ...newProduct, videos: copy })
                          }}
                        />
                      </label>
                      <label className="block">
                        <span className="sr-only">{t('URL video')}</span>
                        <input
                          ref={(element) => {
                            videoUrlInputRefs.current[idx] = element
                          }}
                          aria-invalid={Boolean(productVideoErrors[idx])}
                          className={`w-full rounded-lg border px-3 py-2 text-sm ${productVideoErrors[idx] ? 'border-rose-300' : 'border-slate-200'}`}
                          placeholder={t('Nhập URL video YouTube hoặc file video công khai')}
                          value={v.url}
                          onChange={(e) => {
                            const copy = [...newProduct.videos]
                            copy[idx] = { ...copy[idx], url: e.target.value }
                            setNewProduct({ ...newProduct, videos: copy })
                            setProductVideoErrors((prev) => {
                              if (!(idx in prev)) return prev
                              const next = { ...prev }
                              delete next[idx]
                              return next
                            })
                          }}
                          onBlur={(e) =>
                            validateProductVideoOnBlur(idx, {
                              ...v,
                              url: e.target.value,
                            })
                          }
                        />
                      </label>
                      {productVideoErrors[idx] && (
                        <p className="text-xs text-rose-500">{productVideoErrors[idx]}</p>
                      )}
                      <label className="block">
                        <span className="sr-only">{t('Mô tả video')}</span>
                        <textarea
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder={t('Nhập mô tả')}
                          rows={2}
                          value={v.descriptions}
                          onChange={(e) => {
                            const copy = [...newProduct.videos]
                            copy[idx] = { ...copy[idx], descriptions: e.target.value }
                            setNewProduct({ ...newProduct, videos: copy })
                          }}
                        />
                      </label>
                      {debouncedProductVideoUrls[idx] &&
                      isValidRemoteUrl(debouncedProductVideoUrls[idx]) ? (
                        <div className="group relative overflow-hidden rounded-lg border border-slate-200">
                          <ProductVideoPreview
                            url={debouncedProductVideoUrls[idx]}
                            title={v.title}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-2 inline-flex min-h-11 items-center rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                            onClick={() => {
                              const copy = [...newProduct.videos]
                              copy[idx] = { ...copy[idx], url: '' }
                              setNewProduct({ ...newProduct, videos: copy })
                              setProductVideoErrors((prev) => {
                                if (!(idx in prev)) return prev
                                const next = { ...prev }
                                delete next[idx]
                                return next
                              })
                            }}
                          >
                            {t('Xóa video')}
                          </button>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={idx === 0}
                          className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => moveVideoItem(idx, -1)}
                        >
                          {t('Lên')}
                        </button>
                        <button
                          type="button"
                          disabled={idx === newProduct.videos.length - 1}
                          className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => moveVideoItem(idx, 1)}
                        >
                          {t('Xuống')}
                        </button>
                        <button
                          type="button"
                          className="min-h-11 px-3 py-2 text-xs font-semibold text-red-500"
                          onClick={() => {
                            const copy = newProduct.videos.filter((_, i) => i !== idx)
                            setNewProduct({ ...newProduct, videos: copy })
                            const nextVideoUrlRefs: Record<number, HTMLInputElement | null> = {}
                            Object.entries(videoUrlInputRefs.current).forEach(([key, element]) => {
                              const index = Number(key)
                              if (Number.isNaN(index) || index === idx) {
                                return
                              }
                              nextVideoUrlRefs[index > idx ? index - 1 : index] = element
                            })
                            videoUrlInputRefs.current = nextVideoUrlRefs
                            setProductVideoErrors((prev) => {
                              const next: Record<number, string> = {}
                              Object.entries(prev).forEach(([key, value]) => {
                                const index = Number(key)
                                if (Number.isNaN(index)) return
                                if (index < idx) {
                                  next[index] = value
                                } else if (index > idx) {
                                  next[index - 1] = value
                                }
                              })
                              return next
                            })
                          }}
                        >
                          {t('Xóa video')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
                {newProduct.videos.length > 0 && (
                  <button
                    type="button"
                    className={subtleActionButtonClass}
                    onClick={() =>
                      setNewProduct({
                        ...newProduct,
                        videos: [
                          ...newProduct.videos,
                          ...createVideoTemplate(),
                        ],
                      })
                    }
                  >
                    {t('+ Thêm video')}
                  </button>
                )}
              </div>
            )}
            <div className="sticky bottom-0 mt-6 -mx-6 border-t border-slate-200/70 bg-white/95 px-6 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={isCreating}
                  className={secondaryButtonClass}
                  onClick={() => {
                    void requestCloseModal()
                  }}
                >
                  {t('Hủy')}
                </button>
                <button
                  type="button"
                  disabled={isCreating}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleCreateProductSubmit}
                >
                  {isCreating ? (
                    <>
                      <RotateCcw className="h-4 w-4 animate-spin" />
                      {t('Đang tạo...')}
                    </>
                  ) : (
                    t('Tạo')
                  )}
                </button>
              </div>
            </div>
        </div>
      </Modal>
      {confirmDialog}
    </section>
  )
}

export default ProductsPage
