'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import ThreeSceneSurface from '@/components/3d/core/ThreeSceneSurface';
import { cn } from '@/lib/utils';

const ProductShowcaseScene = dynamic(() => import('@/components/3d/product/ProductShowcaseScene'), {
    ssr: false
});

interface ProductShowcase3DProps {
    className?: string;
    modelUrl?: string | null;
    poster: ReactNode;
}

export default function ProductShowcase3D({ className, modelUrl, poster }: ProductShowcase3DProps) {
    return (
        <div
            className={cn(
                'three-stage-frame relative h-full w-full overflow-hidden rounded-[32px] border border-[rgba(143,219,255,0.14)] bg-[radial-gradient(circle_at_top,rgba(41,171,226,0.12),transparent_45%),linear-gradient(180deg,rgba(9,19,31,0.94),rgba(6,17,27,0.82))] shadow-[0_30px_80px_rgba(0,0,0,0.38)]',
                className
            )}
        >
            <div className="pointer-events-none absolute inset-x-6 top-4 z-20 h-px bg-[linear-gradient(90deg,rgba(41,171,226,0),rgba(143,219,255,0.75),rgba(41,171,226,0))]" />
            <ThreeSceneSurface
                className="absolute inset-0"
                poster={
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(41,171,226,0.18),transparent_42%),linear-gradient(180deg,rgba(10,21,33,0.1),rgba(5,10,16,0.3))]" />
                        <div className="absolute inset-x-[14%] bottom-[16%] h-12 rounded-full bg-[rgba(41,171,226,0.12)] blur-[42px]" />
                        <div className="absolute inset-0 flex items-center justify-center px-5 py-6">{poster}</div>
                    </div>
                }
                posterClassName="backdrop-blur-[1px]"
                posterReadyClassName="opacity-72"
                sceneClassName="z-10"
                interactive
                renderScene={({ active, capability, onReady }) => (
                    <ProductShowcaseScene
                        active={active}
                        maxDpr={capability.maxDpr}
                        modelUrl={modelUrl}
                        onReady={onReady}
                    />
                )}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(6,17,27,0)_0%,rgba(6,17,27,0.62)_100%)]" />
        </div>
    );
}
