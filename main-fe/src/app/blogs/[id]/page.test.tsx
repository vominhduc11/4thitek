import { describe, expect, it, vi } from 'vitest';

const {
    notFoundMock,
    redirectMock,
    fetchBlogByIdMock,
    fetchRelatedBlogsMock
} = vi.hoisted(() => ({
    notFoundMock: vi.fn(() => {
        throw new Error('NEXT_NOT_FOUND');
    }),
    redirectMock: vi.fn((path: string) => {
        throw new Error(`NEXT_REDIRECT:${path}`);
    }),
    fetchBlogByIdMock: vi.fn(),
    fetchRelatedBlogsMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
    notFound: notFoundMock,
    redirect: redirectMock
}));

vi.mock('@/lib/publicApiServer', () => ({
    publicApiServer: {
        fetchBlogById: fetchBlogByIdMock,
        fetchRelatedBlogs: fetchRelatedBlogsMock
    }
}));

describe('BlogDetailPage', () => {
    it('calls notFound when the blog detail cannot be mapped into a post', async () => {
        fetchBlogByIdMock.mockResolvedValueOnce({
            success: true,
            data: {
                id: '',
                title: 'Broken blog',
                description: 'Missing id',
                image: '/blog.png',
                category: 'Guides',
                createdAt: '2026-01-01T00:00:00Z'
            }
        });

        const { default: BlogDetailPage } = await import('./page');

        await expect(
            BlogDetailPage({
                params: Promise.resolve({ id: 'broken' })
            })
        ).rejects.toThrowError('NEXT_NOT_FOUND');

        expect(notFoundMock).toHaveBeenCalled();
    });

    it('redirects non-canonical blog slugs to the canonical path', async () => {
        fetchBlogByIdMock.mockResolvedValueOnce({
            success: true,
            data: {
                id: 5,
                title: 'Road Test Review',
                description: 'Helmet review',
                image: '/blog.png',
                category: 'Guides',
                createdAt: '2026-01-01T00:00:00Z'
            }
        });

        const { default: BlogDetailPage } = await import('./page');

        await expect(
            BlogDetailPage({
                params: Promise.resolve({ id: '5' })
            })
        ).rejects.toThrowError('NEXT_REDIRECT:/blogs/5-road-test-review');

        expect(redirectMock).toHaveBeenCalledWith('/blogs/5-road-test-review');
    });

    it('renders the canonical blog detail page with related posts filtered correctly', async () => {
        fetchBlogByIdMock.mockResolvedValueOnce({
            success: true,
            data: {
                id: 5,
                title: 'Road Test Review',
                description: 'Helmet review',
                image: '/blog.png',
                category: 'Guides',
                createdAt: '2026-01-01T00:00:00Z'
            }
        });
        fetchRelatedBlogsMock.mockResolvedValueOnce({
            success: true,
            data: [
                {
                    id: 5,
                    title: 'Road Test Review',
                    description: 'Same post should be filtered out',
                    image: '/blog.png',
                    category: 'Guides',
                    createdAt: '2026-01-01T00:00:00Z'
                },
                {
                    id: 7,
                    title: 'Long Ride Tips',
                    description: 'Useful follow-up',
                    image: '/related.png',
                    category: 'Tips',
                    createdAt: '2026-01-02T00:00:00Z'
                },
                {
                    id: '',
                    title: 'Invalid related',
                    description: 'Missing id',
                    image: '/invalid.png',
                    category: 'Tips',
                    createdAt: '2026-01-03T00:00:00Z'
                }
            ]
        });

        const { default: BlogDetailPage } = await import('./page');
        const element = await BlogDetailPage({
            params: Promise.resolve({ id: '5-road-test-review' })
        });

        expect(fetchBlogByIdMock).toHaveBeenCalledWith('5');
        expect(fetchRelatedBlogsMock).toHaveBeenCalledWith('5', 4);
        expect(element.props.post).toMatchObject({
            id: '5',
            title: 'Road Test Review'
        });
        expect(element.props.relatedPosts).toEqual([
            expect.objectContaining({
                id: '7',
                title: 'Long Ride Tips'
            })
        ]);
    });
});
