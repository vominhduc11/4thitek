import FeatureCards from './_components/FeatureCards/Index';
import HeroSection from './_components/HeroSection/Index';
import Newsroom from './_components/Newsroom/Index';
import ProductFeature from './_components/ProductFeature/Index';
import ProductSeries from './_components/ProductSeries/Index';

export default function HomePage() {
    return (
        <main className="main-content">
            <HeroSection />
            <ProductSeries />
            <ProductFeature />
            <Newsroom />
            <FeatureCards />
        </main>
    );
}
