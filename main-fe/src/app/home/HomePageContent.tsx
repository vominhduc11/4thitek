import { HeroSection, Newsroom, ProductSeries } from './components';
import BrandValues from './components/BrandValues';
import { publicApiServer } from '@/lib/publicApiServer';
import { mapBlogSummaryToPost, mapProductSummaryToSimpleProduct } from '@/lib/contentMappers';

function WaveDivider({ fromColor, toColor }: { fromColor: string; toColor: string }) {
    return (
        <div
            className="relative h-10 overflow-hidden sm:h-14 md:h-[72px] lg:h-20 xl:h-24"
            style={{ background: toColor }}
            aria-hidden="true"
        >
            <svg
                viewBox="0 0 1440 72"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0 h-full w-full"
            >
                <path d="M0,0 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,0 Z" fill={fromColor} />
            </svg>
        </div>
    );
}

export default async function HomePageContent() {
    const [featuredProductsResponse, homepageProductsResponse, blogsResponse] = await Promise.all([
        publicApiServer.fetchFeaturedProducts(),
        publicApiServer.fetchNewProducts(),
        publicApiServer.fetchLatestBlogs()
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
        <div className="relative overflow-hidden bg-[#06111B] text-white">
            <HeroSection initialProduct={featuredProducts[0] ?? null} />
            <ProductSeries initialProducts={homepageProducts} />
            <WaveDivider fromColor="#06111B" toColor="#081A2A" />
            <BrandValues />
            <WaveDivider fromColor="#081A2A" toColor="#06111B" />
            <Newsroom initialBlogs={blogs} />
        </div>
    );
}
