import { AlertTriangle, Search, type LucideIcon } from "lucide-react";
import ReactPaginate from "react-paginate";
import type {
  ButtonHTMLAttributes,
  ChangeEventHandler,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const panelClass =
  "brand-admin-panel rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_18px_42px_rgba(11,24,38,0.08)]";

export const softCardClass =
  "rounded-[20px] border border-[var(--border)] bg-[var(--surface-ghost)] p-4 shadow-[0_12px_28px_rgba(11,24,38,0.05)]";

export const ghostButtonClass =
  "btn-stable inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--ink)] hover:shadow-[0_12px_26px_rgba(11,24,38,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export const primaryButtonClass =
  "btn-stable inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--brand-gradient-start),var(--brand-gradient-end))] px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(0,113,188,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export const inputClass =
  "h-11 rounded-[18px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--ink)] shadow-sm transition placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1";
export const selectClass = inputClass;

export const cardTitleClass = "text-lg font-semibold tracking-[-0.01em] text-[var(--ink)]";
export const bodyTextClass = "text-sm text-[var(--muted)]";
export const labelClass =
  "text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]";
export const tableCardClass =
  "rounded-[24px] border border-[var(--border)] bg-[var(--surface-ghost)] p-4 shadow-[0_16px_34px_rgba(11,24,38,0.06)] backdrop-blur";
export const tableRowClass =
  "cursor-pointer rounded-2xl bg-[var(--surface-ghost)] text-sm text-[var(--ink)] shadow-sm transition hover:border-[var(--brand-border)] hover:bg-[var(--accent-soft)]/70";
export const tableHeadClass =
  "text-left text-xs uppercase tracking-[0.2em] text-[var(--muted)]";
export const tableMetaClass = "text-xs text-[var(--muted)]";
export const tableValueClass = "font-semibold text-[var(--ink)]";
export const tableActionSelectClass =
  "min-h-11 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--ink)] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1";
export const formCardClass =
  "rounded-[24px] border border-[var(--border)] bg-[var(--surface-muted)] p-5";
export const textareaClass =
  "min-h-[130px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1";
export const destructiveButtonClass =
  "btn-stable inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--destructive-border)] bg-[var(--destructive-soft)] px-4 py-2 text-sm font-semibold text-[var(--destructive-text)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--destructive)] hover:bg-[var(--destructive-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--destructive)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
export const fieldErrorClass = "mt-2 text-sm font-medium text-[var(--error-text)]";
export const fieldHintClass = "mt-2 text-sm text-[var(--muted)]";

type FieldErrorMessageProps = {
  children?: ReactNode;
  message?: string;
  id?: string;
  className?: string;
};

export const FieldErrorMessage = ({
  children,
  message,
  id,
  className,
}: FieldErrorMessageProps) => {
  const content = message ?? children;
  if (!content) return null;

  return (
    <p className={cx(fieldErrorClass, className)} id={id} role="alert">
      {content}
    </p>
  );
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
};

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
);

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
);

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
);

type SearchInputProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  className?: string;
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "value" | "onChange" | "placeholder" | "type"
  >;
};

export const SearchInput = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  className,
  inputProps,
}: SearchInputProps) => (
  <label className={cx("relative block", className)} htmlFor={id}>
    <span className="sr-only">{label}</span>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
    <input
      id={id}
      className={cx(inputClass, "w-full pl-10 pr-4")}
      placeholder={placeholder}
      type="search"
      value={value}
      onChange={onChange}
      {...inputProps}
    />
  </label>
);

type PagePanelProps = HTMLAttributes<HTMLElement> & {
  as?: "section" | "div" | "article";
};

export const PagePanel = ({
  as: Tag = "section",
  className,
  children,
  ...props
}: PagePanelProps) => (
  <Tag className={cx(panelClass, "animate-card-enter", className)} {...props}>
    {children}
  </Tag>
);

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export const PageHeader = ({
  title,
  subtitle,
  description,
  actions,
  className,
}: PageHeaderProps) => {
  const supportingText = subtitle ?? description;

  return (
    <div
      className={cx(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[1.35rem] font-semibold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
          {title}
        </h1>
        {supportingText ? (
          <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>
            {supportingText}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
};

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: "neutral" | "success" | "warning" | "info";
};

const statToneClass: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neutral: "text-[var(--muted)]",
  success: "text-[var(--tone-success-text)]",
  warning: "text-[var(--tone-warning-text)]",
  info: "text-[var(--accent-cool)]",
};

export const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: StatCardProps) => (
  <div className={`${softCardClass} animate-[card-enter_0.6s_ease_both]`}>
    <div className="flex items-center justify-between">
      <span className={labelClass}>{label}</span>
      {Icon && <Icon className={cx("h-4 w-4", statToneClass[tone])} />}
    </div>
    <p className="mt-2 text-[1.65rem] font-semibold tracking-[-0.03em] text-[var(--ink)]">{value}</p>
    {hint && <p className={tableMetaClass}>{hint}</p>}
  </div>
);

export type BadgeTone = "success" | "warning" | "info" | "neutral" | "danger";

type StatusBadgeProps = {
  tone: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
};

const badgeToneClass: Record<BadgeTone, string> = {
  success: "bg-[var(--tone-success-bg)] text-[var(--tone-success-text)]",
  warning: "bg-[var(--tone-warning-bg)] text-[var(--tone-warning-text)]",
  info: "bg-[var(--accent-cool-soft)] text-[var(--accent-cool)]",
  neutral: "bg-[var(--surface-muted)] text-[var(--ink)]",
  danger: "bg-[var(--tone-danger-bg)] text-[var(--tone-danger-text)]",
};

export const StatusBadge = ({
  tone,
  children,
  icon,
  className,
}: StatusBadgeProps) => (
  <span
    aria-live="polite"
    className={cx(
      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
      badgeToneClass[tone],
      className,
    )}
    role="status"
  >
    {icon}
    {children}
  </span>
);

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: LucideIcon;
  action?: ReactNode;
};

export const EmptyState = ({
  title,
  message,
  icon: Icon,
  action,
}: EmptyStateProps) => (
  <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-muted)] px-6 py-10 text-center text-sm text-[var(--muted)]">
    {Icon ? <Icon className="mx-auto h-10 w-10 text-[var(--accent)]" /> : null}
    <p className="mt-4 text-base font-semibold text-[var(--ink)]">{title}</p>
    <p className="mt-2 text-xs text-[var(--muted)]">{message}</p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: LucideIcon;
  className?: string;
};

export const ErrorState = ({
  title,
  message,
  onRetry,
  retryLabel = "Thử lại",
  icon: Icon = AlertTriangle,
  className,
}: ErrorStateProps) => (
  <div
    aria-live="assertive"
    className={cx(
      "rounded-[20px] border border-[var(--error-border)] bg-[var(--error-bg)] px-6 py-10 text-center",
      className,
    )}
    role="alert"
  >
    <Icon aria-hidden="true" className="mx-auto h-10 w-10 text-[var(--destructive)]" />
    <p className="mt-4 text-base font-semibold text-[var(--error-text)]">{title}</p>
    <p className="mt-2 text-sm text-[var(--error-text)]">{message}</p>
    {onRetry ? (
      <button className="mt-4 inline-flex items-center justify-center rounded-full bg-[var(--destructive)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--destructive)] focus-visible:ring-offset-2" onClick={onRetry} type="button">
        {retryLabel}
      </button>
    ) : null}
  </div>
);

type LoadingRowsProps = {
  rows?: number;
};

export const LoadingRows = ({ rows = 4 }: LoadingRowsProps) => (
  <div className="grid gap-3" aria-busy="true" aria-live="polite" role="status">
    <span className="sr-only">Loading content</span>
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={`skeleton-row-${index}`}
        className="h-16 animate-pulse rounded-[18px] bg-[linear-gradient(90deg,rgba(41,171,226,0.08),rgba(255,255,255,0.72),rgba(41,171,226,0.08))] dark:bg-[linear-gradient(90deg,rgba(41,171,226,0.12),rgba(18,34,48,0.88),rgba(41,171,226,0.12))]"
      />
    ))}
  </div>
);

type PaginationNavProps = {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
};

export const PaginationNav = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  previousLabel,
  nextLabel,
}: PaginationNavProps) => {
  const hasPages = totalPages > 1;
  const safeTotalPages = Math.max(totalPages, 1);
  const isEmpty = totalItems === 0;
  const start =
    totalItems != null && pageSize != null
      ? isEmpty
        ? 0
        : page * pageSize + 1
      : null;
  const end =
    totalItems != null && pageSize != null
      ? isEmpty
        ? 0
        : Math.min(totalItems, (page + 1) * pageSize)
      : null;

  if (!hasPages && totalItems == null) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col gap-3 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
      <span>
        {totalItems === 0
          ? "0 / 0"
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
          pageLinkClassName="flex min-h-11 min-w-11 items-center justify-center rounded-[18px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          previousLinkClassName="flex min-h-11 items-center justify-center rounded-[18px] border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          nextLinkClassName="flex min-h-11 items-center justify-center rounded-[18px] border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          breakLinkClassName="flex min-h-11 min-w-11 items-center justify-center rounded-[18px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-[var(--muted)]"
          activeLinkClassName="border-[var(--accent)] bg-[var(--accent)] text-white"
          disabledLinkClassName="cursor-not-allowed border-[var(--border)] text-[var(--muted)] opacity-50"
        />
      ) : null}
    </div>
  );
};
