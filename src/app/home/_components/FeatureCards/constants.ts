/**
 * Animation timing constants
 */
export const ANIMATION = {
    DURATION: {
        FAST: 0.3,
        NORMAL: 0.6,
        SLOW: 0.8
    },
    DELAY: {
        BASE: 0.1,
        INCREMENT: 0.2
    },
    SPRING: {
        STIFFNESS: 100,
        DAMPING: 15
    }
} as const;

/**
 * Responsive image sizes
 */
export const IMAGE_SIZES = {
    LOGO: {
        MOBILE: 'w-24 h-8',
        TABLET: 'w-28 h-10', 
        DESKTOP: 'w-32 h-12'
    },
    ICON: {
        MOBILE: 'w-8 h-8',
        TABLET: 'w-10 h-10',
        DESKTOP: 'w-12 h-12'
    },
    BRAND_LOGO: {
        WIDTH: 'w-36',
        HEIGHT: 'h-16'
    }
} as const;

/**
 * Layout constants
 */
export const LAYOUT = {
    PADDING: {
        MOBILE: 'p-6',
        TABLET: 'sm:p-8',
        DESKTOP: 'lg:p-12'
    },
    SPACING: {
        SMALL: 'gap-4',
        MEDIUM: 'sm:gap-6',
        LARGE: 'lg:gap-8'
    },
    POSITION: {
        ICON: 'bottom-8 left-8 sm:bottom-8 sm:left-8 lg:bottom-8 lg:left-8'
    }
} as const;

/**
 * Shadow and transition effects
 */
export const EFFECTS = {
    SHADOW: 'shadow-lg hover:shadow-xl',
    TRANSITION: 'transition-shadow duration-300',
    HOVER_SCALE: 1.02,
    HOVER_Y: -5
} as const;
