'use client';

import { Canvas, type CameraProps } from '@react-three/fiber';
import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

interface SceneCanvasProps extends PropsWithChildren {
    active: boolean;
    camera: CameraProps;
    className?: string;
    maxDpr?: number;
    onReady?: () => void;
}

export default function SceneCanvas({
    active,
    camera,
    children,
    className,
    maxDpr = 1.5,
    onReady
}: SceneCanvasProps) {
    return (
        <Canvas
            className={cn('h-full w-full', className)}
            camera={camera}
            dpr={[1, maxDpr]}
            frameloop={active ? 'always' : 'never'}
            gl={{
                alpha: true,
                antialias: false,
                powerPreference: 'high-performance',
                failIfMajorPerformanceCaveat: true
            }}
            shadows={false}
            onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0);
                requestAnimationFrame(() => {
                    onReady?.();
                });
            }}
        >
            {children}
        </Canvas>
    );
}
