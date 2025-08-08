'use client';

import Error from '@/components/ui/Error';

export default function BlogDetailError({ reset }: { reset: () => void }) {
    return (
        <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
            <Error 
                title="Lỗi tải bài viết"
                message="Không thể tải nội dung bài viết. Bài viết có thể không tồn tại hoặc đã bị xóa."
                onRetry={reset}
            />
        </div>
    );
}