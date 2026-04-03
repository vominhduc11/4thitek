import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, createBaseMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/products',
    title: '4T HITEK | San pham tai nghe SCS',
    description:
        'Kham pha toan bo san pham tai nghe SCS chinh hang cua 4T HITEK voi thong so ky thuat day du. Chat luong cao, bao hanh chinh hang tai Viet Nam.',
    keywords: ['san pham 4T HITEK', 'tai nghe SCS', 'tai nghe chinh hang', 'mua tai nghe SCS', 'SCS headset Viet Nam']
});

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: 'Trang chu', url: SITE_URL },
                    { name: 'San pham', url: `${SITE_URL}/products` }
                ])}
            />
            {children}
        </>
    );
}
