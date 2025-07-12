import { useMemo } from 'react';
import { ANIMATION } from './constants';

export function useNewsroom() {
    const animationVariants = useMemo(() => ({
        section: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: ANIMATION.DURATION.SLOW }
        },
        header: {
            initial: { y: -50, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            transition: { duration: ANIMATION.DURATION.SLOW, delay: ANIMATION.DELAY.HEADER }
        },
        subtitle: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: ANIMATION.DURATION.NORMAL, delay: ANIMATION.DELAY.SUBTITLE }
        },
        tagline: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: ANIMATION.DURATION.NORMAL, delay: ANIMATION.DELAY.TAGLINE }
        },
        newsItem: (index: number) => ({
            initial: { opacity: 0, y: 100, scale: 0.8 },
            animate: { opacity: 1, y: 0, scale: 1 },
            transition: {
                duration: ANIMATION.DURATION.NORMAL,
                delay: index * ANIMATION.DELAY.ITEM_MULTIPLIER,
                type: 'spring',
                stiffness: ANIMATION.SPRING.STIFFNESS
            }
        }),
        button: {
            initial: { opacity: 0, y: 50 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: ANIMATION.DURATION.SLOW, delay: ANIMATION.DELAY.BUTTON }
        }
    }), []);

    const backgroundDots = useMemo(() => 
        Array.from({ length: 4 }, (_, i) => ({
            id: i,
            left: `${10 + i * 25}%`,
            top: `${20 + i * 15}%`,
            animate: {
                scale: [1, 2, 1],
                opacity: [0.3, 0.8, 0.3]
            },
            transition: {
                duration: 2 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.5
            }
        }))
    , []);

    return {
        animationVariants,
        backgroundDots
    };
}
