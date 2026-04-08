'use client';

import { OrbitControls, RoundedBox, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef } from 'react';
import type { Group } from 'three';
import SceneCanvas from '@/components/3d/core/SceneCanvas';
import LightingRig from '@/components/3d/shared/LightingRig';

interface ProductShowcaseSceneProps {
    active: boolean;
    maxDpr: number;
    modelUrl?: string | null;
    onReady: () => void;
}

function PlaceholderFlagship({ active }: { active: boolean }) {
    const groupRef = useRef<Group | null>(null);

    useFrame((state, delta) => {
        if (!groupRef.current || !active) {
            return;
        }

        groupRef.current.rotation.y += delta * 0.22;
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.08;
    });

    return (
        <group ref={groupRef}>
            <mesh position={[0, -1.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[2.3, 56]} />
                <meshBasicMaterial color="#0a1c2a" transparent opacity={0.35} />
            </mesh>
            <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[1.5, 1.82, 0.18, 48]} />
                <meshStandardMaterial
                    color="#112538"
                    emissive="#0f4b70"
                    emissiveIntensity={0.4}
                    metalness={0.4}
                    roughness={0.28}
                />
            </mesh>
            <mesh position={[0, -0.52, 0]} rotation={[Math.PI / 2, 0.18, 0]}>
                <torusGeometry args={[1.42, 0.035, 16, 120]} />
                <meshStandardMaterial color="#9de6ff" emissive="#29abe2" emissiveIntensity={1.25} />
            </mesh>
            <RoundedBox args={[2.05, 0.48, 1.02]} radius={0.18} smoothness={5} position={[0, 0.05, 0]}>
                <meshStandardMaterial
                    color="#1a3147"
                    emissive="#195f8a"
                    emissiveIntensity={0.42}
                    metalness={0.56}
                    roughness={0.22}
                />
            </RoundedBox>
            <mesh position={[-1.2, 0.08, 0]} rotation={[0.24, 0, 0]}>
                <sphereGeometry args={[0.34, 32, 32]} />
                <meshStandardMaterial
                    color="#173148"
                    emissive="#1d6f9e"
                    emissiveIntensity={0.55}
                    metalness={0.36}
                    roughness={0.26}
                />
            </mesh>
            <mesh position={[1.2, 0.08, 0]} rotation={[0.24, 0, 0]}>
                <sphereGeometry args={[0.34, 32, 32]} />
                <meshStandardMaterial
                    color="#173148"
                    emissive="#1d6f9e"
                    emissiveIntensity={0.55}
                    metalness={0.36}
                    roughness={0.26}
                />
            </mesh>
            <mesh position={[0, 0.78, -0.12]}>
                <torusGeometry args={[1.18, 0.02, 12, 96]} />
                <meshBasicMaterial color="#8fdbff" transparent opacity={0.5} />
            </mesh>
        </group>
    );
}

function ImportedModel({ modelUrl }: { modelUrl: string }) {
    const gltf = useGLTF(modelUrl);
    const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

    return <primitive object={scene} scale={1.35} position={[0, -0.15, 0]} />;
}

export default function ProductShowcaseScene({
    active,
    maxDpr,
    modelUrl,
    onReady
}: ProductShowcaseSceneProps) {
    return (
        <SceneCanvas
            active={active}
            camera={{ position: [0, 0.2, 6.8], fov: 30 }}
            className="cursor-grab active:cursor-grabbing"
            maxDpr={maxDpr}
            onReady={onReady}
        >
            <fog attach="fog" args={['#09131f', 8, 13]} />
            <LightingRig ambientIntensity={0.7} />
            <mesh position={[0, 0, -3]}>
                <planeGeometry args={[12, 10]} />
                <meshBasicMaterial color="#081521" transparent opacity={0.42} />
            </mesh>
            <Suspense fallback={<PlaceholderFlagship active={active} />}>
                {modelUrl ? <ImportedModel modelUrl={modelUrl} /> : <PlaceholderFlagship active={active} />}
            </Suspense>
            <OrbitControls
                autoRotate={active}
                autoRotateSpeed={0.8}
                enablePan={false}
                enableZoom={false}
                minPolarAngle={Math.PI / 2.4}
                maxPolarAngle={Math.PI / 1.7}
            />
        </SceneCanvas>
    );
}
