import DOMPurify from 'dompurify';

// Configuration for DOMPurify
const PURIFY_CONFIG = {
    ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'i', 'b',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'blockquote', 'pre', 'code',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span'
    ],
    ALLOWED_ATTR: [
        'href', 'target', 'rel',
        'src', 'alt', 'width', 'height',
        'class', 'id',
        'title'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target'],
    ADD_DATA_URI_TAGS: ['img']
};

/**
 * Server-side HTML sanitizer: strips the most dangerous XSS patterns.
 * DOMPurify requires a browser DOM, so this protects the initial SSR HTML payload.
 * DOMPurify runs on the client for thorough sanitization during hydration.
 */
function serverSanitizeHtml(dirty: string): string {
    return dirty
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
        .replace(/(href|src|action)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]*)/gi, '')
        .replace(/\bsrc\s*=\s*(?:"data:(?!image\/)[^"]*"|'data:(?!image\/)[^']*')/gi, '');
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - Raw HTML string that may contain malicious content
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
    if (!dirty || typeof dirty !== 'string') {
        return '';
    }

    if (typeof window === 'undefined') {
        return serverSanitizeHtml(dirty);
    }

    try {
        return DOMPurify.sanitize(dirty, PURIFY_CONFIG);
    } catch (error) {
        console.error('HTML sanitization failed:', error);
        return dirty.replace(/<[^>]*>/g, '');
    }
}

/**
 * Sanitizes HTML content for blog posts with more permissive settings
 * @param dirty - Raw HTML string from blog content
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeBlogContent(dirty: string): string {
    if (!dirty || typeof dirty !== 'string') {
        return '';
    }

    if (typeof window === 'undefined') {
        return serverSanitizeHtml(dirty);
    }

    const blogConfig = {
        ...PURIFY_CONFIG,
        ALLOWED_TAGS: [
            ...PURIFY_CONFIG.ALLOWED_TAGS,
            'video', 'audio', 'source',
            'figure', 'figcaption'
        ],
        ALLOWED_ATTR: [
            ...PURIFY_CONFIG.ALLOWED_ATTR,
            'controls', 'autoplay', 'muted', 'loop',
            'poster', 'preload'
        ]
    };

    try {
        return DOMPurify.sanitize(dirty, blogConfig);
    } catch (error) {
        console.error('Blog content sanitization failed:', error);
        return dirty.replace(/<[^>]*>/g, '');
    }
}

/**
 * Strips all HTML tags and returns plain text
 * @param html - HTML string
 * @returns Plain text without HTML tags
 */
export function stripHtml(html: string): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitizes and truncates HTML content for excerpts
 * @param html - Raw HTML string
 * @param maxLength - Maximum length of the excerpt
 * @returns Sanitized and truncated plain text
 */
export function createSafeExcerpt(html: string, maxLength: number = 150): string {
    const plainText = stripHtml(html);

    if (plainText.length <= maxLength) {
        return plainText;
    }

    return plainText.substring(0, maxLength).trim() + '...';
}