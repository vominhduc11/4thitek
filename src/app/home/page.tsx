import { FeatureCards, HeroSection, Newsroom, TransitionDivider, FeaturedProducts } from './components';

function Home() {
    return (
        <div className="relative">
            <HeroSection />

            <TransitionDivider fromColor="#0c131d" toColor="#0c131d" height="md" type="wave" />

            <FeaturedProducts />

            <div className="h-16 bg-gradient-to-b from-transparent to-[#021a33]"></div>

            <Newsroom />

            <TransitionDivider fromColor="#0c131d" toColor="#0c131d" height="sm" type="diagonal" />

            <FeatureCards />
        </div>
    );
}

export default Home;
