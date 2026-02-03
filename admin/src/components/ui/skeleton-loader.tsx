import React from 'react';
import ContentLoader from 'react-content-loader';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  speed?: number;
  backgroundColor?: string;
  foregroundColor?: string;
  className?: string;
}

// Card Skeleton for Product/Item Cards
export const CardSkeleton = ({
  width = '100%',
  height = 350,
  speed = 2,
  backgroundColor = 'hsl(var(--muted))',
  foregroundColor = 'hsl(var(--muted-foreground) / 0.1)',
  className = '',
}: SkeletonLoaderProps) => (
  <div className={className}>
    <ContentLoader
      speed={speed}
      width={width}
      height={height}
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}
    >
      {/* Image */}
      <rect x="0" y="0" rx="8" ry="8" width="100%" height="200" />
      {/* Title */}
      <rect x="16" y="220" rx="4" ry="4" width="80%" height="20" />
      {/* Description */}
      <rect x="16" y="250" rx="4" ry="4" width="90%" height="14" />
      <rect x="16" y="270" rx="4" ry="4" width="70%" height="14" />
      {/* Price/Info */}
      <rect x="16" y="300" rx="4" ry="4" width="40%" height="24" />
      {/* Button */}
      <rect x="16" y="340" rx="6" ry="6" width="100" height="36" />
    </ContentLoader>
  </div>
);

// List Item Skeleton
export const ListSkeleton = ({
  width = '100%',
  height = 80,
  speed = 2,
  backgroundColor = 'hsl(var(--muted))',
  foregroundColor = 'hsl(var(--muted-foreground) / 0.1)',
  className = '',
}: SkeletonLoaderProps) => (
  <div className={className}>
    <ContentLoader
      speed={speed}
      width={width}
      height={height}
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}
    >
      {/* Avatar */}
      <circle cx="40" cy="40" r="30" />
      {/* Title */}
      <rect x="85" y="20" rx="4" ry="4" width="300" height="15" />
      {/* Description */}
      <rect x="85" y="45" rx="4" ry="4" width="200" height="12" />
    </ContentLoader>
  </div>
);

// Table Row Skeleton
export const TableRowSkeleton = ({
  width = '100%',
  height = 60,
  speed = 2,
  backgroundColor = 'hsl(var(--muted))',
  foregroundColor = 'hsl(var(--muted-foreground) / 0.1)',
  className = '',
}: SkeletonLoaderProps) => (
  <div className={className}>
    <ContentLoader
      speed={speed}
      width={width}
      height={height}
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}
    >
      <rect x="20" y="20" rx="4" ry="4" width="15%" height="20" />
      <rect x="20%" y="20" rx="4" ry="4" width="25%" height="20" />
      <rect x="50%" y="20" rx="4" ry="4" width="20%" height="20" />
      <rect x="75%" y="20" rx="4" ry="4" width="20%" height="20" />
    </ContentLoader>
  </div>
);

// Form Skeleton
export const FormSkeleton = ({
  width = '100%',
  height = 400,
  speed = 2,
  backgroundColor = 'hsl(var(--muted))',
  foregroundColor = 'hsl(var(--muted-foreground) / 0.1)',
  className = '',
}: SkeletonLoaderProps) => (
  <div className={className}>
    <ContentLoader
      speed={speed}
      width={width}
      height={height}
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}
    >
      {/* Form Title */}
      <rect x="0" y="0" rx="4" ry="4" width="60%" height="24" />
      {/* Field 1 Label */}
      <rect x="0" y="50" rx="4" ry="4" width="30%" height="16" />
      {/* Field 1 Input */}
      <rect x="0" y="75" rx="4" ry="4" width="100%" height="40" />
      {/* Field 2 Label */}
      <rect x="0" y="135" rx="4" ry="4" width="35%" height="16" />
      {/* Field 2 Input */}
      <rect x="0" y="160" rx="4" ry="4" width="100%" height="40" />
      {/* Field 3 Label */}
      <rect x="0" y="220" rx="4" ry="4" width="25%" height="16" />
      {/* Field 3 Input */}
      <rect x="0" y="245" rx="4" ry="4" width="100%" height="80" />
      {/* Buttons */}
      <rect x="0" y="350" rx="6" ry="6" width="100" height="40" />
      <rect x="120" y="350" rx="6" ry="6" width="100" height="40" />
    </ContentLoader>
  </div>
);

// Dashboard Card Skeleton
export const DashboardCardSkeleton = ({
  width = '100%',
  height = 150,
  speed = 2,
  backgroundColor = 'hsl(var(--muted))',
  foregroundColor = 'hsl(var(--muted-foreground) / 0.1)',
  className = '',
}: SkeletonLoaderProps) => (
  <div className={className}>
    <ContentLoader
      speed={speed}
      width={width}
      height={height}
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}
    >
      {/* Icon */}
      <circle cx="40" cy="40" r="25" />
      {/* Title */}
      <rect x="0" y="80" rx="4" ry="4" width="60%" height="16" />
      {/* Value */}
      <rect x="0" y="105" rx="4" ry="4" width="80%" height="28" />
    </ContentLoader>
  </div>
);

// Grid Skeleton - Multiple Cards
interface GridSkeletonProps extends SkeletonLoaderProps {
  count?: number;
  columns?: number;
}

export const GridSkeleton = ({
  count = 8,
  columns = 4,
  ...props
}: GridSkeletonProps) => {
  const gridClass = `grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(columns, 4)}`;

  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} {...props} />
      ))}
    </div>
  );
};

// Table Skeleton - Multiple Rows
export const TableSkeleton = ({
  count = 5,
  ...props
}: GridSkeletonProps) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, index) => (
      <TableRowSkeleton key={index} {...props} />
    ))}
  </div>
);
