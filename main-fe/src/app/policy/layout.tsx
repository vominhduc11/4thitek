import type { Metadata } from 'next';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/policy',
    title: '4ThiTek | Chinh sach',
    description: 'Xem day du chinh sach bao hanh, doi tra, van chuyen va ho tro khach hang cua 4ThiTek.',
    keywords: ['chinh sach 4ThiTek', 'chinh sach bao hanh', 'chinh sach doi tra', 'chinh sach van chuyen']
});

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
