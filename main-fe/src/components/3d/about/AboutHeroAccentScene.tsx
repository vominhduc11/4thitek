'use client';

import SceneCanvas from '@/components/3d/core/SceneCanvas';
import LightingRig from '@/components/3d/shared/LightingRig';
import SignalCluster from '@/components/3d/shared/SignalCluster';

interface AboutHeroAccentSceneProps {
    active: boolean;
    maxDpr: number;
    onReady: () => void;
}

export default function AboutHeroAccentScene({ active, maxDpr, onReady }: AboutHeroAccentSceneProps) {
    return (
        <SceneCanvas
            active={active}
            camera={{ position: [0, 0, 6], fov: 32 }}
            maxDpr={maxDpr}
            onReady={onReady}
        >
            <LightingRig ambientIntensity={0.66} />
            <SignalCluster active={active} position={[0.6, 0.1, 0]} scale={0.86} rotationSpeed={0.1} density={12} />
        </SceneCanvas>
    );
}
