import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Montserrat, Source_Sans_3 } from 'next/font/google';
import Analytics from '@/components/analytics/Analytics';
import ClientLayout from '@/components/layout/ClientLayout';
import AppProviders from '@/components/providers/AppProviders';
import JsonLd from '@/components/seo/JsonLd';
import { createBaseMetadata, localBusinessJsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import {
    CONTACT_EMAIL,
    CONTACT_PHONE,
    DEFAULT_LOCALE,
    LANGUAGE_COOKIE,
    resolveSupportedLocale,
    SITE_NAME,
    SITE_URL,
    type SupportedLocale
} from '@/lib/site';
import './globals.css';

const sourceSans = Source_Sans_3({
    subsets: ['latin', 'vietnamese'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-sans',
    display: 'swap'
});

const montserrat = Montserrat({
    subsets: ['latin', 'vietnamese'],
    weight: ['500', '600', '700', '800'],
    variable: '--font-serif',
    display: 'swap'
});

const ROOT_COPY: Record<
    SupportedLocale,
    {
        title: string;
        description: string;
        keywords: string[];
        skipLinkLabel: string;
    }
> = {
    vi: {
        title: '4T HITEK - Giải pháp kết nối hành trình và phân phối thiết bị SCS tại Việt Nam',
        description:
            'Website chính thức của 4T HITEK. Khám phá sản phẩm, tra cứu bảo hành, kết nối đại lý và liên hệ bộ phận hỗ trợ tại 4thitek.vn.',
        keywords: [
            '4T HITEK',
            'tai nghe SCS',
            'tai nghe chính hãng',
            'thiết bị SCS',
            'đại lý tai nghe SCS',
            'bảo hành tai nghe SCS',
            'mua tai nghe SCS',
            'SCS Vietnam'
        ],
        skipLinkLabel: 'Bỏ qua đến nội dung chính'
    },
    en: {
        title: '4T HITEK - Connected mobility and SCS device distribution in Vietnam',
        description:
            'Official website of 4T HITEK. Explore products, check warranty status, connect with dealers, and contact our support team at 4thitek.vn.',
        keywords: [
            '4T HITEK',
            'SCS headset',
            'official SCS distributor',
            'SCS devices Vietnam',
            'SCS dealer Vietnam',
            'SCS warranty',
            'buy SCS headset',
            'SCS Vietnam'
        ],
        skipLinkLabel: 'Skip to main content'
    }
};

const SHARED_METADATA: Omit<Metadata, 'title' | 'description'> = {
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: 'electronics',
    other: {
        'contact:phone_number': CONTACT_PHONE,
        'contact:email': CONTACT_EMAIL
    },
    icons: {
        icon: [
            { url: '/logo.png', sizes: '32x32', type: 'image/png' },
            { url: '/logo.png', sizes: '16x16', type: 'image/png' }
        ],
        apple: [{ url: '/logo.png', sizes: '180x180', type: 'image/png' }]
    }
};

const getRootLocale = async (): Promise<SupportedLocale> => {
    const cookieStore = await cookies();
    return resolveSupportedLocale(cookieStore.get(LANGUAGE_COOKIE)?.value ?? DEFAULT_LOCALE);
};

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRootLocale();
    const copy = ROOT_COPY[locale];

    return {
        ...createBaseMetadata({
            locale,
            path: '/',
            title: copy.title,
            description: copy.description,
            keywords: copy.keywords
        }),
        ...SHARED_METADATA
    };
}

export default async function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getRootLocale();
    const copy = ROOT_COPY[locale];

    return (
        <html lang={locale}>
            <body id="__next" className={`${sourceSans.variable} ${montserrat.variable} antialiased`}>
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1200] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-[#06111B]"
                >
                    {copy.skipLinkLabel}
                </a>
                <JsonLd data={[organizationJsonLd(), websiteJsonLd(), localBusinessJsonLd(locale)]} />
                <Analytics />
                <AppProviders initialLanguage={locale}>
                    <ClientLayout>{children}</ClientLayout>
                </AppProviders>
            </body>
        </html>
    );
}
