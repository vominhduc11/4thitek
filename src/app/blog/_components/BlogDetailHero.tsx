'use client';

import { MdHome, MdChevronRight } from 'react-icons/md';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BlogPost } from './types';

interface BlogDetailHeroProps {
    post: BlogPost;
    readingProgress?: number;
    liked?: boolean;
    onLikeToggle?: () => void;
    onShare?: () => void;
}

export function BlogDetailHero({ post }: BlogDetailHeroProps) {
    const categories = [
        { id: 'ALL', name: 'Tất Cả' },
        { id: 'TECHNOLOGY', name: 'Công Nghệ' },
        { id: 'TUTORIAL', name: 'Hướng Dẫn' },
        { id: 'NEWS', name: 'Tin Tức' },
        { id: 'REVIEW', name: 'Đánh Giá' },
        { id: 'TIPS', name: 'Mẹo Hay' }
    ];

    const currentCategory = categories.find((cat) => cat.id === post.category);

    return (
        <section className="relative w-full h-[400px] overflow-hidden">
            {/* Background Video */}
            <motion.video
                src="/videos/motorbike-road-trip-2022-07-26-01-49-02-utc.mp4"
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 2, ease: 'easeOut' }}
            />

            {/* Dark Overlay */}
            <motion.div
                className="absolute inset-0 bg-black/60 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
            />

            {/* Breadcrumb - Bottom Left */}
            <motion.div
                className="absolute bottom-16 sm:bottom-20 lg:bottom-24 left-20 sm:left-24 z-20"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
            >
                <div className="px-12 sm:px-16 lg:px-20">
                    <nav className="flex items-center space-x-2 text-sm">
                        <motion.div whileHover={{ scale: 1.05 }}>
                            <Link
                                href="/"
                                className="text-gray-300 hover:text-[#4FC8FF] transition-colors duration-300 flex items-center gap-1"
                            >
                                <MdHome size={16} />
                                <span>Home</span>
                            </Link>
                        </motion.div>
                        <MdChevronRight size={16} className="text-gray-500" />
                        <motion.div whileHover={{ scale: 1.05 }}>
                            <Link
                                href="/blog"
                                className="text-gray-300 hover:text-[#4FC8FF] transition-colors duration-300"
                            >
                                Blog
                            </Link>
                        </motion.div>
                        <MdChevronRight size={16} className="text-gray-500" />
                        <motion.div whileHover={{ scale: 1.05 }}>
                            <Link
                                href={`/blog?category=${post.category}`}
                                className="text-gray-300 hover:text-[#4FC8FF] transition-colors duration-300"
                            >
                                {currentCategory?.name}
                            </Link>
                        </motion.div>
                        <MdChevronRight size={16} className="text-gray-500" />
                        <span className="text-white font-medium truncate max-w-xs">
                            {post.title.length > 30 ? `${post.title.substring(0, 30)}...` : post.title}
                        </span>
                    </nav>
                </div>
            </motion.div>

            {/* Gradient Overlay - Transition to content below */}
            <motion.div
                className="
          absolute inset-x-0 bottom-0
          h-24 xs:h-32 sm:h-48 md:h-64
          bg-gradient-to-b
          from-transparent
          to-[#0c131d]
          pointer-events-none
          z-10
        "
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, delay: 1.5 }}
            />
        </section>
    );
}
