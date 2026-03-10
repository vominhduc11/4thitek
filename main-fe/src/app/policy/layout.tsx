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
            path: '/policy',
            title: '4ThiTek | Chính sách',
            description: 'Các chính sách áp dụng cho website và sản phẩm 4ThiTek.'
        })
        : createBaseMetadata({
            locale: 'en',
            path: '/policy',
            title: '4ThiTek | Policy',
            description: 'Policies that apply to the 4ThiTek website and products.'
        });
}

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
