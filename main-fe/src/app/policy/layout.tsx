import type { Metadata } from 'next';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/policy',
    title: '4ThiTek | Chinh sach',
    description: 'Xem chinh sach bao hanh, van chuyen va ho tro tu 4ThiTek.'
});

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
