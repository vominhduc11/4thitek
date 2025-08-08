'use client';

import { Pagination } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';

interface BlogPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    currentItemsCount: number;
    onPageChange: (page: number) => void;
}

const BlogPagination = ({ currentPage, totalPages, totalItems, onPageChange }: BlogPaginationProps) => {
    const { t } = useLanguage();

    return (
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={onPageChange}
            showCount={false} // Blogs không hiển thị count
            countLabel={t('blog.list.articles')}
        />
    );
};

export default BlogPagination;
