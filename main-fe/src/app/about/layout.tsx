import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, createBaseMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/about',
    title: '4T HITEK | Về chúng tôi',
    description:
        'Tìm hiểu về 4T HITEK, nhà phân phối chính hãng tai nghe SCS tại Việt Nam. Sứ mệnh, giá trị cốt lõi và cam kết chất lượng với khách hàng.',
    keywords: ['về 4T HITEK', 'giới thiệu 4T HITEK', 'nhà phân phối SCS', 'tai nghe SCS Việt Nam', 'công ty 4T HITEK']
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: 'Trang chủ', url: SITE_URL },
                    { name: 'Về chúng tôi', url: `${SITE_URL}/about` }
                ])}
            />
            {children}
        </>
    );
}
