import { useMemo } from 'react';
import { Variants } from 'framer-motion';
import { ANIMATION } from './constants';

export function useFeatureCards() {
    const getAnimationVariant = useMemo(() => (index: number): Variants => ({
        hidden: { 
            opacity: 0, 
            y: 50, 
            scale: 0.9 
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: ANIMATION.DURATION.NORMAL,
                delay: index * ANIMATION.DELAY.INCREMENT,
                type: 'spring' as const,
                stiffness: ANIMATION.SPRING.STIFFNESS,
                damping: ANIMATION.SPRING.DAMPING
            }
        }
    }), []);

    return {
        getAnimationVariant
    };
}
