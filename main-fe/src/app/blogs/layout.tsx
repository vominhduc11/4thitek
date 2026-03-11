import type { Metadata } from 'next';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/blogs',
    title: '4ThiTek | Tin tuc va bai viet',
    description: 'Tin tuc san pham, huong dan va bai viet tu 4ThiTek.'
});

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
