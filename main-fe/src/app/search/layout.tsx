import type { Metadata } from 'next';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = {
    ...createBaseMetadata({
        locale: 'vi',
        path: '/search',
        title: '4ThiTek | Tìm kiếm',
        description: 'Tìm kiếm sản phẩm tai nghe SCS và bài viết trên website 4ThiTek.',
        noindex: true
    })
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
