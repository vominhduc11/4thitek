import { useState } from 'react';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export function useProductSeries() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeThumb, setActiveThumb] = useState(0);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleSeriesChange = (index: number) => {
        if (index === activeIndex) return;
        
        setIsTransitioning(true);
        
        setTimeout(() => {
            setActiveIndex(index);
            setActiveThumb(0); // Reset thumb when changing series
        }, 150);
        
        setTimeout(() => {
            setIsTransitioning(false);
        }, 300);
    };

    const handleThumbNavigation = (direction: 'left' | 'right', thumbsLength: number) => {
        if (direction === 'left') {
            setActiveThumb(prev => Math.max(prev - 1, 0));
        } else if (direction === 'right') {
            setActiveThumb(prev => Math.min(prev + 1, thumbsLength - 1));
        }
    };

    const handleViewProducts = (seriesLabel: string, router: AppRouterInstance) => {
        const seriesParam = encodeURIComponent(seriesLabel);
        router.push(`/products?series=${seriesParam}`);
    };

    return {
        // State values
        activeIndex,
        activeThumb,
        hoveredIndex,
        isTransitioning,
        
        // State setters
        setActiveIndex,
        setActiveThumb,
        setHoveredIndex,
        setIsTransitioning,
        
        // Helper functions
        handleSeriesChange,
        handleThumbNavigation,
        handleViewProducts
    };
}
