'use client';

import { BlogPostSkeleton } from '@/components/ui/SkeletonLoader';

interface BlogGridSkeletonProps {
    count?: number;
}

export default function BlogGridSkeleton({ count = 9 }: BlogGridSkeletonProps) {
    return (
        <div className="ml-0 sm:ml-16 md:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6 lg:gap-8 2xl:gap-10 3xl:gap-12">
                {Array.from({ length: count }).map((_, index) => (
                    <div key={index} className="rounded-xl overflow-hidden border border-white/10">
                        <BlogPostSkeleton
                            backgroundColor="#1e293b"
                            foregroundColor="#334155"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
