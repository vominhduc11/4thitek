import type { Metadata } from 'next';
import { Be_Vietnam_Pro, IBM_Plex_Mono } from 'next/font/google';
import Analytics from '@/components/analytics/Analytics';
import ClientLayout from '@/components/layout/ClientLayout';
import AppProviders from '@/components/providers/AppProviders';
import JsonLd from '@/components/seo/JsonLd';
import { createBaseMetadata, localBusinessJsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import { SITE_NAME } from '@/lib/site';
import './globals.css';

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

export const metadata: Metadata = {
    ...createBaseMetadata({
        locale: 'vi',
        path: '/',
        title: '4ThiTek - Nha phan phoi tai nghe SCS chinh hang tai Viet Nam',
        description:
            'Website chinh thuc cua 4ThiTek - nha phan phoi chinh hang tai nghe SCS tai Viet Nam. Kham pha san pham, kiem tra bao hanh va dang ky tro thanh dai ly.',
        keywords: [
            '4ThiTek',
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
    authors: [{ name: SITE_NAME, url: 'https://4thitek.vn' }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: 'electronics',
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
            <body id="__next" className={`${beVietnamPro.variable} ${ibmPlexMono.variable} antialiased`}>
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1200] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-black"
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
