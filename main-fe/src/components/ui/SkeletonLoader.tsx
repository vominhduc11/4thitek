'use client';

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

// Card Skeleton for Product Cards
export const CardSkeleton = ({
  width = '100%',
  height = 350,
  speed = 2,
  backgroundColor = '#f3f4f6',
  foregroundColor = '#e5e7eb',
  className = '',
}: SkeletonLoaderProps) => (
  <div className={className}>
    <ContentLoader
      speed={speed}
      width={width}
      height={height}
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}
      className="dark:opacity-20"
    >
      {/* Image */}
      <rect x="0" y="0" rx="8" ry="8" width="100%" height="200" />
      {/* Title */}
      <rect x="16" y="220" rx="4" ry="4" width="80%" height="20" />
      {/* Description */}
      <rect x="16" y="250" rx="4" ry="4" width="90%" height="14" />
      <rect x="16" y="270" rx="4" ry="4" width="70%" height="14" />
      {/* Price */}
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
  backgroundColor = '#f3f4f6',
  foregroundColor = '#e5e7eb',
  className = '',
}: SkeletonLoaderProps) => (
  <div className={className}>
    <ContentLoader
      speed={speed}
      width={width}
      height={height}
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}
      className="dark:opacity-20"
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
  backgroundColor = '#f3f4f6',
  foregroundColor = '#e5e7eb',
  className = '',
}: SkeletonLoaderProps) => (
  <div className={className}>
    <ContentLoader
      speed={speed}
      width={width}
      height={height}
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}
      className="dark:opacity-20"
    >
      <rect x="20" y="20" rx="4" ry="4" width="15%" height="20" />
      <rect x="20%" y="20" rx="4" ry="4" width="25%" height="20" />
      <rect x="50%" y="20" rx="4" ry="4" width="20%" height="20" />
      <rect x="75%" y="20" rx="4" ry="4" width="20%" height="20" />
    </ContentLoader>
  </div>
);

// Profile Card Skeleton
export const ProfileSkeleton = ({
  width = '100%',
  height = 300,
  speed = 2,
  backgroundColor = '#f3f4f6',
  foregroundColor = '#e5e7eb',
  className = '',
}: SkeletonLoaderProps) => (
  <div className={className}>
    <ContentLoader
      speed={speed}
      width={width}
      height={height}
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}
      className="dark:opacity-20"
    >
      {/* Cover Image */}
      <rect x="0" y="0" rx="8" ry="8" width="100%" height="120" />
      {/* Avatar */}
      <circle cx="50%" cy="140" r="50" />
      {/* Name */}
      <rect x="30%" y="210" rx="4" ry="4" width="40%" height="20" />
      {/* Bio */}
      <rect x="20%" y="245" rx="4" ry="4" width="60%" height="14" />
      <rect x="25%" y="265" rx="4" ry="4" width="50%" height="14" />
    </ContentLoader>
  </div>
);

// Blog Post Skeleton
export const BlogPostSkeleton = ({
  width = '100%',
  height = 400,
  speed = 2,
  backgroundColor = '#f3f4f6',
  foregroundColor = '#e5e7eb',
  className = '',
}: SkeletonLoaderProps) => (
  <div className={className}>
    <ContentLoader
      speed={speed}
      width={width}
      height={height}
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}
      className="dark:opacity-20"
    >
      {/* Featured Image */}
      <rect x="0" y="0" rx="8" ry="8" width="100%" height="200" />
      {/* Title */}
      <rect x="0" y="220" rx="4" ry="4" width="90%" height="24" />
      {/* Meta */}
      <rect x="0" y="255" rx="4" ry="4" width="40%" height="14" />
      {/* Content */}
      <rect x="0" y="285" rx="4" ry="4" width="100%" height="12" />
      <rect x="0" y="305" rx="4" ry="4" width="95%" height="12" />
      <rect x="0" y="325" rx="4" ry="4" width="98%" height="12" />
      <rect x="0" y="345" rx="4" ry="4" width="85%" height="12" />
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
  const gridClass = `grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-${Math.min(columns, 3)} lg:grid-cols-${columns}`;

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
