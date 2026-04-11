import { resolveMediaUrl } from '@/utils/media';
import { sanitizeBlogContent } from '@/utils/sanitize';
import type {
    ApiBlogBlock,
    BlogGalleryItem,
    BlogRenderableBlock
} from '@/types/blog';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const pickString = (...values: unknown[]) => {
    for (const value of values) {
        if (typeof value !== 'string') continue;
        const trimmed = value.trim();
        if (trimmed) return trimmed;
    }
    return '';
};

const normalizeCaption = (value: unknown) => pickString(value);

const paragraphFromText = (value: string): BlogRenderableBlock | null => {
    const sanitized = sanitizeBlogContent(value);
    return sanitized ? { type: 'paragraph', text: sanitized } : null;
};

const normalizeGalleryItems = (value: unknown): BlogGalleryItem[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((entry) => {
            if (typeof entry === 'string') {
                return { url: resolveMediaUrl(entry, entry) };
            }
            if (!isRecord(entry)) {
                return null;
            }

            const rawUrl = pickString(entry.url, entry.imageUrl, entry.src);
            if (!rawUrl) {
                return null;
            }

            return { url: resolveMediaUrl(rawUrl, rawUrl) };
        })
        .filter((entry): entry is BlogGalleryItem => Boolean(entry?.url));
};

const parseLegacyBlock = (value: ApiBlogBlock): BlogRenderableBlock | null => {
    switch (value.type) {
        case 'title':
            return paragraphFromText(value.text ?? '');
        case 'description':
            return paragraphFromText(value.text ?? '');
        case 'image': {
            const rawUrl = pickString(value.url, value.imageUrl, value.link);
            if (!rawUrl) return null;
            return {
                type: 'image',
                url: resolveMediaUrl(rawUrl, rawUrl),
                caption: normalizeCaption(value.caption)
            };
        }
        case 'images': {
            const items = normalizeGalleryItems(value.items ?? value.images);
            if (items.length === 0) return null;
            return {
                type: 'gallery',
                items,
                caption: normalizeCaption(value.caption)
            };
        }
        case 'video': {
            const rawUrl = pickString(value.url, value.videoUrl, value.link);
            if (!rawUrl) return null;
            return {
                type: 'video',
                url: rawUrl,
                caption: normalizeCaption(value.caption)
            };
        }
        default:
            return paragraphFromText(value.text ?? value.content ?? '');
    }
};

const parseUnknownBlock = (value: unknown): BlogRenderableBlock | null => {
    if (typeof value === 'string') {
        return paragraphFromText(value);
    }

    if (!isRecord(value)) {
        return null;
    }

    const type = pickString(value.type).toLowerCase();
    if (!type || type === 'paragraph') {
        return paragraphFromText(pickString(value.text, value.content));
    }

    if (type === 'image') {
        const rawUrl = pickString(value.url, value.imageUrl, value.link);
        if (!rawUrl) return null;
        return {
            type: 'image',
            url: resolveMediaUrl(rawUrl, rawUrl),
            caption: normalizeCaption(value.caption)
        };
    }

    if (type === 'gallery' || type === 'images') {
        const items = normalizeGalleryItems(value.items ?? value.images ?? value.gallery ?? value.urls);
        if (items.length === 0) return null;
        return {
            type: 'gallery',
            items,
            caption: normalizeCaption(value.caption)
        };
    }

    if (type === 'video') {
        const rawUrl = pickString(value.url, value.videoUrl, value.link);
        if (!rawUrl) return null;
        return {
            type: 'video',
            url: rawUrl,
            caption: normalizeCaption(value.caption)
        };
    }

    return parseLegacyBlock(value as unknown as ApiBlogBlock);
};

export const parseBlogIntroductionBlocks = (raw?: string | null): BlogRenderableBlock[] => {
    if (!raw?.trim()) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
            return parsed
                .map((entry) => parseUnknownBlock(entry))
                .filter((entry): entry is BlogRenderableBlock => entry !== null);
        }
    } catch {
        return raw
            .split(/\n{2,}/)
            .map((segment) => parseUnknownBlock(segment))
            .filter((entry): entry is BlogRenderableBlock => entry !== null);
    }

    return [];
};

export const getBlogVideoEmbedUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return null;

    try {
        const parsed = new URL(trimmed);
        const hostname = parsed.hostname.replace(/^www\./, '');
        if (hostname === 'youtu.be') {
            const id = parsed.pathname.replace(/^\/+/, '').split('/')[0];
            return id ? `https://www.youtube.com/embed/${id}` : null;
        }
        if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
            if (parsed.pathname.startsWith('/embed/')) {
                return trimmed;
            }
            const watchId = parsed.searchParams.get('v');
            return watchId ? `https://www.youtube.com/embed/${watchId}` : null;
        }
    } catch {
        return null;
    }

    return null;
};
