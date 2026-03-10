import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Be_Vietnam_Pro, IBM_Plex_Mono } from 'next/font/google';
import Analytics from '@/components/analytics/Analytics';
import ClientLayout from '@/components/layout/ClientLayout';
import JsonLd from '@/components/seo/JsonLd';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { LoginModalProvider } from '@/context/LoginModalContext';
import { SearchModalProvider } from '@/context/SearchModalContext';
import { createBaseMetadata, organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import { SITE_NAME } from '@/lib/site';
import './globals.css';

type Language = 'en' | 'vi';

const beVietnamPro = Be_Vietnam_Pro({
    subsets: ['latin', 'vietnamese'],
    weight: ['300', '400', '500', '600', '700', '800', '900'],
    variable: '--font-sans',
    display: 'swap'
});

const ibmPlexMono = IBM_Plex_Mono({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
    variable: '--font-mono',
    display: 'swap'
});

const getLanguageFromCookies = async (): Promise<Language> => {
    const cookieStore = await cookies();
    const value = cookieStore.get('language')?.value;
    return value === 'en' ? 'en' : 'vi';
};

const metadataByLanguage: Record<Language, Metadata> = {
    vi: createBaseMetadata({
        locale: 'vi',
        path: '/',
        title: '4ThiTek - Tai nghe SCS chính hãng',
        description: 'Website chính thức của 4ThiTek tại Việt Nam. Xem sản phẩm, kiểm tra bảo hành và đăng ký trở thành đại lý.'
    }),
    en: createBaseMetadata({
        locale: 'en',
        path: '/',
        title: '4ThiTek - Official SCS Headphones',
        description: 'Official 4ThiTek website in Vietnam. Explore products, check warranty, and apply to become a dealer.'
    })
};

export async function generateMetadata(): Promise<Metadata> {
    return {
        ...metadataByLanguage[await getLanguageFromCookies()],
        applicationName: SITE_NAME,
        authors: [{ name: SITE_NAME }],
        icons: {
            icon: [{ url: '/logo.png', sizes: '32x32', type: 'image/png' }]
        }
    };
}

export default async function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const language = await getLanguageFromCookies();

    return (
        <html lang={language}>
            <body
                id="__next"
                className={`${beVietnamPro.variable} ${ibmPlexMono.variable} antialiased`}
                suppressHydrationWarning={true}
            >
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1200] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-black"
                >
                    Skip to main content
                </a>
                <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
                <Analytics />
                <LanguageProvider initialLanguage={language}>
                    <AuthProvider>
                        <LoginModalProvider>
                            <SearchModalProvider>
                                <ClientLayout>{children}</ClientLayout>
                            </SearchModalProvider>
                        </LoginModalProvider>
                    </AuthProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}
