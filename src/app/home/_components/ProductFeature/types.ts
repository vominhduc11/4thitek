/**
 * Represents a featured product item
 */
export interface FeaturedItem {
    /** Unique identifier for the item */
    id: number;
    /** Product title/name */
    title: string;
    /** Product image URL */
    img: string;
    /** Product description */
    description: string;
}

/**
 * Direction for carousel navigation
 */
export type CarouselDirection = -1 | 0 | 1;

/**
 * Animation variant keys
 */
export type AnimationVariant = 'enter' | 'center' | 'exit' | 'hidden' | 'visible' | 'hover' | 'tap';
