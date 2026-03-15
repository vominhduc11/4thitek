'use client';

import { motion } from 'framer-motion';
import { useAnimationConfig } from '@/hooks/useReducedMotion';

interface AdvancedDividerProps {
    type?: 'wave' | 'geometric' | 'dots' | 'lines';
    direction?: 'up' | 'down';
    intensity?: 'subtle' | 'medium' | 'strong';
}

export default function AdvancedDivider({
    type = 'wave',
    direction = 'down',
    intensity = 'medium'
}: AdvancedDividerProps) {
    const { enableInfiniteAnimations, enableDecorativeAnimations } = useAnimationConfig();

    const intensityColors = {
        subtle: 'from-[#4FC8FF]/5 to-[#00D4FF]/5',
        medium: 'from-[#4FC8FF]/10 to-[#00D4FF]/10',
        strong: 'from-[#4FC8FF]/20 to-[#00D4FF]/20'
    };

    if (type === 'wave') {
        return (
            <div className="relative w-full h-24 overflow-hidden">
                <svg
                    className={`absolute w-full h-full ${direction === 'up' ? 'rotate-180' : ''}`}
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <motion.path
                        d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
                        fill="url(#adv-gradient)"
                        initial={enableDecorativeAnimations ? { pathLength: 0, opacity: 0 } : { opacity: 1 }}
                        animate={enableDecorativeAnimations ? { pathLength: 1, opacity: 1 } : { opacity: 1 }}
                        transition={{ duration: 2, ease: 'easeInOut' }}
                    />
                    <defs>
                        {enableInfiniteAnimations ? (
                            <motion.linearGradient
                                id="adv-gradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                                animate={{ x1: ['0%', '100%', '0%'], x2: ['100%', '200%', '100%'] }}
                                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                            >
                                <stop offset="0%" stopColor="#4FC8FF" stopOpacity="0.1" />
                                <stop offset="50%" stopColor="#00D4FF" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#4FC8FF" stopOpacity="0.1" />
                            </motion.linearGradient>
                        ) : (
                            <linearGradient id="adv-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#4FC8FF" stopOpacity="0.1" />
                                <stop offset="50%" stopColor="#00D4FF" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#4FC8FF" stopOpacity="0.1" />
                            </linearGradient>
                        )}
                    </defs>
                </svg>
                <div className={`absolute inset-0 bg-gradient-to-r ${intensityColors[intensity]}`} />
            </div>
        );
    }

    if (type === 'geometric') {
        return (
            <div className="relative w-full h-20 overflow-hidden bg-[#0c131d]" aria-hidden="true">
                <div className="absolute inset-0 flex items-center justify-center">
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            className={`w-0 h-0 mx-4 ${direction === 'up' ? 'rotate-180' : ''}`}
                            style={{
                                borderLeft: '20px solid transparent',
                                borderRight: '20px solid transparent',
                                borderBottom: '30px solid rgba(79, 200, 255, 0.1)'
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={
                                enableInfiniteAnimations
                                    ? { scale: [0, 1.2, 1], opacity: [0, 0.8, 0.3] }
                                    : { scale: 1, opacity: 0.3 }
                            }
                            transition={
                                enableInfiniteAnimations
                                    ? { duration: 2, delay: i * 0.2, repeat: Infinity, repeatType: 'reverse' }
                                    : { duration: 0.5, delay: i * 0.05 }
                            }
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'dots') {
        return (
            <div className="relative w-full h-16 overflow-hidden bg-[#0c131d]" aria-hidden="true">
                <div className="absolute inset-0 flex items-center justify-center">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 mx-2 bg-[#4FC8FF]/20 rounded-full"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={
                                enableInfiniteAnimations
                                    ? { scale: [0, 1.5, 0.5], opacity: [0, 1, 0.3], y: direction === 'up' ? [-10, 0, -5] : [10, 0, 5] }
                                    : { scale: 1, opacity: 0.4 }
                            }
                            transition={
                                enableInfiniteAnimations
                                    ? { duration: 3, delay: i * 0.1, repeat: Infinity, ease: 'easeInOut' }
                                    : { duration: 0.4, delay: i * 0.03 }
                            }
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Default: lines
    return (
        <div className="relative w-full h-12 overflow-hidden bg-[#0c131d]" aria-hidden="true">
            <div className="absolute inset-0 flex items-center">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="flex-1 h-px bg-gradient-to-r from-transparent via-[#4FC8FF]/30 to-transparent mx-2"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={
                            enableInfiniteAnimations
                                ? { scaleX: [0, 1, 0.7], opacity: [0, 1, 0.5] }
                                : { scaleX: 1, opacity: 0.5 }
                        }
                        transition={
                            enableInfiniteAnimations
                                ? { duration: 2, delay: i * 0.3, repeat: Infinity, repeatType: 'reverse' }
                                : { duration: 0.5, delay: i * 0.07 }
                        }
                    />
                ))}
            </div>
        </div>
    );
}
