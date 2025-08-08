'use client';

import Error from '@/components/ui/Error';

export default function BlogsError({ reset }: { reset: () => void }) {
    return (
        <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
            <Error 
                title="Lỗi tải blogs"
                message="Không thể tải danh sách bài viết. Vui lòng thử lại sau."
                onRetry={reset}
            />
        </div>
    );
}