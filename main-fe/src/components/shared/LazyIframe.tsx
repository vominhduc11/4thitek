'use client';

import { useRef, useEffect, useState, memo } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface LazyIframeProps {
    src: string;
    title: string;
    className?: string;
    width?: string | number;
    height?: string | number;
    allow?: string;
    allowFullScreen?: boolean;
    loading?: 'lazy' | 'eager';
    threshold?: number;
    rootMargin?: string;
    placeholder?: React.ReactNode;
}

/**
 * LazyIframe component with Intersection Observer
 * Loads iframe (YouTube, Vimeo, etc.) only when it enters the viewport
 * Significantly improves page load performance
 */
const LazyIframe = memo(function LazyIframe({
    src,
    title,
    className = '',
    width = '100%',
    height = '100%',
    allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
    allowFullScreen = true,
    loading = 'lazy',
    threshold = 0.1,
    rootMargin = '200px',
    placeholder
}: LazyIframeProps) {
    const { t } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !isInView) {
                        setIsInView(true);
                        observer.disconnect(); // Stop observing once loaded
                    }
                });
            },
            {
                threshold,
                rootMargin
            }
        );

        observer.observe(container);

        return () => {
            observer.disconnect();
        };
    }, [threshold, rootMargin, isInView]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const defaultPlaceholder = (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/30">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-400">{t('common.loadingVideo')}</p>
            </div>
        </div>
    );

    return (
        <div
            ref={containerRef}
            className={`relative ${className}`}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height
            }}
        >
            {/* Placeholder shown before iframe loads */}
            {!isLoaded && (placeholder || defaultPlaceholder)}

            {/* Iframe loaded only when in view */}
            {isInView && (
                <iframe
                    src={src}
                    title={title}
                    className={`w-full h-full transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    allow={allow}
                    allowFullScreen={allowFullScreen}
                    loading={loading}
                    onLoad={handleLoad}
                />
            )}
        </div>
    );
});

export default LazyIframe;
