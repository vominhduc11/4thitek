import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { Thumb } from './types';
import clsx from 'clsx';
import Image from 'next/image';

interface SeriesThumbnailsProps {
    thumbs: Thumb[];
    activeThumb: number;
    setActiveThumb: (value: number) => void;
    handleThumbNavigation: (direction: 'left' | 'right', thumbsLength: number) => void;
}

export default function SeriesThumbnails({ 
    thumbs, 
    activeThumb, 
    setActiveThumb, 
    handleThumbNavigation 
}: SeriesThumbnailsProps) {
    return (
        <motion.div
            className="relative mb-4 xs:mb-6 sm:mb-8 md:mb-10"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: true }}
        >
            <div className="border-b border-gray-700/50"></div>
            {/* Thumbnails positioned to interrupt the divider */}
            <motion.div
                className="absolute top-0 right-0 xs:right-2 sm:right-0 transform -translate-y-1/2 z-30 max-w-[90%] xs:max-w-none"
                style={{ paddingTop: '8px' }}
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
            >
                <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3 overflow-x-auto overflow-y-visible scrollbar-hide bg-[#0c131d] px-1.5 xs:px-2 sm:px-4 py-2 xs:py-2.5 sm:py-3 scroll-smooth shadow-lg border border-gray-700/30 rounded-lg">
                    {/* Left Navigation Button */}
                    <button
                        onClick={() => handleThumbNavigation('left', thumbs.length)}
                        className={clsx(
                            'p-1 xs:p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 transition-colors rounded flex-shrink-0 z-20 min-w-[32px] xs:min-w-[36px] sm:min-w-[40px] min-h-[32px] xs:min-h-[36px] sm:min-h-[40px] flex items-center justify-center',
                            activeThumb === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                        )}
                        disabled={activeThumb === 0}
                    >
                        <FiChevronLeft size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" color="white" />
                    </button>
                    {thumbs.map((thumb, idx) => (
                        <motion.div
                            key={`${thumb.id}-${idx}-${thumb.label}`}
                            className={clsx(
                                'relative w-[45px] xs:w-[55px] sm:w-[70px] md:w-[90px] lg:w-[100px] h-[28px] xs:h-[35px] sm:h-[45px] md:h-[60px] lg:h-[70px] cursor-pointer border-2 rounded overflow-hidden flex-shrink-0 bg-[#0c131d] z-10',
                                idx === activeThumb
                                    ? 'border-blue-400 shadow-lg shadow-blue-400/30'
                                    : 'border-white/30 hover:border-white/60'
                            )}
                            onClick={() => setActiveThumb(idx)}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                duration: 0.4,
                                delay: idx * 0.05,
                                ease: 'easeOut'
                            }}
                            whileHover={{
                                scale: 1.05,
                                zIndex: 50,
                                boxShadow: '0 4px 15px rgba(79, 200, 255, 0.4)',
                                transition: { duration: 0.2, ease: 'easeOut' }
                            }}
                            whileTap={{
                                scale: 0.98,
                                transition: { duration: 0.1, ease: 'easeInOut' }
                            }}
                        >
                            <div className="w-full h-full relative overflow-hidden">
                                <Image
                                    width={0}
                                    height={0}
                                    sizes="(max-width: 475px) 45px, (max-width: 640px) 55px, (max-width: 768px) 70px, (max-width: 1024px) 90px, 100px"
                                    priority
                                    src={thumb.src}
                                    alt={thumb.label}
                                    className="w-full h-full object-cover transition-transform duration-200 ease-out"
                                />

                                {/* Subtle active indicator cho thumbnail */}
                                {idx === activeThumb && (
                                    <motion.div
                                        className="absolute inset-0 bg-blue-400/10"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                    />
                                )}
                            </div>

                            <span className="absolute top-0.5 xs:top-1 left-0.5 xs:left-1 md:left-2 text-white text-[10px] xs:text-xs font-bold z-10 drop-shadow-sm">
                                {thumb.label}
                            </span>

                            {/* Subtle click feedback */}
                            <motion.div
                                className="absolute inset-0 bg-white/10 rounded pointer-events-none"
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileTap={{
                                    opacity: [0, 0.6, 0],
                                    scale: [0.8, 1, 1],
                                    transition: { duration: 0.25, ease: 'easeOut' }
                                }}
                            />
                        </motion.div>
                    ))}
                    <button
                        onClick={() => handleThumbNavigation('right', thumbs.length)}
                        className={clsx(
                            'p-1 xs:p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 transition-colors rounded flex-shrink-0 z-20 min-w-[32px] xs:min-w-[36px] sm:min-w-[40px] min-h-[32px] xs:min-h-[36px] sm:min-h-[40px] flex items-center justify-center',
                            activeThumb === thumbs.length - 1 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                        )}
                        disabled={activeThumb === thumbs.length - 1}
                    >
                        <FiChevronRight size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" color="white" />
                    </button>

                    {/* Thumbnail Counter */}
                    {thumbs.length > 1 && (
                        <div className="px-1.5 xs:px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-[10px] xs:text-xs font-medium flex-shrink-0 min-w-[2rem] xs:min-w-[2.5rem] text-center z-20">
                            {activeThumb + 1}/{thumbs.length}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
