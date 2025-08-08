'use client';

import Loading from '@/components/ui/Loading';

export default function ProductDetailLoading() {
    return (
        <Loading 
            title="Đang tải chi tiết sản phẩm"
            message="Đang tải thông tin sản phẩm..."
        />
    );
}