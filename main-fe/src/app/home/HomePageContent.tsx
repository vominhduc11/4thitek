import { HeroSection, Newsroom, ProductSeries } from './components';
import BrandValues from './components/BrandValues';
import { publicApiServer } from '@/lib/publicApiServer';
import { mapBlogSummaryToPost, mapProductSummaryToSimpleProduct } from '@/lib/contentMappers';
import { cookies } from 'next/headers';
import { LANGUAGE_COOKIE, resolveSupportedLocale } from '@/lib/site';
import type { HomeContent } from '@/types/content';

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
    const cookieStore = await cookies();
    const locale = resolveSupportedLocale(cookieStore.get(LANGUAGE_COOKIE)?.value);

    const [featuredProductsResponse, homepageProductsResponse, blogsResponse, homeContentResponse] = await Promise.all([
        publicApiServer.fetchFeaturedProducts(),
        publicApiServer.fetchHomepageProducts(),
        publicApiServer.fetchLatestBlogs(),
        publicApiServer.fetchContentSection<HomeContent>('home', locale)
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
    const homeContent = homeContentResponse.data ?? null;

    return (
        <div className="relative overflow-hidden bg-[#06111B] text-white">
            <HeroSection initialProduct={featuredProducts[0] ?? null} content={homeContent?.hero} />
            <ProductSeries initialProducts={homepageProducts} content={homeContent?.showcase} />
            <WaveDivider fromColor="#06111B" toColor="#081A2A" />
            <BrandValues content={homeContent?.brandValues} />
            <WaveDivider fromColor="#081A2A" toColor="#06111B" />
            <Newsroom initialBlogs={blogs} content={homeContent?.newsroom} />
        </div>
    );
}
