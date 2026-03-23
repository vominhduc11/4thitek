import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, createBaseMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/certification',
    title: '4ThiTek | Chung nhan & Giai thuong',
    description:
        'Xem cac chung nhan chat luong va giai thuong cua 4ThiTek trong linh vuc phan phoi tai nghe SCS chinh hang tai Viet Nam.',
    keywords: ['chung nhan 4ThiTek', 'giai thuong SCS', 'tai nghe SCS chinh hang', 'chung chi chat luong']
});

export default function CertificationLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: 'Trang chu', url: SITE_URL },
                    { name: 'Chung nhan', url: `${SITE_URL}/certification` }
                ])}
            />
            {children}
        </>
    );
}
