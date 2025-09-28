// UI Constants - centralized values for consistent styling and behavior

// Animation durations (in seconds)
export const ANIMATION_DURATIONS = {
    FAST: 0.15,
    NORMAL: 0.3,
    SLOW: 0.5,
    VERY_SLOW: 0.8,
    EXTRA_SLOW: 1.2
} as const;

// Breakpoint values (in pixels)
export const BREAKPOINTS = {
    XS: 480,
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
    '3XL': 1920,
    '4XL': 2560
} as const;

// Spacing scale (in rem units)
export const SPACING = {
    XXS: 0.25,  // 4px
    XS: 0.5,    // 8px
    SM: 0.75,   // 12px
    MD: 1,      // 16px
    LG: 1.5,    // 24px
    XL: 2,      // 32px
    XXL: 3,     // 48px
    XXXL: 4     // 64px
} as const;

// Border radius values (in pixels)
export const BORDER_RADIUS = {
    NONE: 0,
    SM: 4,
    MD: 8,
    LG: 12,
    XL: 16,
    FULL: 9999
} as const;

// Shadow levels
export const SHADOWS = {
    NONE: 'none',
    SM: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    MD: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    LG: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    XL: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2XL': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    INNER: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
} as const;

// Component sizes
export const COMPONENT_SIZES = {
    BUTTON: {
        SM: { height: 32, padding: '0 12px', fontSize: '14px' },
        MD: { height: 40, padding: '0 16px', fontSize: '16px' },
        LG: { height: 48, padding: '0 24px', fontSize: '18px' }
    },
    INPUT: {
        SM: { height: 32, padding: '0 12px', fontSize: '14px' },
        MD: { height: 40, padding: '0 16px', fontSize: '16px' },
        LG: { height: 48, padding: '0 20px', fontSize: '18px' }
    },
    AVATAR: {
        XS: 24,
        SM: 32,
        MD: 40,
        LG: 48,
        XL: 64,
        XXL: 96
    }
} as const;

// Layout constants
export const LAYOUT = {
    HEADER_HEIGHT: 80,
    FOOTER_HEIGHT: 200,
    SIDEBAR_WIDTH: 280,
    CONTAINER_MAX_WIDTH: 1400,
    CONTENT_MAX_WIDTH: 1200
} as const;

// Grid system
export const GRID = {
    COLUMNS: 12,
    GUTTER: 16,
    CONTAINER_PADDING: 24
} as const;


// Image dimensions
export const IMAGE_DIMENSIONS = {
    THUMBNAIL: { width: 150, height: 150 },
    CARD: { width: 300, height: 200 },
    HERO: { width: 1200, height: 600 },
    BLOG_FEATURED: { width: 800, height: 400 },
    PRODUCT_DETAIL: { width: 600, height: 600 }
} as const;

// Loading states
export const LOADING_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
} as const;

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
    MAX_VISIBLE_PAGES: 5
} as const;

// Modal/Dialog sizes
export const MODAL_SIZES = {
    SM: { width: 400, maxHeight: '80vh' },
    MD: { width: 600, maxHeight: '85vh' },
    LG: { width: 800, maxHeight: '90vh' },
    XL: { width: 1000, maxHeight: '95vh' },
    FULL: { width: '100vw', height: '100vh' }
} as const;

// Notification/Toast settings
export const NOTIFICATION = {
    DURATION: {
        SHORT: 3000,    // 3 seconds
        MEDIUM: 5000,   // 5 seconds
        LONG: 8000      // 8 seconds
    },
    MAX_VISIBLE: 5
} as const;