import { ArrowDown, ArrowUp, ArrowUpDown, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  EmptyState,
  ErrorState,
  LoadingRows,
  tableCardClass,
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
  tableScrollerClass,
} from "./ui-kit";

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export type AdminTableAlign = "left" | "center" | "right";

export type AdminTableColumn<Row> = {
  /** Stable column id; also used as the sort key. */
  key: string;
  label: ReactNode;
  align?: AdminTableAlign;
  sortable?: boolean;
  /** Extra classes for the body cell (`<td>`). */
  className?: string;
  /** Extra classes for the header cell (`<th>`). */
  headClassName?: string;
  /** Tailwind width class for the skeleton bar, e.g. "w-24". */
  skeletonWidth?: string;
  /** Cell renderer; defaults to `String((row as any)[key])`. */
  render?: (row: Row) => ReactNode;
  /** Hide this column from the mobile card layout. */
  hideOnMobile?: boolean;
};

export type AdminTableSort = {
  key: string;
  direction: "asc" | "desc";
};

export type AdminTableSelection<Id> = {
  selectedIds: ReadonlySet<Id>;
  onToggle: (id: Id) => void;
  onToggleAll: (ids: Id[]) => void;
  ariaLabel?: string;
};

export type AdminTableProps<Row extends { id: Id }, Id extends string | number = Row["id"]> = {
  columns: AdminTableColumn<Row>[];
  rows: Row[];
  /** First-load skeleton. Subsequent background reloads should use `isFetching`. */
  isLoading?: boolean;
  isFetching?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRowClick?: (row: Row) => void;
  rowClassName?: (row: Row) => string | undefined;
  sort?: AdminTableSort | null;
  onSortChange?: (sort: AdminTableSort) => void;
  selection?: AdminTableSelection<Id>;
  /** Per-row action rendered in a trailing column (desktop) / card footer (mobile). */
  rowActions?: (row: Row) => ReactNode;
  minWidthClass?: string;
  skeletonRows?: number;
  emptyIcon?: LucideIcon;
  emptyTitle: string;
  emptyMessage: string;
  errorTitle?: string;
  errorMessage?: string;
  /** Accessible name for the table. */
  caption?: string;
};

const alignClass: Record<AdminTableAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const cellValue = <Row,>(column: AdminTableColumn<Row>, row: Row): ReactNode => {
  if (column.render) {
    return column.render(row);
  }
  const raw = (row as Record<string, unknown>)[column.key];
  return raw === null || raw === undefined ? "" : String(raw);
};

export function AdminTable<Row extends { id: Id }, Id extends string | number = Row["id"]>({
  columns,
  rows,
  isLoading = false,
  isFetching = false,
  error = null,
  onRetry,
  onRowClick,
  rowClassName,
  sort = null,
  onSortChange,
  selection,
  rowActions,
  minWidthClass = "min-w-[64rem]",
  skeletonRows = 6,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  errorTitle,
  errorMessage,
  caption,
}: AdminTableProps<Row, Id>) {
  const { t } = useLanguage();

  if (error) {
    return (
      <ErrorState
        title={errorTitle ?? t("Không tải được dữ liệu")}
        message={errorMessage ?? error}
        onRetry={onRetry}
      />
    );
  }

  if (isLoading && rows.length === 0) {
    return <LoadingRows rows={skeletonRows} />;
  }

  if (rows.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />;
  }

  const allIds = rows.map((row) => row.id);
  const allSelected =
    selection !== undefined && allIds.length > 0 && allIds.every((id) => selection.selectedIds.has(id));
  const someSelected =
    selection !== undefined && !allSelected && allIds.some((id) => selection.selectedIds.has(id));

  const handleSort = (column: AdminTableColumn<Row>) => {
    if (!column.sortable || !onSortChange) {
      return;
    }
    const nextDirection: AdminTableSort["direction"] =
      sort?.key === column.key && sort.direction === "asc" ? "desc" : "asc";
    onSortChange({ key: column.key, direction: nextDirection });
  };

  const renderSortIcon = (column: AdminTableColumn<Row>) => {
    if (!column.sortable) {
      return null;
    }
    if (sort?.key !== column.key) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />;
    }
    return sort.direction === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
    );
  };

  return (
    <div aria-busy={isFetching || undefined}>
      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <article
            key={String(row.id)}
            className={cx(tableCardClass, onRowClick && "cursor-pointer", rowClassName?.(row))}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            <div className="grid gap-2 text-sm">
              {columns
                .filter((column) => !column.hideOnMobile)
                .map((column) => (
                  <div key={column.key} className="flex justify-between gap-3">
                    <span className={tableMetaClass}>{column.label}</span>
                    <span className="text-right text-[var(--ink)]">{cellValue(column, row)}</span>
                  </div>
                ))}
            </div>
            {rowActions ? <div className="mt-3">{rowActions(row)}</div> : null}
          </article>
        ))}
      </div>

      {/* Desktop table */}
      <div className={cx(tableScrollerClass, "hidden md:block")}>
        <table className={cx(minWidthClass, "w-full border-separate border-spacing-y-2")}>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className={tableHeadClass}>
              {selection ? (
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label={selection.ariaLabel ?? t("Chọn tất cả")}
                    checked={allSelected}
                    ref={(node) => {
                      if (node) {
                        node.indeterminate = someSelected;
                      }
                    }}
                    onChange={() => selection.onToggleAll(allIds)}
                  />
                </th>
              ) : null}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cx("px-3 py-2 font-semibold", alignClass[column.align ?? "left"], column.headClassName)}
                  aria-sort={
                    sort?.key === column.key
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : column.sortable
                        ? "none"
                        : undefined
                  }
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column)}
                      className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.2em] text-[var(--muted)] transition hover:text-[var(--ink)]"
                    >
                      {column.label}
                      {renderSortIcon(column)}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              {rowActions ? <th className="px-3 py-2" /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = selection?.selectedIds.has(row.id) ?? false;
              return (
                <tr
                  key={String(row.id)}
                  className={cx(tableRowClass, isSelected && "ring-1 ring-[var(--accent)]", rowClassName?.(row))}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {selection ? (
                    <td className="rounded-l-2xl px-3 py-3" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={t("Chọn dòng")}
                        checked={isSelected}
                        onChange={() => selection.onToggle(row.id)}
                      />
                    </td>
                  ) : null}
                  {columns.map((column, columnIndex) => {
                    const isFirst = columnIndex === 0 && !selection;
                    const isLast = columnIndex === columns.length - 1 && !rowActions;
                    return (
                      <td
                        key={column.key}
                        className={cx(
                          "px-3 py-3",
                          alignClass[column.align ?? "left"],
                          isFirst && "rounded-l-2xl",
                          isLast && "rounded-r-2xl",
                          column.className,
                        )}
                      >
                        {cellValue(column, row)}
                      </td>
                    );
                  })}
                  {rowActions ? (
                    <td className="rounded-r-2xl px-3 py-3" onClick={(event) => event.stopPropagation()}>
                      {rowActions(row)}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
