import type { Metadata } from 'next';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/policy',
    title: '4ThiTek | Chính sách',
    description: 'Xem đầy đủ chính sách bảo hành, đổi trả, vận chuyển và hỗ trợ khách hàng của 4ThiTek.',
    keywords: ['chính sách 4ThiTek', 'chính sách bảo hành', 'chính sách đổi trả', 'chính sách vận chuyển']
});

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
