import { HeroSection, FeaturedProductsCarousel, ProductSeries, Newsroom } from './components';
import BrandValues from './components/BrandValues';
import { mapBlogSummaryToPost, mapProductSummaryToSimpleProduct } from '@/lib/contentMappers';
import { publicApiServer } from '@/lib/publicApiServer';

/** SVG wave divider — organic transition between sections */
function WaveDivider({ fromColor, toColor }: { fromColor: string; toColor: string }) {
    return (
        <div className="relative overflow-hidden" style={{ height: 72, background: toColor }} aria-hidden="true">
            <svg
                viewBox="0 0 1440 72"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0 h-full w-full"
            >
                <path
                    d="M0,0 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,0 Z"
                    fill={fromColor}
                />
            </svg>
        </div>
    );
}

export default async function HomePageContent() {
    const [featuredProductsResponse, homepageProductsResponse, blogsResponse] = await Promise.all([
        publicApiServer.fetchFeaturedProducts(),
        publicApiServer.fetchHomepageProducts(),
        publicApiServer.fetchHomepageBlogs()
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
        <div className="relative">
            <HeroSection initialProduct={featuredProducts[0] ?? null} />

            <ProductSeries initialProducts={homepageProducts} />

            {/* Wave: dark (#0c131d) into deep-blue (#013A5E) */}
            <WaveDivider fromColor="#0c131d" toColor="#013A5E" />

            <FeaturedProductsCarousel products={featuredProducts} />

            {/* Wave: deep-blue (#032B4A) into near-black (#060d16) */}
            <WaveDivider fromColor="#032B4A" toColor="#060d16" />

            <BrandValues />

            <Newsroom initialBlogs={blogs} />
        </div>
    );
}
