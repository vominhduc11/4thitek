'use client';

import { Pagination } from '@/components/ui';

interface ProductsPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    currentItemsCount: number;
    onPageChange: (page: number) => void;
}

export default function ProductsPagination({
    currentPage,
    totalPages,
    totalItems,
    onPageChange
}: ProductsPaginationProps) {
    return (
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={onPageChange}
            showCount={false} // Bỏ count display giống blogs
            countLabel="sản phẩm"
        />
    );
}
