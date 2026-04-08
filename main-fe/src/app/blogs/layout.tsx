import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, createBaseMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/blogs',
    title: '4T HITEK | Tin tuc & Bai viet',
    description:
        'Cập nhật tin tức sản phẩm tai nghe SCS mới nhất, hướng dẫn sử dụng chuyên sâu và bài viết công nghệ từ 4T HITEK.',
    keywords: ['tin tức 4T HITEK', 'bài viết tai nghe SCS', 'hướng dẫn tai nghe', 'công nghệ âm thanh', 'review tai nghe SCS']
});

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: 'Trang chủ', url: SITE_URL },
                    { name: 'Tin tuc & Bai viet', url: `${SITE_URL}/blogs` }
                ])}
            />
            {children}
        </>
    );
}
