import {
    FeatureCards,
    HeroSection,
    Newsroom,
    TransitionDivider,
    FeaturedProducts,
    FeaturedProductsCarousel
} from './components';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

function Home() {
    return (
        <div className="relative">
            {/* Language Switcher */}
            <div className="fixed top-4 right-4 z-50">
                <LanguageSwitcher />
            </div>

            <HeroSection />

            <TransitionDivider fromColor="#0c131d" toColor="#0c131d" height="md" type="wave" />

            <FeaturedProducts />

            <div className="h-16 bg-gradient-to-b from-[#0c131d] to-[#013A5E]"></div>

            <FeaturedProductsCarousel />

            <div className="h-16 bg-gradient-to-b from-[#032B4A] to-[#001A35]"></div>

            <Newsroom />

            <TransitionDivider fromColor="#032d4c" toColor="#1a1f2e" height="sm" type="diagonal" />

            <FeatureCards />
        </div>
    );
}

export default Home;
