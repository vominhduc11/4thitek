import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, createBaseMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/warranty-check',
    title: '4ThiTek | Kiểm tra bảo hành',
    description: 'Tra cứu tình trạng bảo hành sản phẩm tai nghe SCS của bạn tại 4ThiTek. Nhập số serial để xem thông tin bảo hành chi tiết và ngày hết hạn.',
    keywords: ['kiểm tra bảo hành', 'tra cứu bảo hành SCS', 'bảo hành tai nghe 4ThiTek', 'số serial SCS']
});

export default function WarrantyCheckLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: 'Trang chủ', url: SITE_URL },
                    { name: 'Kiểm tra bảo hành', url: `${SITE_URL}/warranty-check` }
                ])}
            />
            {children}
        </>
    );
}
