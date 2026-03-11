import type { Metadata } from 'next';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/products',
    title: '4ThiTek | Danh sach san pham',
    description: 'Xem cac san pham 4ThiTek va thong tin ky thuat chinh thuc.'
});

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
