import { memo } from 'react';
import { motion, Variants } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import { NewsItem } from './types';
import { LAYOUT, DEFAULTS } from './constants';

interface NewsCardProps {
    post: NewsItem;
    index: number;
    animationVariant: Variants;
}

function NewsCard({ post, index, animationVariant }: NewsCardProps) {
    return (
        <motion.div
            className="relative w-full h-64 sm:h-72 md:h-80 bg-black/10 rounded-lg overflow-hidden group cursor-pointer"
            variants={animationVariant}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{
                y: LAYOUT.HOVER_LIFT,
                scale: LAYOUT.HOVER_SCALE,
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                transition: { duration: 0.3 }
            }}
        >
            <motion.img
                src={post.img}
                alt={post.caption}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.4 }}
                loading={index < 3 ? 'eager' : 'lazy'}
            />
            
            {/* Overlay Content */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2 sm:p-3 md:p-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#4FC8FF] text-white text-xs font-semibold rounded-full">
                        {post.category || DEFAULTS.CATEGORY}
                    </span>
                    <span className="text-white/70 text-xs font-medium">
                        {post.date || DEFAULTS.DATE}
                    </span>
                </div>
                
                {/* Main Content */}
                <div className="flex-1 flex flex-col justify-center space-y-2 my-3">
                    <h3 className="text-white font-bold text-xs sm:text-sm md:text-base leading-tight line-clamp-2">
                        {post.title || DEFAULTS.TITLE}
                    </h3>
                    <p className="text-white/90 text-xs leading-relaxed line-clamp-3">
                        {post.content || DEFAULTS.CONTENT}
                    </p>
                </div>
                
                {/* Footer */}
                <div className="flex justify-between items-end">
                    <div className="flex-1 mr-1 sm:mr-2">
                        <p className="text-white/70 text-xs leading-tight line-clamp-2">
                            {post.caption}
                        </p>
                    </div>
                    <motion.button
                        className="p-1.5 sm:p-2 bg-white/20 hover:bg-[#4FC8FF] rounded-full transition-colors duration-300 flex-shrink-0"
                        whileHover={{
                            scale: LAYOUT.ARROW_HOVER_SCALE,
                            rotate: LAYOUT.ARROW_HOVER_ROTATE,
                            backgroundColor: '#4FC8FF'
                        }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        aria-label={`Read more about ${post.title}`}
                    >
                        <FiArrowUpRight size={12} className="sm:w-3.5 sm:h-3.5" color="white" />
                    </motion.button>
                </div>
            </div>

            {/* Animated border */}
            <motion.div
                className="absolute inset-0 border-2 border-transparent rounded-lg pointer-events-none"
                whileHover={{
                    borderColor: '#4FC8FF',
                    boxShadow: '0 0 20px rgba(79, 200, 255, 0.3)'
                }}
                transition={{ duration: 0.3 }}
            />
            
            {/* Reading time indicator */}
            <motion.div
                className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-black/60 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ scale: 0 }}
                whileHover={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
            >
                <span className="text-white text-xs font-medium">{DEFAULTS.READ_TIME}</span>
            </motion.div>
        </motion.div>
    );
}

export default memo(NewsCard);
