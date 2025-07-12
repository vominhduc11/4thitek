import { useState, useCallback } from 'react';
import { CarouselDirection } from './types';

export function useProductFeature(itemsLength: number) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState<CarouselDirection>(0);

    const goToPrevious = useCallback(() => {
        setDirection(-1);
        setActiveIndex((current) => (current > 0 ? current - 1 : itemsLength - 1));
    }, [itemsLength]);

    const goToNext = useCallback(() => {
        setDirection(1);
        setActiveIndex((current) => (current + 1) % itemsLength);
    }, [itemsLength]);

    const goToIndex = useCallback((index: number) => {
        if (index < 0 || index >= itemsLength) return;
        
        setDirection(index > activeIndex ? 1 : -1);
        setActiveIndex(index);
    }, [activeIndex, itemsLength]);

    return {
        activeIndex,
        direction,
        goToPrevious,
        goToNext,
        goToIndex
    };
}
