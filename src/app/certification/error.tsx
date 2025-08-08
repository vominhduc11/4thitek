'use client';

import Error from '@/components/ui/Error';

export default function CertificationError({ reset }: { reset: () => void }) {
    return (
        <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
            <Error 
                title="Lỗi tải trang chứng nhận"
                message="Không thể tải thông tin chứng nhận. Vui lòng thử lại sau."
                onRetry={reset}
            />
        </div>
    );
}