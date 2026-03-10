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
            path: '/home',
            title: '4ThiTek | Trang chủ',
            description: 'Khám phá sản phẩm nổi bật, tin tức mới và hệ sinh thái 4ThiTek.'
        })
        : createBaseMetadata({
            locale: 'en',
            path: '/home',
            title: '4ThiTek | Home',
            description: 'Explore featured products, latest articles, and the 4ThiTek ecosystem.'
        });
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
