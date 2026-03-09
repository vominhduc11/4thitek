'use client';

import { Pagination } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';

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
    const { t } = useLanguage();

    return (
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={onPageChange}
            showCount={false} // Bỏ count display giống blogs
            countLabel={t('products.list.countLabel')}
        />
    );
}
