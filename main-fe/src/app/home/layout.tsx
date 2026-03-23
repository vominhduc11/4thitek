import type { Metadata } from 'next';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/',
    title: '4ThiTek | Trang chu',
    description:
        'Kham pha san pham tai nghe SCS chinh hang, tin tuc moi nhat va he sinh thai 4ThiTek. Nha phan phoi chinh hang tai nghe SCS tai Viet Nam.',
    keywords: ['4ThiTek', 'tai nghe SCS', 'tai nghe chinh hang', 'SCS headset', 'trang chu 4ThiTek']
});

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
