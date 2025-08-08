'use client';

import Loading from '@/components/ui/Loading';

export default function BlogDetailLoading() {
    return (
        <Loading 
            title="Đang tải bài viết"
            message="Đang tải nội dung bài viết..."
        />
    );
}