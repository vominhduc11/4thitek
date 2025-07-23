'use client';

import { motion } from 'framer-motion';
import Breadcrumb from './Breadcrumb';

interface BreadcrumbItem {
    label: string;
    href?: string;
    active?: boolean;
}

interface HeroProps {
    breadcrumbItems?: BreadcrumbItem[];
}

export default function Hero({ breadcrumbItems = [] }: HeroProps) {
    return (
        <section className="relative w-full h-[250px] xs:h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] overflow-hidden">
            {/* Background Video - Responsive scaling */}
            <motion.video
                src="/videos/motorbike-road-trip-2022-07-26-01-49-02-utc.mp4"
                className="absolute inset-0 w-full h-full object-cover transform-gpu"
                autoPlay
                loop
                muted
                playsInline
                initial={{ scale: 1.05, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
            />

            {/* Dark Overlay */}
            <motion.div
                className="absolute inset-0 bg-black/60 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
            />

            {/* Breadcrumb - Aligned with content below */}
            {breadcrumbItems.length > 0 && (
                <div className="absolute bottom-8 xs:bottom-10 sm:bottom-12 left-[80px] sm:left-[128px] md:left-[144px] lg:left-[160px] z-[110]">
                    <Breadcrumb items={breadcrumbItems} />
                </div>
            )}

            {/* Gradient Overlay - Responsive transition to content below */}
            <motion.div
                className="absolute inset-x-0 bottom-0 h-16 xs:h-20 sm:h-32 md:h-48 lg:h-64 bg-gradient-to-b from-transparent to-[#0c131d] pointer-events-none z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, delay: 1.5 }}
            />
        </section>
    );
}
