import {
    HeroSection,
    Newsroom,
    TransitionDivider,
    FeaturedProducts,
    FeaturedProductsCarousel
} from './components';

function Home() {
    return (
        <div className="relative">
            <HeroSection />

            <TransitionDivider fromColor="#0c131d" toColor="#0c131d" height="md" type="wave" />

            <FeaturedProducts />

            <div className="h-16 bg-gradient-to-b from-[#0c131d] to-[#013A5E]"></div>

            <FeaturedProductsCarousel />

            <div className="h-16 bg-gradient-to-b from-[#032B4A] to-[#001A35]"></div>

            <Newsroom />
        </div>
    );
}

export default Home;
