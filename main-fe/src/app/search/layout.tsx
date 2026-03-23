import type { Metadata } from 'next';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = {
    ...createBaseMetadata({
        locale: 'vi',
        path: '/search',
        title: '4ThiTek | Tim kiem',
        description: 'Tim kiem san pham tai nghe SCS va bai viet tren website 4ThiTek.',
        noindex: true
    })
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
