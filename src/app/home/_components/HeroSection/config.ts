import { Variants } from 'framer-motion';
import { ANIMATION_TIMING } from './constants';

// Animation variants
export const videoVariants: Variants = {
    hidden: { scale: 1.1, opacity: 0 },
    visible: { 
        scale: 1, 
        opacity: 1, 
        transition: { 
            duration: ANIMATION_TIMING.DURATION.VERY_SLOW, 
            ease: 'easeOut' 
        } 
    }
};

export const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1, 
        transition: { 
            duration: ANIMATION_TIMING.DURATION.SLOW, 
            delay: ANIMATION_TIMING.DELAY.OVERLAY 
        } 
    }
};

export const titleVariants: Variants = {
    hidden: { y: -100, opacity: 0, scale: 0.8 },
    visible: {
        y: 0,
        opacity: 1,
        scale: 1,
        transition: { 
            duration: ANIMATION_TIMING.DURATION.SLOW, 
            delay: ANIMATION_TIMING.DELAY.TITLE, 
            type: 'spring', 
            stiffness: ANIMATION_TIMING.SPRING.STIFFNESS.MEDIUM, 
            damping: ANIMATION_TIMING.SPRING.DAMPING.MEDIUM 
        }
    },
    hover: { 
        scale: 1.05, 
        textShadow: '0 0 30px rgba(79,200,255,0.5)', 
        transition: { duration: ANIMATION_TIMING.DURATION.FAST } 
    }
};

export const productVariants: Variants = {
    hidden: { scale: 0, rotate: -180, opacity: 0 },
    visible: {
        scale: 1,
        rotate: 0,
        opacity: 1,
        transition: { 
            duration: 1.8, 
            delay: ANIMATION_TIMING.DELAY.PRODUCT, 
            type: 'spring', 
            stiffness: ANIMATION_TIMING.SPRING.STIFFNESS.LOW, 
            damping: ANIMATION_TIMING.SPRING.DAMPING.LOW 
        }
    },
    hover: { 
        scale: 1.1, 
        rotate: 5, 
        y: -10, 
        transition: { 
            duration: 0.4, 
            type: 'spring', 
            stiffness: ANIMATION_TIMING.SPRING.STIFFNESS.VERY_HIGH 
        } 
    }
};

export const descWrapperVariants: Variants = {
    hidden: { y: 100, opacity: 0 },
    visible: { 
        y: 0, 
        opacity: 1, 
        transition: { 
            duration: ANIMATION_TIMING.DURATION.SLOW, 
            delay: ANIMATION_TIMING.DELAY.DESCRIPTION_WRAPPER 
        } 
    }
};

export const descVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1, 
        transition: { 
            duration: 1, 
            delay: ANIMATION_TIMING.DELAY.DESCRIPTION 
        } 
    }
};

export const buttonVariants: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: { 
            duration: ANIMATION_TIMING.DURATION.NORMAL, 
            delay: ANIMATION_TIMING.DELAY.BUTTON, 
            type: 'spring', 
            stiffness: ANIMATION_TIMING.SPRING.STIFFNESS.HIGH 
        }
    },
    hover: {
        scale: 1.05,
        boxShadow: '0 10px 25px rgba(255,255,255,0.2)',
        borderColor: '#4FC8FF',
        transition: { duration: ANIMATION_TIMING.DURATION.FAST }
    },
    tap: { scale: 0.95 }
};

export const gradientVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1, 
        transition: { 
            duration: ANIMATION_TIMING.DURATION.VERY_SLOW, 
            delay: ANIMATION_TIMING.DELAY.GRADIENT 
        } 
    }
};
