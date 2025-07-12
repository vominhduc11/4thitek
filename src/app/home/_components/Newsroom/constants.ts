/**
 * Animation durations and delays
 */
export const ANIMATION = {
    DURATION: {
        FAST: 0.3,
        NORMAL: 0.6,
        SLOW: 0.8
    },
    DELAY: {
        HEADER: 0.2,
        SUBTITLE: 0.5,
        TAGLINE: 0.7,
        BUTTON: 0.5,
        ITEM_MULTIPLIER: 0.1
    },
    SPRING: {
        STIFFNESS: 100
    }
} as const;

/**
 * Layout and spacing constants
 */
export const LAYOUT = {
    HOVER_LIFT: -10,
    HOVER_SCALE: 1.02,
    BUTTON_HOVER_SCALE: 1.05,
    BUTTON_TAP_SCALE: 0.95,
    ARROW_HOVER_SCALE: 1.2,
    ARROW_HOVER_ROTATE: 45
} as const;

/**
 * Default values for missing data
 */
export const DEFAULTS = {
    CATEGORY: 'News',
    DATE: '2024-07-09',
    TITLE: 'Sample Title',
    CONTENT: 'Sample content preview of this article will show here. Add real content.',
    READ_TIME: '2 min read'
} as const;
