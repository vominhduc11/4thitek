import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, createBaseMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/warranty-check',
    title: '4ThiTek | Kiem tra bao hanh',
    description:
        'Tra cuu tinh trang bao hanh san pham tai nghe SCS cua ban tai 4ThiTek. Nhap so serial de xem thong tin bao hanh chi tiet va ngay het han.',
    keywords: ['kiem tra bao hanh', 'tra cuu bao hanh SCS', 'bao hanh tai nghe 4ThiTek', 'so serial SCS']
});

export default function WarrantyCheckLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: 'Trang chu', url: SITE_URL },
                    { name: 'Kiem tra bao hanh', url: `${SITE_URL}/warranty-check` }
                ])}
            />
            {children}
        </>
    );
}
