import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import ReactPaginate from 'react-paginate'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
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
import { useProducts } from '../context/ProductsContext'
import { useLanguage } from '../context/LanguageContext'
import type { Product } from '../data/products'

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

const getImageUrl = (image: string) => {
  try {
    const parsed = JSON.parse(image) as { imageUrl?: string }
    return parsed.imageUrl || image
  } catch {
    return image
  }
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

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(file)
  })

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_BYTES = 10 * 1024 * 1024
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

type QuillEditorProps = {
  value: string
  onChange: (value: string) => void
  modules?: Record<string, unknown>
  formats?: string[]
  placeholder?: string
  readOnly?: boolean
}

const QuillEditor = ({
  value,
  onChange,
  modules,
  formats,
  placeholder,
  readOnly,
}: QuillEditorProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const quillRef = useRef<Quill | null>(null)
  const toolbarRef = useRef<HTMLElement | null>(null)
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return

    const instance = new Quill(containerRef.current, {
      theme: 'snow',
      modules,
      formats,
      placeholder,
      readOnly,
    })

    quillRef.current = instance
    const toolbarModule = instance.getModule('toolbar') as { container?: HTMLElement } | null
    toolbarRef.current = toolbarModule?.container ?? null

    const handleChange = () => {
      const html = instance.root.innerHTML
      if (html !== valueRef.current) {
        onChangeRef.current(html)
      }
    }

    instance.on('text-change', handleChange)

    if (valueRef.current) {
      instance.clipboard.dangerouslyPasteHTML(valueRef.current, 'silent')
    } else {
      instance.setText('', 'silent')
    }

    return () => {
      instance.off('text-change', handleChange)
      quillRef.current = null
      if (toolbarRef.current?.parentNode) {
        toolbarRef.current.parentNode.removeChild(toolbarRef.current)
      }
      toolbarRef.current = null
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [formats, modules, placeholder, readOnly])

  useEffect(() => {
    const instance = quillRef.current
    if (!instance) return
    const currentHtml = instance.root.innerHTML
    if (value !== currentHtml) {
      const selection = instance.getSelection()
      instance.clipboard.dangerouslyPasteHTML(value || '', 'silent')
      if (selection) {
        instance.setSelection(selection)
      }
    }
  }, [value])

  return <div ref={containerRef} />
}

function ProductsPage() {
  const { t } = useLanguage()
  const {
    products,
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
  const [selectedImageName, setSelectedImageName] = useState('')
  const [imageError, setImageError] = useState('')
  const [descriptionImageErrors, setDescriptionImageErrors] = useState<Record<number, string>>({})
  const [descriptionVideoErrors, setDescriptionVideoErrors] = useState<Record<number, string>>({})
  const [productVideoErrors, setProductVideoErrors] = useState<Record<number, string>>({})
  const [activeTab, setActiveTab] = useState<'basic' | 'description' | 'specs' | 'videos'>('basic')
  const [currentPage, setCurrentPage] = useState(0)
  const [actionMessage, setActionMessage] = useState('')
  const [newProduct, setNewProduct] = useState({
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
    stock: '',
    publishStatus: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    isFeatured: false,
    showOnHomepage: false,
    imageUrl: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const tabOrder = ['basic', 'description', 'specs', 'videos'] as const

  const activeProducts = useMemo(
    () => products.filter((product) => !product.isDeleted && product.status === 'Active'),
    [products],
  )

  const lowStockProducts = useMemo(
    () => products.filter((product) => !product.isDeleted && product.stock > 0 && product.stock < 20),
    [products],
  )

  const draftProducts = useMemo(
    () => products.filter((product) => !product.isDeleted && product.status === 'Draft'),
    [products],
  )

  const normalizedSearch = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm])
  const baseFilteredProducts = useMemo(
    () =>
      products.filter((product) => {
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
      }),
    [products, normalizedSearch, filterFeatured, filterHomepage],
  )

  const filterCounts = useMemo(
    () =>
      baseFilteredProducts.reduce(
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
      ),
    [baseFilteredProducts],
  )

  const visibleProducts = useMemo(() => baseFilteredProducts.filter((product) => {
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
  }), [baseFilteredProducts, filter])

  useEffect(() => {
    setCurrentPage(0)
  }, [normalizedSearch, filter, filterFeatured, filterHomepage])

  useEffect(() => {
    if (!actionMessage) return
    const timer = window.setTimeout(() => setActionMessage(''), 3000)
    return () => window.clearTimeout(timer)
  }, [actionMessage])

  const pageCount = Math.ceil(visibleProducts.length / ITEMS_PER_PAGE)
  const pagedProducts = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE
    return visibleProducts.slice(start, start + ITEMS_PER_PAGE)
  }, [visibleProducts, currentPage])

  useEffect(() => {
    if (pageCount === 0) {
      if (currentPage !== 0) setCurrentPage(0)
      return
    }
    if (currentPage > pageCount - 1) {
      setCurrentPage(pageCount - 1)
    }
  }, [pageCount, currentPage])

  const panelClass =
    'rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]'
  const primaryButtonClass =
    'btn-stable inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0'
  const filterBaseClass =
    'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition whitespace-nowrap'

  const resetFilters = () => {
    setFilter('all')
    setSearchTerm('')
    setFilterFeatured('all')
    setFilterHomepage('all')
  }

  const descriptionTypeOptions: Array<{ id: DescriptionItem['type']; label: string }> = [
    { id: 'title', label: t('Tiêu đề') },
    { id: 'description', label: t('Mô tả') },
    { id: 'image', label: t('Hình ảnh') },
    { id: 'gallery', label: t('Nhiều hình ảnh') },
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

  const changeDescriptionType = (index: number, nextType: DescriptionItem['type']) => {
    setNewProduct((prev) => {
      const copy = [...prev.descriptions]
      const current = copy[index] ?? { type: nextType }
      const nextItem: DescriptionItem = { type: nextType }

      if (nextType === 'title' || nextType === 'description') {
        nextItem.text = current.text ?? ''
      }
      if (nextType === 'image' || nextType === 'video') {
        nextItem.url = current.url ?? ''
        nextItem.caption = current.caption ?? ''
      }
      if (nextType === 'gallery') {
        const legacyUrls = (current as { urls?: string[] }).urls
        const currentGallery =
          current.gallery && current.gallery.length
            ? current.gallery
            : legacyUrls?.map((url) => ({ url })) ?? []
        nextItem.gallery = currentGallery
        nextItem.caption = current.caption ?? ''
      }

      copy[index] = nextItem
      return { ...prev, descriptions: copy }
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
      const url = await readFileAsDataUrl(file)
      setNewProduct((prev) => {
        const copy = [...prev.descriptions]
        const current = copy[index] ?? { type: 'image' as const }
        copy[index] = { ...current, type: 'image', url }
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
        [index]: t('Ảnh tối đa 10MB'),
      }))
    }
    const validFiles = fileList.filter((file) => file.size <= MAX_IMAGE_BYTES)
    if (validFiles.length === 0) return
    try {
      const urls = await Promise.all(validFiles.map(readFileAsDataUrl))
      const newItems = urls.filter(Boolean).map((url) => ({ url }))
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
    } catch {
      // ignore
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
      const url = await readFileAsDataUrl(file)
      setNewProduct((prev) => {
        const copy = [...prev.descriptions]
        const current = copy[index] ?? { type: 'gallery' as const, gallery: [] as GalleryItem[] }
        const nextGallery = [...(current.gallery ?? [])]
        const existing = nextGallery[itemIndex] ?? { url: '' }
        nextGallery[itemIndex] = { ...existing, url }
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
    if (file.size > MAX_VIDEO_BYTES) {
      setDescriptionVideoErrors((prev) => ({
        ...prev,
        [index]: t('Video tối đa 10MB'),
      }))
      return
    }
    try {
      const url = await readFileAsDataUrl(file)
      setNewProduct((prev) => {
        const copy = [...prev.descriptions]
        const current = copy[index] ?? { type: 'video' as const }
        copy[index] = { ...current, type: 'video', url }
        return { ...prev, descriptions: copy }
      })
      setDescriptionVideoErrors((prev) => {
        const next = { ...prev }
        delete next[index]
        return next
      })
    } catch {
      // ignore
    }
  }

  const handleProductVideoFile = async (index: number, file: File | null) => {
    if (!file) return
    if (file.size > MAX_VIDEO_BYTES) {
      setProductVideoErrors((prev) => ({
        ...prev,
        [index]: t('Video tối đa 10MB'),
      }))
      return
    }
    try {
      const url = await readFileAsDataUrl(file)
      setNewProduct((prev) => {
        const copy = [...prev.videos]
        const current =
          copy[index] ?? { title: '', descriptions: '', url: '', type: 'tutorial' as const }
        copy[index] = { ...current, url }
        return { ...prev, videos: copy }
      })
      setProductVideoErrors((prev) => {
        const next = { ...prev }
        delete next[index]
        return next
      })
    } catch {
      // ignore
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

  const closeModal = () => {
    setActiveTab('basic')
    retailPriceCaretRef.current = null
    setDescriptionImageErrors({})
    setDescriptionVideoErrors({})
    setProductVideoErrors({})
    setShowModal(false)
  }

  useLayoutEffect(() => {
    if (retailPriceCaretRef.current === null) return
    const input = retailPriceInputRef.current
    if (!input) return
    const caret = retailPriceCaretRef.current
    retailPriceCaretRef.current = null
    input.setSelectionRange(caret, caret)
  }, [newProduct.retailPrice])

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(t('Ảnh tối đa 10MB'))
      setSelectedImageName('')
      setNewProduct((prev) => ({ ...prev, imageUrl: '' }))
      event.target.value = ''
      return
    }
    setImageError('')
    setSelectedImageName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setNewProduct((prev) => ({ ...prev, imageUrl: result }))
    }
    reader.readAsDataURL(file)
  }

  const handleClearImage = () => {
    setImageError('')
    setSelectedImageName('')
    setNewProduct((prev) => ({ ...prev, imageUrl: '' }))
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const handleDelete = useCallback((sku: string) => {
    if (
      window.confirm(
        t('Xóa vĩnh viễn sản phẩm này? Hành động không thể hoàn tác.'),
      )
    ) {
      deleteProduct(sku)
    }
  }, [deleteProduct, t])

  const handleArchiveToggle = useCallback((product: Product) => {
    if (product.isDeleted) {
      restoreProduct(product.sku)
      setActionMessage(t('Đã khôi phục sản phẩm về bản nháp.'))
      return
    }
    archiveProduct(product.sku)
    setActionMessage('')
  }, [archiveProduct, restoreProduct, t])

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

  const listContent = useMemo(() => {
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
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-700"
                    title={t('Nổi bật')}
                  >
                    <Star className="h-3 w-3" />
                  </span>
                )}
                {product.showOnHomepage && (
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 text-blue-700"
                    title={t('Trang chủ')}
                  >
                    <Home className="h-3 w-3" />
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
              <span>{t('Tồn')}: {product.stock > 999 ? '999+' : product.stock}</span>
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
              ? t('Đã xóa')
              : product.publishStatus === 'PUBLISHED'
                ? t('Đã xuất bản')
                : product.publishStatus === 'DRAFT'
                  ? t('Bản nháp')
                  : t('Đã xóa')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <Link
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
            to={`/products/${product.sku}`}
            aria-label={t('Chi tiết')}
            title={t('Chi tiết')}
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            className={
              product.publishStatus === 'DRAFT' && !product.isDeleted
                ? 'inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[var(--accent-soft)] bg-[var(--accent-soft)] text-[var(--accent-strong)] transition hover:border-[var(--accent)]'
                : 'inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:border-[var(--accent)] hover:text-[var(--accent)]'
            }
            type="button"
            onClick={() => togglePublishStatus(product.sku)}
            disabled={product.isDeleted}
            aria-label={
              product.publishStatus === 'DRAFT'
                ? t('Xuất bản')
                : t('Hủy xuất bản')
            }
            title={
              product.publishStatus === 'DRAFT'
                ? t('Xuất bản')
                : t('Hủy xuất bản')
            }
          >
            <CheckCircle className="h-4 w-4" />
          </button>
          <button
            className={
              product.isDeleted
                ? 'inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-emerald-200 text-emerald-700 transition hover:border-emerald-400'
                : 'inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-amber-200 text-amber-700 transition hover:border-amber-400'
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
          </button>
          <button
            className={
              product.isDeleted
                ? 'inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-rose-200 text-rose-700 transition hover:border-rose-400'
                : 'inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-400'
            }
            type="button"
            onClick={() => handleDelete(product.sku)}
            disabled={!product.isDeleted}
            aria-label={t('Xóa')}
            title={
              product.isDeleted
                ? t('Xóa vĩnh viễn')
                : t('Chỉ xóa vĩnh viễn được khi đã ẩn sản phẩm')
            }
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    ))
  }, [
    visibleProducts.length,
    pagedProducts,
    archiveProduct,
    restoreProduct,
    togglePublishStatus,
    handleDelete,
    t,
  ])

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
              className="h-11 w-full max-w-sm rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus:outline-none"
              placeholder={t('Tìm tên, SKU...')}
              aria-label={t('Tìm tên, SKU...')}
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <button
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showAdvancedFilters ? t('\u1ea8n b\u1ed9 l\u1ecdc') : t('B\u1ed9 l\u1ecdc n\u00e2ng cao')}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
            className="btn-stable ml-auto inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
                p.stock,
                p.publishStatus,
                p.isFeatured ? t('Có') : t('Không'),
                p.showOnHomepage ? t('Có') : t('Không')
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
            {t('Xuất CSV')}
          </button>
          <button
            className={primaryButtonClass}
            type="button"
            onClick={() => {
              setActiveTab('basic')
              retailPriceCaretRef.current = null
              setNewProduct({
                name: '',
                sku: '',
                shortDescription: '',
                descriptions: [],
                specifications: [],
                videos: [],
                retailPrice: '',
                stock: '',
                publishStatus: 'DRAFT',
                isFeatured: false,
                showOnHomepage: false,
                imageUrl: '',
              })
              setSelectedImageName('')
              setImageError('')
              setDescriptionImageErrors({})
              setDescriptionVideoErrors({})
              setProductVideoErrors({})
              setErrors({})
              setShowModal(true)
            }}
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

      <div className="mt-6 grid gap-3">
        <div className="hidden items-center gap-3 rounded-2xl border border-slate-200/70 bg-[var(--surface-muted)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400 md:grid md:grid-cols-[2fr_1fr_0.9fr]">
          <span>{t('S\u1ea3n ph\u1ea9m')}</span>
          <span>{t('Tr\u1ea1ng th\u00e1i')}</span>
          <span>{t('Thao t\u00e1c')}</span>
        </div>
        {listContent}
      </div>
      {pageCount > 1 && (
        <div className="mt-6 flex justify-center">
          <ReactPaginate
            breakLabel="..."
            nextLabel={t('Tiếp')}
            onPageChange={(selectedItem) => setCurrentPage(selectedItem.selected)}
            pageRangeDisplayed={2}
            marginPagesDisplayed={1}
            pageCount={pageCount}
            previousLabel={t('Trước')}
            forcePage={currentPage}
            containerClassName="flex items-center gap-1 text-sm"
            pageLinkClassName="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            previousLinkClassName="flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-600 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            nextLinkClassName="flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-600 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            breakLinkClassName="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400"
            activeLinkClassName="border-[var(--accent)] bg-[var(--accent)] text-white"
            disabledLinkClassName="cursor-not-allowed border-slate-200 text-slate-300"
          />
        </div>
      )}

      <Modal
        isOpen={showModal}
        onRequestClose={closeModal}
        onAfterOpen={() => {
          tabRefs.current.basic?.focus()
        }}
        style={modalStyles}
        contentLabel={t('Tạo sản phẩm')}
      >
        <div className="app-scroll modal-form w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">
                {t('Tạo sản phẩm')}
              </h4>
              <button
                className="rounded-full p-2 hover:bg-slate-100"
                onClick={closeModal}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label={t('Các tab sản phẩm')}>
              {[
                { id: 'basic', label: 'Thông tin' },
                { id: 'description', label: 'Mô tả' },
                { id: 'specs', label: 'Thông số' },
                { id: 'videos', label: 'Video' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabRefs.current[tab.id as typeof activeTab] = node
                  }}
                  id={`product-tab-${tab.id}`}
                  className={
                    activeTab === tab.id
                      ? 'rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white shadow'
                      : 'rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700'
                  }
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`product-tabpanel-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
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
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                >
                  {t(tab.label)}
                </button>
              ))}
            </div>

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
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          placeholder={t('Nhập tên sản phẩm')}
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                      </label>
                      <label className="text-sm text-slate-700">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">SKU *</span>
                        <input
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          placeholder={t('Nhập SKU')}
                          value={newProduct.sku}
                          onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                        />
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
                          value={newProduct.shortDescription}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, shortDescription: e.target.value })
                          }
                        />
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
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder={t('Nhập giá bán lẻ')}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-12 text-sm"
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
                          {t('Tồn kho')}
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder={t('Nhập tồn kho')}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          value={newProduct.stock}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, stock: toDigitsOnly(e.target.value) })
                          }
                        />
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
                    {(selectedImageName || newProduct.imageUrl) && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        {selectedImageName && (
                          <span>
                            {t('\u0110\u00e3 ch\u1ecdn')}{': '}
                            <span className="font-semibold text-slate-800">{selectedImageName}</span>
                          </span>
                        )}
                        {!newProduct.imageUrl && (
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
                    {newProduct.imageUrl && (
                      <div className="group relative mt-3 overflow-hidden rounded-2xl border bg-white">
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-rose-200 bg-[var(--surface-glass)] px-2 py-1 text-[11px] font-semibold text-rose-600 shadow-sm opacity-0 transition hover:border-rose-300 hover:text-rose-700 focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                          {t('\u0058\u00f3a \u1ea3nh')}
                        </button>
                        <img
                          src={newProduct.imageUrl}
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
                    <p className="font-semibold text-slate-900">{t('Mô tả')}</p>
                    <p className="text-xs text-slate-500">
                      {t('Thêm các đoạn mô tả ngắn cho sản phẩm.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-[var(--accent)] underline"
                    onClick={() =>
                      setNewProduct({
                        ...newProduct,
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
                {newProduct.descriptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    <p className="font-semibold text-slate-700">{t('Chưa có mô tả nào.')}</p>
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
                      {t('Thêm mô tả đầu tiên')}
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
                                onClick={() => changeDescriptionType(idx, option.id)}
                              >
                                {option.label}
                              </button>
                            )
                          })}
                        </div>
                        <button
                          type="button"
                          className="text-xs text-red-500"
                          onClick={() => removeDescriptionItem(idx)}
                        >
                          {t('Xóa')}
                        </button>
                      </div>
                      {d.type === 'title' && (
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          value={d.text ?? ''}
                          onChange={(e) => {
                            const copy = [...newProduct.descriptions]
                            copy[idx] = { ...copy[idx], text: e.target.value }
                            setNewProduct({ ...newProduct, descriptions: copy })
                          }}
                          placeholder={t('Nhập tiêu đề')}
                        />
                      )}
                      {d.type === 'description' && (
                        <div className="richtext-editor">
                          <QuillEditor
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
                          {descriptionImageErrors[idx] && (
                            <p className="text-xs text-rose-500">{descriptionImageErrors[idx]}</p>
                          )}
                          {d.url && (
                            <div className="group relative overflow-hidden rounded-lg border border-slate-200 md:col-span-2">
                              <img
                                src={d.url}
                                alt={t('Xem trước')}
                                className="h-40 w-full object-cover"
                              />
                              <button
                                type="button"
                                className="absolute right-2 top-2 rounded-full border border-rose-200 bg-[var(--surface-glass)] px-2 py-1 text-[10px] font-semibold text-rose-600 opacity-0 transition group-hover:opacity-100"
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
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
                              <div className="grid gap-3 md:grid-cols-[180px_1fr] md:items-start">
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
                                        src={item.url}
                                        alt={t('Xem trước')}
                                        className="h-24 w-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        className="absolute right-2 top-2 rounded-full border border-rose-200 bg-[var(--surface-glass)] px-2 py-1 text-[10px] font-semibold text-rose-600 opacity-0 transition group-hover:opacity-100"
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
                                        {t('Xóa ảnh')}
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
                          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                            <input
                              type="file"
                              accept="video/*"
                              className="sr-only"
                              onChange={(e) =>
                                handleDescriptionVideoFile(idx, e.target.files?.[0] ?? null)
                              }
                            />
                            {t('Chọn video')}
                          </label>
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
                          {descriptionVideoErrors[idx] && (
                            <p className="text-xs text-rose-500">{descriptionVideoErrors[idx]}</p>
                          )}
                          {d.url && (
                            <div className="group relative overflow-hidden rounded-lg border border-slate-200 md:col-span-2">
                              <video
                                src={d.url}
                                controls
                                className="h-44 w-full object-cover"
                              />
                              <button
                                type="button"
                                className="absolute right-2 top-2 rounded-full border border-rose-200 bg-[var(--surface-glass)] px-2 py-1 text-[10px] font-semibold text-rose-600 opacity-0 transition group-hover:opacity-100"
                                onClick={() => {
                                  const copy = [...newProduct.descriptions]
                                  copy[idx] = { ...copy[idx], url: '' }
                                  setNewProduct({ ...newProduct, descriptions: copy })
                                  setDescriptionVideoErrors((prev) => {
                                    const next = { ...prev }
                                    delete next[idx]
                                    return next
                                  })
                                }}
                              >
                                {t('Xóa video')}
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
                    {t('Thêm mục mô tả')}
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
                    <p className="font-semibold text-slate-900">{t('Thông số')}</p>
                    <p className="text-xs text-slate-500">
                      {t('Thêm các thông số kỹ thuật quan trọng.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-[var(--accent)] underline"
                    onClick={() =>
                      setNewProduct({
                        ...newProduct,
                        specifications: [
                          { label: '', value: '' },
                          { label: '', value: '' },
                        ],
                      })
                    }
                  >
                    {t('Dùng mẫu')}
                  </button>
                </div>
                {newProduct.specifications.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    <p className="font-semibold text-slate-700">{t('Chưa có thông số nào.')}</p>
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
                      {t('Thêm thông số đầu tiên')}
                    </button>
                  </div>
                ) : (
                  newProduct.specifications.map((s, idx) => (
                    <div key={idx} className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-center">
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
                      <button
                        type="button"
                        className="justify-self-end text-xs text-red-500 md:justify-self-auto"
                        onClick={() => {
                          const copy = newProduct.specifications.filter((_, i) => i !== idx)
                          setNewProduct({ ...newProduct, specifications: copy })
                        }}
                      >
                        {t('Xóa')}
                      </button>
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
                    <p className="text-xs text-slate-500">
                      {t('Thêm video giới thiệu hoặc hướng dẫn sản phẩm.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-[var(--accent)] underline"
                    onClick={() =>
                      setNewProduct({
                        ...newProduct,
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
                {newProduct.videos.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    <p className="font-semibold text-slate-700">{t('Chưa có video nào.')}</p>
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-[var(--accent)]"
                      onClick={() =>
                        setNewProduct({
                          ...newProduct,
                          videos: [
                            { title: '', descriptions: '', url: '', type: 'tutorial' as const },
                          ],
                        })
                      }
                    >
                      {t('Thêm video đầu tiên')}
                    </button>
                  </div>
                ) : (
                  newProduct.videos.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3">
                      <div className="grid gap-2">
                        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                          <input
                            type="file"
                            accept="video/*"
                            className="sr-only"
                            onChange={(e) =>
                              handleProductVideoFile(idx, e.target.files?.[0] ?? null)
                            }
                          />
                          {t('Chọn video')}
                        </label>
                      </div>
                      {productVideoErrors[idx] && (
                        <p className="text-xs text-rose-500">{productVideoErrors[idx]}</p>
                      )}
                      {v.url && (
                        <div className="group relative overflow-hidden rounded-lg border border-slate-200">
                          <video src={v.url} controls className="h-44 w-full object-cover" />
                          <button
                            type="button"
                            className="absolute right-2 top-2 rounded-full border border-rose-200 bg-[var(--surface-glass)] px-2 py-1 text-[10px] font-semibold text-rose-600 opacity-0 transition group-hover:opacity-100"
                            onClick={() => {
                              const copy = [...newProduct.videos]
                              copy[idx] = { ...copy[idx], url: '' }
                              setNewProduct({ ...newProduct, videos: copy })
                              setProductVideoErrors((prev) => {
                                const next = { ...prev }
                                delete next[idx]
                                return next
                              })
                            }}
                          >
                            {t('Xóa video')}
                          </button>
                        </div>
                      )}
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
                      <button
                        type="button"
                        className="self-end text-xs text-red-500"
                        onClick={() => {
                          const copy = newProduct.videos.filter((_, i) => i !== idx)
                          setNewProduct({ ...newProduct, videos: copy })
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
                          { title: '', descriptions: '', url: '', type: 'tutorial' as const },
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
              <div className="flex justify-end">
                <button
                  className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  onClick={() => {
                    const nextErrors: Record<string, string> = {}
                    if (!newProduct.name.trim())
                      nextErrors.name = t('Vui lòng nhập tên sản phẩm')
                    if (!newProduct.sku.trim())
                      nextErrors.sku = t('Vui lòng nhập SKU')
                    if (products.some((p) => p.sku === newProduct.sku.trim())) {
                      nextErrors.sku = t('SKU đã tồn tại')
                    }
                    const priceNum = Number(newProduct.retailPrice)
                    if (Number.isNaN(priceNum) || priceNum < 0) {
                      nextErrors.retailPrice = t('Giá phải là số không âm')
                    }
                    const stockNum = Number(newProduct.stock || 0)
                    setErrors(nextErrors)
                    if (Object.keys(nextErrors).length) return

                    const descJson = JSON.stringify(newProduct.descriptions || [])
                    const specJson = JSON.stringify(newProduct.specifications || [])
                    const videoJson = JSON.stringify(newProduct.videos || [])

                    addProduct({
                      name: newProduct.name.trim(),
                      sku: newProduct.sku.trim(),
                      shortDescription: newProduct.shortDescription.trim(),
                      retailPrice: priceNum || 0,
                      stock: stockNum || 0,
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
                  }}
                >
                  {t('Tạo')}
                </button>
              </div>
            </div>
        </div>
      </Modal>
    </section>
  )
}

export default ProductsPage
