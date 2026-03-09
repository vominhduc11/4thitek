// Animation constants for consistent motion across the application

export const ANIMATION_DURATION = {
  fast: 0.2,     // Micro-interactions, quick feedback
  normal: 0.3,   // Hover effects, buttons, standard transitions
  slow: 0.6,     // Page loads, cards, content reveals
  slower: 0.8,   // Hero sections, major page transitions
  slowest: 1.2   // Special dramatic effects only
} as const;

export const ANIMATION_EASING = {
  easeOut: 'easeOut',
  easeInOut: 'easeInOut',
  spring: { type: 'spring' as const, stiffness: 120, damping: 20 },
  springBouncy: { type: 'spring' as const, stiffness: 400, damping: 17 },
  springGentle: { type: 'spring' as const, stiffness: 100, damping: 15 }
} as const;

export const ANIMATION_OFFSET = {
  small: 20,   // Subtle movements
  medium: 30,  // Standard page loads (most common)
  large: 50    // Dramatic entrances
} as const;

export const ANIMATION_SCALE = {
  hover: 1.05,    // Standard hover scale
  tap: 0.95,      // Button press feedback
  entrance: 0.9   // Initial scale for entrance animations
} as const;

export const ANIMATION_STAGGER = {
  fast: 0.05,    // For large lists (>8 items)
  normal: 0.1,   // Standard stagger (most common)
  slow: 0.2      // For dramatic effect with few items
} as const;

// Reusable animation variants
export const pageTransition = {
  initial: { opacity: 0, y: ANIMATION_OFFSET.medium },
  animate: { opacity: 1, y: 0 },
  transition: { duration: ANIMATION_DURATION.slow, ease: ANIMATION_EASING.easeOut }
};

export const cardEntrance = {
  initial: { opacity: 0, y: ANIMATION_OFFSET.medium },
  animate: { opacity: 1, y: 0 },
  transition: { duration: ANIMATION_DURATION.slow }
};

export const cardHover = {
  whileHover: { 
    y: -5, 
    scale: ANIMATION_SCALE.hover,
    transition: { duration: ANIMATION_DURATION.normal }
  }
};

export const buttonHover = {
  whileHover: { 
    scale: ANIMATION_SCALE.hover,
    transition: { duration: ANIMATION_DURATION.normal }
  },
  whileTap: { 
    scale: ANIMATION_SCALE.tap,
    transition: { duration: ANIMATION_DURATION.fast }
  }
};

export const fadeInUp = {
  initial: { opacity: 0, y: ANIMATION_OFFSET.medium },
  animate: { opacity: 1, y: 0 }
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -ANIMATION_OFFSET.small },
  animate: { opacity: 1, x: 0 }
};

export const fadeInRight = {
  initial: { opacity: 0, x: ANIMATION_OFFSET.small },
  animate: { opacity: 1, x: 0 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: ANIMATION_SCALE.entrance },
  animate: { opacity: 1, scale: 1 }
};

// Viewport animation settings
export const viewportSettings = {
  once: true,
  margin: '-50px'
};

export const viewportSettingsLarge = {
  once: true,
  margin: '-100px'
};

// Common transition configurations
export const getStaggerTransition = (index: number, staggerType: keyof typeof ANIMATION_STAGGER = 'normal') => ({
  duration: ANIMATION_DURATION.slow,
  delay: index * ANIMATION_STAGGER[staggerType],
  ease: ANIMATION_EASING.easeOut
});

export const getHoverTransition = (duration: keyof typeof ANIMATION_DURATION = 'normal') => ({
  duration: ANIMATION_DURATION[duration]
});