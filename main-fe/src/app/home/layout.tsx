import type { Metadata } from 'next';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/',
    title: '4ThiTek | Trang chu',
    description: 'Kham pha san pham noi bat, tin tuc moi va he sinh thai 4ThiTek.'
});

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
