'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { type ThreeCapability } from '@/lib/3d/capabilities';
import { useThreeCapability } from '@/lib/3d/useThreeCapability';
import { cn } from '@/lib/utils';

interface ThreeSceneSurfaceRenderProps {
    active: boolean;
    capability: ThreeCapability;
    onReady: () => void;
}

interface ThreeSceneSurfaceProps {
    poster: ReactNode;
    renderScene: (props: ThreeSceneSurfaceRenderProps) => ReactNode;
    allowOnMobile?: boolean;
    className?: string;
    mountRootMargin?: string;
    posterReadyClassName?: string;
    posterClassName?: string;
    sceneClassName?: string;
    interactive?: boolean;
}

export default function ThreeSceneSurface({
    poster,
    renderScene,
    allowOnMobile = false,
    className,
    mountRootMargin = '180px 0px',
    posterReadyClassName = 'opacity-35',
    posterClassName,
    sceneClassName,
    interactive = false
}: ThreeSceneSurfaceProps) {
    const capability = useThreeCapability({ allowOnMobile });
    const [isInView, setIsInView] = useState(false);
    const [isPageVisible, setIsPageVisible] = useState(true);
    const [isSceneReady, setIsSceneReady] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const element = rootRef.current;
        if (!element) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            { rootMargin: mountRootMargin, threshold: 0.01 }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [mountRootMargin]);

    useEffect(() => {
        const updateVisibility = () => {
            setIsPageVisible(document.visibilityState === 'visible');
        };

        updateVisibility();
        document.addEventListener('visibilitychange', updateVisibility);

        return () => {
            document.removeEventListener('visibilitychange', updateVisibility);
        };
    }, []);

    const shouldMountScene = capability.allowThree && isInView;
    const isSceneActive = shouldMountScene && isPageVisible;

    useEffect(() => {
        if (!shouldMountScene) {
            setIsSceneReady(false);
        }
    }, [shouldMountScene]);

    return (
        <div
            ref={rootRef}
            className={cn('relative isolate overflow-hidden', className)}
            data-three-reason={capability.reason}
        >
            <div
                className={cn(
                    'pointer-events-none absolute inset-0 transition-opacity duration-700',
                    isSceneReady ? posterReadyClassName : 'opacity-100',
                    posterClassName
                )}
                aria-hidden="true"
            >
                {poster}
            </div>

            {shouldMountScene ? (
                <div
                    className={cn(
                        'absolute inset-0 transition-opacity duration-700',
                        interactive ? 'pointer-events-auto' : 'pointer-events-none',
                        isSceneReady ? 'opacity-100' : 'opacity-0',
                        sceneClassName
                    )}
                    aria-hidden="true"
                >
                    {renderScene({
                        active: isSceneActive,
                        capability,
                        onReady: () => setIsSceneReady(true)
                    })}
                </div>
            ) : null}
        </div>
    );
}
