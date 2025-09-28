'use client';

import { useState, memo } from 'react';
import Image from 'next/image';
import { FiImage } from 'react-icons/fi';

interface ImageWithFallbackProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    fallbackIcon?: React.ReactNode;
    fallbackText?: string;
    priority?: boolean;
    sizes?: string;
    fill?: boolean;
    onLoad?: () => void;
    onError?: () => void;
}

const ImageWithFallback = memo(function ImageWithFallback({
    src,
    alt,
    width = 200,
    height = 200,
    className = '',
    fallbackIcon,
    fallbackText,
    priority = false,
    sizes,
    fill = false,
    onLoad,
    onError
}: ImageWithFallbackProps) {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleLoad = () => {
        setIsLoading(false);
        onLoad?.();
    };

    const handleError = () => {
        setImageError(true);
        setIsLoading(false);
        onError?.();
    };

    if (imageError) {
        return (
            <div className={`${className} flex flex-col items-center justify-center bg-gray-800/30 text-gray-400`}>
                {fallbackIcon || <FiImage className="w-8 h-8 mb-2" />}
                {fallbackText && (
                    <span className="text-xs text-center">{fallbackText}</span>
                )}
            </div>
        );
    }

    return (
        <div className={`${className} relative`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/30 z-10">
                    <div className="w-6 h-6 border-2 border-[#4FC8FF] border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            <Image
                src={src}
                alt={alt}
                width={fill ? undefined : width}
                height={fill ? undefined : height}
                fill={fill}
                sizes={sizes}
                priority={priority}
                className={`transition-opacity duration-200 ease-out ${isLoading ? 'opacity-0' : 'opacity-100'} ${fill ? 'object-cover' : 'object-contain'}`}
                onLoad={handleLoad}
                onError={handleError}
            />
        </div>
    );
});

export default ImageWithFallback;