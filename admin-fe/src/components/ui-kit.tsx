import { Search, type LucideIcon } from 'lucide-react'
import ReactPaginate from 'react-paginate'
import type {
  ButtonHTMLAttributes,
  ChangeEventHandler,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from 'react'

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ')

export const panelClass =
  'rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]'

export const softCardClass =
  'rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-4 shadow-sm backdrop-blur'

export const ghostButtonClass =
  'btn-stable inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--ink)] hover:shadow-[0_12px_26px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

export const primaryButtonClass =
  'btn-stable inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

export const inputClass =
  'h-11 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] shadow-sm transition placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1'

export const cardTitleClass = 'text-lg font-semibold text-[var(--ink)]'
export const bodyTextClass = 'text-sm text-[var(--muted)]'
export const labelClass = 'text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]'
export const tableCardClass =
  'rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-4 shadow-sm backdrop-blur'
export const tableRowClass =
  'cursor-pointer rounded-2xl bg-[var(--surface-ghost)] text-sm text-[var(--ink)] shadow-sm transition hover:bg-[var(--accent-soft)]/40'
export const tableHeadClass = 'text-left text-xs uppercase tracking-[0.2em] text-[var(--muted)]'
export const tableMetaClass = 'text-xs text-[var(--muted)]'
export const tableValueClass = 'font-semibold text-[var(--ink)]'
export const tableActionSelectClass =
  'min-h-11 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--ink)] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1'
export const formCardClass = 'rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-5'
export const textareaClass =
  'min-h-[130px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1'
export const destructiveButtonClass =
  'btn-stable inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-rose-300/70 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-500 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
export const fieldErrorClass = 'mt-2 text-sm font-medium text-rose-600'
export const fieldHintClass = 'mt-2 text-sm text-[var(--muted)]'

type FieldErrorMessageProps = {
  children: ReactNode
  id?: string
  className?: string
}

export const FieldErrorMessage = ({ children, id, className }: FieldErrorMessageProps) => (
  <p
    aria-live="polite"
    className={cx(fieldErrorClass, className)}
    id={id}
    role="status"
  >
    {children}
  </p>
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode
}

export const GhostButton = ({
  className,
  children,
  icon,
  ...props
}: ButtonProps) => (
  <button className={cx(ghostButtonClass, className)} {...props}>
    {icon}
    {children}
  </button>
)

export const PrimaryButton = ({
  className,
  children,
  icon,
  ...props
}: ButtonProps) => (
  <button className={cx(primaryButtonClass, className)} {...props}>
    {icon}
    {children}
  </button>
)

export const DestructiveButton = ({
  className,
  children,
  icon,
  ...props
}: ButtonProps) => (
  <button className={cx(destructiveButtonClass, className)} {...props}>
    {icon}
    {children}
  </button>
)

type SearchInputProps = {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  className?: string
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onChange' | 'placeholder' | 'type'>
}

export const SearchInput = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  className,
  inputProps,
}: SearchInputProps) => (
  <label className={cx('relative block', className)} htmlFor={id}>
    <span className="sr-only">{label}</span>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      id={id}
      className={cx(inputClass, 'w-full pl-10 pr-4')}
      placeholder={placeholder}
      type="search"
      value={value}
      onChange={onChange}
      {...inputProps}
    />
  </label>
)

type PagePanelProps = HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'div' | 'article'
}

export const PagePanel = ({
  as: Tag = 'section',
  className,
  children,
  ...props
}: PagePanelProps) => (
  <Tag className={cx(panelClass, 'animate-card-enter', className)} {...props}>
    {children}
  </Tag>
)

type StatCardProps = {
  label: string
  value: ReactNode
  hint?: string
  icon?: LucideIcon
  tone?: 'neutral' | 'success' | 'warning' | 'info'
}

const statToneClass: Record<NonNullable<StatCardProps['tone']>, string> = {
  neutral: 'text-slate-400',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
}

export const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
}: StatCardProps) => (
  <div className={softCardClass}>
    <div className="flex items-center justify-between">
      <span className={labelClass}>{label}</span>
      {Icon && <Icon className={cx('h-4 w-4', statToneClass[tone])} />}
    </div>
    <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">{value}</p>
    {hint && <p className={tableMetaClass}>{hint}</p>}
  </div>
)

export type BadgeTone = 'success' | 'warning' | 'info' | 'neutral' | 'danger'

type StatusBadgeProps = {
  tone: BadgeTone
  children: ReactNode
  icon?: ReactNode
  className?: string
}

const badgeToneClass: Record<BadgeTone, string> = {
  success: 'bg-emerald-500/15 text-emerald-700',
  warning: 'bg-amber-500/15 text-amber-700',
  info: 'bg-[var(--accent-cool-soft)] text-[var(--accent-cool)]',
  neutral: 'bg-slate-200/70 text-[var(--ink)]',
  danger: 'bg-rose-500/15 text-rose-700',
}

export const StatusBadge = ({ tone, children, icon, className }: StatusBadgeProps) => (
  <span
    aria-live="polite"
    className={cx(
      'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
      badgeToneClass[tone],
      className,
    )}
    role="status"
  >
    {icon}
    {children}
  </span>
)

type EmptyStateProps = {
  title: string
  message: string
  icon?: LucideIcon
  action?: ReactNode
}

export const EmptyState = ({ title, message, icon: Icon, action }: EmptyStateProps) => (
  <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] px-6 py-10 text-center text-sm text-[var(--muted)]">
    {Icon ? <Icon className="mx-auto h-10 w-10 text-[var(--muted)]" /> : null}
    <p className="mt-4 text-base font-semibold text-[var(--ink)]">{title}</p>
    <p className="mt-2 text-xs text-[var(--muted)]">{message}</p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
)

type ErrorStateProps = {
  title: string
  message: string
  onRetry?: () => void
  retryLabel?: string
}

export const ErrorState = ({
  title,
  message,
  onRetry,
  retryLabel = 'Thu lai',
}: ErrorStateProps) => (
  <div
    className="rounded-3xl border border-rose-200 bg-rose-50/80 px-6 py-10 text-center"
    role="alert"
  >
      <p className="text-base font-semibold text-rose-700">{title}</p>
      <p className="mt-2 text-sm text-rose-600">{message}</p>
    {onRetry ? (
      <button
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
        onClick={onRetry}
        type="button"
      >
        {retryLabel}
      </button>
    ) : null}
  </div>
)

type LoadingRowsProps = {
  rows?: number
}

export const LoadingRows = ({ rows = 4 }: LoadingRowsProps) => (
  <div className="grid gap-3" aria-busy="true" aria-live="polite" role="status">
    <span className="sr-only">Loading content</span>
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={`skeleton-row-${index}`}
        className="h-16 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-700/40"
      />
    ))}
  </div>
)

type PaginationNavProps = {
  page: number
  totalPages: number
  totalItems?: number
  pageSize?: number
  onPageChange: (page: number) => void
  previousLabel: string
  nextLabel: string
}

export const PaginationNav = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  previousLabel,
  nextLabel,
}: PaginationNavProps) => {
  const hasPages = totalPages > 1
  const safeTotalPages = Math.max(totalPages, 1)
  const isEmpty = totalItems === 0
  const start =
    totalItems != null && pageSize != null ? (isEmpty ? 0 : page * pageSize + 1) : null
  const end =
    totalItems != null && pageSize != null
      ? (isEmpty ? 0 : Math.min(totalItems, (page + 1) * pageSize))
      : null

  if (!hasPages && totalItems == null) {
    return null
  }

  return (
    <div className="mt-6 flex flex-col gap-3 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
      <span>
        {totalItems === 0
          ? '0 / 0'
          : totalItems != null && start != null && end != null
          ? `${start}-${end} / ${totalItems}`
          : `${page + 1} / ${safeTotalPages}`}
      </span>
      {hasPages ? (
        <ReactPaginate
          breakLabel="..."
          nextLabel={nextLabel}
          onPageChange={(selectedItem) => onPageChange(selectedItem.selected)}
          pageRangeDisplayed={2}
          marginPagesDisplayed={1}
          pageCount={totalPages}
          previousLabel={previousLabel}
          forcePage={page}
          containerClassName="flex flex-wrap items-center gap-2 text-sm"
          pageLinkClassName="flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          previousLinkClassName="flex min-h-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          nextLinkClassName="flex min-h-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          breakLinkClassName="flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--muted)]"
          activeLinkClassName="border-[var(--accent)] bg-[var(--accent)] text-white"
          disabledLinkClassName="cursor-not-allowed border-[var(--border)] text-[var(--muted)] opacity-50"
        />
      ) : null}
    </div>
  )
}
