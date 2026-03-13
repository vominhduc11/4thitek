import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Archive,
  CheckCircle,
  Eye,
  FileDown,
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
import { RichTextEditor } from '../components/RichTextEditor'
import { ErrorState, LoadingRows, PaginationNav } from '../components/ui-kit'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../context/ProductsContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import type { Product } from '../types/product'
import { resolveBackendAssetUrl } from '../lib/backendApi'
import { storeFileReference } from '../lib/upload'

type ProductFilter = 'all' | 'active' | 'lowStock' | 'outOfStock' | 'draft' | 'deleted'
type FeaturedFilter = 'all' | 'featured' | 'nonFeatured'
type HomepageFilter = 'all' | 'homepage' | 'nonHomepage'

type GalleryItem = {
  url: string
}

type DescriptionItem = {
  type: 'title' | 'description' | 'image' | 'gallery' | 'video'
  text?: string
  url?: string
  caption?: string
  gallery?: GalleryItem[]
}

type CreateProductErrorField = 'name' | 'sku' | 'retailPrice' | 'warrantyPeriod' | 'stock' | 'videos'

const createProductErrorFieldOrder: CreateProductErrorField[] = [
  'name',
  'sku',
  'retailPrice',
  'warrantyPeriod',
  'stock',
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
  stock: 'basic',
  videos: 'videos',
}

const createDescriptionTemplate = (): DescriptionItem[] => [
  { type: 'title', text: '' },
  { type: 'description', text: '' },
  { type: 'image', url: '', caption: '' },
  { type: 'gallery', gallery: [] },
  { type: 'video', url: '', caption: '' },
]

const createSpecificationTemplate = () => [
  { label: '', value: '' },
  { label: '', value: '' },
]

const createVideoTemplate = () => [
  { title: '', descriptions: '', url: '', type: 'tutorial' as const },
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
  items: Array<{ title: string; descriptions: string; url: string; type: 'unboxing' | 'tutorial' }>,
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
  'K\u00edch th\u01b0\u1edbc',
  'Tr\u1ecdng l\u01b0\u1ee3ng',
  'Ch\u1ea5t li\u1ec7u',
  'C\u00f4ng su\u1ea5t',
  '\u0110i\u1ec7n \u00e1p',
  'B\u1ea3o h\u00e0nh',
]

const createInitialNewProduct = () => ({
  name: '',
  sku: '',
  shortDescription: '',
  descriptions: [] as DescriptionItem[],
  specifications: [] as { label: string; value: string }[],
  videos: [] as {
    title: string
    descriptions: string
    url: string
    type: 'unboxing' | 'tutorial'
  }[],
  retailPrice: '',
  warrantyPeriod: '12',
  stock: '',
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
const ITEMS_PER_PAGE = 8

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
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const warrantyInputRef = useRef<HTMLInputElement | null>(null)
  const skuInputRef = useRef<HTMLInputElement | null>(null)
  const videoUrlInputRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const tabRefs = useRef<
    Record<'basic' | 'description' | 'specs' | 'videos', HTMLButtonElement | null>
  >({
    basic: null,
    description: null,
    specs: null,
    videos: null,
  })
  const retailPriceInputRef = useRef<HTMLInputElement | null>(null)
  const stockInputRef = useRef<HTMLInputElement | null>(null)
  const retailPriceCaretRef = useRef<number | null>(null)
  const [selectedImageName, setSelectedImageName] = useState('')
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [imageError, setImageError] = useState('')
  const [descriptionImageErrors, setDescriptionImageErrors] = useState<Record<number, string>>({})
  const [productVideoErrors, setProductVideoErrors] = useState<Record<number, string>>({})
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
      (product) => !product.isDeleted && product.stock > 0 && product.stock < 20,
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
        if (product.stock === 0) acc.outOfStock += 1
        if (product.stock > 0 && product.stock < 20) acc.lowStock += 1
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
          return !product.isDeleted && product.stock > 0 && product.stock < 20
        case 'outOfStock':
          return !product.isDeleted && product.stock === 0
        case 'draft':
          return !product.isDeleted && product.status === 'Draft'
        case 'deleted':
          return product.isDeleted
        default:
          return !product.isDeleted
      }
    })

    return {
      activeProducts: activeProductsList,
      lowStockProducts: lowStockProductsList,
      draftProducts: draftProductsList,
      visibleProducts: filteredByTab,
      filterCounts: counts,
    }
  }, [filter, filterFeatured, filterHomepage, normalizedSearch, products])

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
          errors.warrantyPeriod ||
          errors.stock,
      ),
      description: Object.keys(descriptionImageErrors).length > 0,
      specs: false,
      videos: Object.keys(productVideoErrors).length > 0,
    }),
    [descriptionImageErrors, errors, imageError, productVideoErrors],
  )

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
  const filterBaseClass =
    'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition whitespace-nowrap'

  const uploadImageAsset = async (file: File) =>
    storeFileReference({
      file,
      category: 'products',
      accessToken,
    })

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
              : field === 'stock'
                ? stockInputRef.current
                : null

    target?.focus()
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const confirmTemplateReplacement = async (hasContent: boolean) => {
    if (!hasContent) {
      return true
    }

    return confirm({
      title: t('Thay th\u1ebf d\u1eef li\u1ec7u hi\u1ec7n t\u1ea1i?'),
      message: t(
        'M\u1eabu s\u1ebd ghi \u0111\u00e8 n\u1ed9i dung b\u1ea1n \u0111ang nh\u1eadp trong m\u1ee5c n\u00e0y.',
      ),
      confirmLabel: t('Ghi \u0111\u00e8'),
      cancelLabel: t('Gi\u1eef l\u1ea1i'),
      tone: 'warning',
    })
  }

  const applyDescriptionTemplate = async () => {
    const approved = await confirmTemplateReplacement(hasDescriptionContent(newProduct.descriptions))
    if (!approved) {
      return
    }

    setDescriptionImageErrors({})
    setNewProduct((prev) => ({
      ...prev,
      descriptions: createDescriptionTemplate(),
    }))
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

  const descriptionTypeOptions: Array<{ id: DescriptionItem['type']; label: string }> = [
    { id: 'title', label: t('TiĂªu Ä‘á»') },
    { id: 'description', label: t('MĂ´ táº£') },
    { id: 'image', label: t('HĂ¬nh áº£nh') },
    { id: 'gallery', label: t('Nhiá»u hĂ¬nh áº£nh') },
    { id: 'video', label: t('Video') },
  ]

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

  const changeDescriptionType = async (index: number, nextType: DescriptionItem['type']) => {
    const current = newProduct.descriptions[index]
    if (!current || current.type === nextType) {
      return
    }

    const legacyUrls = ((current as { urls?: string[] }).urls ?? []).filter((url) => url.trim())
    const currentGallery = (current.gallery ?? []).filter((item) => item.url.trim())
    const currentPrimaryUrl =
      current.url?.trim() || currentGallery[0]?.url?.trim() || legacyUrls[0] || ''

    const nextItem: DescriptionItem = { type: nextType }

    if (nextType === 'title' || nextType === 'description') {
      nextItem.text = current.text ?? ''
    }

    if (nextType === 'image' || nextType === 'video') {
      nextItem.url = currentPrimaryUrl
      nextItem.caption = current.caption ?? ''
    }

    if (nextType === 'gallery') {
      nextItem.gallery =
        currentGallery.length > 0
          ? currentGallery
          : currentPrimaryUrl
            ? [{ url: currentPrimaryUrl }]
            : legacyUrls.map((url) => ({ url }))
      nextItem.caption = current.caption ?? ''
    }

    const currentMediaCount = new Set(
      [current.url ?? '', ...currentGallery.map((item) => item.url), ...legacyUrls]
        .map((url) => url.trim())
        .filter(Boolean),
    ).size
    const nextMediaCount = new Set(
      [
        nextItem.url ?? '',
        ...(nextItem.gallery ?? []).map((item) => item.url),
      ]
        .map((url) => url.trim())
        .filter(Boolean),
    ).size

    const willLoseText = Boolean((current.text ?? '').trim()) && !Boolean((nextItem.text ?? '').trim())
    const willLoseCaption =
      Boolean((current.caption ?? '').trim()) && !Boolean((nextItem.caption ?? '').trim())
    const willLoseMedia = currentMediaCount > nextMediaCount

    if (willLoseText || willLoseCaption || willLoseMedia) {
      const approved = await confirm({
        title: t('\u0110\u1ed5i lo\u1ea1i n\u1ed9i dung?'),
        message: t(
          'M\u1ed9t ph\u1ea7n d\u1eef li\u1ec7u trong m\u1ee5c n\u00e0y s\u1ebd b\u1ecb x\u00f3a khi \u0111\u1ed5i lo\u1ea1i.',
        ),
        confirmLabel: t('V\u1eabn \u0111\u1ed5i'),
        cancelLabel: t('Gi\u1eef lo\u1ea1i c\u0169'),
        tone: 'warning',
      })

      if (!approved) {
        return
      }
    }

    setNewProduct((prev) => {
      const copy = [...prev.descriptions]
      copy[index] = nextItem
      return { ...prev, descriptions: copy }
    })
    setDescriptionImageErrors((prev) => {
      if (!(index in prev)) return prev
      const next = { ...prev }
      delete next[index]
      return next
    })
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
        [index]: t('áº¢nh tá»‘i Ä‘a 10MB'),
      }))
      return
    }
    try {
      const stored = await uploadImageAsset(file)
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
    } catch (error) {
      const message = getErrorMessage(
        error,
        t('Kh\u00f4ng th\u1ec3 t\u1ea3i \u1ea3nh l\u00ean. Vui l\u00f2ng th\u1eed l\u1ea1i.'),
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
        [index]: t('áº¢nh tá»‘i Ä‘a 10MB'),
      }))
    }
    const validFiles = fileList.filter((file) => file.size <= MAX_IMAGE_BYTES)
    if (validFiles.length === 0) return
    try {
      const storedItems = await Promise.all(
        validFiles.map((file) => uploadImageAsset(file)),
      )
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
        t('Kh\u00f4ng th\u1ec3 t\u1ea3i \u1ea3nh l\u00ean. Vui l\u00f2ng th\u1eed l\u1ea1i.'),
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
        [index]: t('áº¢nh tá»‘i Ä‘a 10MB'),
      }))
      return
    }
    try {
      const stored = await uploadImageAsset(file)
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
    } catch (error) {
      const message = getErrorMessage(
        error,
        t('Kh\u00f4ng th\u1ec3 t\u1ea3i \u1ea3nh l\u00ean. Vui l\u00f2ng th\u1eed l\u1ea1i.'),
      )
      setDescriptionImageErrors((prev) => ({
        ...prev,
        [index]: message,
      }))
      notify(message, { title: 'Products', variant: 'error' })
    }
  }

  const removeDescriptionItem = (index: number) => {
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
  }

  const resetCreateForm = () => {
    setActiveTab('basic')
    retailPriceCaretRef.current = null
    setDescriptionImageErrors({})
    setProductVideoErrors({})
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

  const openCreateModal = () => {
    resetCreateForm()
    setShowModal(true)
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
        title: t('\u0110\u00f3ng bi\u1ec3u m\u1eabu t\u1ea1o s\u1ea3n ph\u1ea9m?'),
        message: t('M\u1ecdi thay \u0111\u1ed5i ch\u01b0a l\u01b0u s\u1ebd b\u1ecb m\u1ea5t.'),
        confirmLabel: t('Ti\u1ebfp t\u1ee5c \u0111\u00f3ng'),
        cancelLabel: t('\u1ede l\u1ea1i'),
        tone: 'warning',
      })
      if (!approved) {
        return
      }
    }
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

    if (!newProduct.name.trim()) {
      nextErrors.name = t('Vui lĂ²ng nháº­p tĂªn sáº£n pháº©m')
    }
    if (!newProduct.sku.trim()) {
      nextErrors.sku = t('Vui lĂ²ng nháº­p SKU')
    }
    if (products.some((p) => p.sku === newProduct.sku.trim())) {
      nextErrors.sku = t('SKU Ä‘Ă£ tá»“n táº¡i')
    }

    const priceNum = Number(newProduct.retailPrice)
    if (Number.isNaN(priceNum) || priceNum < 0) {
      nextErrors.retailPrice = t('GiĂ¡ pháº£i lĂ  sá»‘ khĂ´ng Ă¢m')
    }

    const warrantyPeriodNum = Number(newProduct.warrantyPeriod)
    if (
      Number.isNaN(warrantyPeriodNum) ||
      warrantyPeriodNum <= 0 ||
      !Number.isInteger(warrantyPeriodNum)
    ) {
      nextErrors.warrantyPeriod = t(
        'Thá»i háº¡n báº£o hĂ nh pháº£i lĂ  sá»‘ nguyĂªn dÆ°Æ¡ng',
      )
    }

    const stockNum = Number(newProduct.stock || 0)
    if (Number.isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      nextErrors.stock = t('Tá»“n kho pháº£i lĂ  sá»‘ nguyĂªn khĂ´ng Ă¢m')
    }

    newProduct.videos.forEach((video, index) => {
      const hasVideoValues =
        video.title.trim() || video.descriptions.trim() || video.url.trim()

      if (!hasVideoValues) {
        return
      }

      if (!video.url.trim()) {
        nextProductVideoErrors[index] = t('Vui l\u00f2ng nh\u1eadp URL video')
        return
      }

      if (!isValidRemoteUrl(video.url)) {
        nextProductVideoErrors[index] = t('URL video kh\u00f4ng h\u1ee3p l\u1ec7')
      }
    })

    const firstVideoErrorIndex =
      Object.keys(nextProductVideoErrors)
        .map((key) => Number(key))
        .find((index) => !Number.isNaN(index)) ?? null

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
        type: video.type,
      }))
      .filter((video) => video.title || video.descriptions || video.url)

    return {
      nextErrors,
      nextProductVideoErrors,
      firstErrorField,
      firstVideoErrorIndex,
      priceNum,
      stockNum,
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
      sanitizedSpecifications,
      sanitizedVideos,
      stockNum,
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
      notify(t('Vui l\u00f2ng ki\u1ec3m tra l\u1ea1i c\u00e1c tr\u01b0\u1eddng b\u1eaft bu\u1ed9c'), {
        title: 'Products',
        variant: 'error',
      })
      return
    }

    const descJson = JSON.stringify(newProduct.descriptions || [])
    const specJson = JSON.stringify(sanitizedSpecifications)
    const videoJson = JSON.stringify(sanitizedVideos)

    void (async () => {
      setIsCreating(true)
      try {
        await addProduct({
          name: newProduct.name.trim(),
          sku: newProduct.sku.trim(),
          shortDescription: newProduct.shortDescription.trim(),
          retailPrice: priceNum || 0,
          warrantyPeriod: warrantyPeriodNum,
          stock: stockNum,
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
        closeModal()
      } catch (error) {
        notify(error instanceof Error ? error.message : t('KhÄ‚Â´ng thĂ¡Â»Æ’ tĂ¡ÂºÂ¡o sĂ¡ÂºÂ£n phĂ¡ÂºÂ©m'), {
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
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(t('áº¢nh tá»‘i Ä‘a 10MB'))
      setSelectedImageName('')
      setNewProduct((prev) => ({ ...prev, imageUrl: '' }))
      setImagePreviewUrl('')
      event.target.value = ''
      return
    }
    setImageError('')
    setSelectedImageName(file.name)
    setImagePreviewUrl(URL.createObjectURL(file))
    try {
      const stored = await uploadImageAsset(file)
      setNewProduct((prev) => ({ ...prev, imageUrl: stored.url }))
    } catch (error) {
      const message = getErrorMessage(
        error,
        t('Kh\u00f4ng th\u1ec3 x\u1eed l\u00fd t\u1ec7p \u0111\u00e3 ch\u1ecdn'),
      )
      setImageError(message)
      setSelectedImageName('')
      setNewProduct((prev) => ({ ...prev, imageUrl: '' }))
      event.target.value = ''
      setImagePreviewUrl('')
      notify(message, { title: 'Products', variant: 'error' })
    }
  }

  const handleClearImage = () => {
    setImagePreviewUrl('')
    setImageError('')
    setSelectedImageName('')
    setNewProduct((prev) => ({ ...prev, imageUrl: '' }))
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const handleDelete = useCallback(async (sku: string) => {
    const approved = await confirm({
      title: t('XĂ³a vÄ©nh viá»…n sáº£n pháº©m'),
      message: t('XĂ³a vÄ©nh viá»…n sáº£n pháº©m nĂ y?'),
      tone: 'danger',
      confirmLabel: t('XĂ³a'),
    })
    if (!approved) {
      return
    }
    try {
      await deleteProduct(sku)
      setActionMessage(t("ÄĂ£ xĂ³a vÄ©nh viá»…n sáº£n pháº©m."))
    } catch (error) {
      notify(error instanceof Error ? error.message : t('KhĂ´ng thá»ƒ xĂ³a sáº£n pháº©m'), {
        title: 'Products',
        variant: 'error',
      })
    }
  }, [confirm, deleteProduct, notify, t])

  const handleArchiveToggle = useCallback(async (product: Product) => {
    if (product.isDeleted) {
      try {
        await restoreProduct(product.sku)
        setActionMessage(t("ÄĂ£ khĂ´i phá»¥c sáº£n pháº©m vá» báº£n nhĂ¡p."))
      } catch (error) {
        notify(error instanceof Error ? error.message : t('KhĂ´ng thá»ƒ khĂ´i phá»¥c sáº£n pháº©m'), {
          title: 'Products',
          variant: 'error',
        })
      }
      return
    }
    const approved = await confirm({
      title: t('áº¨n sáº£n pháº©m'),
      message: t('áº¨n sáº£n pháº©m nĂ y khá»i danh má»¥c?'),
      tone: 'warning',
      confirmLabel: t('áº¨n sáº£n pháº©m'),
    })
    if (!approved) {
      return
    }
    try {
      await archiveProduct(product.sku)
      setActionMessage(t("ÄĂ£ áº©n sáº£n pháº©m khá»i danh má»¥c."))
    } catch (error) {
      notify(error instanceof Error ? error.message : t('KhĂ´ng thá»ƒ áº©n sáº£n pháº©m'), {
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
        title: t('Há»§y xuáº¥t báº£n'),
        message: t('Há»§y xuáº¥t báº£n sáº£n pháº©m nĂ y?'),
        tone: 'warning',
        confirmLabel: t('Há»§y xuáº¥t báº£n'),
      })
      if (!approved) {
        return
      }
    }
    try {
      await togglePublishStatus(product.sku)
      setActionMessage(
        product.publishStatus === "PUBLISHED"
          ? t("ÄĂ£ há»§y xuáº¥t báº£n sáº£n pháº©m.")
          : t("ÄĂ£ xuáº¥t báº£n sáº£n pháº©m."),
      )
    } catch (error) {
      notify(error instanceof Error ? error.message : t('KhĂ´ng thá»ƒ cáº­p nháº­t tráº¡ng thĂ¡i xuáº¥t báº£n'), {
        title: 'Products',
        variant: 'error',
      })
    }
  }, [confirm, notify, t, togglePublishStatus])

  const filters = useMemo(() => ([
    { value: 'all', label: 'Táº¥t cáº£', count: filterCounts.all },
    { value: 'active', label: 'Äang bĂ¡n', count: filterCounts.active },
    { value: 'lowStock', label: 'Tá»“n kho tháº¥p', count: filterCounts.lowStock },
    { value: 'outOfStock', label: 'Háº¿t hĂ ng', count: filterCounts.outOfStock },
    { value: 'draft', label: 'Báº£n nhĂ¡p', count: filterCounts.draft },
    {
      value: 'deleted',
      label: 'ÄĂ£ xĂ³a',
      count: filterCounts.deleted,
    },
  ] as const), [filterCounts])

  const listContent = (() => {
    if (visibleProducts.length === 0) {
      return (
        <div className="rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] px-6 py-10 text-center text-sm text-slate-500">
          <Package className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-4 text-base font-semibold text-slate-900">
            {t('KhĂ´ng tĂ¬m tháº¥y sáº£n pháº©m')}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {t('Thá»­ Ä‘á»•i bá»™ lá»c hoáº·c tá»« khĂ³a tĂ¬m kiáº¿m.')}
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
                    aria-label={t('Ná»•i báº­t')}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-700"
                    role="img"
                    title={t('Ná»•i báº­t')}
                  >
                    <Star aria-hidden="true" className="h-3 w-3" />
                  </span>
                )}
                {product.showOnHomepage && (
                  <span
                    aria-label={t('Trang chá»§')}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 text-blue-700"
                    role="img"
                    title={t('Trang chá»§')}
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
              <span>{t('Tá»“n')}: {product.stock > 999 ? '999+' : product.stock}</span>
            </p>
          </div>
        </div>
        <div>
          <span
            className={
              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ' +
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
              ? t('ÄĂ£ xĂ³a')
              : product.publishStatus === 'PUBLISHED'
                ? t('ÄĂ£ xuáº¥t báº£n')
                : product.publishStatus === 'DRAFT'
                  ? t('Báº£n nhĂ¡p')
                  : t('ÄĂ£ xĂ³a')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <Link
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
            to={`/products/${product.sku}`}
            aria-label={t('Chi tiáº¿t')}
            title={t('Chi tiáº¿t')}
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            className={
              product.publishStatus === 'DRAFT' && !product.isDeleted
                ? 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-[var(--accent-soft)] bg-[var(--accent-soft)] text-[var(--accent-strong)] transition hover:border-[var(--accent)]'
                : 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:border-[var(--accent)] hover:text-[var(--accent)]'
            }
            type="button"
            onClick={() => handlePublishToggle(product)}
            disabled={product.isDeleted}
            aria-label={
              product.publishStatus === 'DRAFT'
                ? t('Xuáº¥t báº£n')
                : t('Há»§y xuáº¥t báº£n')
            }
            title={
              product.publishStatus === 'DRAFT'
                ? t('Xuáº¥t báº£n')
                : t('Há»§y xuáº¥t báº£n')
            }
          >
            <CheckCircle className="h-4 w-4" />
          </button>
          <button
            className={
              product.isDeleted
                ? 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-emerald-200 text-emerald-700 transition hover:border-emerald-400'
                : 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-amber-200 text-amber-700 transition hover:border-amber-400'
            }
            type="button"
            onClick={() => handleArchiveToggle(product)}
            aria-label={
              product.isDeleted
                ? t('KhĂ´i phá»¥c')
                : t('áº¨n sáº£n pháº©m')
            }
            title={
              product.isDeleted
                ? t('KhĂ´i phá»¥c')
                : t('áº¨n sáº£n pháº©m')
            }
          >
            {product.isDeleted ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
          </button>
          <button
            className={
              product.isDeleted
                ? 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-rose-200 text-rose-700 transition hover:border-rose-400'
                : 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-400'
            }
            type="button"
            onClick={() => handleDelete(product.sku)}
            disabled={!product.isDeleted}
            aria-label={t('XĂ³a')}
            title={
              product.isDeleted
                ? t('XĂ³a vÄ©nh viá»…n')
                : t('Chá»‰ xĂ³a vÄ©nh viá»…n Ä‘Æ°á»£c khi Ä‘Ă£ áº©n sáº£n pháº©m')
            }
          >
            <Trash2 className="h-4 w-4" />
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
            {t('Sáº£n pháº©m')}
          </h3>
          <p className="text-sm text-slate-500">
            {t('Quáº£n lĂ½ sáº£n pháº©m vĂ  tá»“n kho.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-full max-w-sm rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
              placeholder={t('TĂ¬m tĂªn, SKU...')}
              aria-label={t('TĂ¬m tĂªn, SKU...')}
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
            {showAdvancedFilters ? t('\u1ea8n b\u1ed9 l\u1ecdc') : t('B\u1ed9 l\u1ecdc n\u00e2ng cao')}
          </button>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            type="button"
            onClick={resetFilters}
          >
            <RotateCcw className="h-4 w-4" />
            {t('\u0110\u1eb7t l\u1ea1i')}
          </button>
          {showAdvancedFilters && (
            <div className="flex w-full flex-wrap gap-2">
              <select
                className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                value={filterFeatured}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterFeatured(e.target.value as FeaturedFilter)}
              >
                <option value="all">{t('Ná»•i báº­t: Táº¥t cáº£')}</option>
                <option value="featured">{t('Ná»•i báº­t')}</option>
                <option value="nonFeatured">{t('KhĂ´ng ná»•i báº­t')}</option>
              </select>
              <select
                className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                value={filterHomepage}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterHomepage(e.target.value as HomepageFilter)}
              >
                <option value="all">{t('Trang chá»§: Táº¥t cáº£')}</option>
                <option value="homepage">{t('Trang chá»§')}</option>
                <option value="nonHomepage">{t('KhĂ´ng á»Ÿ trang chá»§')}</option>
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
                t('TĂªn sáº£n pháº©m'),
                'SKU',
                t('GiĂ¡'),
                t('Tá»“n kho'),
                t('Xuáº¥t báº£n'),
                t('Ná»•i báº­t'),
                t('Trang chá»§'),
              ]
              const rows = visibleProducts.map((p) => [
                p.name,
                p.sku,
                p.retailPrice ?? 0,
                p.stock,
                p.publishStatus,
                p.isFeatured ? t('CĂ³') : t('KhĂ´ng'),
                p.showOnHomepage ? t('CĂ³') : t('KhĂ´ng')
              ])
              const csv = [header, ...rows]
                .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
                .join('\n')
              const csvContent = `\ufeff${csv}`
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
            {t('Xuáº¥t CSV')}
          </button>
          <button
            className={primaryButtonClass}
            type="button"
            onClick={openCreateModal}
          >
            <Plus className="h-4 w-4" />
            {t('ThĂªm sáº£n pháº©m')}
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
            {t('Tá»•ng SKU')}
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {products.filter((product) => !product.isDeleted).length}
          </span>
          <span className="text-slate-500">
            {t('{count} báº£n nhĂ¡p', { count: draftProducts.length })}
          </span>
        </div>
        <span className="h-4 w-px bg-[var(--border)]" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-[0.2em] text-slate-400">
            {t('Tá»“n kho tháº¥p')}
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {lowStockProducts.length}
          </span>
          <span className="text-slate-500">{t('Cáº§n bá»• sung')}</span>
        </div>
        <span className="h-4 w-px bg-[var(--border)]" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-[0.2em] text-slate-400">
            {t('Äang bĂ¡n')}
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {activeProducts.length}
          </span>
          <span className="text-slate-500">{t('Äang kinh doanh')}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="hidden items-center gap-3 rounded-2xl border border-slate-200/70 bg-[var(--surface-muted)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400 md:grid md:grid-cols-[2fr_1fr_0.9fr]">
          <span>{t('S\u1ea3n ph\u1ea9m')}</span>
          <span>{t('Tr\u1ea1ng th\u00e1i')}</span>
          <span>{t('Thao t\u00e1c')}</span>
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
          previousLabel={t('TrÆ°á»›c')}
          nextLabel={t('Tiáº¿p')}
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
        contentLabel={t('Táº¡o sáº£n pháº©m')}
      >
        <div
          aria-busy={isCreating}
          className="app-scroll modal-form w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">
                {t('Táº¡o sáº£n pháº©m')}
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

            <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label={t('CĂ¡c tab sáº£n pháº©m')}>
              {[
                { id: 'basic', label: 'ThĂ´ng tin' },
                { id: 'description', label: 'MĂ´ táº£' },
                { id: 'specs', label: 'ThĂ´ng sá»‘' },
                { id: 'videos', label: 'Video' },
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
                {t('B\u1ea1n c\u00f3 thay \u0111\u1ed5i ch\u01b0a l\u01b0u trong bi\u1ec3u m\u1eabu t\u1ea1o s\u1ea3n ph\u1ea9m.')}
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
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('ThĂ´ng tin cÆ¡ báº£n')}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <label className="text-sm text-slate-700">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {t('TĂªn sáº£n pháº©m')} <span className="text-rose-500">*</span>
                        </span>
                        <input
                          ref={nameInputRef}
                          aria-invalid={Boolean(errors.name)}
                          className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm ${errors.name ? 'border-rose-300' : 'border-slate-200'}`}
                          placeholder={t('Nháº­p tĂªn sáº£n pháº©m')}
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                      </label>
                      <label className="text-sm text-slate-700">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {t('Th\u1eddi h\u1ea1n b\u1ea3o h\u00e0nh (th\u00e1ng)')}
                        </span>
                        <input
                          ref={warrantyInputRef}
                          type="text"
                          aria-invalid={Boolean(errors.warrantyPeriod)}
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder={t('Nh\u1eadp s\u1ed1 th\u00e1ng b\u1ea3o h\u00e0nh')}
                          className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm ${errors.warrantyPeriod ? 'border-rose-300' : 'border-slate-200'}`}
                          value={newProduct.warrantyPeriod}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              warrantyPeriod: toDigitsOnly(e.target.value),
                            })
                          }
                        />
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
                          placeholder={t('Nháº­p SKU')}
                          value={newProduct.sku}
                          onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                        />
                        {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku}</p>}
                      </label>
                      <label className="text-sm text-slate-700 md:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {t('MĂ´ táº£ ngáº¯n')}
                        </span>
                        <textarea
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          placeholder={t('Nháº­p mĂ´ táº£ ngáº¯n')}
                          rows={3}
                          value={newProduct.shortDescription}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, shortDescription: e.target.value })
                          }
                        />
                      </label>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('Hiá»ƒn thá»‹')}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={newProduct.isFeatured}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, isFeatured: e.target.checked })
                          }
                        />
                        {t('Ná»•i báº­t')}
                      </label>
                      <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={newProduct.showOnHomepage}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, showOnHomepage: e.target.checked })
                          }
                        />
                        {t('Trang chá»§')}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('GiĂ¡ & tráº¡ng thĂ¡i')}</p>
                    <div className="mt-4 grid gap-3">
                      <label className="text-sm text-slate-700">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {t('GiĂ¡ bĂ¡n láº»')} <span className="text-rose-500">*</span>
                        </span>
                        <div className="relative mt-2">
                          <input
                            ref={retailPriceInputRef}
                            type="text"
                            aria-invalid={Boolean(errors.retailPrice)}
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder={t('Nháº­p giĂ¡ bĂ¡n láº»')}
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
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                            VND
                          </span>
                        </div>
                        {errors.retailPrice && (
                          <p className="mt-1 text-xs text-red-500">{errors.retailPrice}</p>
                        )}
                      </label>
                      <label className="text-sm text-slate-700">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {t('Tá»“n kho')}
                        </span>
                        <input
                          ref={stockInputRef}
                          type="text"
                          aria-invalid={Boolean(errors.stock)}
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder={t('Nháº­p tá»“n kho')}
                          className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm ${errors.stock ? 'border-rose-300' : 'border-slate-200'}`}
                          value={newProduct.stock}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, stock: toDigitsOnly(e.target.value) })
                          }
                        />
                        {errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock}</p>}
                      </label>
                      <label className="text-sm text-slate-700">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {t('Tráº¡ng thĂ¡i xuáº¥t báº£n')}
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
                          <option value="DRAFT">{t('Báº£n nhĂ¡p')}</option>
                          <option value="PUBLISHED">{t('ÄĂ£ xuáº¥t báº£n')}</option>
                        </select>
                      </label>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-[var(--surface-muted)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{t('áº¢nh sáº£n pháº©m')}</p>
                        <p className="text-xs text-slate-500">{t('PNG/JPG, tá»‘i Ä‘a 10MB')}</p>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          ref={imageInputRef}
                          onChange={handleImageChange}
                        />
                        {t('Chá»n áº£nh')}
                      </label>
                    </div>
                    {(selectedImageName || imagePreviewUrl || newProduct.imageUrl) && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        {selectedImageName && (
                          <span>
                            {t('\u0110\u00e3 ch\u1ecdn')}{': '}
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
                            {t('\u0058\u00f3a \u1ea3nh')}
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
                          {t('\u0058\u00f3a \u1ea3nh')}
                        </button>
                        <img
                          src={imagePreviewUrl || resolveBackendAssetUrl(newProduct.imageUrl)}
                          alt={t('\u0058em tr\u01b0\u1edbc')}
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
                    <p className="font-semibold text-slate-900">{t('MĂ´ táº£')}</p>
                    <p className="text-xs text-slate-500">
                      {t('ThĂªm cĂ¡c Ä‘oáº¡n mĂ´ táº£ ngáº¯n cho sáº£n pháº©m.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-[var(--accent)] underline"
                    onClick={() => {
                      void applyDescriptionTemplate()
                    }}
                  >
                    {t('DĂ¹ng máº«u')}
                  </button>
                </div>
                {newProduct.descriptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    <p className="font-semibold text-slate-700">{t('ChÆ°a cĂ³ mĂ´ táº£ nĂ o.')}</p>
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-[var(--accent)]"
                      onClick={() =>
                        setNewProduct({
                          ...newProduct,
                          descriptions: [{ type: 'description', text: '' }],
                        })
                      }
                    >
                      {t('ThĂªm mĂ´ táº£ Ä‘áº§u tiĂªn')}
                    </button>
                  </div>
                ) : (
                  newProduct.descriptions.map((d, idx) => (
                    <div key={idx} className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 text-[11px]">
                          {descriptionTypeOptions.map((option) => {
                            const isActive = d.type === option.id
                            return (
                              <button
                                key={option.id}
                                type="button"
                                className={
                                  isActive
                                    ? 'rounded-full bg-[var(--accent)] px-2 py-1 font-semibold text-white shadow-sm'
                                    : 'rounded-full px-2 py-1 font-semibold text-slate-600 hover:text-slate-900'
                                }
                                onClick={() => {
                                  void changeDescriptionType(idx, option.id)
                                }}
                              >
                                {option.label}
                              </button>
                            )
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() => moveDescriptionItem(idx, -1)}
                          >
                            {t('L\u00ean')}
                          </button>
                          <button
                            type="button"
                            disabled={idx === newProduct.descriptions.length - 1}
                            className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() => moveDescriptionItem(idx, 1)}
                          >
                            {t('Xu\u1ed1ng')}
                          </button>
                          <button
                            type="button"
                            className="min-h-11 rounded-lg px-3 py-2 text-xs font-semibold text-red-500"
                            onClick={() => removeDescriptionItem(idx)}
                          >
                            {t('XĂ³a')}
                          </button>
                        </div>
                      </div>
                      {d.type === 'title' && (
                        <label className="block">
                          <span className="sr-only">{t('TiĂªu Ä‘á» mĂ´ táº£')}</span>
                          <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={d.text ?? ''}
                            onChange={(e) => {
                              const copy = [...newProduct.descriptions]
                              copy[idx] = { ...copy[idx], text: e.target.value }
                              setNewProduct({ ...newProduct, descriptions: copy })
                            }}
                            placeholder={t('Nháº­p tiĂªu Ä‘á»')}
                          />
                        </label>
                      )}
                      {d.type === 'description' && (
                        <div className="richtext-editor">
                          <RichTextEditor
                            ariaLabel={t('TrĂ¬nh soáº¡n tháº£o mĂ´ táº£ chi tiáº¿t')}
                            value={d.text ?? ''}
                            modules={descriptionEditorModules}
                            formats={descriptionEditorFormats}
                            placeholder={t('Nháº­p mĂ´ táº£')}
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
                            {t('Chá»n áº£nh')}
                          </label>
                          <label className="block">
                            <span className="sr-only">{t('ChĂº thĂ­ch hĂ¬nh áº£nh')}</span>
                            <input
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                              placeholder={t('Nháº­p chĂº thĂ­ch')}
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
                                alt={t('Xem trÆ°á»›c')}
                                className="h-40 w-full object-cover"
                              />
                              <button
                                type="button"
                                className="absolute right-2 top-2 inline-flex min-h-11 items-center rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                                onClick={() => {
                                  const copy = [...newProduct.descriptions]
                                  copy[idx] = { ...copy[idx], url: '' }
                                  setNewProduct({ ...newProduct, descriptions: copy })
                                  setDescriptionImageErrors((prev) => {
                                    const next = { ...prev }
                                    delete next[idx]
                                    return next
                                  })
                                }}
                              >
                                {t('XĂ³a áº£nh')}
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
                              {t('Chá»n nhiá»u áº£nh')}
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
                              {t('ThĂªm hĂ¬nh áº£nh')}
                            </button>
                          </div>
                          {descriptionImageErrors[idx] && (
                            <p className="text-xs text-rose-500">{descriptionImageErrors[idx]}</p>
                          )}
                          <label className="text-sm text-slate-700">
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              {t('ChĂº thĂ­ch bá»™ áº£nh')}
                            </span>
                            <input
                              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                              placeholder={t('Nháº­p chĂº thĂ­ch bá»™ áº£nh')}
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
                              <p className="font-semibold text-slate-700">{t('ChÆ°a cĂ³ hĂ¬nh áº£nh nĂ o.')}</p>
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
                                {t('ThĂªm hĂ¬nh áº£nh Ä‘áº§u tiĂªn')}
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
                                    {item.url ? t('Chá»n áº£nh') : t('Chá»n áº£nh')}
                                  </label>
                                  {item.url && (
                                    <div className="group relative overflow-hidden rounded-lg border border-slate-200">
                                      <img
                                        src={resolveBackendAssetUrl(item.url)}
                                        alt={t('Xem trÆ°á»›c')}
                                        className="h-24 w-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        className="absolute right-2 top-2 inline-flex min-h-11 items-center rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                                        onClick={() => {
                                          const copy = [...newProduct.descriptions]
                                          const current = { ...copy[idx] }
                                          const nextGallery = [...(current.gallery ?? [])]
                                          nextGallery[itemIdx] = { ...nextGallery[itemIdx], url: '' }
                                          current.gallery = nextGallery
                                          copy[idx] = current
                                          setNewProduct({ ...newProduct, descriptions: copy })
                                        }}
                                      >
                                        {t('XĂ³a áº£nh')}
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-start justify-end">
                                  <button
                                    type="button"
                                    className="text-xs text-red-500"
                                    onClick={() => {
                                      const copy = [...newProduct.descriptions]
                                      const current = { ...copy[idx] }
                                      const nextGallery = (current.gallery ?? []).filter((_, i) => i !== itemIdx)
                                      current.gallery = nextGallery
                                      copy[idx] = current
                                      setNewProduct({ ...newProduct, descriptions: copy })
                                    }}
                                  >
                                    {t('XĂ³a áº£nh')}
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
                            placeholder={t('Nh\u1eadp URL video YouTube ho\u1eb7c file video c\u00f4ng khai')}
                            value={d.url ?? ''}
                            onChange={(e) => {
                              const copy = [...newProduct.descriptions]
                              copy[idx] = { ...copy[idx], url: e.target.value }
                              setNewProduct({ ...newProduct, descriptions: copy })
                            }}
                          />
                          <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder={t('Nh\u1eadp ch\u00fa th\u00edch')}
                            value={d.caption ?? ''}
                            onChange={(e) => {
                              const copy = [...newProduct.descriptions]
                              copy[idx] = { ...copy[idx], caption: e.target.value }
                              setNewProduct({ ...newProduct, descriptions: copy })
                            }}
                          />
                          {d.url && (
                            <div className="group relative overflow-hidden rounded-lg border border-slate-200 md:col-span-2">
                              <ProductVideoPreview url={d.url} title={d.caption} />
                              <button
                                type="button"
                                className="absolute right-2 top-2 inline-flex min-h-11 items-center rounded-full border border-rose-200 bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-semibold text-rose-600 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                                onClick={() => {
                                  const copy = [...newProduct.descriptions]
                                  copy[idx] = { ...copy[idx], url: '' }
                                  setNewProduct({ ...newProduct, descriptions: copy })
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
                {newProduct.descriptions.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-[var(--accent)]"
                    onClick={() =>
                      setNewProduct({
                        ...newProduct,
                        descriptions: [
                          ...newProduct.descriptions,
                          { type: 'description', text: '' },
                        ],
                      })
                    }
                  >
                    {t('ThĂªm má»¥c mĂ´ táº£')}
                  </button>
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
                    <p className="font-semibold text-slate-900">{t('ThĂ´ng sá»‘')}</p>
                    <p className="text-xs text-slate-500">
                      {t('ThĂªm cĂ¡c thĂ´ng sá»‘ ká»¹ thuáº­t quan trá»ng.')}
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
                    className="text-xs text-[var(--accent)] underline"
                    onClick={() => {
                      void applySpecificationTemplate()
                    }}
                  >
                    {t('DĂ¹ng máº«u')}
                  </button>
                </div>
                {newProduct.specifications.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    <p className="font-semibold text-slate-700">{t('ChÆ°a cĂ³ thĂ´ng sá»‘ nĂ o.')}</p>
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-[var(--accent)]"
                      onClick={() =>
                        setNewProduct({
                          ...newProduct,
                          specifications: [{ label: '', value: '' }],
                        })
                      }
                    >
                      {t('ThĂªm thĂ´ng sá»‘ Ä‘áº§u tiĂªn')}
                    </button>
                  </div>
                ) : (
                  newProduct.specifications.map((s, idx) => (
                    <div key={idx} className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-center">
                      <label className="block">
                        <span className="sr-only">{t('NhĂ£n thĂ´ng sá»‘')}</span>
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder={t('Nháº­p nhĂ£n')}
                          value={s.label}
                          onChange={(e) => {
                            const copy = [...newProduct.specifications]
                            copy[idx] = { ...copy[idx], label: e.target.value }
                            setNewProduct({ ...newProduct, specifications: copy })
                          }}
                        />
                      </label>
                      <label className="block">
                        <span className="sr-only">{t('GiĂ¡ trá»‹ thĂ´ng sá»‘')}</span>
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder={t('Nháº­p giĂ¡ trá»‹')}
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
                          {t('L\u00ean')}
                        </button>
                        <button
                          type="button"
                          disabled={idx === newProduct.specifications.length - 1}
                          className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => moveSpecificationItem(idx, 1)}
                        >
                          {t('Xu\u1ed1ng')}
                        </button>
                        <button
                          type="button"
                          className="min-h-11 px-3 py-2 text-xs font-semibold text-red-500"
                          onClick={() => {
                            const copy = newProduct.specifications.filter((_, i) => i !== idx)
                            setNewProduct({ ...newProduct, specifications: copy })
                          }}
                        >
                          {t('XĂ³a')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
                {newProduct.specifications.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-[var(--accent)]"
                    onClick={() =>
                      setNewProduct({
                        ...newProduct,
                        specifications: [...newProduct.specifications, { label: '', value: '' }],
                      })
                    }
                  >
                    {t('+ ThĂªm thĂ´ng sá»‘')}
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
                    <p className="text-xs text-slate-500">
                      {t('ThĂªm video giá»›i thiá»‡u hoáº·c hÆ°á»›ng dáº«n sáº£n pháº©m.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-[var(--accent)] underline"
                    onClick={() => {
                      void applyVideoTemplate()
                    }}
                  >
                    {t('DĂ¹ng máº«u')}
                  </button>
                </div>
                {newProduct.videos.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    <p className="font-semibold text-slate-700">{t('ChÆ°a cĂ³ video nĂ o.')}</p>
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-[var(--accent)]"
                      onClick={() =>
                        setNewProduct({
                          ...newProduct,
                          videos: createVideoTemplate(),
                        })
                      }
                    >
                      {t('ThĂªm video Ä‘áº§u tiĂªn')}
                    </button>
                  </div>
                ) : (
                  newProduct.videos.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3">
                      <label className="block">
                        <span className="sr-only">{t('TiĂªu Ä‘á» video')}</span>
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder={t('Nháº­p tiĂªu Ä‘á»')}
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
                          placeholder={t('Nh\u1eadp URL video YouTube ho\u1eb7c file video c\u00f4ng khai')}
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
                        />
                      </label>
                      {productVideoErrors[idx] && (
                        <p className="text-xs text-rose-500">{productVideoErrors[idx]}</p>
                      )}
                      <div className="grid gap-2 md:grid-cols-[180px_1fr]">
                        <label className="block">
                          <span className="sr-only">{t('Loáº¡i video')}</span>
                          <select
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={v.type}
                            onChange={(e) => {
                              const copy = [...newProduct.videos]
                              copy[idx] = {
                                ...copy[idx],
                                type: e.target.value as 'unboxing' | 'tutorial',
                              }
                              setNewProduct({ ...newProduct, videos: copy })
                            }}
                          >
                            <option value="tutorial">{t('HÆ°á»›ng dáº«n')}</option>
                            <option value="unboxing">{t('Mở há»™p')}</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="sr-only">{t('MĂ´ táº£ video')}</span>
                          <textarea
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder={t('Nháº­p mĂ´ táº£')}
                            rows={2}
                            value={v.descriptions}
                            onChange={(e) => {
                              const copy = [...newProduct.videos]
                              copy[idx] = { ...copy[idx], descriptions: e.target.value }
                              setNewProduct({ ...newProduct, videos: copy })
                            }}
                          />
                        </label>
                      </div>
                      {v.url && (
                        <div className="group relative overflow-hidden rounded-lg border border-slate-200">
                          <ProductVideoPreview url={v.url} title={v.title} />
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
                            {t('X\u00f3a video')}
                          </button>
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={idx === 0}
                          className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => moveVideoItem(idx, -1)}
                        >
                          {t('L\u00ean')}
                        </button>
                        <button
                          type="button"
                          disabled={idx === newProduct.videos.length - 1}
                          className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => moveVideoItem(idx, 1)}
                        >
                          {t('Xu\u1ed1ng')}
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
                          {t('XĂ³a video')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
                {newProduct.videos.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-[var(--accent)]"
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
                    {t('+ ThĂªm video')}
                  </button>
                )}
              </div>
            )}
            <div className="sticky bottom-0 mt-6 -mx-6 border-t border-slate-200/70 bg-white/95 px-6 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={isCreating}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => {
                    void requestCloseModal()
                  }}
                >
                  {t('H\u1ee7y')}
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
                      {t('\u0110ang t\u1ea1o...')}
                    </>
                  ) : (
                    t('T\u1ea1o')
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

