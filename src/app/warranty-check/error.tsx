'use client';

import Error from '@/components/ui/Error';

export default function WarrantyCheckError({ reset }: { reset: () => void }) {
    return (
        <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
            <Error 
                title="Lỗi tải kiểm tra bảo hành"
                message="Không thể tải trang kiểm tra bảo hành. Vui lòng thử lại sau."
                onRetry={reset}
            />
        </div>
    );
}