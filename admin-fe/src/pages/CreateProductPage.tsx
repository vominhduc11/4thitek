import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, GripVertical, RotateCcw, X } from 'lucide-react'
import { ProductVideoPreview } from '../components/ProductVideoPreview'
import { RichTextEditor } from '../components/RichTextEditor'
import { PagePanel } from '../components/ui-kit'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../context/ProductsContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import { resolveBackendAssetUrl } from '../lib/backendApi'
import { deleteStoredFileReference, storeFileReference } from '../lib/upload'

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

const hasVideoContent = (items: ProductVideoItem[]) =>
  items.some((item) => item.title.trim() || item.descriptions.trim() || item.url.trim())

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
    if (Number.isNaN(index)) return

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
    if (!url && !caption) return null
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

  if (gallery.length === 0 && !caption) return null

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

const toDigitsOnly = (value: string) => value.replace(/\D/g, '')

const formatNumberInput = (value: string) => {
  if (!value) return ''
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function CreateProductPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { notify } = useToast()
  const { accessToken } = useAuth()
  const { confirm, confirmDialog } = useConfirmDialog()
  const { products, addProduct } = useProducts()

  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const warrantyInputRef = useRef<HTMLInputElement | null>(null)
  const skuInputRef = useRef<HTMLInputElement | null>(null)
  const videoUrlInputRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const uploadedAssetUrlsRef = useRef<Set<string>>(new Set())
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
  const [newProduct, setNewProduct] = useState(createInitialNewProduct)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isCreating, setIsCreating] = useState(false)
  const tabOrder = ['basic', 'description', 'specs', 'videos'] as const

  const uploadImageAsset = async (file: File) =>
    storeFileReference({ file, category: 'products', accessToken })

  const getTrackedUploadUrls = (urls: Array<string | null | undefined>) =>
    Array.from(
      new Set(
        urls
          .map((url) => url?.trim() ?? '')
          .filter((url) => url && uploadedAssetUrlsRef.current.has(url)),
      ),
    )

  const getTrackedUploadUrlsFromDescriptionItem = (item?: DescriptionItem) =>
    getTrackedUploadUrls([item?.url, ...(item?.gallery ?? []).map((g) => g.url)])

  const getTrackedUploadUrlsFromDescriptionItems = (items: DescriptionItem[]) =>
    getTrackedUploadUrls(
      items.flatMap((item) => [item.url, ...(item.gallery ?? []).map((g) => g.url)]),
    )

  const trackUploadedAsset = (url: string) => {
    const normalized = url.trim()
    if (normalized) uploadedAssetUrlsRef.current.add(normalized)
  }

  const clearUploadedAssetTracking = () => {
    uploadedAssetUrlsRef.current.clear()
  }

  const cleanupUploadedAssets = useCallback(
    async (urls: Array<string | null | undefined>) => {
      const trackedUrls = getTrackedUploadUrls(urls)
      if (trackedUrls.length === 0) return

      const results = await Promise.allSettled(
        trackedUrls.map(async (url) => {
          await deleteStoredFileReference({ url, accessToken })
          return url
        }),
      )

      const failedUrls: string[] = []
      results.forEach((result, index) => {
        const url = trackedUrls[index]
        if (result.status === 'fulfilled') {
          uploadedAssetUrlsRef.current.delete(url)
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

  // Cleanup uploaded assets on unmount
  useEffect(() => {
    const trackedUploads = uploadedAssetUrlsRef.current
    return () => {
      if (trackedUploads.size > 0) {
        void cleanupUploadedAssets(Array.from(trackedUploads))
      }
    }
  }, [cleanupUploadedAssets])

  // Revoke blob URL when imagePreviewUrl changes
  useEffect(() => {
    if (!imagePreviewUrl || !imagePreviewUrl.startsWith('blob:')) return
    return () => {
      URL.revokeObjectURL(imagePreviewUrl)
    }
  }, [imagePreviewUrl])

  // Debounce description video URLs
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextUrls = newProduct.descriptions.reduce<Record<number, string>>((acc, item, index) => {
        if (item.type !== 'video') return acc
        const url = item.url?.trim() ?? ''
        if (url) acc[index] = url
        return acc
      }, {})
      setDebouncedDescriptionVideoUrls(nextUrls)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [newProduct.descriptions])

  // Debounce product video URLs
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextUrls = newProduct.videos.reduce<Record<number, string>>((acc, item, index) => {
        const url = item.url.trim()
        if (url) acc[index] = url
        return acc
      }, {})
      setDebouncedProductVideoUrls(nextUrls)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [newProduct.videos])

  // Keep retail price caret position after formatting
  useLayoutEffect(() => {
    if (retailPriceCaretRef.current === null) return
    const input = retailPriceInputRef.current
    if (!input) return
    const caret = retailPriceCaretRef.current
    retailPriceCaretRef.current = null
    input.setSelectionRange(caret, caret)
  }, [newProduct.retailPrice])

  const isCreateFormDirty = useMemo(
    () => JSON.stringify(newProduct) !== JSON.stringify(createInitialNewProduct()),
    [newProduct],
  )

  const createTabHasError = useMemo(
    () => ({
      basic: Boolean(
        imageError || errors.name || errors.sku || errors.retailPrice || errors.warrantyPeriod,
      ),
      description: Object.keys(descriptionImageErrors).length > 0,
      specs: false,
      videos: Object.keys(productVideoErrors).length > 0,
    }),
    [descriptionImageErrors, errors, imageError, productVideoErrors],
  )

  const hasZeroRetailPrice = newProduct.retailPrice.trim() === '0'

  const clearDescriptionImage = (index: number) => {
    const currentUrl = newProduct.descriptions[index]?.url?.trim() ?? ''
    setNewProduct((prev) => {
      const copy = [...prev.descriptions]
      const currentItem = copy[index] ?? { type: 'image' as const }
      copy[index] = { ...currentItem, type: 'image', url: '' }
      return { ...prev, descriptions: copy }
    })
    setDescriptionImageErrors((prev) => {
      if (!(index in prev)) return prev
      const next = { ...prev }
      delete next[index]
      return next
    })
    void cleanupUploadedAssets([currentUrl])
  }

  const clearGalleryItemImage = (index: number, itemIndex: number, removeItem = false) => {
    const current = newProduct.descriptions[index]
    const currentUrl = current?.gallery?.[itemIndex]?.url?.trim() ?? ''
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
      if (!(index in prev)) return prev
      const next = { ...prev }
      delete next[index]
      return next
    })
    void cleanupUploadedAssets([currentUrl])
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
      if (!normalizedSku) return t('Vui lòng nhập SKU')
      return products.some((p) => p.sku.toLowerCase() === normalizedSku.toLowerCase())
        ? t('SKU đã tồn tại')
        : ''
    }
    if (field === 'retailPrice') {
      if (!draft.retailPrice.trim()) return t('Vui lòng nhập giá bán lẻ')
      const priceNum = Number(draft.retailPrice)
      return Number.isNaN(priceNum) || priceNum < 0 ? t('Giá phải là số không âm') : ''
    }
    if (field === 'warrantyPeriod') {
      const n = Number(draft.warrantyPeriod)
      if (Number.isNaN(n) || n <= 0 || !Number.isInteger(n))
        return t('Thời hạn bảo hành phải là số nguyên dương')
      if (n > 120) return t('Tối đa 120 tháng')
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
      if (prev[field] === message) return prev
      return { ...prev, [field]: message }
    })
  }

  const validateCreateFieldOnBlur = (
    field: Exclude<CreateProductErrorField, 'videos'>,
    draft: NewProductDraft = newProduct,
  ) => {
    setCreateFieldError(field, getCreateFieldError(field, draft))
  }

  const getProductVideoError = (video: ProductVideoItem) => {
    const hasVideoValues = video.title.trim() || video.descriptions.trim() || video.url.trim()
    if (!hasVideoValues) return ''
    if (!video.url.trim()) return t('Vui lòng nhập URL video')
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
      if (prev[index] === message) return prev
      return { ...prev, [index]: message }
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
    if (!hasContent) return true
    return confirm({
      title: t('Thay thế dữ liệu hiện tại?'),
      message: t('Mẫu sẽ ghi đè nội dung bạn đang nhập trong mục này.'),
      confirmLabel: t('Ghi đè'),
      cancelLabel: t('Giữ lại'),
      tone: 'warning',
    })
  }

  const applyDescriptionTemplate = async () => {
    const approved = await confirmTemplateReplacement(hasDescriptionContent(newProduct.descriptions))
    if (!approved) return
    const previousUrls = getTrackedUploadUrlsFromDescriptionItems(newProduct.descriptions)
    setDescriptionImageErrors({})
    setNewProduct((prev) => ({ ...prev, descriptions: createDescriptionTemplate() }))
    void cleanupUploadedAssets(previousUrls)
  }

  const applySpecificationTemplate = async () => {
    const approved = await confirmTemplateReplacement(
      hasSpecificationContent(newProduct.specifications),
    )
    if (!approved) return
    setNewProduct((prev) => ({ ...prev, specifications: createSpecificationTemplate() }))
  }

  const applyVideoTemplate = async () => {
    const approved = await confirmTemplateReplacement(hasVideoContent(newProduct.videos))
    if (!approved) return
    setProductVideoErrors({})
    setNewProduct((prev) => ({ ...prev, videos: createVideoTemplate() }))
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
    if (targetIndex < 0 || targetIndex >= newProduct.descriptions.length) return
    setNewProduct((prev) => ({
      ...prev,
      descriptions: moveListItem(prev.descriptions, index, targetIndex),
    }))
    setDescriptionImageErrors((prev) => moveIndexedRecord(prev, index, targetIndex))
  }

  const moveSpecificationItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newProduct.specifications.length) return
    setNewProduct((prev) => ({
      ...prev,
      specifications: moveListItem(prev.specifications, index, targetIndex),
    }))
  }

  const moveVideoItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newProduct.videos.length) return
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
      return { ...prev, specifications: [...copy, { label, value: '' }] }
    })
  }

  const handleDescriptionImageFile = async (index: number, file: File | null) => {
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setDescriptionImageErrors((prev) => ({ ...prev, [index]: t('Ảnh tối đa 10MB') }))
      return
    }
    try {
      const previousUrl = newProduct.descriptions[index]?.url?.trim() ?? ''
      const stored = await uploadImageAsset(file)
      trackUploadedAsset(stored.url)
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
      void cleanupUploadedAssets([previousUrl])
    } catch (error) {
      const message = getErrorMessage(error, t('Không thể tải ảnh lên. Vui lòng thử lại.'))
      setDescriptionImageErrors((prev) => ({ ...prev, [index]: message }))
      notify(message, { title: 'Products', variant: 'error' })
    }
  }

  const handleDescriptionGalleryFiles = async (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileList = Array.from(files)
    const oversized = fileList.find((file) => file.size > MAX_IMAGE_BYTES)
    if (oversized) {
      setDescriptionImageErrors((prev) => ({ ...prev, [index]: t('Ảnh tối đa 10MB') }))
    }
    const validFiles = fileList.filter((file) => file.size <= MAX_IMAGE_BYTES)
    if (validFiles.length === 0) return
    try {
      const storedItems = await Promise.all(validFiles.map((file) => uploadImageAsset(file)))
      storedItems.forEach((item) => trackUploadedAsset(item.url))
      const newItems = storedItems.filter((item) => item.url).map((item) => ({ url: item.url }))
      setNewProduct((prev) => {
        const copy = [...prev.descriptions]
        const current = copy[index] ?? { type: 'gallery' as const, gallery: [] as GalleryItem[] }
        copy[index] = { ...current, type: 'gallery', gallery: [...(current.gallery ?? []), ...newItems] }
        return { ...prev, descriptions: copy }
      })
      setDescriptionImageErrors((prev) => {
        const next = { ...prev }
        delete next[index]
        return next
      })
    } catch (error) {
      const message = getErrorMessage(error, t('Không thể tải ảnh lên. Vui lòng thử lại.'))
      setDescriptionImageErrors((prev) => ({ ...prev, [index]: message }))
      notify(message, { title: 'Products', variant: 'error' })
    }
  }

  const handleGalleryItemFile = async (index: number, itemIndex: number, file: File | null) => {
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setDescriptionImageErrors((prev) => ({ ...prev, [index]: t('Ảnh tối đa 10MB') }))
      return
    }
    try {
      const previousUrl = newProduct.descriptions[index]?.gallery?.[itemIndex]?.url?.trim() ?? ''
      const stored = await uploadImageAsset(file)
      trackUploadedAsset(stored.url)
      setNewProduct((prev) => {
        const copy = [...prev.descriptions]
        const current = copy[index] ?? { type: 'gallery' as const, gallery: [] as GalleryItem[] }
        const nextGallery = [...(current.gallery ?? [])]
        nextGallery[itemIndex] = { ...(nextGallery[itemIndex] ?? { url: '' }), url: stored.url }
        copy[index] = { ...current, type: 'gallery', gallery: nextGallery }
        return { ...prev, descriptions: copy }
      })
      setDescriptionImageErrors((prev) => {
        const next = { ...prev }
        delete next[index]
        return next
      })
      void cleanupUploadedAssets([previousUrl])
    } catch (error) {
      const message = getErrorMessage(error, t('Không thể tải ảnh lên. Vui lòng thử lại.'))
      setDescriptionImageErrors((prev) => ({ ...prev, [index]: message }))
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
        if (idx < index) next[idx] = value
        else if (idx > index) next[idx - 1] = value
      })
      return next
    })
    void cleanupUploadedAssets(getTrackedUploadUrlsFromDescriptionItem(removedItem))
  }

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
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
      trackUploadedAsset(stored.url)
      setNewProduct((prev) => ({ ...prev, imageUrl: stored.url }))
      void cleanupUploadedAssets([previousImageUrl])
    } catch (error) {
      const message = getErrorMessage(error, t('Không thể xử lý tệp đã chọn'))
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
    if (imageInputRef.current) imageInputRef.current.value = ''
    void cleanupUploadedAssets([currentImageUrl])
  }

  const requestNavigateAway = async () => {
    if (isCreating) return
    if (isCreateFormDirty) {
      const approved = await confirm({
        title: t('Rời khỏi trang?'),
        message: t('Mọi thay đổi chưa lưu sẽ bị mất.'),
        confirmLabel: t('Rời đi'),
        cancelLabel: t('Ở lại'),
        tone: 'warning',
      })
      if (!approved) return
    }
    await cleanupUploadedAssets(Array.from(uploadedAssetUrlsRef.current))
    navigate('/products')
  }

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
      if (message) nextErrors[field] = message
    })

    const priceNum = Number(newProduct.retailPrice)
    const warrantyPeriodNum = Number(newProduct.warrantyPeriod)

    newProduct.videos.forEach((video, index) => {
      const message = getProductVideoError(video)
      if (message) nextProductVideoErrors[index] = message
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
      .map((item) => ({ label: item.label.trim(), value: item.value.trim() }))
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
    if (isCreating) return

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
          descriptions: JSON.stringify(sanitizedDescriptions),
          specifications: JSON.stringify(sanitizedSpecifications),
          videos: JSON.stringify(sanitizedVideos),
        })
        clearUploadedAssetTracking()
        notify(t('Sản phẩm đã được tạo thành công'), { title: 'Products', variant: 'success' })
        navigate('/products')
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

  const subtleActionButtonClass =
    'inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]'
  const secondaryButtonClass =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <PagePanel>
      <div aria-busy={isCreating}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isCreating}
            onClick={() => void requestNavigateAway()}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Về sản phẩm')}
          </button>
          <h3 className="text-lg font-semibold text-slate-900">{t('Tạo sản phẩm')}</h3>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label={t('Các tab sản phẩm')}>
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
          <div
            className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
            role="status"
          >
            {t('Bạn có thay đổi chưa lưu trong biểu mẫu tạo sản phẩm.')}
          </div>
        ) : null}

        {/* Basic tab */}
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
                        validateCreateFieldOnBlur('name', { ...newProduct, name: e.target.value })
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
                        setNewProduct({ ...newProduct, warrantyPeriod: toDigitsOnly(e.target.value) })
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
                        validateCreateFieldOnBlur('sku', { ...newProduct, sku: e.target.value })
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
                      onChange={(e) => setNewProduct({ ...newProduct, isFeatured: e.target.checked })}
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
                    {t('Mới ra mắt')}
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
                {imageError && <p className="mt-2 text-xs text-rose-500">{imageError}</p>}
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

        {/* Description tab */}
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
                onClick={() => void applyDescriptionTemplate()}
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
                  onDragOver={(e) => e.preventDefault()}
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
                            current.gallery = [...(current.gallery ?? []), { url: '' }]
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
                              current.gallery = [...(current.gallery ?? []), { url: '' }]
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
                                {t('Chọn ảnh')}
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
            {newProduct.descriptions.length > 0 &&
              newProduct.descriptions.some((item) => {
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

        {/* Specs tab */}
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
                <p className="text-xs text-slate-500">{t('Thêm các thông số kỹ thuật quan trọng.')}</p>
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
                onClick={() => void applySpecificationTemplate()}
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
                    setNewProduct({ ...newProduct, specifications: [{ label: '', value: '' }] })
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
                  onDragOver={(e) => e.preventDefault()}
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

        {/* Videos tab */}
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
                onClick={() => void applyVideoTemplate()}
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
                    setNewProduct({ ...newProduct, videos: createVideoTemplate() })
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
                        validateProductVideoOnBlur(idx, { ...v, url: e.target.value })
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
                      <ProductVideoPreview url={debouncedProductVideoUrls[idx]} title={v.title} />
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
                        const nextRefs: Record<number, HTMLInputElement | null> = {}
                        Object.entries(videoUrlInputRefs.current).forEach(([key, element]) => {
                          const index = Number(key)
                          if (Number.isNaN(index) || index === idx) return
                          nextRefs[index > idx ? index - 1 : index] = element
                        })
                        videoUrlInputRefs.current = nextRefs
                        setProductVideoErrors((prev) => {
                          const next: Record<number, string> = {}
                          Object.entries(prev).forEach(([key, value]) => {
                            const index = Number(key)
                            if (Number.isNaN(index)) return
                            if (index < idx) next[index] = value
                            else if (index > idx) next[index - 1] = value
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
                    videos: [...newProduct.videos, ...createVideoTemplate()],
                  })
                }
              >
                {t('+ Thêm video')}
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isCreating}
            className={secondaryButtonClass}
            onClick={() => void requestNavigateAway()}
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
              t('Tạo sản phẩm')
            )}
          </button>
        </div>
      </div>
      {confirmDialog}
    </PagePanel>
  )
}

export default CreateProductPage
