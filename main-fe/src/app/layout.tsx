import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Be_Vietnam_Pro, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/layout/ClientLayout';
import { AuthProvider } from '@/context/AuthContext';
import { LoginModalProvider } from '@/context/LoginModalContext';
import { SearchModalProvider } from '@/context/SearchModalContext';
import { LanguageProvider } from '@/context/LanguageContext';


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

type Language = 'en' | 'vi';

const getLanguageFromCookies = async (): Promise<Language> => {
    const cookieStore = await cookies();
    const value = cookieStore.get('language')?.value;
    return value === 'en' ? 'en' : 'vi';
};

const metadataByLanguage: Record<Language, Metadata> = {
    vi: {
        title: '4ThiTek - Tai nghe SCS chính hãng',
        description: 'Website chính thức của 4ThiTek - Nhà phân phối tai nghe SCS chính hãng tại Việt Nam. Xem sản phẩm, kiểm tra bảo hành và đăng ký trở thành đại lý.',
        keywords: '4thitek, tai nghe scs, scs headphones, tai nghe chính hãng, phân phối tai nghe, đăng ký đại lý, kiểm tra bảo hành',
        authors: [{ name: '4ThiTek' }],
        openGraph: {
            title: '4ThiTek - Tai nghe SCS chính hãng',
            description: 'Nhà phân phối tai nghe SCS chính hãng tại Việt Nam',
            type: 'website',
            locale: 'vi_VN',
            url: 'https://4thitek.vn',
            siteName: '4ThiTek'
        },
        twitter: {
            card: 'summary_large_image',
            title: '4ThiTek - Tai nghe SCS chính hãng',
            description: 'Nhà phân phối tai nghe SCS chính hãng tại Việt Nam'
        },
        icons: {
            icon: [{ url: '/logo.png', sizes: '32x32', type: 'image/png' }]
        }
    },
    en: {
        title: '4ThiTek - Official SCS Headphones',
        description: 'Official 4ThiTek website - distributor of SCS headphones in Vietnam. Explore products, check warranty, and apply to become a dealer.',
        keywords: '4thitek, scs headphones, official headphones, distributor, warranty check, reseller signup',
        authors: [{ name: '4ThiTek' }],
        openGraph: {
            title: '4ThiTek - Official SCS Headphones',
            description: 'Official 4ThiTek website - distributor of SCS headphones in Vietnam.',
            type: 'website',
            locale: 'en_US',
            url: 'https://4thitek.vn',
            siteName: '4ThiTek'
        },
        twitter: {
            card: 'summary_large_image',
            title: '4ThiTek - Official SCS Headphones',
            description: 'Official 4ThiTek website - distributor of SCS headphones in Vietnam.'
        },
        icons: {
            icon: [{ url: '/logo.png', sizes: '32x32', type: 'image/png' }]
        }
    }
};

export async function generateMetadata(): Promise<Metadata> {
    return metadataByLanguage[await getLanguageFromCookies()];
}

export default async function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const language = await getLanguageFromCookies();
    return (
        <html lang={language}>
            <body id="__next" className={`${beVietnamPro.variable} ${ibmPlexMono.variable} antialiased`} suppressHydrationWarning={true}>
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
