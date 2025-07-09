import FeatureCards from "./_components/FeatureCards";
import HeroSection from "./_components/HeroSection";
import Newsroom from "./_components/Newsroom";
import ProductFeature from "./_components/ProductFeature";
import ProductSeries from "./_components/ProductSeries";

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
