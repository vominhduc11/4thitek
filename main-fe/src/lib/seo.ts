import type { Metadata } from 'next';
import { buildCanonicalUrl, SITE_NAME, SITE_URL, type SupportedLocale } from './site';

const alternates = (path: string) => ({
    canonical: buildCanonicalUrl(path),
    languages: {
        vi: buildCanonicalUrl(path),
        en: buildCanonicalUrl(path)
    }
});

export const createBaseMetadata = ({
    locale,
    path,
    title,
    description
}: {
    locale: SupportedLocale;
    path: string;
    title: string;
    description: string;
}): Metadata => ({
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: alternates(path),
    openGraph: {
        title,
        description,
        url: buildCanonicalUrl(path),
        siteName: SITE_NAME,
        locale: locale === 'vi' ? 'vi_VN' : 'en_US',
        type: 'website'
    },
    twitter: {
        card: 'summary_large_image',
        title,
        description
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
    publishedAt
}: {
    id: string;
    title: string;
    description: string;
    image?: string;
    publishedAt?: string;
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
    mainEntityOfPage: `${SITE_URL}/blogs/${id}`
});
