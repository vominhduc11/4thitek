'use client';

import Loading from '@/components/ui/Loading';

export default function BlogsLoading() {
    return (
        <Loading 
            title="Đang tải blogs"
            message="Đang tải danh sách bài viết..."
        />
    );
}