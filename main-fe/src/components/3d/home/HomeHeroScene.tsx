'use client';

import SceneCanvas from '@/components/3d/core/SceneCanvas';
import LightingRig from '@/components/3d/shared/LightingRig';
import SignalCluster from '@/components/3d/shared/SignalCluster';

interface HomeHeroSceneProps {
    active: boolean;
    maxDpr: number;
    onReady: () => void;
}

export default function HomeHeroScene({ active, maxDpr, onReady }: HomeHeroSceneProps) {
    return (
        <SceneCanvas
            active={active}
            camera={{ position: [0, 0, 8.5], fov: 34 }}
            maxDpr={maxDpr}
            onReady={onReady}
        >
            <fog attach="fog" args={['#07111a', 10, 18]} />
            <LightingRig ambientIntensity={0.58} />
            <SignalCluster active={active} position={[2.4, 0.1, -0.1]} scale={1.2} rotationSpeed={0.1} />
            <SignalCluster active={active} position={[4.4, -1.2, -2.4]} scale={0.72} rotationSpeed={0.08} density={14} />
            <mesh position={[2.5, -1.7, -1.6]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[2.3, 64]} />
                <meshBasicMaterial color="#0d2233" transparent opacity={0.14} />
            </mesh>
        </SceneCanvas>
    );
}
