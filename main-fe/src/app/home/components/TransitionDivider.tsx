'use client';

import { motion } from 'framer-motion';

interface TransitionDividerProps {
    fromColor: string;
    toColor: string;
    height?: 'sm' | 'md' | 'lg';
    type?: 'smooth' | 'wave' | 'diagonal';
}

const heightVariants = {
    sm: 'h-12',
    md: 'h-20',
    lg: 'h-32'
};

export default function TransitionDivider({
    fromColor,
    toColor,
    height = 'md',
    type = 'smooth'
}: TransitionDividerProps) {
    if (type === 'wave') {
        return (
            <div className={`relative w-full ${heightVariants[height]} overflow-hidden`}>
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(to bottom, ${fromColor}, ${toColor})`
                    }}
                />
                <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <motion.path
                        d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
                        fill={toColor}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: 'easeInOut' }}
                    />
                </svg>

                {/* Animated particles */}
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-[#4FC8FF]/20 rounded-full"
                        style={{
                            left: `${10 + i * 12}%`,
                            top: '60%'
                        }}
                        animate={{
                            y: [-5, 5, -5],
                            opacity: [0.2, 0.6, 0.2]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: 'easeInOut'
                        }}
                    />
                ))}
            </div>
        );
    }

    if (type === 'diagonal') {
        return (
            <div className={`relative w-full ${heightVariants[height]} overflow-hidden`}>
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(135deg, ${fromColor} 0%, ${fromColor} 40%, ${toColor} 60%, ${toColor} 100%)`
                    }}
                />

                {/* Diagonal lines effect */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute h-full w-px bg-[#4FC8FF]/10"
                        style={{
                            left: `${15 + i * 15}%`,
                            transform: 'rotate(15deg)',
                            transformOrigin: 'center'
                        }}
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{
                            scaleY: [0, 1, 0.8],
                            opacity: [0, 0.5, 0.2]
                        }}
                        transition={{
                            duration: 2,
                            delay: i * 0.2,
                            repeat: Infinity,
                            repeatType: 'reverse'
                        }}
                    />
                ))}
            </div>
        );
    }

    // Default: smooth gradient
    return (
        <div className={`relative w-full ${heightVariants[height]} overflow-hidden`}>
            <motion.div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(to bottom, ${fromColor}, ${toColor})`
                }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
                viewport={{ once: true }}
            />

            {/* Floating gradient overlay */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#4FC8FF]/5 to-transparent"
                animate={{
                    x: ['-100%', '100%']
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />

            {/* Central glow line */}
            <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2">
                <motion.div
                    className="h-px bg-gradient-to-r from-transparent via-[#4FC8FF]/30 to-transparent"
                    animate={{
                        opacity: [0.3, 0.8, 0.3],
                        scaleX: [0.8, 1.2, 0.8]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
            </div>
        </div>
    );
}
