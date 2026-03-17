import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, createBaseMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/blogs',
    title: '4ThiTek | Tin tức & Bài viết',
    description: 'Cập nhật tin tức sản phẩm tai nghe SCS mới nhất, hướng dẫn sử dụng chuyên sâu và bài viết công nghệ từ 4ThiTek.',
    keywords: ['tin tức 4ThiTek', 'bài viết tai nghe SCS', 'hướng dẫn tai nghe', 'công nghệ âm thanh', 'review tai nghe SCS']
});

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: 'Trang chủ', url: SITE_URL },
                    { name: 'Tin tức & Bài viết', url: `${SITE_URL}/blogs` }
                ])}
            />
            {children}
        </>
    );
}
