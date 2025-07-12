import { memo } from 'react';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { ImageFeatureCard } from './types';
import { LAYOUT, EFFECTS } from './constants';

interface ImageCardProps {
    card: ImageFeatureCard;
    index: number;
    animationVariant: Variants;
}

function ImageCard({ card, index, animationVariant }: ImageCardProps) {
    return (
        <motion.div
            className={`aspect-square bg-${card.backgroundColor || 'white'} relative rounded-lg overflow-hidden ${EFFECTS.SHADOW} ${EFFECTS.TRANSITION} ${card.className || ''}`}
            variants={animationVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{
                scale: EFFECTS.HOVER_SCALE,
                y: EFFECTS.HOVER_Y,
                transition: { duration: 0.3 }
            }}
        >
            {/* Logo */}
            {card.logoImage && (
                <Image
                    height={40}
                    width={120}
                    src={card.logoImage}
                    alt="Brand logo"
                    className="absolute top-6 sm:top-8 lg:top-12 left-6 sm:left-8 lg:left-12 z-10"
                    loading={index < 2 ? 'eager' : 'lazy'}
                />
            )}
            
            {/* Background Image */}
            <div className="relative w-full h-full">
                <Image
                    fill
                    src={card.backgroundImage}
                    alt={card.alt}
                    className="object-cover"
                    loading={index < 2 ? 'eager' : 'lazy'}
                />
            </div>
            
            {/* Icon */}
            {card.iconImage && (
                <Image
                    height={0}
                    width={0}
                    sizes="100vw"
                    src={card.iconImage}
                    alt="Card icon"
                    className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 z-20 absolute ${LAYOUT.POSITION.ICON}`}
                    loading="lazy"
                />
            )}
        </motion.div>
    );
}

export default memo(ImageCard);
