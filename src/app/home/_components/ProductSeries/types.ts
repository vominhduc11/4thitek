/**
 * Represents a thumbnail image for a product series
 */
export interface Thumb {
    /** Unique identifier for the thumbnail */
    id: string;
    /** Image source URL */
    src: string;
    /** Display label for the thumbnail */
    label: string;
}

/**
 * Represents a product series with its main image and thumbnails
 */
export interface SeriesItem {
    /** Unique identifier for the series */
    id: string;
    /** Display name of the series (e.g., "SX SERIES") */
    label: string;
    /** Main image URL for the series */
    img: string;
    /** Optional array of thumbnail images */
    thumbs?: Thumb[];
}
