import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, createBaseMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/become_our_reseller',
    title: '4ThiTek | Trở thành đại lý',
    description: 'Đăng ký trở thành đại lý chính thức của 4ThiTek. Phân phối tai nghe SCS chính hãng và nhận chính sách hỗ trợ kinh doanh toàn diện.',
    keywords: ['đại lý 4ThiTek', 'phân phối tai nghe SCS', 'đăng ký đại lý SCS', 'kinh doanh tai nghe', 'nhượng quyền SCS']
});

export default function BecomeOurResellerLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: 'Trang chủ', url: SITE_URL },
                    { name: 'Trở thành đại lý', url: `${SITE_URL}/become_our_reseller` }
                ])}
            />
            {children}
        </>
    );
}
