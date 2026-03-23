import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, createBaseMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/about',
    title: '4ThiTek | Ve chung toi',
    description:
        'Tim hieu ve 4ThiTek - nha phan phoi chinh hang tai nghe SCS tai Viet Nam. Su menh, gia tri cot loi va cam ket chat luong voi khach hang.',
    keywords: ['ve 4ThiTek', 'gioi thieu 4ThiTek', 'nha phan phoi SCS', 'tai nghe SCS Viet Nam', 'cong ty 4ThiTek']
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: 'Trang chu', url: SITE_URL },
                    { name: 'Ve chung toi', url: `${SITE_URL}/about` }
                ])}
            />
            {children}
        </>
    );
}
