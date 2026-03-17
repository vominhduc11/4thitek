import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, createBaseMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/certification',
    title: '4ThiTek | Chứng nhận & Giải thưởng',
    description: 'Xem các chứng nhận chất lượng và giải thưởng của 4ThiTek trong lĩnh vực phân phối tai nghe SCS chính hãng tại Việt Nam.',
    keywords: ['chứng nhận 4ThiTek', 'giải thưởng SCS', 'tai nghe SCS chính hãng', 'chứng chỉ chất lượng']
});

export default function CertificationLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: 'Trang chủ', url: SITE_URL },
                    { name: 'Chứng nhận', url: `${SITE_URL}/certification` }
                ])}
            />
            {children}
        </>
    );
}
