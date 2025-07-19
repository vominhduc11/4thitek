'use client';

import { Pagination } from '@/components/ui';

interface BlogPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    currentItemsCount: number;
    onPageChange: (page: number) => void;
}

const BlogPagination = ({ currentPage, totalPages, totalItems, onPageChange }: BlogPaginationProps) => {
    return (
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={onPageChange}
            showCount={false} // Blogs không hiển thị count
            countLabel="bài viết"
        />
    );
};

export default BlogPagination;
