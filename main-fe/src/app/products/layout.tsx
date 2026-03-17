import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, createBaseMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/products',
    title: '4ThiTek | Sản phẩm tai nghe SCS',
    description: 'Khám phá toàn bộ sản phẩm tai nghe SCS chính hãng của 4ThiTek với thông số kỹ thuật đầy đủ. Chất lượng cao, bảo hành chính hãng tại Việt Nam.',
    keywords: ['sản phẩm 4ThiTek', 'tai nghe SCS', 'tai nghe chính hãng', 'mua tai nghe SCS', 'SCS headset Việt Nam']
});

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: 'Trang chủ', url: SITE_URL },
                    { name: 'Sản phẩm', url: `${SITE_URL}/products` }
                ])}
            />
            {children}
        </>
    );
}
