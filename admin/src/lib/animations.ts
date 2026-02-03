/**
 * @fileoverview Framer Motion animation variants and utilities
 * @module lib/animations
 */

// Fade animations
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
}

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.4, ease: "easeOut" }
}

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: "easeOut" }
}

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.4, ease: "easeOut" }
}

export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.4, ease: "easeOut" }
}

// Scale animations
export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.3, ease: "easeOut" }
}

export const scaleUp = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  exit: { scale: 0 },
  transition: { type: "spring", stiffness: 260, damping: 20 }
}

// Slide animations
export const slideInUp = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
  transition: { type: "spring", stiffness: 300, damping: 30 }
}

export const slideInDown = {
  initial: { y: "-100%" },
  animate: { y: 0 },
  exit: { y: "-100%" },
  transition: { type: "spring", stiffness: 300, damping: 30 }
}

export const slideInLeft = {
  initial: { x: "-100%" },
  animate: { x: 0 },
  exit: { x: "-100%" },
  transition: { type: "spring", stiffness: 300, damping: 30 }
}

export const slideInRight = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
  transition: { type: "spring", stiffness: 300, damping: 30 }
}

// Stagger animations for lists
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
}

// Hover effects
export const hoverScale = {
  scale: 1.05,
  transition: { type: "spring", stiffness: 400, damping: 10 }
}

export const hoverLift = {
  y: -4,
  boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.15)",
  transition: { type: "spring", stiffness: 400, damping: 20 }
}

export const hoverGlow = {
  boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
  transition: { duration: 0.3 }
}

// Tap effects
export const tapScale = {
  scale: 0.95,
  transition: { type: "spring", stiffness: 400, damping: 17 }
}

// Page transitions
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: "easeInOut" }
}

export const pageSlide = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "-100%", opacity: 0 },
  transition: { type: "spring", stiffness: 300, damping: 30 }
}

// Loading animations
export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1]
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
}

export const bounce = {
  animate: {
    y: [0, -10, 0]
  },
  transition: {
    duration: 0.6,
    repeat: Infinity,
    ease: "easeInOut"
  }
}

export const spin = {
  animate: { rotate: 360 },
  transition: { duration: 1, repeat: Infinity, ease: "linear" }
}

// Modal/Dialog animations
export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
}

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
  transition: { type: "spring", duration: 0.3, bounce: 0 }
}

// Notification animations
export const notificationSlide = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 0 },
  transition: { type: "spring", stiffness: 300, damping: 30 }
}

// Card grid animations
export const cardGridContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
}

export const cardGridItem = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3 }
}

// Utility function to create custom stagger
export const createStagger = (staggerDelay = 0.1, delayChildren = 0) => ({
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren
    }
  }
})

// Utility function for spring animations
export const springTransition = (stiffness = 300, damping = 20) => ({
  type: "spring",
  stiffness,
  damping
})
