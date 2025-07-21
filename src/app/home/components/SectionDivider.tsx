'use client';

import { motion } from 'framer-motion';

interface SectionDividerProps {
    variant?: 'gradient1' | 'gradient2' | 'gradient3' | 'gradient4';
    height?: 'sm' | 'md' | 'lg';
}

const gradientVariants = {
    gradient1: 'bg-gradient-to-r from-[#0c131d] via-[#1a1f2e] to-[#0c131d]',
    gradient2: 'bg-gradient-to-r from-[#0c131d] via-[#4FC8FF]/10 to-[#0c131d]',
    gradient3: 'bg-gradient-to-r from-[#0c131d] via-[#00D4FF]/10 to-[#0c131d]',
    gradient4: 'bg-gradient-to-r from-[#0c131d] via-[#2563eb]/10 to-[#0c131d]'
};

const heightVariants = {
    sm: 'h-16',
    md: 'h-24',
    lg: 'h-32'
};

export default function SectionDivider({ variant = 'gradient1', height = 'md' }: SectionDividerProps) {
    return (
        <motion.div
            className={`relative w-full ${heightVariants[height]} ${gradientVariants[variant]} overflow-hidden`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
        >
            {/* Animated gradient overlay */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#4FC8FF]/5 to-transparent"
                animate={{
                    x: ['-100%', '100%']
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />

            {/* Floating particles */}
            <div className="absolute inset-0">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-[#4FC8FF]/30 rounded-full"
                        style={{
                            left: `${20 + i * 15}%`,
                            top: '50%'
                        }}
                        animate={{
                            y: [-10, 10, -10],
                            opacity: [0.3, 0.8, 0.3]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.5,
                            ease: 'easeInOut'
                        }}
                    />
                ))}
            </div>

            {/* Central glow effect */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <motion.div
                    className="w-32 h-4 bg-gradient-to-r from-[#4FC8FF]/20 via-[#00D4FF]/20 to-[#4FC8FF]/20 rounded-full blur-sm"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
            </div>
        </motion.div>
    );
}
