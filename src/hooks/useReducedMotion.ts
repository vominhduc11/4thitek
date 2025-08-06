import { useState, useEffect } from 'react';

/**
 * Hook to detect user's reduced motion preference and device performance
 */
export function useReducedMotion() {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isLowEndDevice, setIsLowEndDevice] = useState(false);

    useEffect(() => {
        // Check for reduced motion preference
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);

        // Check for mobile device
        setIsMobile(window.innerWidth <= 768);

        // Detect low-end device based on hardware concurrency and memory
        const nav = window.navigator as Navigator & { hardwareConcurrency?: number; deviceMemory?: number };
        const hardwareConcurrency = nav.hardwareConcurrency || 1;
        const deviceMemory = nav.deviceMemory || 1;
        
        setIsLowEndDevice(hardwareConcurrency <= 2 || deviceMemory <= 2);

        // Window resize listener for mobile detection
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Determine if animations should be reduced
    const shouldReduceAnimations = prefersReducedMotion || (isMobile && isLowEndDevice);

    return {
        prefersReducedMotion,
        isMobile,
        isLowEndDevice,
        shouldReduceAnimations
    };
}

/**
 * Hook for performance-aware animation settings
 */
export function useAnimationConfig() {
    const { shouldReduceAnimations, isMobile } = useReducedMotion();

    return {
        // Reduced duration for better performance
        duration: shouldReduceAnimations ? 0.1 : isMobile ? 0.2 : 0.3,
        
        // Simpler easing
        ease: shouldReduceAnimations ? 'linear' as const : 'easeOut' as const,
        
        // Reduced stagger delay
        stagger: shouldReduceAnimations ? 0 : isMobile ? 0.03 : 0.05,
        
        // Disable complex animations
        enableComplexAnimations: !shouldReduceAnimations,
        
        // Disable infinite animations
        enableInfiniteAnimations: !shouldReduceAnimations && !isMobile,
        
        // Disable decorative animations
        enableDecorativeAnimations: !shouldReduceAnimations
    };
}