import { ANIMATION_DURATION, ANIMATION_DISTANCE } from './constants';

export const imageVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? ANIMATION_DISTANCE.SLIDE : -ANIMATION_DISTANCE.SLIDE,
        opacity: 0,
        rotateY: direction > 0 ? ANIMATION_DISTANCE.ROTATE : -ANIMATION_DISTANCE.ROTATE,
        scale: 0.95
    }),
    center: {
        x: 0,
        opacity: 1,
        rotateY: 0,
        scale: 1
    },
    exit: (direction: number) => ({
        x: direction < 0 ? ANIMATION_DISTANCE.SLIDE : -ANIMATION_DISTANCE.SLIDE,
        opacity: 0,
        rotateY: direction < 0 ? ANIMATION_DISTANCE.ROTATE : -ANIMATION_DISTANCE.ROTATE,
        scale: 0.95
    })
} as const;

export const infoVariants = {
    enter: { opacity: 0, y: ANIMATION_DISTANCE.VERTICAL },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -ANIMATION_DISTANCE.VERTICAL }
} as const;

export const titleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
} as const;

export const arrowVariants = {
    hover: { scale: 1.15 },
    tap: { scale: 0.9 }
} as const;

export const dotVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.2 },
    tap: { scale: 0.95 }
} as const;

export const headingVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 }
} as const;

export const patternVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1, 
        transition: { 
            duration: ANIMATION_DURATION.SLOW, 
            delay: ANIMATION_DURATION.PATTERN_DELAY 
        } 
    }
} as const;

export const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    hover: {
        scale: 1.05,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: '#4FC8FF',
        color: '#4FC8FF'
    },
    tap: { scale: 0.95 }
} as const;
