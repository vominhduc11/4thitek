import { describe, expect, it } from 'vitest';
import { getBlogVideoEmbedUrl, parseBlogIntroductionBlocks } from './blogContent';

describe('parseBlogIntroductionBlocks', () => {
    it('parses the new block schema from admin-fe', () => {
        const result = parseBlogIntroductionBlocks(
            JSON.stringify([
                { type: 'paragraph', text: '<p>Hello riders</p>' },
                { type: 'image', url: '/uploads/blog-1.jpg', caption: 'Cover' },
                { type: 'gallery', items: [{ url: '/uploads/a.jpg' }, { url: '/uploads/b.jpg' }] },
                { type: 'video', url: 'https://youtu.be/demo123' }
            ])
        );

        expect(result).toEqual([
            { type: 'paragraph', text: '<p>Hello riders</p>' },
            { type: 'image', url: 'https://api.4thitek.vn/uploads/blog-1.jpg', caption: 'Cover' },
            {
                type: 'gallery',
                items: [
                    { url: 'https://api.4thitek.vn/uploads/a.jpg' },
                    { url: 'https://api.4thitek.vn/uploads/b.jpg' }
                ],
                caption: ''
            },
            { type: 'video', url: 'https://youtu.be/demo123', caption: '' }
        ]);
    });

    it('keeps backward compatibility with plain text and legacy image/video fields', () => {
        const result = parseBlogIntroductionBlocks(
            JSON.stringify([
                { type: 'description', text: 'First paragraph' },
                { type: 'image', imageUrl: '/uploads/legacy-image.jpg', caption: 'Legacy image' },
                { type: 'images', images: [{ url: '/uploads/gallery-1.jpg', public_id: '1' }] },
                { type: 'video', videoUrl: 'https://www.youtube.com/watch?v=abc123' }
            ])
        );

        expect(result).toEqual([
            { type: 'paragraph', text: 'First paragraph' },
            { type: 'image', url: 'https://api.4thitek.vn/uploads/legacy-image.jpg', caption: 'Legacy image' },
            {
                type: 'gallery',
                items: [{ url: 'https://api.4thitek.vn/uploads/gallery-1.jpg' }],
                caption: ''
            },
            { type: 'video', url: 'https://www.youtube.com/watch?v=abc123', caption: '' }
        ]);
    });

    it('falls back to paragraphs when the API still returns plain text', () => {
        expect(parseBlogIntroductionBlocks('First section\n\nSecond section')).toEqual([
            { type: 'paragraph', text: 'First section' },
            { type: 'paragraph', text: 'Second section' }
        ]);
    });
});

describe('getBlogVideoEmbedUrl', () => {
    it('converts a watch URL into an embeddable YouTube URL', () => {
        expect(getBlogVideoEmbedUrl('https://www.youtube.com/watch?v=demo123')).toBe(
            'https://www.youtube.com/embed/demo123'
        );
    });

    it('returns null for non-YouTube URLs', () => {
        expect(getBlogVideoEmbedUrl('https://cdn.example.com/video.mp4')).toBeNull();
    });
});
