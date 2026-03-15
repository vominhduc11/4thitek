import type { Metadata } from 'next';
import { buildCanonicalUrl, SITE_NAME, SITE_URL, type SupportedLocale } from './site';

const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

export const createBaseMetadata = ({
    locale,
    path,
    title,
    description,
    image,
    keywords
}: {
    locale: SupportedLocale;
    path: string;
    title: string;
    description: string;
    image?: string;
    keywords?: string[];
}): Metadata => ({
    metadataBase: new URL(SITE_URL),
    title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: {
        canonical: buildCanonicalUrl(path),
        languages: {
            'vi': `${SITE_URL}${path}`,
            'en': `${SITE_URL}${path}`
        }
    },
    openGraph: {
        title,
        description,
        url: buildCanonicalUrl(path),
        siteName: SITE_NAME,
        locale: locale === 'vi' ? 'vi_VN' : 'en_US',
        alternateLocale: locale === 'vi' ? 'en_US' : 'vi_VN',
        type: 'website',
        images: [
            {
                url: image ?? DEFAULT_OG_IMAGE,
                width: 1200,
                height: 630,
                alt: title
            }
        ]
    },
    twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image ?? DEFAULT_OG_IMAGE]
    }
});

export const organizationJsonLd = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [SITE_URL]
});

export const localBusinessJsonLd = () => ({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Nhà phân phối chính hãng tai nghe SCS tại Việt Nam',
    address: {
        '@type': 'PostalAddress',
        addressCountry: 'VN'
    },
    contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['Vietnamese', 'English']
    }
});

export const breadcrumbJsonLd = (items: { name: string; url: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
    }))
});

export const websiteJsonLd = () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
    }
});

export const productJsonLd = ({
    id,
    name,
    description,
    image
}: {
    id: string;
    name: string;
    description: string;
    image?: string;
}) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: image ? [image] : undefined,
    brand: {
        '@type': 'Brand',
        name: SITE_NAME
    },
    url: `${SITE_URL}/products/${id}`
});

export const articleJsonLd = ({
    id,
    title,
    description,
    image,
    publishedAt,
    path
}: {
    id: string;
    title: string;
    description: string;
    image?: string;
    publishedAt?: string;
    path?: string;
}) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image ? [image] : undefined,
    datePublished: publishedAt,
    dateModified: publishedAt,
    author: {
        '@type': 'Organization',
        name: SITE_NAME
    },
    publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/logo.png`
        }
    },
    mainEntityOfPage: path ? buildCanonicalUrl(path).toString() : `${SITE_URL}/blogs/${id}`
});
