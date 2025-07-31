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
