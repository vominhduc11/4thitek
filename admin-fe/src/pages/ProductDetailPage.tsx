import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Archive,
  ArrowLeft,
  CheckCircle,
  Pencil,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import productPlaceholder from '../assets/product-placeholder.svg'
import { ProductVideoPreview } from '../components/ProductVideoPreview'
import { RichTextEditor } from '../components/RichTextEditor'
import { FieldErrorMessage } from '../components/ui-kit'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../context/ProductsContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import type { Product } from '../types/product'
import { resolveBackendAssetUrl } from '../lib/backendApi'
import { storeFileReference } from '../lib/upload'

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

const isLocalBlobUrl = (value?: string) =>
  Boolean(value && (value.startsWith('blob:') || value.startsWith('local-file:')))

const imageUrlCache = new Map<string, string>()
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const VIDEO_FILE_NOTICE =
  'T\u1ea3i t\u1ec7p video ch\u01b0a \u0111\u01b0\u1ee3c h\u1ed7 tr\u1ee3. Vui l\u00f2ng d\u00f9ng URL video.'

type ProductDraft = {
  name: string
  publishStatus: Product['publishStatus']
  retailPrice: string
  warrantyPeriod: string
  stock: string
  shortDescription: string
  image: string
  specifications: SpecificationItem[]
  descriptions: DescriptionItem[]
  videos: VideoDraftItem[]
}

type DescriptionItem = {
  type: 'title' | 'description' | 'image' | 'gallery' | 'video'
  text?: string
  url?: string
  caption?: string
  gallery?: Array<{ url: string } | string>
}

type SpecificationItem = {
  label: string
  value: string
}

type VideoItem = {
  title?: string
  descriptions?: string
  description?: string
  url?: string
  type?: string
}

type VideoDraftItem = {
  title: string
  descriptions: string
  url: string
  type: string
}

const buildDraft = (product: Product): ProductDraft => ({
  name: product.name,
  publishStatus: product.publishStatus,
  retailPrice: String(product.retailPrice ?? 0),
  warrantyPeriod: product.warrantyPeriod == null ? '' : String(product.warrantyPeriod),
  stock: String(product.stock),
  shortDescription: product.shortDescription,
  image: getImageUrl(product.image),
  specifications: parseSpecifications(product.specifications),
  descriptions: parseDescriptionItems(product.descriptions),
  videos: parseVideoItems(product.videos),
})

const formatDisplayDate = (value?: string) => {
  const date = value ? new Date(value) : new Date()
  const fallback = new Date()
  return (Number.isNaN(date.getTime()) ? fallback : date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const parseJson = <T,>(value: string, fallback: T): T => {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const parseJsonArray = <T,>(value: string, fallback: T[] = []): T[] => {
  const parsed = parseJson<unknown>(value, fallback)
  return Array.isArray(parsed) ? (parsed as T[]) : fallback
}

const parseVideoItems = (value: string): VideoDraftItem[] =>
  parseJsonArray<VideoItem>(value, []).map((item) => ({
    title: String(item.title ?? '').trim(),
    descriptions: String(item.descriptions ?? item.description ?? '').trim(),
    url: String(item.url ?? (item as { videoUrl?: string }).videoUrl ?? '').trim(),
    type: String(item.type ?? 'tutorial'),
  }))

const parseDescriptionItems = (value: string): DescriptionItem[] =>
  parseJsonArray<DescriptionItem>(value, []).map((item) => {
    if (item.type === 'image') {
      const imageUrl = (item as { imageUrl?: string }).imageUrl
      return { ...item, url: item.url || imageUrl || '' }
    }
    if (item.type === 'video') {
      const videoUrl = (item as { videoUrl?: string }).videoUrl
      return { ...item, url: item.url || videoUrl || '' }
    }
    if (item.type === 'gallery') {
      const legacyUrls = (item as { urls?: string[] }).urls
      const gallerySource = Array.isArray(item.gallery)
        ? item.gallery
        : Array.isArray(legacyUrls)
          ? legacyUrls
          : []
      const gallery = gallerySource
        .map((entry) => (typeof entry === 'string' ? { url: entry } : entry))
        .filter((entry): entry is { url: string } => !!entry && typeof entry.url === 'string')
      return { ...item, gallery }
    }
    return item
  })

const parseSpecifications = (value: string): SpecificationItem[] => {
  const parsed = parseJson<unknown>(value, [])
  if (Array.isArray(parsed)) {
    return parsed
      .filter((item): item is SpecificationItem => !!item && typeof item === 'object')
      .map((item) => ({
        label: String((item as SpecificationItem).label ?? '').trim(),
        value: String((item as SpecificationItem).value ?? '').trim(),
      }))
      .filter((item) => item.label || item.value)
  }
  if (parsed && typeof parsed === 'object') {
    return Object.entries(parsed as Record<string, unknown>)
      .map(([label, value]) => ({
        label: String(label ?? '').trim(),
        value: value == null ? '' : String(value).trim(),
      }))
      .filter((item) => item.label || item.value)
  }
  return []
}

const toPlainText = (value: string) =>
  value
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()

const formatCurrency = (value: number) => currencyFormatter.format(value)

function ProductDetailPage() {
  const { sku } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { accessToken } = useAuth()
  const { notify } = useToast()
  const { confirm, confirmDialog } = useConfirmDialog()
  const {
    products,
    archiveProduct,
    restoreProduct,
    togglePublishStatus,
    updateProduct,
    deleteProduct,
  } = useProducts()
  const product = products.find((item) => item.sku === sku)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ProductDraft | null>(
    product ? buildDraft(product) : null,
  )
  const [descriptionImageErrors, setDescriptionImageErrors] = useState<Record<number, string>>({})
  const [descriptionVideoErrors, setDescriptionVideoErrors] = useState<Record<number, string>>({})
  const [productVideoErrors, setProductVideoErrors] = useState<Record<number, string>>({})
  const [actionMessage, setActionMessage] = useState('')

  void descriptionVideoErrors
  void productVideoErrors
  const uploadImageAsset = async (file: File) =>
    storeFileReference({
      file,
      category: 'products',
      accessToken,
    })

  const productStatusLabelMap: Record<Product['status'], string> = {
    Active: 'Đang bán',
    'Low Stock': 'Tồn kho thấp',
    Draft: 'Bản nháp',
  }

  const publishStatusLabelMap: Record<Product['publishStatus'], string> = {
    PUBLISHED: 'Đã xuất bản',
    DRAFT: 'Bản nháp',
  }

  const validateDraft = useCallback((value: ProductDraft) => {
    const errors: Record<string, string> = {}
    const retailPrice = Number(value.retailPrice)
    const stock = Number(value.stock)
    const warrantyPeriod = Number(value.warrantyPeriod)

    if (!value.name.trim()) {
      errors.name = t('Vui lòng nhập tên sản phẩm')
    }
    if (Number.isNaN(retailPrice) || retailPrice < 0) {
      errors.retailPrice = t('Giá bán lẻ phải là số không âm')
    }
    if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      errors.stock = t('Tồn kho phải là số nguyên không âm')
    }
    if (Number.isNaN(warrantyPeriod) || warrantyPeriod <= 0 || !Number.isInteger(warrantyPeriod)) {
      errors.warrantyPeriod = t('Thời hạn bảo hành phải là số nguyên dương')
    }

    return errors
  }, [t])

  const draftErrors = useMemo(() => (draft ? validateDraft(draft) : {}), [draft, validateDraft])
  const isDirty = useMemo(() => {
    if (!draft || !product) {
      return false
    }

    return JSON.stringify(draft) !== JSON.stringify(buildDraft(product))
  }, [draft, product])

  useEffect(() => {
    if (product && !isEditing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(buildDraft(product))
    }
  }, [product, isEditing])

  useEffect(() => {
    if (!actionMessage) return
    const timer = window.setTimeout(() => setActionMessage(''), 3000)
    return () => window.clearTimeout(timer)
  }, [actionMessage])

  const descriptionEditorModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'link'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean'],
      ],
    }),
    [],
  )

  const descriptionEditorFormats = useMemo(
    () => ['header', 'bold', 'italic', 'link', 'list'],
    [],
  )

  if (!product) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <h3 className="text-lg font-semibold text-slate-900">
          {t('Không tìm thấy sản phẩm')}
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          {t('SKU {sku} không tồn tại hoặc đã bị xóa.', { sku: sku ?? '' })}
        </p>
        <Link
          className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
          to="/products"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('Quay lại danh sách')}
        </Link>
      </section>
    )
  }

  if (!draft) {
    return null
  }

  const descriptionItems = parseDescriptionItems(product.descriptions)
  const specificationItems = parseSpecifications(product.specifications)
  const videoItems = parseVideoItems(product.videos)
  const shortDescription = product.shortDescription?.trim() ?? ''

  const handleStartEdit = () => {
    setDraft(buildDraft(product))
    setDescriptionImageErrors({})
    setDescriptionVideoErrors({})
    setProductVideoErrors({})
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setDraft(buildDraft(product))
    setDescriptionImageErrors({})
    setDescriptionVideoErrors({})
    setProductVideoErrors({})
    setIsEditing(false)
  }

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (Object.keys(draftErrors).length > 0) {
      notify(t('Vui lòng kiểm tra lại các trường bắt buộc'), {
        title: 'Products',
        variant: 'error',
      })
      return
    }

    const nextStock = Number(draft.stock)
    const nextRetailPrice = Number(draft.retailPrice)
    const nextWarrantyPeriod = Number(draft.warrantyPeriod)
    const cleanedSpecifications = draft.specifications
      .map((spec) => ({
        label: String(spec.label || '').trim(),
        value: String(spec.value || '').trim(),
      }))
      .filter((spec) => spec.label || spec.value)
    const cleanedDescriptions = draft.descriptions
      .map((item) => {
        if (item.type === 'title' || item.type === 'description') {
          const text = String(item.text || '').trim()
          return { type: item.type, text }
        }
        if (item.type === 'image' || item.type === 'video') {
          const rawUrl = String(item.url || '').trim()
          const url = isLocalBlobUrl(rawUrl) ? '' : rawUrl
          const caption = String(item.caption || '').trim()
          return { type: item.type, url, caption }
        }
        if (item.type === 'gallery') {
          const caption = String(item.caption || '').trim()
          const gallery = (item.gallery ?? [])
            .map((entry) => (typeof entry === 'string' ? entry : entry.url))
            .map((url) => String(url || '').trim())
            .filter((url) => url && !isLocalBlobUrl(url))
            .map((url) => ({ url }))
          return { type: item.type, caption, gallery }
        }
        return item
      })
      .filter((item) => {
        if (item.type === 'title' || item.type === 'description') {
          return !!item.text
        }
        if (item.type === 'image' || item.type === 'video') {
          return !!item.url || !!item.caption
        }
        if (item.type === 'gallery') {
          return (item.gallery ?? []).length > 0 || !!item.caption
        }
        return false
      })
    const cleanedVideos = draft.videos
      .map((video) => ({
        title: String(video.title || '').trim(),
        descriptions: String(video.descriptions || '').trim(),
        url: (() => {
          const rawUrl = String(video.url || '').trim()
          return isLocalBlobUrl(rawUrl) ? '' : rawUrl
        })(),
        type: video.type || 'tutorial',
      }))
      .filter((video) => video.title || video.descriptions || video.url)

    try {
      await updateProduct(product.sku, {
        name: draft.name.trim() || product.name,
        publishStatus: draft.publishStatus,
        retailPrice: nextRetailPrice,
        warrantyPeriod: nextWarrantyPeriod,
        stock: Number.isNaN(nextStock) ? product.stock : nextStock,
        shortDescription: draft.shortDescription.trim(),
        image: draft.image.trim() || productPlaceholder,
        descriptions: JSON.stringify(cleanedDescriptions),
        specifications: JSON.stringify(cleanedSpecifications),
        videos: JSON.stringify(cleanedVideos),
        updatedAt: new Date().toISOString(),
      })

      setIsEditing(false)
    } catch (error) {
      notify(error instanceof Error ? error.message : t('Không thể lưu sản phẩm'), {
        title: 'Products',
        variant: 'error',
      })
    }
  }

  const handleDelete = async () => {
    if (!product.isDeleted) {
      return
    }
    const confirmed = await confirm({
      title: t('Xóa vĩnh viễn sản phẩm'),
      message: t('Xóa vĩnh viễn sản phẩm này? Hành động không thể hoàn tác.'),
      tone: 'danger',
      confirmLabel: t('Xóa'),
    })
    if (confirmed) {
      try {
        await deleteProduct(product.sku)
        navigate('/products')
      } catch (error) {
        notify(error instanceof Error ? error.message : t('Không thể xóa sản phẩm'), {
          title: 'Products',
          variant: 'error',
        })
      }
    }
  }

  const handleArchiveToggle = async () => {
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

    const confirmed = await confirm({
      title: t('Ẩn sản phẩm'),
      message: t('Ẩn sản phẩm này khỏi danh mục hiện hành?'),
      tone: 'warning',
      confirmLabel: t('Ẩn sản phẩm'),
    })
    if (!confirmed) {
      return
    }

    try {
      await archiveProduct(product.sku)
      setActionMessage('')
    } catch (error) {
      notify(error instanceof Error ? error.message : t('Không thể ẩn sản phẩm'), {
        title: 'Products',
        variant: 'error',
      })
    }
  }

  const descriptionTypeOptions: Array<{ id: DescriptionItem['type']; label: string }> = [
    { id: 'title', label: t('Tiêu đề') },
    { id: 'description', label: t('Mô tả') },
    { id: 'image', label: t('Hình ảnh') },
    { id: 'gallery', label: t('Nhiều hình ảnh') },
    { id: 'video', label: t('Video') },
  ]

  const changeDescriptionType = (index: number, nextType: DescriptionItem['type']) => {
    setDraft((prev) => {
      if (!prev) return prev
      const nextDescriptions = [...prev.descriptions]
      const current = nextDescriptions[index] ?? { type: nextType }
      const nextItem: DescriptionItem = { type: nextType }

      if (nextType === 'title' || nextType === 'description') {
        nextItem.text = current.text ?? ''
      }
      if (nextType === 'image' || nextType === 'video') {
        nextItem.url = current.url ?? ''
        nextItem.caption = current.caption ?? ''
      }
      if (nextType === 'gallery') {
        const gallerySource = current.gallery ?? []
        nextItem.gallery = gallerySource.map((entry) =>
          typeof entry === 'string' ? { url: entry } : entry,
        )
        nextItem.caption = current.caption ?? ''
      }

      nextDescriptions[index] = nextItem
      return { ...prev, descriptions: nextDescriptions }
    })
    setDescriptionImageErrors((prev) => {
      if (!(index in prev)) return prev
      const next = { ...prev }
      delete next[index]
      return next
    })
    setDescriptionVideoErrors((prev) => {
      if (!(index in prev)) return prev
      const next = { ...prev }
      delete next[index]
      return next
    })
  }

  const removeDescriptionItem = (index: number) => {
    setDraft((prev) => {
      if (!prev) return prev
      const nextDescriptions = prev.descriptions.filter((_, idx) => idx !== index)
      return { ...prev, descriptions: nextDescriptions }
    })
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
    setDescriptionVideoErrors((prev) => {
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
  }

  const handleDescriptionImageFile = async (index: number, file: File | null) => {
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setDescriptionImageErrors((prev) => ({
        ...prev,
        [index]: t('\u1ea2nh t\u1ed1i \u0111a 10MB'),
      }))
      return
    }
    try {
      const stored = await uploadImageAsset(file)
      setDraft((prev) => {
        if (!prev) return prev
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
    } catch {
      // ignore
    }
  }

  const handleDescriptionGalleryFiles = async (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileList = Array.from(files)
    const oversized = fileList.find((file) => file.size > MAX_IMAGE_BYTES)
    if (oversized) {
      setDescriptionImageErrors((prev) => ({
        ...prev,
        [index]: t('\u1ea2nh t\u1ed1i \u0111a 10MB'),
      }))
    }
    const validFiles = fileList.filter((file) => file.size <= MAX_IMAGE_BYTES)
    if (validFiles.length === 0) return
    try {
      const storedItems = await Promise.all(
        validFiles.map((candidate) => uploadImageAsset(candidate)),
      )
      const newItems = storedItems.filter((item) => item.url).map((item) => ({ url: item.url }))
      setDraft((prev) => {
        if (!prev) return prev
        const copy = [...prev.descriptions]
        const current = copy[index] ?? { type: 'gallery' as const, gallery: [] as { url: string }[] }
        const nextGallery = [...(current.gallery ?? []), ...newItems]
        copy[index] = { ...current, type: 'gallery', gallery: nextGallery }
        return { ...prev, descriptions: copy }
      })
      setDescriptionImageErrors((prev) => {
        const next = { ...prev }
        delete next[index]
        return next
      })
    } catch {
      // ignore
    }
  }

  const handleGalleryItemFile = async (index: number, itemIndex: number, file: File | null) => {
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setDescriptionImageErrors((prev) => ({
        ...prev,
        [index]: t('\u1ea2nh t\u1ed1i \u0111a 10MB'),
      }))
      return
    }
    try {
      const stored = await uploadImageAsset(file)
      setDraft((prev) => {
        if (!prev) return prev
        const copy = [...prev.descriptions]
        const current = copy[index] ?? { type: 'gallery' as const, gallery: [] as { url: string }[] }
        const nextGallery = [...(current.gallery ?? [])]
        const existing = nextGallery[itemIndex]
        const existingItem =
          typeof existing === 'string'
            ? { url: existing }
            : existing && typeof existing === 'object'
              ? existing
              : { url: '' }
        nextGallery[itemIndex] = { ...existingItem, url: stored.url }
        copy[index] = { ...current, type: 'gallery', gallery: nextGallery }
        return { ...prev, descriptions: copy }
      })
      setDescriptionImageErrors((prev) => {
        const next = { ...prev }
        delete next[index]
        return next
      })
    } catch {
      // ignore
    }
  }

  const handleDescriptionVideoFile = async (index: number, file: File | null) => {
    if (!file) return
    void index
    setActionMessage(t(VIDEO_FILE_NOTICE))
  }

  const handleProductVideoFile = async (index: number, file: File | null) => {
    if (!file) return
    void index
    setActionMessage(t(VIDEO_FILE_NOTICE))
  }

  void handleDescriptionVideoFile
  void handleProductVideoFile
  const handleMainImageFile = async (file: File | null) => {
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      notify(t('Anh toi da 10MB'), {
        title: 'Products',
        variant: 'error',
      })
      return
    }
    try {
      const stored = await uploadImageAsset(file)
      setDraft((prev) => (prev ? { ...prev, image: stored.url } : prev))
    } catch {
      notify(t('Không thể tải ảnh sản phẩm'), {
        title: 'Products',
        variant: 'error',
      })
    }
  }

  const renderDescriptionItem = (item: DescriptionItem, index: number) => {
    if (item.type === 'title') {
      return (
        <h5 key={`desc-title-${index}`} className="text-base font-semibold text-slate-900">
          {item.text || t('Tiêu đề')}
        </h5>
      )
    }

    if (item.type === 'description') {
      const content = toPlainText(item.text ?? '')
      return (
        <p key={`desc-text-${index}`} className="text-sm text-slate-600 whitespace-pre-line">
          {content || t('Chưa có mô tả nào.')}
        </p>
      )
    }

    if (item.type === 'image') {
      const imageUrl = item.url || (item as { imageUrl?: string }).imageUrl
      const isLocal = isLocalBlobUrl(imageUrl)
      return (
        <div key={`desc-image-${index}`} className="space-y-3">
          {imageUrl ? (
            isLocal ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                <p className="font-semibold">{t('Đã chọn tệp ảnh cục bộ.')}</p>
                <p className="mt-1 text-[11px] text-amber-600">{t('Xem trước sẽ hiển thị sau khi lưu.')}</p>
              </div>
            ) : (
              <img
                src={resolveBackendAssetUrl(imageUrl)}
                alt={item.caption || t('Xem trước')}
                className="h-48 w-full rounded-2xl border border-slate-200 object-cover"
              />
            )
          ) : (
            <p className="text-sm text-slate-500">
              {t('Ảnh URL')}: -
            </p>
          )}
          {item.caption && <p className="text-xs text-slate-500">{item.caption}</p>}
        </div>
      )
    }

    if (item.type === 'gallery') {
      const galleryItems =
        item.gallery?.map((entry) => (typeof entry === 'string' ? { url: entry } : entry)) ?? []
        return (
          <div key={`desc-gallery-${index}`} className="space-y-3">
            {galleryItems.length === 0 ? (
              <p className="text-sm text-slate-500">{t('Chưa có hình ảnh nào.')}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {galleryItems.map((entry, galleryIndex) => (
                  isLocalBlobUrl(entry.url) ? (
                    <div
                      key={`desc-gallery-${index}-${galleryIndex}`}
                      className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700"
                    >
                      <p className="font-semibold">{t('Đã chọn tệp ảnh cục bộ.')}</p>
                      <p className="mt-1 text-[11px] text-amber-600">{t('Xem trước sẽ hiển thị sau khi lưu.')}</p>
                    </div>
                  ) : (
                    <img
                      key={`desc-gallery-${index}-${galleryIndex}`}
                      src={resolveBackendAssetUrl(entry.url)}
                      alt={item.caption || t('Xem trước')}
                      className="h-32 w-full rounded-2xl border border-slate-200 object-cover"
                    />
                  )
                ))}
              </div>
            )}
            {item.caption && <p className="text-xs text-slate-500">{item.caption}</p>}
          </div>
      )
    }

    if (item.type === 'video') {
      const videoUrl = item.url || (item as { videoUrl?: string }).videoUrl
      const isLocal = isLocalBlobUrl(videoUrl)
      return (
        <div key={`desc-video-${index}`} className="space-y-3">
          {videoUrl ? (
            isLocal ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                <p className="font-semibold">{t('Đã chọn tệp video cục bộ.')}</p>
                <p className="mt-1 text-[11px] text-amber-600">{t('Xem trước sẽ hiển thị sau khi lưu.')}</p>
              </div>
            ) : (
              <video
                src={videoUrl}
                controls
                preload="metadata"
                className="h-48 w-full rounded-2xl border border-slate-200 bg-slate-950 object-cover"
              />
            )
          ) : (
            <p className="text-sm text-slate-500">
              {t('URL video')}: -
            </p>
          )}
          {item.caption && <p className="text-xs text-slate-500">{item.caption}</p>}
        </div>
      )
    }

    return null
  }

  return (
    <section className="space-y-6">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
              to="/products"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('Sản phẩm')}
            </Link>
            <h3 className="mt-3 text-2xl font-semibold text-slate-900">
              {product.name}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {shortDescription}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold ' +
                  (product.isDeleted
                    ? 'bg-slate-200 text-slate-600'
                    : product.publishStatus === 'PUBLISHED'
                      ? 'bg-emerald-500/15 text-emerald-700'
                      : product.publishStatus === 'DRAFT'
                        ? 'bg-slate-900/5 text-slate-700'
                        : 'bg-slate-200 text-slate-600')
                }
              >
                {product.isDeleted
                  ? t('Đã xóa')
                  : t(publishStatusLabelMap[product.publishStatus])}
              </span>
              {product.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 font-semibold text-amber-700">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {t('Nổi bật')}
                </span>
              )}
              {product.showOnHomepage && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-3 py-1 font-semibold text-blue-700">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {t('Trang chủ')}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="rounded-full bg-slate-900/5 px-3 py-1 font-semibold">
                SKU {product.sku}
              </span>
              <span className="rounded-full bg-slate-900/5 px-3 py-1 font-semibold">
                {t('Cập nhật {date}', { date: formatDisplayDate(product.updatedAt) })}
              </span>
            </div>
          </div>
        <div className="flex flex-wrap gap-3">
          {isEditing ? (
            <>
                <button
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
                  type="button"
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4" />
                  {t('Hủy')}
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0"
                  disabled={!isDirty}
                  type="submit"
                  form="product-edit-form"
                >
                  <Save className="h-4 w-4" />
                  {t('Lưu thay đổi')}
                </button>
              </>
            ) : (
              <>
                <button
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
                  type="button"
                  onClick={handleStartEdit}
                >
                  <Pencil className="h-4 w-4" />
                  {t('Chỉnh sửa')}
                </button>
                <button
                  className={
                  product.publishStatus === 'DRAFT' && !product.isDeleted
                    ? 'inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0'
                    : 'inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]'
                }
                type="button"
                onClick={async () => {
                  if (product.publishStatus === 'PUBLISHED') {
                    const approved = await confirm({
                      title: t('Hủy xuất bản'),
                      message: t('Hủy xuất bản sản phẩm này?'),
                      tone: 'warning',
                      confirmLabel: t('Hủy xuất bản'),
                    })
                    if (!approved) {
                      return
                    }
                  }

                  try {
                    await togglePublishStatus(product.sku)
                  } catch (error) {
                    notify(
                      error instanceof Error
                        ? error.message
                        : t('Không thể cập nhật trạng thái xuất bản'),
                      {
                        title: 'Products',
                        variant: 'error',
                      },
                    )
                  }
                }}
                disabled={product.isDeleted}
              >
                <CheckCircle className="h-4 w-4" />
                {product.publishStatus === 'DRAFT'
                  ? t('Xuất bản')
                  : t('Hủy xuất bản')}
              </button>
              </>
            )}
            <button
              className={
                product.isDeleted
                  ? 'inline-flex items-center gap-2 rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400'
                  : 'inline-flex items-center gap-2 rounded-2xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-400'
              }
              type="button"
              onClick={handleArchiveToggle}
            >
              {product.isDeleted ? (
                <>
                  <RotateCcw className="h-4 w-4" />
                  {t('Khôi phục')}
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  {t('Ẩn sản phẩm')}
                </>
              )}
            </button>
            <button
              className={
                product.isDeleted
                  ? 'inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400'
                  : 'inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-400'
              }
              type="button"
              onClick={handleDelete}
              disabled={!product.isDeleted}
              title={
                product.isDeleted
                  ? t('Xóa vĩnh viễn')
                  : t('Chỉ xóa vĩnh viễn được khi đã ẩn sản phẩm')
              }
            >
              <Trash2 className="h-4 w-4" />
              {t('Xóa')}
            </button>
          </div>
        </div>
        {actionMessage && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {actionMessage}
          </div>
        )}
        {isEditing && isDirty ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="status">
            {t('Bạn có thay đổi chưa lưu trong sản phẩm này.')}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-4">
            <img
              className="h-24 w-24 rounded-3xl border border-slate-200 bg-slate-50 object-cover"
              src={
                resolveBackendAssetUrl(draft.image.trim()) ||
                getImageUrl(product.image) ||
                productPlaceholder
              }
              alt={product.name}
            />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                SKU {product.sku}
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--accent)]">
                {formatCurrency(product.retailPrice || 0)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {t('Cập nhật {date}', { date: formatDisplayDate(product.updatedAt) })}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {t('Trạng thái')}
              </p>
              <span
                className={
                  product.isDeleted
                    ? 'mt-2 inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600'
                    : product.status === 'Active'
                      ? 'mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700'
                      : product.status === 'Low Stock'
                        ? 'mt-2 inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-700'
                        : 'mt-2 inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600'
                }
              >
                <span
                  className={
                    product.isDeleted
                      ? 'h-2 w-2 rounded-full bg-slate-400'
                      : product.status === 'Active'
                        ? 'h-2 w-2 rounded-full bg-emerald-500'
                        : product.status === 'Low Stock'
                          ? 'h-2 w-2 rounded-full bg-amber-500'
                        : 'h-2 w-2 rounded-full bg-slate-400'
                  }
                />
                {product.isDeleted
                  ? t('Đã xóa')
                  : t(productStatusLabelMap[product.status])}
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {t('Tồn kho')}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {product.stock}
              </p>
              <p className="text-xs text-slate-500">
                {t('Cập nhật {date}', { date: formatDisplayDate(product.updatedAt) })}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          {isEditing ? (
            <form
              id="product-edit-form"
              className="space-y-4"
              onSubmit={handleSave}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t('Tên sản phẩm')}
                  </label>
                  <input
                    aria-describedby={draftErrors.name ? 'product-detail-name-error' : undefined}
                    aria-invalid={Boolean(draftErrors.name)}
                    className={`mt-2 w-full rounded-2xl border bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 ${
                      draftErrors.name ? 'border-rose-300' : 'border-slate-200'
                    }`}
                    value={draft.name}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                  />
                  {draftErrors.name ? (
                    <FieldErrorMessage id="product-detail-name-error">
                      {draftErrors.name}
                    </FieldErrorMessage>
                  ) : null}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t('Retail price')}
                  </label>
                  <input
                    aria-describedby={draftErrors.retailPrice ? 'product-detail-price-error' : undefined}
                    aria-invalid={Boolean(draftErrors.retailPrice)}
                    className={`mt-2 w-full rounded-2xl border bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 ${
                      draftErrors.retailPrice ? 'border-rose-300' : 'border-slate-200'
                    }`}
                    type="number"
                    min="0"
                    value={draft.retailPrice}
                    onChange={(event) =>
                      setDraft({ ...draft, retailPrice: event.target.value })
                    }
                  />
                  {draftErrors.retailPrice ? (
                    <FieldErrorMessage id="product-detail-price-error">
                      {draftErrors.retailPrice}
                    </FieldErrorMessage>
                  ) : null}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t('Tồn kho')}
                  </label>
                  <input
                    aria-describedby={draftErrors.stock ? 'product-detail-stock-error' : undefined}
                    aria-invalid={Boolean(draftErrors.stock)}
                    className={`mt-2 w-full rounded-2xl border bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 ${
                      draftErrors.stock ? 'border-rose-300' : 'border-slate-200'
                    }`}
                    type="number"
                    min="0"
                    value={draft.stock}
                    onChange={(event) =>
                      setDraft({ ...draft, stock: event.target.value })
                    }
                  />
                  {draftErrors.stock ? (
                    <FieldErrorMessage id="product-detail-stock-error">
                      {draftErrors.stock}
                    </FieldErrorMessage>
                  ) : null}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t('Warranty period (months)')}
                  </label>
                  <input
                    aria-describedby={draftErrors.warrantyPeriod ? 'product-detail-warranty-error' : undefined}
                    aria-invalid={Boolean(draftErrors.warrantyPeriod)}
                    className={`mt-2 w-full rounded-2xl border bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 ${
                      draftErrors.warrantyPeriod ? 'border-rose-300' : 'border-slate-200'
                    }`}
                    type="number"
                    min="1"
                    step="1"
                    value={draft.warrantyPeriod}
                    onChange={(event) =>
                      setDraft({ ...draft, warrantyPeriod: event.target.value })
                    }
                  />
                  {draftErrors.warrantyPeriod ? (
                    <FieldErrorMessage id="product-detail-warranty-error">
                      {draftErrors.warrantyPeriod}
                    </FieldErrorMessage>
                  ) : null}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t('Xuất bản')}
                  </label>
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
                    value={draft.publishStatus}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        publishStatus: event.target.value as Product['publishStatus'],
                      })
                    }
                  >
                    <option value="PUBLISHED">{t('Đã xuất bản')}</option>
                    <option value="DRAFT">{t('Bản nháp')}</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t('\u1ea2nh URL')}
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
                    value={draft.image}
                    onChange={(event) =>
                      setDraft({ ...draft, image: event.target.value })
                    }
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) =>
                          handleMainImageFile(event.target.files?.[0] ?? null)
                        }
                      />
                      {t('T\u1ea3i \u1ea3nh')}
                    </label>
                    <p className="text-xs text-slate-500">
                      {t('Ho\u1eb7c nh\u1eadp URL th\u1ee7 c\u00f4ng')}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {t('Mô tả ngắn')}
                </label>
                <textarea
                  className="mt-2 min-h-[110px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
                  value={draft.shortDescription}
                  onChange={(event) =>
                    setDraft({ ...draft, shortDescription: event.target.value })
                  }
                />
              </div>

            </form>
          ) : (
            <>
              <h4 className="text-sm font-semibold text-slate-900">
                {t('Mô tả ngắn')}
              </h4>
              <p className="mt-3 text-sm text-slate-600 whitespace-pre-line">
                {shortDescription || t('Chưa có mô tả nào.')}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <h4 className="text-sm font-semibold text-slate-900">{t('Thông số')}</h4>
        {isEditing ? (
          <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
            {draft.specifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                <p className="font-semibold text-slate-700">{t('Chưa có thông số nào.')}</p>
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-[var(--accent)]"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      specifications: [{ label: '', value: '' }],
                    })
                  }
                >
                  {t('Thêm thông số đầu tiên')}
                </button>
              </div>
            ) : (
              draft.specifications.map((spec, index) => (
                <div
                  key={`spec-${index}`}
                  className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-center"
                >
                  <label className="block">
                    <span className="sr-only">{t('Nhãn thông số')}</span>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder={t('Nhãn')}
                      value={spec.label}
                      onChange={(event) => {
                        const next = [...draft.specifications]
                        next[index] = { ...next[index], label: event.target.value }
                        setDraft({ ...draft, specifications: next })
                      }}
                    />
                  </label>
                  <label className="block">
                    <span className="sr-only">{t('Giá trị thông số')}</span>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder={t('Giá trị')}
                      value={spec.value}
                      onChange={(event) => {
                        const next = [...draft.specifications]
                        next[index] = { ...next[index], value: event.target.value }
                        setDraft({ ...draft, specifications: next })
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="justify-self-end text-xs text-red-500 md:justify-self-auto"
                    onClick={() => {
                      const next = draft.specifications.filter((_, idx) => idx !== index)
                      setDraft({ ...draft, specifications: next })
                    }}
                  >
                    {t('Xóa')}
                  </button>
                </div>
              ))
            )}
            {draft.specifications.length > 0 && (
              <button
                type="button"
                className="text-xs text-[var(--accent)]"
                onClick={() =>
                  setDraft({
                    ...draft,
                    specifications: [...draft.specifications, { label: '', value: '' }],
                  })
                }
              >
                {t('+ Thêm thông số')}
              </button>
            )}
          </div>
        ) : (
          <>
            {specificationItems.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">{t('Chưa có thông số nào.')}</p>
            ) : (
              <div className="mt-4 space-y-2">
                {specificationItems.map((spec, index) => (
                  <div
                    key={`spec-${spec.label}-${index}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-[var(--surface-muted)] px-4 py-3 text-sm"
                  >
                    <span className="text-slate-500">{spec.label || t('Nhãn')}</span>
                    <span className="font-semibold text-slate-900">{spec.value || '-'}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <h4 className="text-sm font-semibold text-slate-900">{t('Mô tả (Descriptions)')}</h4>
        {isEditing ? (
          <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-2 text-sm text-slate-700">
              <div>
                <p className="font-semibold text-slate-900">{t('Mô tả')}</p>
                <p className="text-xs text-slate-500">
                  {t('Thêm các đoạn mô tả ngắn cho sản phẩm.')}
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-[var(--accent)] underline"
                onClick={() =>
                  setDraft({
                    ...draft,
                    descriptions: [
                      { type: 'title', text: '' },
                      { type: 'description', text: '' },
                      { type: 'image', url: '', caption: '' },
                      { type: 'gallery', gallery: [] },
                      { type: 'video', url: '', caption: '' },
                    ],
                  })
                }
              >
                {t('Dùng mẫu')}
              </button>
            </div>
            {draft.descriptions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                <p className="font-semibold text-slate-700">{t('Chưa có mô tả nào.')}</p>
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-[var(--accent)]"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      descriptions: [{ type: 'description', text: '' }],
                    })
                  }
                >
                  {t('Thêm mô tả đầu tiên')}
                </button>
              </div>
            ) : (
              draft.descriptions.map((item, index) => (
                <div key={`description-item-${index}`} className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 text-[11px]">
                      {descriptionTypeOptions.map((option) => {
                        const isActive = item.type === option.id
                        return (
                          <button
                            key={option.id}
                            type="button"
                            className={
                              isActive
                                ? 'rounded-full bg-[var(--accent)] px-2 py-1 font-semibold text-white shadow-sm'
                                : 'rounded-full px-2 py-1 font-semibold text-slate-600 hover:text-slate-900'
                            }
                            onClick={() => changeDescriptionType(index, option.id)}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      type="button"
                      className="text-xs text-red-500"
                      onClick={() => removeDescriptionItem(index)}
                    >
                      {t('Xóa')}
                    </button>
                  </div>
                  {item.type === 'title' && (
                    <label className="block">
                      <span className="sr-only">{t('Tiêu đề mô tả')}</span>
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={item.text ?? ''}
                        onChange={(event) => {
                          const nextDescriptions = [...draft.descriptions]
                          nextDescriptions[index] = { ...nextDescriptions[index], text: event.target.value }
                          setDraft({ ...draft, descriptions: nextDescriptions })
                        }}
                        placeholder={t('Nhập tiêu đề')}
                      />
                    </label>
                  )}
                  {item.type === 'description' && (
                    <div className="richtext-editor">
                      <RichTextEditor
                        ariaLabel={t('Trình soạn thảo mô tả chi tiết')}
                        value={item.text ?? ''}
                        modules={descriptionEditorModules}
                        formats={descriptionEditorFormats}
                        placeholder={t('Nhập mô tả')}
                        onChange={(value) => {
                          const nextDescriptions = [...draft.descriptions]
                          nextDescriptions[index] = { ...nextDescriptions[index], text: value }
                          setDraft({ ...draft, descriptions: nextDescriptions })
                        }}
                      />
                    </div>
                  )}
                  {item.type === 'image' && (
                    <div className="grid gap-2 md:grid-cols-[1.4fr_1fr]">
                      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(event) =>
                            handleDescriptionImageFile(index, event.target.files?.[0] ?? null)
                          }
                        />
                        {t('Chọn ảnh')}
                      </label>
                      <label className="block">
                        <span className="sr-only">{t('Chú thích hình ảnh')}</span>
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder={t('Nhập chú thích')}
                          value={item.caption ?? ''}
                          onChange={(event) => {
                            const nextDescriptions = [...draft.descriptions]
                            nextDescriptions[index] = { ...nextDescriptions[index], caption: event.target.value }
                            setDraft({ ...draft, descriptions: nextDescriptions })
                          }}
                        />
                      </label>
                      {descriptionImageErrors[index] && (
                        <p className="text-xs text-rose-500">{descriptionImageErrors[index]}</p>
                      )}
                      {item.url && (
                        isLocalBlobUrl(item.url) ? (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 md:col-span-2">
                            <p className="font-semibold">{t('Đã chọn tệp ảnh cục bộ.')}</p>
                            <p className="mt-1 text-[11px] text-amber-600">{t('Xem trước sẽ hiển thị sau khi lưu.')}</p>
                            <button
                              type="button"
                              className="mt-2 inline-flex text-[11px] font-semibold text-rose-600"
                              onClick={() => {
                                const nextDescriptions = [...draft.descriptions]
                                nextDescriptions[index] = { ...nextDescriptions[index], url: '' }
                                setDraft({ ...draft, descriptions: nextDescriptions })
                                setDescriptionImageErrors((prev) => {
                                  const next = { ...prev }
                                  delete next[index]
                                  return next
                                })
                              }}
                            >
                              {t('Xóa ảnh')}
                            </button>
                          </div>
                        ) : (
                          <div className="group relative overflow-hidden rounded-lg border border-slate-200 md:col-span-2">
                            <img
                              src={resolveBackendAssetUrl(item.url)}
                              alt={t('Xem trước')}
                              className="h-40 w-full object-cover"
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-2 inline-flex min-h-11 items-center rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                              onClick={() => {
                                const nextDescriptions = [...draft.descriptions]
                                nextDescriptions[index] = { ...nextDescriptions[index], url: '' }
                                setDraft({ ...draft, descriptions: nextDescriptions })
                                setDescriptionImageErrors((prev) => {
                                  const next = { ...prev }
                                  delete next[index]
                                  return next
                                })
                              }}
                            >
                              {t('Xóa ảnh')}
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                  {item.type === 'gallery' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="sr-only"
                            onChange={(event) => handleDescriptionGalleryFiles(index, event.target.files)}
                          />
                          {t('Chọn nhiều ảnh')}
                        </label>
                        <button
                          type="button"
                          className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                          onClick={() => {
                            const nextDescriptions = [...draft.descriptions]
                            const current = { ...nextDescriptions[index] }
                            const nextGallery = [...(current.gallery ?? []), { url: '' }]
                            current.gallery = nextGallery
                            nextDescriptions[index] = current
                            setDraft({ ...draft, descriptions: nextDescriptions })
                          }}
                        >
                          {t('Thêm hình ảnh')}
                        </button>
                      </div>
                      {descriptionImageErrors[index] && (
                        <p className="text-xs text-rose-500">{descriptionImageErrors[index]}</p>
                      )}
                      <label className="text-sm text-slate-700">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {t('Chú thích bộ ảnh')}
                        </span>
                        <input
                          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder={t('Nhập chú thích bộ ảnh')}
                          value={item.caption ?? ''}
                          onChange={(event) => {
                            const nextDescriptions = [...draft.descriptions]
                            nextDescriptions[index] = { ...nextDescriptions[index], caption: event.target.value }
                            setDraft({ ...draft, descriptions: nextDescriptions })
                          }}
                        />
                      </label>
                      {(item.gallery ?? []).length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                          <p className="font-semibold text-slate-700">{t('Chưa có hình ảnh nào.')}</p>
                          <button
                            type="button"
                            className="mt-2 text-xs font-semibold text-[var(--accent)]"
                            onClick={() => {
                              const nextDescriptions = [...draft.descriptions]
                              const current = { ...nextDescriptions[index] }
                              const nextGallery = [...(current.gallery ?? []), { url: '' }]
                              current.gallery = nextGallery
                              nextDescriptions[index] = current
                              setDraft({ ...draft, descriptions: nextDescriptions })
                            }}
                          >
                            {t('Thêm hình ảnh đầu tiên')}
                          </button>
                        </div>
                      ) : (
                        (item.gallery ?? []).map((entry, entryIndex) => (
                          <div key={entryIndex} className="rounded-lg border border-slate-200 bg-white p-3">
                            <div className="grid gap-3 lg:grid-cols-[180px_1fr] lg:items-start">
                              <div className="space-y-2">
                                <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(event) =>
                                      handleGalleryItemFile(index, entryIndex, event.target.files?.[0] ?? null)
                                    }
                                  />
                                  {t('Chọn ảnh')}
                                </label>
                                {entry && typeof entry !== 'string' && entry.url && (
                                  isLocalBlobUrl(entry.url) ? (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                                      <p className="font-semibold">{t('Đã chọn tệp ảnh cục bộ.')}</p>
                                      <button
                                        type="button"
                                        className="mt-2 inline-flex text-[11px] font-semibold text-rose-600"
                                        onClick={() => {
                                          const nextDescriptions = [...draft.descriptions]
                                          const current = { ...nextDescriptions[index] }
                                          const nextGallery = [...(current.gallery ?? [])]
                                          const currentEntry =
                                            typeof nextGallery[entryIndex] === 'string'
                                              ? { url: '' }
                                              : { ...(nextGallery[entryIndex] as { url?: string }) }
                                          nextGallery[entryIndex] = { ...currentEntry, url: '' }
                                          current.gallery = nextGallery
                                          nextDescriptions[index] = current
                                          setDraft({ ...draft, descriptions: nextDescriptions })
                                        }}
                                      >
                                        {t('Xóa ảnh')}
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="group relative overflow-hidden rounded-lg border border-slate-200">
                                      <img
                                        src={resolveBackendAssetUrl(entry.url)}
                                        alt={t('Xem trước')}
                                        className="h-24 w-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        className="absolute right-2 top-2 inline-flex min-h-11 items-center rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                                        onClick={() => {
                                          const nextDescriptions = [...draft.descriptions]
                                          const current = { ...nextDescriptions[index] }
                                          const nextGallery = [...(current.gallery ?? [])]
                                          const currentEntry =
                                            typeof nextGallery[entryIndex] === 'string'
                                              ? { url: '' }
                                              : { ...(nextGallery[entryIndex] as { url?: string }) }
                                          nextGallery[entryIndex] = { ...currentEntry, url: '' }
                                          current.gallery = nextGallery
                                          nextDescriptions[index] = current
                                          setDraft({ ...draft, descriptions: nextDescriptions })
                                        }}
                                      >
                                        {t('Xóa ảnh')}
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                              <div className="flex items-start justify-end">
                                <button
                                  type="button"
                                  className="text-xs text-red-500"
                                  onClick={() => {
                                    const nextDescriptions = [...draft.descriptions]
                                    const current = { ...nextDescriptions[index] }
                                    const nextGallery = (current.gallery ?? []).filter((_, i) => i !== entryIndex)
                                    current.gallery = nextGallery
                                    nextDescriptions[index] = current
                                    setDraft({ ...draft, descriptions: nextDescriptions })
                                  }}
                                >
                                  {t('Xóa ảnh')}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {item.type === 'video' && (
                    <div className="grid gap-2 md:grid-cols-[1.4fr_1fr]">
                      <label className="block">
                        <span className="sr-only">{t('URL video')}</span>
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder={t('Nh\u1eadp URL video YouTube ho\u1eb7c file video c\u00f4ng khai')}
                          value={item.url ?? ''}
                          onChange={(event) => {
                            const nextDescriptions = [...draft.descriptions]
                            nextDescriptions[index] = { ...nextDescriptions[index], url: event.target.value }
                            setDraft({ ...draft, descriptions: nextDescriptions })
                          }}
                        />
                      </label>
                      <label className="block">
                        <span className="sr-only">{t('Chú thích video')}</span>
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder={t('Nh\u1eadp ch\u00fa th\u00edch')}
                          value={item.caption ?? ''}
                          onChange={(event) => {
                            const nextDescriptions = [...draft.descriptions]
                            nextDescriptions[index] = { ...nextDescriptions[index], caption: event.target.value }
                            setDraft({ ...draft, descriptions: nextDescriptions })
                          }}
                        />
                      </label>
                      {item.url && (
                        <div className="group relative overflow-hidden rounded-lg border border-slate-200 md:col-span-2">
                          <ProductVideoPreview url={item.url} title={item.caption ?? item.text} />
                          <button
                            type="button"
                            className="absolute right-2 top-2 inline-flex min-h-11 items-center rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                            onClick={() => {
                              const nextDescriptions = [...draft.descriptions]
                              nextDescriptions[index] = { ...nextDescriptions[index], url: '' }
                              setDraft({ ...draft, descriptions: nextDescriptions })
                            }}
                          >
                            {t('X\u00f3a video')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            {draft.descriptions.length > 0 && (
              <button
                type="button"
                className="text-xs text-[var(--accent)]"
                onClick={() =>
                  setDraft({
                    ...draft,
                    descriptions: [...draft.descriptions, { type: 'description', text: '' }],
                  })
                }
              >
                {t('Thêm mục mô tả')}
              </button>
            )}
          </div>
        ) : (
          <>
            {descriptionItems.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">{t('Chưa có mô tả nào.')}</p>
            ) : (
              <div className="mt-4 space-y-4">
                {descriptionItems.map((item, index) => (
                  <div
                    key={`description-item-${index}`}
                    className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4"
                  >
                    {renderDescriptionItem(item, index)}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <h4 className="text-sm font-semibold text-slate-900">{t('Video')}</h4>
        {isEditing ? (
          <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-2 text-sm text-slate-700">
              <div>
                <p className="font-semibold text-slate-900">{t('Video')}</p>
                <p className="text-xs text-slate-500">
                  {t('Thêm video giới thiệu hoặc hướng dẫn sản phẩm.')}
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-[var(--accent)] underline"
                onClick={() =>
                  setDraft({
                    ...draft,
                    videos: [
                      {
                        title: '',
                        descriptions: '',
                        url: '',
                        type: 'tutorial',
                      },
                    ],
                  })
                }
              >
                {t('Dùng mẫu')}
              </button>
            </div>
            {draft.videos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                <p className="font-semibold text-slate-700">{t('Chưa có video nào.')}</p>
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-[var(--accent)]"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      videos: [{ title: '', descriptions: '', url: '', type: 'tutorial' }],
                    })
                  }
                >
                  {t('Thêm video đầu tiên')}
                </button>
              </div>
            ) : (
              draft.videos.map((video, index) => (
                <div
                  key={`video-${index}`}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3">
                  <label className="block">
                    <span className="sr-only">{t('URL video')}</span>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder={t('Nh\u1eadp URL video YouTube ho\u1eb7c file video c\u00f4ng khai')}
                      value={video.url}
                      onChange={(event) => {
                        const nextVideos = [...draft.videos]
                        nextVideos[index] = { ...nextVideos[index], url: event.target.value }
                        setDraft({ ...draft, videos: nextVideos })
                      }}
                    />
                  </label>
                  {video.url && (
                    <div className="group relative overflow-hidden rounded-lg border border-slate-200">
                      <ProductVideoPreview url={video.url} title={video.title} />
                      <button
                        type="button"
                        className="absolute right-2 top-2 inline-flex min-h-11 items-center rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                        onClick={() => {
                          const nextVideos = [...draft.videos]
                          nextVideos[index] = { ...nextVideos[index], url: '' }
                          setDraft({ ...draft, videos: nextVideos })
                        }}
                      >
                        {t('X\u00f3a video')}
                      </button>
                    </div>
                  )}
                  <label className="block">
                    <span className="sr-only">{t('Tiêu đề video')}</span>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder={t('Nhập tiêu đề')}
                      value={video.title}
                      onChange={(event) => {
                        const nextVideos = [...draft.videos]
                        nextVideos[index] = { ...nextVideos[index], title: event.target.value }
                        setDraft({ ...draft, videos: nextVideos })
                      }}
                    />
                  </label>
                  <label className="block">
                    <span className="sr-only">{t('Mô tả video')}</span>
                    <textarea
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder={t('Nhập mô tả')}
                      rows={2}
                      value={video.descriptions}
                      onChange={(event) => {
                        const nextVideos = [...draft.videos]
                        nextVideos[index] = { ...nextVideos[index], descriptions: event.target.value }
                        setDraft({ ...draft, videos: nextVideos })
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="self-end text-xs text-red-500"
                    onClick={() => {
                      const nextVideos = draft.videos.filter((_, idx) => idx !== index)
                      setDraft({ ...draft, videos: nextVideos })
                      setProductVideoErrors((prev) => {
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
                    }}
                  >
                    {t('Xóa video')}
                  </button>
                </div>
              ))
            )}
            {draft.videos.length > 0 && (
              <button
                type="button"
                className="text-xs text-[var(--accent)]"
                onClick={() =>
                  setDraft({
                    ...draft,
                    videos: [
                      ...draft.videos,
                      { title: '', descriptions: '', url: '', type: 'tutorial' },
                    ],
                  })
                }
              >
                {t('+ Thêm video')}
              </button>
            )}
          </div>
        ) : (
          <>
            {videoItems.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">{t('Chưa có video nào.')}</p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {videoItems.map((video, index) => (
                  <div
                    key={`video-${index}`}
                    className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {video.title || t('Video')}
                    </p>
                    {video.url ? (
                      isLocalBlobUrl(video.url) ? (
                        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                          <p className="font-semibold">{t('Đã chọn tệp video cục bộ.')}</p>
                          <p className="mt-1 text-[11px] text-amber-600">{t('Xem trước sẽ hiển thị sau khi lưu.')}</p>
                        </div>
                      ) : (
                        <video
                          src={video.url}
                          controls
                          preload="metadata"
                          className="mt-3 h-44 w-full rounded-xl border border-slate-200 bg-slate-950 object-cover"
                        />
                      )
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">
                        {t('URL video')}: -
                      </p>
                    )}
                    {video.descriptions && (
                      <p className="mt-3 text-sm text-slate-600 whitespace-pre-line">
                        {video.descriptions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {confirmDialog}
    </section>
  )
}

export default ProductDetailPage
