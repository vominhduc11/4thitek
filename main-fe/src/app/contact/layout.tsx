import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, createBaseMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/contact',
    title: '4T HITEK | Lien he',
    description:
        'Lien he voi 4T HITEK de duoc tu van san pham tai nghe SCS, ho tro ky thuat va giai dap moi thac mac. Chung toi luon san sang ho tro ban.',
    keywords: ['lien he 4T HITEK', 'ho tro khach hang', 'tu van tai nghe SCS', 'cham soc khach hang 4T HITEK']
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: 'Trang chu', url: SITE_URL },
                    { name: 'Lien he', url: `${SITE_URL}/contact` }
                ])}
            />
            {children}
        </>
    );
}
