import type { Metadata } from 'next';
import { Montserrat, Source_Sans_3 } from 'next/font/google';
import Analytics from '@/components/analytics/Analytics';
import ClientLayout from '@/components/layout/ClientLayout';
import AppProviders from '@/components/providers/AppProviders';
import JsonLd from '@/components/seo/JsonLd';
import { createBaseMetadata, localBusinessJsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import { CONTACT_EMAIL, CONTACT_PHONE, SITE_NAME, SITE_URL } from '@/lib/site';
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

export const metadata: Metadata = {
    ...createBaseMetadata({
        locale: 'vi',
        path: '/',
        title: '4T HITEK - Giai phap ket noi hanh trinh va phan phoi thiet bi SCS tai Viet Nam',
        description:
            'Website chinh thuc cua 4T HITEK. Kham pha san pham, tra cuu bao hanh, ket noi dai ly va lien he bo phan ho tro tai 4thitek.vn.',
        keywords: [
            '4T HITEK',
            'tai nghe SCS',
            'tai nghe chinh hang',
            'SCS headset',
            'dai ly tai nghe SCS',
            'bao hanh tai nghe SCS',
            'mua tai nghe SCS',
            'SCS Vietnam'
        ]
    }),
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

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi">
            <body id="__next" className={`${sourceSans.variable} ${montserrat.variable} antialiased`}>
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1200] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-[#06111B]"
                >
                    Skip to main content
                </a>
                <JsonLd data={[organizationJsonLd(), websiteJsonLd(), localBusinessJsonLd()]} />
                <Analytics />
                <AppProviders>
                    <ClientLayout>{children}</ClientLayout>
                </AppProviders>
            </body>
        </html>
    );
}
