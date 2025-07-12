import { memo } from 'react';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { ProductFeatureCard } from './types';
import { LAYOUT, EFFECTS, IMAGE_SIZES } from './constants';

interface ProductCardProps {
    card: ProductFeatureCard;
    index: number;
    animationVariant: Variants;
}

function ProductCard({ card, index, animationVariant }: ProductCardProps) {
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
            <div className={`relative h-full flex flex-col justify-between ${LAYOUT.PADDING.MOBILE} ${LAYOUT.PADDING.TABLET} ${LAYOUT.PADDING.DESKTOP}`}>
                {/* Brand Logo */}
                {card.brandLogo && (
                    <div>
                        <Image
                            height={80}
                            width={80}
                            src={card.brandLogo}
                            alt="Brand logo"
                            className={`${IMAGE_SIZES.BRAND_LOGO.WIDTH} ${IMAGE_SIZES.BRAND_LOGO.HEIGHT}`}
                            loading={index < 2 ? 'eager' : 'lazy'}
                        />
                    </div>
                )}

                {/* Product Image */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="relative w-full max-w-sm">
                        <Image
                            width={0}
                            height={0}
                            sizes="100vw"
                            src={card.productImage}
                            alt={card.alt}
                            className="w-full h-auto object-contain"
                            style={{
                                width: '100%',
                                height: 'auto'
                            }}
                            loading={index < 2 ? 'eager' : 'lazy'}
                        />
                    </div>
                </div>

                {/* Icon */}
                {card.iconImage && (
                    <div className="flex justify-start">
                        <Image
                            height={0}
                            width={0}
                            sizes="100vw"
                            src={card.iconImage}
                            alt="Card icon"
                            className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 z-20 absolute ${LAYOUT.POSITION.ICON}`}
                            loading="lazy"
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default memo(ProductCard);
