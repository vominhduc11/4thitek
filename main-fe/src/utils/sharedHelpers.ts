import { FaFacebookF, FaYoutube } from 'react-icons/fa';
import { SOCIAL_URLS } from '@/constants/urls';
import { buildBlogPath, buildProductPath } from '@/lib/slug';
import { parseImageUrl } from '@/utils/media';
import { SearchResult, SearchCombinedResponse } from '@/types/api';

type SearchData = SearchCombinedResponse['data'];
type SearchProduct = SearchData['products'][number];
type SearchBlog = SearchData['blogs'][number];

export const SOCIAL_ITEMS = [
    { href: SOCIAL_URLS.FACEBOOK, labelKey: 'social.facebook', Icon: FaFacebookF },
    { href: SOCIAL_URLS.YOUTUBE, labelKey: 'social.youtube', Icon: FaYoutube }
] as const;

export function mapSearchResults(data: SearchData, t: (key: string) => string): SearchResult[] {
    const nextResults: SearchResult[] = [];
    const products = data.products ?? [];
    const blogs = data.blogs ?? [];

    products.forEach((product: SearchProduct) => {
        const productId = product.id?.toString().trim();
        if (!productId) return;

        nextResults.push({
            type: 'product',
            id: productId,
            title: product.name,
            subtitle: product.shortDescription || undefined,
            image: parseImageUrl(product.image) || undefined,
            href: buildProductPath(productId, product.name),
            metaLabel: t('search.type.product')
        });
    });

    blogs.forEach((blog: SearchBlog) => {
        const blogId = blog.id?.toString().trim();
        if (!blogId) return;

        nextResults.push({
            type: 'blog',
            id: blogId,
            title: blog.title,
            subtitle: blog.description || undefined,
            image: parseImageUrl(blog.image) || undefined,
            href: buildBlogPath(blogId, blog.title),
            metaLabel: blog.category || t('search.type.blog')
        });
    });

    return nextResults;
}
