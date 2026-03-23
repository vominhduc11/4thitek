import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, createBaseMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/blogs',
    title: '4ThiTek | Tin tuc & Bai viet',
    description:
        'Cap nhat tin tuc san pham tai nghe SCS moi nhat, huong dan su dung chuyen sau va bai viet cong nghe tu 4ThiTek.',
    keywords: ['tin tuc 4ThiTek', 'bai viet tai nghe SCS', 'huong dan tai nghe', 'cong nghe am thanh', 'review tai nghe SCS']
});

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: 'Trang chu', url: SITE_URL },
                    { name: 'Tin tuc & Bai viet', url: `${SITE_URL}/blogs` }
                ])}
            />
            {children}
        </>
    );
}
