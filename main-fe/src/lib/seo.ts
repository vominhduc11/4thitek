import type { Metadata } from 'next';
import { buildCanonicalUrl, SITE_NAME, SITE_URL, type SupportedLocale } from './site';

const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

export const createBaseMetadata = ({
    locale,
    path,
    title,
    description,
    image,
    keywords,
    noindex = false
}: {
    locale: SupportedLocale;
    path: string;
    title: string;
    description: string;
    image?: string;
    keywords?: string[];
    noindex?: boolean;
}): Metadata => ({
    metadataBase: new URL(SITE_URL),
    title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    alternates: {
        canonical: buildCanonicalUrl(path)
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
    logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
        width: 200,
        height: 60
    },
    contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['Vietnamese', 'English']
    },
    sameAs: [SITE_URL]
});

export const localBusinessJsonLd = () => ({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`
    },
    image: `${SITE_URL}/logo.png`,
    description: 'Nha phan phoi chinh hang tai nghe SCS tai Viet Nam',
    address: {
        '@type': 'PostalAddress',
        addressCountry: 'VN',
        addressLocality: 'Viet Nam'
    },
    contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['Vietnamese', 'English']
    },
    priceRange: '$$',
    currenciesAccepted: 'VND',
    paymentAccepted: 'Cash, Credit Card, Bank Transfer'
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
    image,
    sku,
    price,
    path
}: {
    id: string;
    name: string;
    description: string;
    image?: string;
    sku?: string;
    price?: number;
    path?: string;
}) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: image ? [image] : undefined,
    ...(sku ? { sku } : {}),
    brand: {
        '@type': 'Brand',
        name: SITE_NAME
    },
    url: buildCanonicalUrl(path ?? `/products/${id}`).toString(),
    ...(price
        ? {
              offers: {
                  '@type': 'Offer',
                  price,
                  priceCurrency: 'VND',
                  availability: 'https://schema.org/InStock',
                  url: buildCanonicalUrl(path ?? `/products/${id}`).toString(),
                  seller: {
                      '@type': 'Organization',
                      name: SITE_NAME
                  }
              }
          }
        : {})
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
