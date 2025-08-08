'use client';

import Error from '@/components/ui/Error';

export default function ProductDetailError({ reset }: { reset: () => void }) {
    return (
        <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
            <Error 
                title="Lỗi tải chi tiết sản phẩm"
                message="Không thể tải thông tin sản phẩm. Sản phẩm có thể không tồn tại hoặc đã bị xóa."
                onRetry={reset}
            />
        </div>
    );
}