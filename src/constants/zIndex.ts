/**
 * Z-Index Hierarchy Constants
 *
 * This file defines a consistent z-index hierarchy for the entire application.
 * Use these constants instead of arbitrary z-index values to maintain proper layering.
 */

export const Z_INDEX = {
    // Background elements
    BEHIND: -1, // For elements that should be behind content
    BASE: 0, // Base content level

    // Content layers
    CONTENT: 1, // Regular content
    ELEVATED: 10, // Slightly elevated content (cards, etc.)

    // UI Components
    TOOLTIP: 50, // Tooltips and small popups
    DROPDOWN: 100, // Dropdown menus
    STICKY: 200, // Sticky elements (breadcrumbs, etc.)
    OVERLAY: 300, // General overlays

    // Navigation
    SIDEBAR: 900, // Side navigation
    HEADER: 1000, // Main header/navigation

    // Modals & Dialogs
    MODAL_BACKDROP: 2000, // Modal backdrop/overlay
    MODAL: 2001, // Modal content

    // Critical overlays (highest priority modals)
    DRAWER_BACKDROP: 3000, // Side drawer backdrop
    DRAWER: 3001, // Side drawer content

    // Notifications & Alerts
    TOAST: 4000, // Toast notifications
    ALERT: 4001, // Critical alerts

    // Development/Debug (should only be used temporarily)
    DEBUG: 9999 // Debug overlays
} as const;

// Type for z-index values
export type ZIndexValue = (typeof Z_INDEX)[keyof typeof Z_INDEX];

// Helper function to get Tailwind z-index class
export const getZIndexClass = (level: ZIndexValue): string => {
    if (level < 0) return `-z-${Math.abs(level)}`;
    if (level <= 50) return `z-${level}`;
    return `z-[${level}]`;
};

// Migration mapping for common z-index values to proper constants
export const Z_INDEX_MIGRATION = {
    'z-5': Z_INDEX.CONTENT,
    'z-10': Z_INDEX.ELEVATED,
    'z-20': Z_INDEX.TOOLTIP,
    'z-25': Z_INDEX.TOOLTIP,
    'z-30': Z_INDEX.DROPDOWN,
    'z-50': Z_INDEX.TOOLTIP,
    'z-[110]': Z_INDEX.OVERLAY,
    'z-[200]': Z_INDEX.STICKY,
    'z-[300]': Z_INDEX.OVERLAY,
    'z-[600]': Z_INDEX.SIDEBAR,
} as const;
