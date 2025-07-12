'use client';

import { useRouter } from 'next/navigation';
import { seriesItems } from './mockdata';
import { useProductSeries } from './useProductSeries';
import SeriesThumbnails from './SeriesThumbnails';
import SeriesCardsGrid from './SeriesCardsGrid';
import Layout from './Layout';

export default function ProductSeries() {
    const router = useRouter();
    const {
        activeIndex,
        activeThumb,
        hoveredIndex,
        isTransitioning,
        setActiveThumb,
        setHoveredIndex,
        handleSeriesChange,
        handleThumbNavigation,
        handleViewProducts
    } = useProductSeries();

    const thumbs = seriesItems[activeIndex].thumbs || [];

    return (
        <Layout>
            <SeriesThumbnails 
                thumbs={thumbs} 
                activeThumb={activeThumb} 
                setActiveThumb={setActiveThumb}
                handleThumbNavigation={handleThumbNavigation}
            />
            <SeriesCardsGrid 
                seriesItems={seriesItems} 
                activeIndex={activeIndex}
                activeThumb={activeThumb}
                hoveredIndex={hoveredIndex}
                isTransitioning={isTransitioning}
                setHoveredIndex={setHoveredIndex}
                handleSeriesChange={handleSeriesChange}
                handleViewProducts={handleViewProducts}
                router={router} 
            />
        </Layout>
    );
}
