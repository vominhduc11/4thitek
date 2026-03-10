import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createBaseMetadata } from '@/lib/seo';

type Language = 'en' | 'vi';

const getLanguageFromCookies = async (): Promise<Language> => {
    const cookieStore = await cookies();
    const value = cookieStore.get('language')?.value;
    return value === 'en' ? 'en' : 'vi';
};

export async function generateMetadata(): Promise<Metadata> {
    const language = await getLanguageFromCookies();
    return language === 'vi'
        ? createBaseMetadata({
            locale: 'vi',
            path: '/products',
            title: '4ThiTek | Danh sách sản phẩm',
            description: 'Xem các sản phẩm 4ThiTek và thông tin kỹ thuật chính thức.'
        })
        : createBaseMetadata({
            locale: 'en',
            path: '/products',
            title: '4ThiTek | Products',
            description: 'Browse 4ThiTek products and official technical details.'
        });
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
