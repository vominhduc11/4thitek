import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, createBaseMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/contact',
    title: '4ThiTek | Liên hệ',
    description: 'Liên hệ với 4ThiTek để được tư vấn sản phẩm tai nghe SCS, hỗ trợ kỹ thuật và giải đáp mọi thắc mắc. Chúng tôi luôn sẵn sàng hỗ trợ bạn.',
    keywords: ['liên hệ 4ThiTek', 'hỗ trợ khách hàng', 'tư vấn tai nghe SCS', 'chăm sóc khách hàng 4ThiTek']
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: 'Trang chủ', url: SITE_URL },
                    { name: 'Liên hệ', url: `${SITE_URL}/contact` }
                ])}
            />
            {children}
        </>
    );
}
