/**
 * Feature card types
 */
export type FeatureCardType = 'image' | 'video' | 'product';

/**
 * Base feature card interface
 */
export interface BaseFeatureCard {
    /** Unique identifier */
    id: string;
    /** Card type */
    type: FeatureCardType;
    /** Alt text for accessibility */
    alt: string;
    /** CSS classes for styling */
    className?: string;
}

/**
 * Image-based feature card
 */
export interface ImageFeatureCard extends BaseFeatureCard {
    type: 'image';
    /** Background image URL */
    backgroundImage: string;
    /** Logo image URL */
    logoImage?: string;
    /** Icon image URL */
    iconImage?: string;
    /** Background color */
    backgroundColor?: string;
}

/**
 * Video-based feature card
 */
export interface VideoFeatureCard extends BaseFeatureCard {
    type: 'video';
    /** Video source URL */
    videoSrc: string;
    /** Title text */
    title: string;
    /** Subtitle text */
    subtitle?: string;
    /** Logo image URL */
    logoImage?: string;
    /** Icon image URL */
    iconImage?: string;
    /** Overlay image URL */
    overlayImage?: string;
    /** Gradient colors */
    gradientFrom: string;
    gradientTo: string;
}

/**
 * Product showcase card
 */
export interface ProductFeatureCard extends BaseFeatureCard {
    type: 'product';
    /** Product image URL */
    productImage: string;
    /** Brand logo URL */
    brandLogo?: string;
    /** Icon image URL */
    iconImage?: string;
    /** Background color */
    backgroundColor?: string;
}

/**
 * Union type for all feature cards
 */
export type FeatureCard = ImageFeatureCard | VideoFeatureCard | ProductFeatureCard;

/**
 * Animation configuration
 */
export interface FeatureCardAnimation {
    /** Animation duration */
    duration: number;
    /** Animation delay */
    delay: number;
    /** Animation type */
    type: 'spring' | 'tween';
}
