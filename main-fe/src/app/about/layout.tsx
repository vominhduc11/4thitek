import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, createBaseMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/about',
    title: '4T HITEK | Ve chung toi',
    description:
        'Tim hieu ve 4T HITEK - nha phan phoi chinh hang tai nghe SCS tai Viet Nam. Su menh, gia tri cot loi va cam ket chat luong voi khach hang.',
    keywords: ['ve 4T HITEK', 'gioi thieu 4T HITEK', 'nha phan phoi SCS', 'tai nghe SCS Viet Nam', 'cong ty 4T HITEK']
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
