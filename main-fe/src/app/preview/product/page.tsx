'use client';

import { useEffect, useState } from 'react';
import ProductPageClient from '@/app/products/[id]/ProductPageClient';
import { PreviewGuard } from '@/components/preview/PreviewGuard';

// Origin của app admin — chỉ nhận postMessage từ đây (chống frame lạ chèn dữ liệu).
// Header `frame-ancestors` ở next.config cũng chỉ cho admin nhúng route /preview/*.
const ADMIN_ORIGIN = (process.env.NEXT_PUBLIC_ADMIN_ORIGIN ?? '').replace(/\/$/, '');

type ProductPreviewData = Parameters<typeof ProductPageClient>[0]['initialProductData'];
type PreviewInbound = { type: '4thitek-preview'; data: ProductPreviewData };

/**
 * Khung xem trước "sống" cho admin editor: KHÔNG tự fetch sản phẩm. Nhận dữ liệu bản
 * nháp (đã được backend dry-run map sang public shape) qua postMessage từ app admin rồi
 * render bằng đúng <ProductPageClient> của PDP thật. Route này noindex (X-Robots-Tag ở
 * next.config) và chỉ cho phép admin origin nhúng iframe (frame-ancestors).
 */
export default function ProductPreviewPage() {
    const [product, setProduct] = useState<ProductPreviewData | null>(null);

    useEffect(() => {
        function handleMessage(event: MessageEvent) {
            // Chỉ nhận từ origin admin đã cấu hình. Khi chưa set (dev local) thì bỏ qua
            // kiểm tra để vẫn chạy được giữa localhost:3000 ↔ localhost:5173.
            if (ADMIN_ORIGIN && event.origin !== ADMIN_ORIGIN) return;
            const inbound = event.data as PreviewInbound | undefined;
            if (!inbound || inbound.type !== '4thitek-preview' || !inbound.data) return;
            // id có thể null cho bản nháp — chèn id giả để mapper không loại bỏ.
            setProduct({ ...inbound.data, id: inbound.data.id ?? 'preview' });
        }

        window.addEventListener('message', handleMessage);
        // Bắt tay: báo cho frame cha (admin) biết iframe đã sẵn sàng nhận dữ liệu, để
        // admin gửi ngay payload hiện tại mà không phải chờ lần gõ kế tiếp.
        window.parent?.postMessage({ type: '4thitek-preview-ready' }, ADMIN_ORIGIN || '*');

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    if (!product) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#06111B] px-6 text-center text-sm text-white/70">
                Đang chờ dữ liệu xem trước…
            </div>
        );
    }

    return (
        <>
            <PreviewGuard />
            <ProductPageClient initialProductData={product} initialRelatedProducts={[]} />
        </>
    );
}
