'use client';

import Error from '@/components/ui/Error';

export default function ContactError({ reset }: { reset: () => void }) {
    return (
        <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
            <Error 
                title="Lỗi tải trang liên hệ"
                message="Không thể tải thông tin liên hệ. Vui lòng thử lại sau."
                onRetry={reset}
            />
        </div>
    );
}