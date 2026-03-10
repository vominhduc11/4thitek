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
            path: '/blogs',
            title: '4ThiTek | Tin tức và bài viết',
            description: 'Tin tức sản phẩm, hướng dẫn và bài viết từ 4ThiTek.'
        })
        : createBaseMetadata({
            locale: 'en',
            path: '/blogs',
            title: '4ThiTek | Blogs',
            description: 'Product news, guides, and stories from 4ThiTek.'
        });
}

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
