import type { Metadata } from 'next';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/policy',
    title: '4T HITEK | Chinh sach',
    description: 'Xem đầy đủ chính sách bảo hành, đổi trả, vận chuyển và hỗ trợ khách hàng của 4T HITEK.',
    keywords: ['chính sách 4T HITEK', 'chính sách bảo hành', 'chính sách đổi trả', 'chính sách vận chuyển']
});

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
