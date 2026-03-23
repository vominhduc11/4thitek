import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, createBaseMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/become_our_reseller',
    title: '4ThiTek | Tro thanh dai ly',
    description:
        'Dang ky tro thanh dai ly chinh thuc cua 4ThiTek. Phan phoi tai nghe SCS chinh hang va nhan chinh sach ho tro kinh doanh toan dien.',
    keywords: ['dai ly 4ThiTek', 'phan phoi tai nghe SCS', 'dang ky dai ly SCS', 'kinh doanh tai nghe', 'nhuong quyen SCS']
});

export default function BecomeOurResellerLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: 'Trang chu', url: SITE_URL },
                    { name: 'Tro thanh dai ly', url: `${SITE_URL}/become_our_reseller` }
                ])}
            />
            {children}
        </>
    );
}
