/**
 * Represents a news article item
 */
export interface NewsItem {
    /** Unique identifier for the news item */
    id: number;
    /** Image URL for the news item */
    img: string;
    /** Short caption/description */
    caption: string;
    /** Article title */
    title: string;
    /** Article content/preview */
    content: string;
    /** Publication date */
    date: string;
    /** Article category */
    category: string;
}

/**
 * Animation configuration for news items
 */
export interface NewsAnimationConfig {
    /** Animation duration in seconds */
    duration: number;
    /** Animation delay multiplier */
    delayMultiplier: number;
    /** Spring animation stiffness */
    stiffness: number;
}
