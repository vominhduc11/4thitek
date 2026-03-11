import { FeaturedProducts, FeaturedProductsCarousel, HeroSection, Newsroom, TransitionDivider } from './components';
import { mapBlogSummaryToPost, mapProductSummaryToSimpleProduct } from '@/lib/contentMappers';
import { publicApiServer } from '@/lib/publicApiServer';

export default async function HomePageContent() {
    const [productsResponse, blogsResponse] = await Promise.all([
        publicApiServer.fetchHomepageProducts(),
        publicApiServer.fetchHomepageBlogs()
    ]);

    const products = (productsResponse.data ?? [])
        .map((product) => mapProductSummaryToSimpleProduct(product))
        .filter((product): product is NonNullable<typeof product> => product !== null);
    const blogs = (blogsResponse.data ?? [])
        .map((blog) => mapBlogSummaryToPost(blog))
        .filter((blog): blog is NonNullable<typeof blog> => blog !== null);

    return (
        <div className="relative">
            <HeroSection initialProduct={products[0] ?? null} />

            <TransitionDivider fromColor="#0c131d" toColor="#0c131d" height="md" type="wave" />

            <FeaturedProducts initialProducts={products} />

            <div className="h-16 bg-gradient-to-b from-[#0c131d] to-[#013A5E]"></div>

            <FeaturedProductsCarousel products={products} />

            <div className="h-16 bg-gradient-to-b from-[#032B4A] to-[#001A35]"></div>

            <Newsroom initialBlogs={blogs} />
        </div>
    );
}
