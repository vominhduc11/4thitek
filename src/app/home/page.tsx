import { FeatureCards, HeroSection, Newsroom, ProductFeature, ProductSeries } from './components';

function Home() {
    return (
        <div>
            <HeroSection />
            <ProductSeries />
            <ProductFeature />
            <Newsroom />
            <FeatureCards />
        </div>
    );
}

export default Home;
