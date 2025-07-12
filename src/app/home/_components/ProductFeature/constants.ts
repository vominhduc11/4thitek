/**
 * Animation durations in seconds
 */
export const ANIMATION_DURATION = {
    FAST: 0.3,
    NORMAL: 0.5,
    SLOW: 1.0,
    PATTERN_DELAY: 0.2
} as const;

/**
 * Animation spring configuration
 */
export const SPRING_CONFIG = {
    stiffness: 300,
    damping: 30
} as const;

/**
 * Animation distances in pixels
 */
export const ANIMATION_DISTANCE = {
    SLIDE: 300,
    ROTATE: 35,
    VERTICAL: 40
} as const;
