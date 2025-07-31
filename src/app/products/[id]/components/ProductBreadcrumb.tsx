'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
    label: string;
    section: string;
}

interface ProductBreadcrumbProps {
    items: BreadcrumbItem[];
    activeBreadcrumb: string;
    onBreadcrumbClick: (item: BreadcrumbItem) => void;
}

export default function ProductBreadcrumb({ items, activeBreadcrumb, onBreadcrumbClick }: ProductBreadcrumbProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation immediately and with a slight delay for better effect
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const containerVariants = {
        hidden: {
            opacity: 0,
            y: -30,
            scale: 0.9
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 1.2,
                ease: 'easeOut' as const,
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants = {
        hidden: {
            opacity: 0,
            scale: 0.7,
            y: -20
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: 'easeOut' as const
            }
        }
    };

    const lineVariants = {
        hidden: {
            pathLength: 0,
            opacity: 0
        },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                duration: 2.5,
                ease: 'easeInOut' as const,
                delay: 0.8
            }
        }
    };

    const glowVariants = {
        hidden: {
            scale: 0,
            opacity: 0,
            rotate: -180
        },
        visible: {
            scale: 1,
            opacity: 1,
            rotate: 0,
            transition: {
                duration: 1.5,
                ease: 'easeOut' as const,
                delay: 0.5
            }
        }
    };

    return (
        <>
            {/* Mobile Navigation */}
            <motion.div
                className="md:hidden sticky top-16 z-[600] py-3 bg-[#0a0f1a]/95 backdrop-blur-sm border-b border-gray-800/50 relative overflow-hidden"
                initial="hidden"
                animate={isVisible ? 'visible' : 'hidden'}
                variants={containerVariants}
            >
                {/* Decorative Pattern */}
                <motion.div className="absolute inset-0 opacity-5" variants={glowVariants}>
                    <div className="absolute top-0 left-0 w-full h-full">
                        <div className="flex items-center justify-center h-full">
                            <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl transform -translate-x-16"></div>
                            <div className="w-24 h-24 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-2xl transform translate-x-20 -translate-y-4"></div>
                        </div>
                    </div>
                </motion.div>
                {/* Geometric Lines */}
                <motion.div className="absolute inset-0 opacity-10" variants={glowVariants}>
                    <svg className="w-full h-full" viewBox="0 0 400 60" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="lineGradientMobile" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{ stopColor: '#4FC8FF', stopOpacity: 0.3 }} />
                                <stop offset="50%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.6 }} />
                                <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 0.3 }} />
                            </linearGradient>
                        </defs>
                        <motion.path
                            d="M0,30 Q100,10 200,30 T400,30"
                            stroke="url(#lineGradientMobile)"
                            strokeWidth="1"
                            fill="none"
                            variants={lineVariants}
                        />
                        <motion.path
                            d="M0,45 Q150,25 300,45 Q350,50 400,45"
                            stroke="url(#lineGradientMobile)"
                            strokeWidth="0.5"
                            fill="none"
                            opacity="0.5"
                            variants={lineVariants}
                        />
                        <motion.circle cx="80" cy="30" r="1.5" fill="#4FC8FF" opacity="0.6" variants={glowVariants} />
                        <motion.circle cx="200" cy="30" r="1" fill="#8B5CF6" opacity="0.4" variants={glowVariants} />
                        <motion.circle cx="320" cy="45" r="1.2" fill="#EC4899" opacity="0.5" variants={glowVariants} />
                    </svg>
                </motion.div>
                <motion.div className="px-4 relative z-10" variants={itemVariants}>
                    <div className="relative">
                        <select
                            value={activeBreadcrumb}
                            onChange={(e) => {
                                const selectedItem = items.find((item) => item.label === e.target.value);
                                if (selectedItem) {
                                    onBreadcrumbClick(selectedItem);
                                }
                            }}
                            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none cursor-pointer"
                            aria-label="Select section"
                        >
                            {items.map((item) => (
                                <option key={item.label} value={item.label} className="bg-gray-800 text-white">
                                    {item.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Desktop Navigation */}
            <motion.div
                className="hidden md:block relative overflow-hidden"
                initial="hidden"
                animate={isVisible ? 'visible' : 'hidden'}
                variants={containerVariants}
            >
                {/* Decorative Pattern */}
                <motion.div className="absolute inset-0 opacity-5" variants={glowVariants}>
                    <div className="absolute top-0 left-0 w-full h-full">
                        <div className="flex items-center justify-center h-full">
                            <div className="w-40 h-40 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl transform -translate-x-32"></div>
                            <div className="w-32 h-32 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-2xl transform translate-x-40 -translate-y-6"></div>
                            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl transform -translate-x-20 translate-y-4"></div>
                        </div>
                    </div>
                </motion.div>
                {/* Geometric Lines */}
                <motion.div className="absolute inset-0 opacity-15" variants={glowVariants}>
                    <svg className="w-full h-full" viewBox="0 0 800 80" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="lineGradientDesktop" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{ stopColor: '#4FC8FF', stopOpacity: 0.4 }} />
                                <stop offset="25%" style={{ stopColor: '#06B6D4', stopOpacity: 0.6 }} />
                                <stop offset="50%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.8 }} />
                                <stop offset="75%" style={{ stopColor: '#D946EF', stopOpacity: 0.6 }} />
                                <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 0.4 }} />
                            </linearGradient>
                            <linearGradient id="lineGradientDesktop2" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{ stopColor: '#06B6D4', stopOpacity: 0.2 }} />
                                <stop offset="50%" style={{ stopColor: '#3B82F6', stopOpacity: 0.4 }} />
                                <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.2 }} />
                            </linearGradient>
                        </defs>
                        <motion.path
                            d="M0,40 Q200,15 400,40 T800,40"
                            stroke="url(#lineGradientDesktop)"
                            strokeWidth="1.5"
                            fill="none"
                            variants={lineVariants}
                        />
                        <motion.path
                            d="M0,55 Q300,35 600,55 Q700,60 800,55"
                            stroke="url(#lineGradientDesktop)"
                            strokeWidth="0.8"
                            fill="none"
                            opacity="0.6"
                            variants={lineVariants}
                        />
                        <motion.path
                            d="M0,25 Q150,10 300,25 Q450,35 600,25 T800,25"
                            stroke="url(#lineGradientDesktop2)"
                            strokeWidth="0.5"
                            fill="none"
                            opacity="0.4"
                            variants={lineVariants}
                        />
                        <motion.circle cx="120" cy="40" r="2" fill="#4FC8FF" opacity="0.7" variants={glowVariants} />
                        <motion.circle cx="280" cy="25" r="1.5" fill="#06B6D4" opacity="0.5" variants={glowVariants} />
                        <motion.circle cx="400" cy="40" r="2.5" fill="#8B5CF6" opacity="0.8" variants={glowVariants} />
                        <motion.circle cx="560" cy="25" r="1.8" fill="#D946EF" opacity="0.6" variants={glowVariants} />
                        <motion.circle cx="680" cy="55" r="1.2" fill="#EC4899" opacity="0.5" variants={glowVariants} />
                        <motion.polygon
                            points="200,15 205,20 195,20"
                            fill="#06B6D4"
                            opacity="0.3"
                            variants={glowVariants}
                        />
                        <motion.polygon
                            points="500,35 508,42 492,42"
                            fill="#8B5CF6"
                            opacity="0.4"
                            variants={glowVariants}
                        />
                    </svg>
                </motion.div>
                <motion.nav
                    className="flex space-x-8 border-b border-gray-800/50 mb-8 relative z-10"
                    variants={containerVariants}
                >
                    {items.map((item, index) => (
                        <motion.button
                            key={item.label}
                            onClick={() => onBreadcrumbClick(item)}
                            className={`relative py-4 text-sm font-medium transition-colors ${
                                activeBreadcrumb === item.label ? 'text-[#4FC8FF]' : 'text-gray-400 hover:text-white'
                            }`}
                            variants={itemVariants}
                            custom={index}
                            whileHover={{
                                scale: 1.05,
                                transition: { duration: 0.2 }
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {item.label}
                            {activeBreadcrumb === item.label && (
                                <motion.span
                                    className="absolute bottom-0 left-0 w-full h-0.5 bg-[#4FC8FF]"
                                    layoutId="activeTab"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                />
                            )}
                        </motion.button>
                    ))}
                </motion.nav>
            </motion.div>
        </>
    );
}
