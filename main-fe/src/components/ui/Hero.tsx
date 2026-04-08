'use client';

import { motion } from 'framer-motion';
import Breadcrumb from './Breadcrumb';
import { Z_INDEX } from '@/constants/zIndex';

interface BreadcrumbItem {
    label: string;
    href?: string;
    active?: boolean;
}

interface HeroProps {
    breadcrumbItems?: BreadcrumbItem[];
    breadcrumbWrapperClassName?: string;
    videoSrc?: string;
}

const defaultBreadcrumbWrapperClassName = 'ml-0 sm:ml-16 md:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20';
const defaultVideoSrc = '/videos/hero-brand-network-service-loop.mp4';

export default function Hero({
    breadcrumbItems = [],
    breadcrumbWrapperClassName = defaultBreadcrumbWrapperClassName,
    videoSrc = defaultVideoSrc
}: HeroProps) {
    return (
        <section className="relative h-[250px] w-full overflow-hidden xs:h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] 2xl:h-[500px] 3xl:h-[600px]">
            <motion.video
                src={videoSrc}
                className="absolute inset-0 w-full h-full object-cover transform-gpu"
                autoPlay
                loop
                muted
                playsInline
                initial={{ scale: 1.05, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
            />

            <motion.div
                className="absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(6,17,27,0.88),rgba(6,17,27,0.58)_44%,rgba(6,17,27,0.82))]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
            />
            <div className="absolute inset-0 z-10 bg-topo opacity-45" />
            <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_top_right,rgba(41,171,226,0.32),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(0,113,188,0.26),transparent_32%)]" />
            <div className="absolute inset-0 z-10 bg-[linear-gradient(180deg,transparent_0%,rgba(6,17,27,0.1)_45%,rgba(6,17,27,0.86)_100%)]" />
            <div className="absolute inset-x-0 top-0 z-10 h-1 bg-[linear-gradient(90deg,rgba(41,171,226,0),rgba(41,171,226,0.82),rgba(0,113,188,0))]" />

            {/* Breadcrumb - Aligned with content below */}
            {breadcrumbItems.length > 0 && (
                <div className="absolute bottom-8 xs:bottom-10 sm:bottom-12 left-0 right-0" style={{ zIndex: Z_INDEX.STICKY }}>
                    <div className={breadcrumbWrapperClassName}>
                        <Breadcrumb items={breadcrumbItems} />
                    </div>
                </div>
            )}

            <motion.div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-b from-transparent to-[#06111B] xs:h-20 sm:h-32 md:h-48 lg:h-64 2xl:h-72 3xl:h-80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, delay: 1.5 }}
            />
        </section>
    );
}
