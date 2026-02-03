import { Skeleton } from './skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

interface TableSkeletonProps {
  /**
   * Number of rows to display
   * @default 5
   */
  rows?: number;
  /**
   * Number of columns to display
   * @default 6
   */
  columns?: number;
  /**
   * Show header skeleton
   * @default true
   */
  showHeader?: boolean;
}

/**
 * Table loading skeleton component
 * Displays a skeleton table while data is loading
 *
 * @example
 * {loading ? (
 *   <TableSkeleton rows={10} columns={5} />
 * ) : (
 *   <Table>{/* actual table content *\/}</Table>
 * )}
 */
export function TableSkeleton({
  rows = 5,
  columns = 6,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div className="w-full">
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableHead key={`header-${index}`}>
                  <Skeleton className="h-4 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={`row-${rowIndex}`}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Compact card skeleton for dashboard stats
 */
export function StatsCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

/**
 * List skeleton for general content
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default TableSkeleton;
