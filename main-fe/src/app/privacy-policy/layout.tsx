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
            path: '/privacy-policy',
            title: '4ThiTek | Chính sách quyền riêng tư',
            description: 'Tìm hiểu cách 4ThiTek thu thập, sử dụng và bảo vệ dữ liệu của bạn.'
        })
        : createBaseMetadata({
            locale: 'en',
            path: '/privacy-policy',
            title: '4ThiTek | Privacy Policy',
            description: 'Learn how 4ThiTek collects, uses, and protects your data.'
        });
}

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
