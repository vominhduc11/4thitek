/**
 * Animation timing constants
 */
export const ANIMATION_TIMING = {
    DURATION: {
        FAST: 0.3,
        NORMAL: 0.8,
        SLOW: 1.2,
        VERY_SLOW: 2.0
    },
    DELAY: {
        OVERLAY: 0.5,
        TITLE: 1.0,
        PRODUCT: 1.5,
        DESCRIPTION_WRAPPER: 2.2,
        DESCRIPTION: 2.5,
        BUTTON: 2.8,
        GRADIENT: 1.5
    },
    SPRING: {
        STIFFNESS: {
            LOW: 80,
            MEDIUM: 100,
            HIGH: 200,
            VERY_HIGH: 300
        },
        DAMPING: {
            LOW: 12,
            MEDIUM: 15,
            HIGH: 20
        }
    }
} as const;

/**
 * Responsive breakpoint values
 */
export const RESPONSIVE = {
    HEIGHTS: {
        MOBILE: '450px',
        XS: '500px',
        SM: '600px',
        MD: '700px',
        LG: '800px'
    },
    FONT_SIZES: {
        MOBILE: '45px',
        XS: '55px',
        SM: '80px',
        MD: '120px',
        LG: '160px',
        XL: '200px'
    },
    IMAGE_WIDTHS: {
        MOBILE: '180px',
        XS: '220px',
        SM: '280px',
        MD: '350px',
        LG: '384px'
    }
} as const;

/**
 * Effect configuration
 */
export const EFFECTS = {
    PARTICLES: {
        COUNT: 6,
        BASE_DURATION: 2.5,
        DURATION_INCREMENT: 0.3,
        DELAY_INCREMENT: 0.4,
        POSITION_INCREMENT: 15,
        BASE_LEFT: 10,
        BASE_TOP: 20,
        TOP_INCREMENT: 25
    },
    LIGHT_RAYS: {
        COUNT: 2,
        BASE_DURATION: 3.5,
        DURATION_INCREMENT: 0.5,
        DELAY_INCREMENT: 1.5,
        BASE_LEFT: 25,
        POSITION_INCREMENT: 30,
        ROTATION: '12deg'
    }
} as const;

/**
 * Product information
 */
export const PRODUCT_INFO = {
    NAME: 'SCS S8X',
    IMAGE: '/products/product1.png',
    VIDEO: '/videos/motorbike-road-trip-2022-07-26-01-49-02-utc.mp4',
    DESCRIPTION: `SCSETC latest S8X's unique appearance and a variety of functions allow users to have a better product experience. S8X has a unique rain proof structure, Bluetooth 5.0 communication technology, group intercom connection, advanced noise control, stereo music playback, GPS navigation, etc.`,
    CTA_TEXT: 'DISCOVERY NOW'
} as const;
