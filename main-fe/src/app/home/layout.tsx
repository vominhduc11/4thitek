import type { Metadata } from 'next';
import { cookies } from 'next/headers';

type Language = 'en' | 'vi';

const getLanguageFromCookies = async (): Promise<Language> => {
    const cookieStore = await cookies();
    const value = cookieStore.get('language')?.value;
    return value === 'en' ? 'en' : 'vi';
};

const metadataByLanguage: Record<Language, Metadata> = {
    vi: { title: '4thitek | Trang chủ' },
    en: { title: '4thitek | Home' }
};

export async function generateMetadata(): Promise<Metadata> {
    return metadataByLanguage[await getLanguageFromCookies()];
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
