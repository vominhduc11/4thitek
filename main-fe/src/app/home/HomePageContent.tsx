import { HeroSection, FeaturedProductsCarousel, ProductSeries, Newsroom } from './components';
import { mapBlogSummaryToPost, mapProductSummaryToSimpleProduct } from '@/lib/contentMappers';
import { publicApiServer } from '@/lib/publicApiServer';

export default async function HomePageContent() {
    const [productsResponse, featuredProductsResponse, blogsResponse] = await Promise.all([
        publicApiServer.fetchHomepageProducts(),
        publicApiServer.fetchFeaturedProducts(),
        publicApiServer.fetchHomepageBlogs()
    ]);

    const firstProduct = productsResponse.data?.[0] ?? null;
    const heroProduct = firstProduct ? (mapProductSummaryToSimpleProduct(firstProduct) ?? null) : null;

    const featuredProducts = (featuredProductsResponse.data ?? [])
        .map((product) => mapProductSummaryToSimpleProduct(product))
        .filter((product): product is NonNullable<typeof product> => product !== null);

    const blogs = (blogsResponse.data ?? [])
        .map((blog) => mapBlogSummaryToPost(blog))
        .filter((blog): blog is NonNullable<typeof blog> => blog !== null);

    return (
        <div className="relative">
            <HeroSection initialProduct={heroProduct} />

            <ProductSeries />

            <div className="h-16 bg-gradient-to-b from-[#0c131d] to-[#013A5E]" />

            <FeaturedProductsCarousel products={featuredProducts} />

            <div className="h-16 bg-gradient-to-b from-[#032B4A] to-[#001A35]" />

            <Newsroom initialBlogs={blogs} />
        </div>
    );
}
