'use client';

import Error from '@/components/ui/Error';

export default function AboutError({ reset }: { reset: () => void }) {
    return (
        <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
            <Error 
                title="Lỗi tải trang giới thiệu"
                message="Không thể tải thông tin giới thiệu công ty. Vui lòng thử lại sau."
                onRetry={reset}
            />
        </div>
    );
}