import type { Metadata } from 'next';
import { cookies } from 'next/headers';

type Language = 'en' | 'vi';

const getLanguageFromCookies = async (): Promise<Language> => {
    const cookieStore = await cookies();
    const value = cookieStore.get('language')?.value;
    return value === 'en' ? 'en' : 'vi';
};

const metadataByLanguage: Record<Language, Metadata> = {
    vi: {
        title: '4thitek | Chính Sách Quyền Riêng Tư',
        description: 'Chính sách quyền riêng tư của 4thitek. Tìm hiểu cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn.'
    },
    en: {
        title: '4thitek | Privacy Policy',
        description: '4thitek privacy policy. Learn how we collect, use, and protect your data.'
    }
};

export async function generateMetadata(): Promise<Metadata> {
    return metadataByLanguage[await getLanguageFromCookies()];
}

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
