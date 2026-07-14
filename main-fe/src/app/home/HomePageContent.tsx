import HomeView from './HomeView';
import { publicApiServer } from '@/lib/publicApiServer';
import { mapBlogSummaryToPost, mapProductSummaryToSimpleProduct } from '@/lib/contentMappers';
import { DEFAULT_LOCALE } from '@/lib/site';
import type { HomeContent } from '@/types/content';

export default async function HomePageContent() {
    // Server LUÔN fetch nội dung `vi` (locale canonical) → trang tĩnh SSG/ISR, không đọc
    // cookie. Bản `en` được áp ở client trong HomeView. Products/blogs không phụ thuộc locale.
    const [featuredProductsResponse, homepageProductsResponse, blogsResponse, homeContentResponse] = await Promise.all([
        publicApiServer.fetchFeaturedProducts(),
        publicApiServer.fetchHomepageProducts(),
        publicApiServer.fetchLatestBlogs(),
        publicApiServer.fetchContentSection<HomeContent>('home', DEFAULT_LOCALE)
    ]);

    const featuredProducts = (featuredProductsResponse.data ?? [])
        .map((product) => mapProductSummaryToSimpleProduct(product))
        .filter((product): product is NonNullable<typeof product> => product !== null);

    const homepageProducts = (homepageProductsResponse.data ?? [])
        .map((product) => mapProductSummaryToSimpleProduct(product))
        .filter((product): product is NonNullable<typeof product> => product !== null);

    const blogs = (blogsResponse.data ?? [])
        .map((blog) => mapBlogSummaryToPost(blog))
        .filter((blog): blog is NonNullable<typeof blog> => blog !== null);

    return (
        <HomeView
            heroProduct={featuredProducts[0] ?? null}
            homepageProducts={homepageProducts}
            blogs={blogs}
            initialContent={homeContentResponse.data ?? null}
        />
    );
}
