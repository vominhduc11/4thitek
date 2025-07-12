/**
 * Hero section animation configuration
 */
export interface HeroAnimationConfig {
    /** Animation duration in seconds */
    duration: number;
    /** Animation delay in seconds */
    delay: number;
    /** Spring animation stiffness */
    stiffness: number;
    /** Spring animation damping */
    damping: number;
}

/**
 * Floating particle configuration
 */
export interface ParticleConfig {
    /** Particle ID */
    id: number;
    /** Left position percentage */
    left: string;
    /** Top position percentage */
    top: string;
    /** Animation duration */
    duration: number;
    /** Animation delay */
    delay: number;
}

/**
 * Light ray configuration
 */
export interface LightRayConfig {
    /** Ray ID */
    id: number;
    /** Left position percentage */
    left: string;
    /** Animation duration */
    duration: number;
    /** Animation delay */
    delay: number;
}
