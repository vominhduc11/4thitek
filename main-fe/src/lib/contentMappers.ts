import type { BlogPost } from '@/types/blog';
import type { Product, ProductSpecification, ProductVideo, SimpleProduct } from '@/types/product';
import { parseImageUrl, parseJsonArray } from '@/utils/media';
import { slugify } from './slug';

const EMPTY_PRODUCT_CATEGORY = {
    id: '',
    name: '',
    description: '',
    slug: ''
};

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
        category: { ...EMPTY_PRODUCT_CATEGORY },
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
    title: string;
    description: string;
    image: string;
    category: string;
    createdAt: string;
    introduction?: string;
}): BlogPost | null {
    const id = toEntityId(blog.id);
    if (!id) {
        return null;
    }

    return {
        id,
        title: blog.title,
        slug: slugify(blog.title),
        excerpt: blog.description,
        content: blog.description,
        featuredImage: parseImageUrl(blog.image, ''),
        publishedAt: blog.createdAt,
        category: {
            id: blog.category,
            name: blog.category,
            slug: slugify(blog.category),
            description: blog.category
        },
        introductionBlocks: parseJsonArray(blog.introduction || '[]', []),
        tags: [],
        isPublished: true,
        seo: {
            metaTitle: blog.title,
            metaDescription: blog.description
        }
    };
}

export function mapProductDetailToViewModel(
    productData: {
        id: string | number;
        name: string;
        shortDescription: string;
        description?: string;
        descriptions?: string;
        image: string;
        videos: string;
        specifications: string | unknown;
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
    const descriptions = parseJsonArray(productData.descriptions || '[]', []);
    const image = parseImageUrl(productData.image, '');

    const videos = parseJsonArray<unknown>(productData.videos || '[]', []).reduce<ProductVideo[]>((acc, entry, index) => {
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
    const features = descriptions
        .filter((entry) => (entry as { type?: string }).type === 'title')
        .map((entry, index) => ({
            id: `feature-${index}`,
            title: (entry as { text: string }).text,
            description: (entry as { text: string }).text
        }));
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
            category: { ...EMPTY_PRODUCT_CATEGORY },
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
