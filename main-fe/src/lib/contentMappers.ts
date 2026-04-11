import type { BlogPost } from '@/types/blog';
import type { Product, ProductSpecification, ProductVideo, SimpleProduct } from '@/types/product';
import { parseImageUrl, parseJsonArray, resolveMediaUrl } from '@/utils/media';
import { slugify } from './slug';

const EMPTY_PRODUCT_WARRANTY = {
    period: '',
    coverage: [],
    conditions: [],
    excludes: [],
    registrationRequired: false
};

const EMPTY_PRODUCT_SPECIFICATIONS: ProductSpecification = {
    driver: '',
    frequencyResponse: '',
    impedance: '',
    sensitivity: '',
    maxPower: '',
    cable: '',
    weight: '',
    dimensions: '',
    connector: '',
    compatibility: []
};

const normalizeTextArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const pickString = (...values: unknown[]) => {
    for (const value of values) {
        if (typeof value !== 'string') continue;
        const trimmed = value.trim();
        if (trimmed) return trimmed;
    }
    return '';
};

const normalizeGalleryEntries = (value: unknown) => {
    if (!Array.isArray(value)) {
        return value;
    }

    return value.map((entry) => {
        if (typeof entry === 'string') {
            return resolveMediaUrl(entry, entry);
        }
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            return entry;
        }

        const typedEntry = entry as Record<string, unknown>;
        const url = typeof typedEntry.url === 'string' ? resolveMediaUrl(typedEntry.url, typedEntry.url) : typedEntry.url;
        return {
            ...typedEntry,
            ...(typeof url === 'string' ? { url } : {})
        };
    });
};

const normalizeMediaPayload = <T,>(entry: T): T => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return entry;
    }

    const typedEntry = entry as Record<string, unknown>;
    const normalized: Record<string, unknown> = { ...typedEntry };

    for (const field of ['imageUrl', 'url', 'link'] as const) {
        if (typeof typedEntry[field] === 'string') {
            normalized[field] = resolveMediaUrl(typedEntry[field] as string, typedEntry[field] as string);
        }
    }

    for (const field of ['gallery', 'images', 'urls'] as const) {
        if (field in typedEntry) {
            normalized[field] = normalizeGalleryEntries(typedEntry[field]);
        }
    }

    return normalized as T;
};

export const toEntityId = (value: string | number | null | undefined): string | null => {
    const nextValue = value?.toString().trim();
    return nextValue ? nextValue : null;
};

export function mapProductSummaryToSimpleProduct(product: {
    id: string | number;
    name: string;
    sku?: string;
    shortDescription: string;
    image: string;
    price?: number;
}): SimpleProduct | null {
    const id = toEntityId(product.id);
    if (!id) {
        return null;
    }

    return {
        id,
        name: product.name,
        sku: product.sku,
        shortDescription: product.shortDescription,
        description: product.shortDescription,
        image: parseImageUrl(product.image, ''),
        price: product.price
    };
}

export function mapProductSummaryToProductCard(product: {
    id: string | number;
    name: string;
    shortDescription: string;
    image: string;
}): Product | null {
    const id = toEntityId(product.id);
    if (!id) {
        return null;
    }

    const image = parseImageUrl(product.image, '');

    return {
        id,
        name: product.name,
        subtitle: product.shortDescription,
        description: product.shortDescription,
        longDescription: product.shortDescription,
        images: image
            ? [
                  {
                      id: '1',
                      url: image,
                      alt: product.name,
                      type: 'main',
                      order: 0
                  }
              ]
            : [],
        videos: [],
        specifications: { ...EMPTY_PRODUCT_SPECIFICATIONS },
        features: [],
        availability: {
            status: 'unknown'
        },
        warranty: { ...EMPTY_PRODUCT_WARRANTY },
        highlights: [],
        targetAudience: [],
        useCases: [],
        popularity: 0,
        tags: [],
        relatedProductIds: [],
        accessories: [],
        createdAt: '',
        updatedAt: ''
    };
}

export function mapBlogSummaryToPost(blog: {
    id: string | number;
    title: unknown;
    description: unknown;
    image: string;
    category: unknown;
    createdAt: unknown;
    introduction?: string;
}): BlogPost | null {
    const id = toEntityId(blog.id);
    if (!id) {
        return null;
    }

    const title = pickString(blog.title);
    if (!title) {
        return null;
    }

    const description = pickString(blog.description, title);
    const categoryName = pickString(blog.category);
    const publishedAt = pickString(blog.createdAt);

    return {
        id,
        title,
        slug: slugify(title),
        excerpt: description,
        content: description,
        featuredImage: parseImageUrl(blog.image, ''),
        publishedAt,
        category: {
            id: categoryName || 'uncategorized',
            name: categoryName || 'Chua phan loai',
            slug: slugify(categoryName),
            description: categoryName || 'Chua phan loai'
        },
        introductionBlocks: parseJsonArray(blog.introduction || '[]', []).map((entry) => normalizeMediaPayload(entry)),
        tags: [],
        isPublished: true,
        seo: {
            metaTitle: title,
            metaDescription: description
        }
    };
}

export function mapProductDetailToViewModel(
    productData: {
        id: string | number;
        name: string;
        shortDescription: string;
        description?: string;
        descriptions?: Array<Record<string, unknown>>;
        image: string;
        videos: Array<Record<string, unknown>>;
        specifications: unknown;
        tags?: string[];
    },
    videoTitleFallback: string
): {
    product: Product;
    descriptions: unknown[];
    apiSpecifications: Array<{ label: string; value: string }>;
    hasApiSpecifications: boolean;
} {
    const id = toEntityId(productData.id) ?? '';
    const descriptions = parseJsonArray(productData.descriptions || [], []).map((entry) => normalizeMediaPayload(entry));
    const image = parseImageUrl(productData.image, '');

    const videos = parseJsonArray<unknown>(productData.videos || [], []).reduce<ProductVideo[]>((acc, entry, index) => {
        if (!entry || typeof entry !== 'object') return acc;
        const video = entry as {
            title?: unknown;
            description?: unknown;
            descriptions?: unknown;
            url?: unknown;
            videoUrl?: unknown;
        };
        const title = pickString(video.title) || videoTitleFallback;
        const description = pickString(video.description, video.descriptions);
        const url = pickString(video.url, video.videoUrl);
        if (!title && !description && !url) return acc;
        acc.push({
            id: `video-${index}`,
            title,
            description,
            url,
            type: 'unknown'
        });
        return acc;
    }, []);

    let specifications: unknown = {};
    let apiSpecifications: Array<{ label: string; value: string }> = [];
    let hasApiSpecifications = false;

    if (typeof productData.specifications === 'string') {
        const parsedSpecifications = parseJsonArray<unknown>(productData.specifications, []);
        if (Array.isArray(parsedSpecifications)) {
            apiSpecifications = parsedSpecifications.filter(
                (entry): entry is { label: string; value: string } =>
                    Boolean(entry) &&
                    typeof entry === 'object' &&
                    typeof (entry as { label?: unknown }).label === 'string' &&
                    typeof (entry as { value?: unknown }).value === 'string'
            );
            hasApiSpecifications = apiSpecifications.length > 0;
            specifications = apiSpecifications.reduce<Record<string, string>>((acc, spec) => {
                const key = spec.label.toLowerCase().replace(/[^a-z0-9]+/g, '');
                acc[key] = spec.value;
                return acc;
            }, {});
        } else {
            specifications = parsedSpecifications;
        }
    } else if (productData.specifications && typeof productData.specifications === 'object') {
        specifications = productData.specifications;
    }

    const normalizedSpecifications =
        specifications && typeof specifications === 'object' && !Array.isArray(specifications)
            ? {
                  driver: typeof (specifications as Record<string, unknown>).driver === 'string' ? (specifications as Record<string, string>).driver : '',
                  frequencyResponse:
                      typeof (specifications as Record<string, unknown>).frequencyResponse === 'string'
                          ? (specifications as Record<string, string>).frequencyResponse
                          : '',
                  impedance:
                      typeof (specifications as Record<string, unknown>).impedance === 'string'
                          ? (specifications as Record<string, string>).impedance
                          : '',
                  sensitivity:
                      typeof (specifications as Record<string, unknown>).sensitivity === 'string'
                          ? (specifications as Record<string, string>).sensitivity
                          : '',
                  maxPower:
                      typeof (specifications as Record<string, unknown>).maxPower === 'string'
                          ? (specifications as Record<string, string>).maxPower
                          : '',
                  cable:
                      typeof (specifications as Record<string, unknown>).cable === 'string'
                          ? (specifications as Record<string, string>).cable
                          : '',
                  weight:
                      typeof (specifications as Record<string, unknown>).weight === 'string'
                          ? (specifications as Record<string, string>).weight
                          : '',
                  dimensions:
                      typeof (specifications as Record<string, unknown>).dimensions === 'string'
                          ? (specifications as Record<string, string>).dimensions
                          : '',
                  connector:
                      typeof (specifications as Record<string, unknown>).connector === 'string'
                          ? (specifications as Record<string, string>).connector
                          : '',
                  compatibility: normalizeTextArray((specifications as Record<string, unknown>).compatibility)
              }
            : { ...EMPTY_PRODUCT_SPECIFICATIONS };

    const description = productData.description || productData.shortDescription;
    const features: { id: string; title: string; description: string }[] = [];
    const highlights = descriptions
        .filter((entry) => (entry as { type?: string }).type === 'description')
        .map((entry) => (entry as { text: string }).text);

    return {
        product: {
            id,
            name: productData.name,
            subtitle: description,
            description,
            longDescription: description,
            images: image
                ? [
                      {
                          id: '1',
                          url: image,
                          alt: productData.name,
                          type: 'main',
                          order: 0
                      }
                  ]
                : [],
            videos,
            specifications: normalizedSpecifications,
            features,
            availability: {
                status: 'unknown'
            },
            warranty: { ...EMPTY_PRODUCT_WARRANTY },
            highlights,
            targetAudience: [],
            useCases: [],
            popularity: 0,
            tags: productData.tags ?? [],
            relatedProductIds: [],
            accessories: [],
            createdAt: '',
            updatedAt: ''
        },
        descriptions,
        apiSpecifications,
        hasApiSpecifications
    };
}
