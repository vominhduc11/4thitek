'use client';

import Loading from '@/components/ui/Loading';

export default function ProductsLoading() {
    return (
        <Loading 
            title="Đang tải sản phẩm"
            message="Đang tải danh sách sản phẩm..."
        />
    );
}