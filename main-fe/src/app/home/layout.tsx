import type { Metadata } from 'next';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/',
    title: '4ThiTek | Trang chủ',
    description: 'Khám phá sản phẩm tai nghe SCS chính hãng, tin tức mới nhất và hệ sinh thái 4ThiTek. Nhà phân phối chính hãng tai nghe SCS tại Việt Nam.',
    keywords: ['4ThiTek', 'tai nghe SCS', 'tai nghe chính hãng', 'SCS headset', 'trang chủ 4ThiTek']
});

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
