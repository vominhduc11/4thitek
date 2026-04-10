import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import {
  GhostButton,
  SearchInput,
  inputClass,
  selectClass,
  toolbarCardClass,
  toolbarGroupClass,
} from '../../components/ui-kit'
import type {
  FeaturedFilter,
  HomepageFilter,
  ProductFilter,
  ProductsSortDir,
  ProductsSortField,
} from './productsPageShared'

type TranslationFunction = (key: string, vars?: Record<string, string | number>) => string

type ProductsToolbarProps = {
  t: TranslationFunction
  searchTerm: string
  onSearchTermChange: (value: string) => void
  filter: ProductFilter
  onFilterChange: (value: ProductFilter) => void
  filterFeatured: FeaturedFilter
  onFilterFeaturedChange: (value: FeaturedFilter) => void
  filterHomepage: HomepageFilter
  onFilterHomepageChange: (value: HomepageFilter) => void
  sortField: ProductsSortField
  sortDir: ProductsSortDir
  onSortFieldChange: (value: ProductsSortField) => void
  onSortDirChange: (value: ProductsSortDir) => void
  onReset: () => void
  filterCounts: Record<ProductFilter, number>
  showAdvancedFilters: boolean
  onToggleAdvancedFilters: () => void
}

const sortOptions: Array<{ field: ProductsSortField; label: string }> = [
  { field: 'updatedAt', label: 'Mới nhất' },
  { field: 'name', label: 'Tên' },
  { field: 'retailPrice', label: 'Giá' },
  { field: 'availableStock', label: 'Tồn kho' },
]

const filterBaseClass =
  'inline-flex min-h-11 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition whitespace-nowrap'

function ProductsToolbar({
  t,
  searchTerm,
  onSearchTermChange,
  filter,
  onFilterChange,
  filterFeatured,
  onFilterFeaturedChange,
  filterHomepage,
  onFilterHomepageChange,
  sortField,
  sortDir,
  onSortFieldChange,
  onSortDirChange,
  onReset,
  filterCounts,
  showAdvancedFilters,
  onToggleAdvancedFilters,
}: ProductsToolbarProps) {
  const filterOptions: Array<{ value: ProductFilter; label: string }> = [
    { value: 'all', label: 'Tất cả' },
    { value: 'active', label: 'Đang bán' },
    { value: 'urgentStock', label: 'Tồn kho khẩn cấp' },
    { value: 'lowStock', label: 'Tồn kho thấp' },
    { value: 'outOfStock', label: 'Hết hàng' },
    { value: 'draft', label: 'Bản nháp' },
    { value: 'deleted', label: 'Đã xóa' },
  ]

  return (
    <section className="mt-6 space-y-4">
      <div className={toolbarCardClass}>
        <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            id="products-search"
            label={t('Tìm sản phẩm')}
            placeholder={t('Tìm tên, SKU...')}
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            className="w-full lg:max-w-lg"
          />
          <div className={`${toolbarGroupClass} lg:ml-auto`}>
            <GhostButton
              className="w-full sm:w-auto"
              icon={<SlidersHorizontal className="h-4 w-4" />}
              onClick={onToggleAdvancedFilters}
              type="button"
            >
              {showAdvancedFilters ? t('Ẩn bộ lọc') : t('Bộ lọc nâng cao')}
            </GhostButton>
            <GhostButton
              className="w-full sm:w-auto"
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={onReset}
              type="button"
            >
              {t('Đặt lại')}
            </GhostButton>
          </div>
        </div>
      </div>

      <label className="space-y-2 lg:hidden">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          {t('Sắp xếp')}
        </span>
        <select
          className={`${inputClass} w-full`}
          onChange={(event) => {
            const [nextField, nextDir] = event.target.value.split('|') as [
              ProductsSortField,
              ProductsSortDir,
            ]
            onSortFieldChange(nextField)
            onSortDirChange(nextDir)
          }}
          value={`${sortField}|${sortDir}`}
        >
          <option value="updatedAt|desc">{t('Mới nhất')}</option>
          <option value="updatedAt|asc">{`${t('Mới nhất')} ↑`}</option>
          <option value="name|asc">{`${t('Tên')} A-Z`}</option>
          <option value="name|desc">{`${t('Tên')} Z-A`}</option>
          <option value="retailPrice|desc">{`${t('Giá')} ↓`}</option>
          <option value="retailPrice|asc">{`${t('Giá')} ↑`}</option>
          <option value="availableStock|desc">{`${t('Tồn kho')} ↓`}</option>
          <option value="availableStock|asc">{`${t('Tồn kho')} ↑`}</option>
        </select>
      </label>

      {showAdvancedFilters ? (
        <div className="grid gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {t('Nổi bật')}
            </span>
            <select
              className={`${selectClass} w-full`}
              onChange={(event) => onFilterFeaturedChange(event.target.value as FeaturedFilter)}
              value={filterFeatured}
            >
              <option value="all">{t('Nổi bật: Tất cả')}</option>
              <option value="featured">{t('Nổi bật')}</option>
              <option value="nonFeatured">{t('Không nổi bật')}</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {t('Trang chủ')}
            </span>
            <select
              className={`${selectClass} w-full`}
              onChange={(event) => onFilterHomepageChange(event.target.value as HomepageFilter)}
              value={filterHomepage}
            >
              <option value="all">{t('Trang chủ: Tất cả')}</option>
              <option value="homepage">{t('Trang chủ')}</option>
              <option value="nonHomepage">{t('Không ở trang chủ')}</option>
            </select>
          </label>

          <label className="hidden">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {t('Sắp xếp')}
            </span>
            <select
              className={`${inputClass} w-full`}
              onChange={(event) => {
                const [nextField, nextDir] = event.target.value.split('|') as [
                  ProductsSortField,
                  ProductsSortDir,
                ]
                onSortFieldChange(nextField)
                onSortDirChange(nextDir)
              }}
              value={`${sortField}|${sortDir}`}
            >
              <option value="updatedAt|desc">{t('Mới nhất')}</option>
              <option value="updatedAt|asc">{`${t('Mới nhất')} ↑`}</option>
              <option value="name|asc">{`${t('Tên')} A-Z`}</option>
              <option value="name|desc">{`${t('Tên')} Z-A`}</option>
              <option value="retailPrice|desc">{`${t('Giá')} ↓`}</option>
              <option value="retailPrice|asc">{`${t('Giá')} ↑`}</option>
              <option value="availableStock|desc">{`${t('Tồn kho')} ↓`}</option>
              <option value="availableStock|asc">{`${t('Tồn kho')} ↑`}</option>
            </select>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {t('Chế độ sắp xếp hiện tại')}: {t(sortOptions.find((option) => option.field === sortField)?.label ?? 'Mới nhất')} {sortDir === 'asc' ? '↑' : '↓'}
            </p>
          </label>
        </div>
      ) : null}

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max flex-wrap gap-2 sm:flex-nowrap">
          {filterOptions.map((option) => {
            const isActive = filter === option.value

            return (
              <button
                key={option.value}
                className={
                  isActive
                    ? `${filterBaseClass} bg-[var(--accent)] text-white shadow-sm`
                    : `${filterBaseClass} border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]`
                }
                onClick={() => onFilterChange(option.value)}
                type="button"
              >
                <span>{t(option.label)}</span>
                <span
                  className={
                    isActive
                      ? 'rounded-full bg-white/20 px-2 py-0.5 text-xs'
                      : 'rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-[var(--muted)]'
                  }
                >
                  {filterCounts[option.value]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="hidden flex-wrap items-center gap-2 lg:flex">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          {t('Sắp xếp')}
        </span>
        {sortOptions.map((option) => (
          <button
            key={option.field}
            className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              sortField === option.field
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
            }`}
            onClick={() => {
              if (sortField === option.field) {
                onSortDirChange(sortDir === 'asc' ? 'desc' : 'asc')
                return
              }

              onSortFieldChange(option.field)
              onSortDirChange('desc')
            }}
            type="button"
          >
            {t(option.label)}
            {sortField === option.field ? (
              <span className="text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  )
}

export default ProductsToolbar
