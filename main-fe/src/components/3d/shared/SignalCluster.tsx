'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';

interface SignalClusterProps {
    active: boolean;
    density?: number;
    position?: [number, number, number];
    rotationSpeed?: number;
    scale?: number;
}

export default function SignalCluster({
    active,
    density = 18,
    position = [0, 0, 0],
    rotationSpeed = 0.12,
    scale = 1
}: SignalClusterProps) {
    const clusterRef = useRef<Group | null>(null);
    const nodes = useMemo(
        () =>
            Array.from({ length: density }, (_, index) => {
                const angle = (Math.PI * 2 * index) / density;
                const radius = 1.15 + ((index % 3) * 0.18);
                const depth = (index % 4) * 0.12 - 0.18;

                return {
                    key: `node-${index}`,
                    position: [Math.cos(angle) * radius, Math.sin(angle * 1.3) * 0.7, depth] as [number, number, number],
                    size: index % 5 === 0 ? 0.055 : 0.035,
                    opacity: index % 2 === 0 ? 0.8 : 0.45
                };
            }),
        [density]
    );

    useFrame((state, delta) => {
        if (!active || !clusterRef.current) {
            return;
        }

        clusterRef.current.rotation.y += delta * rotationSpeed;
        clusterRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.08;
        clusterRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.45) * 0.08;
    });

    return (
        <group ref={clusterRef} position={position} scale={scale}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.05, 1.1, 72]} />
                <meshBasicMaterial color="#29abe2" transparent opacity={0.45} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0.24, 0]}>
                <torusGeometry args={[1.38, 0.026, 12, 96]} />
                <meshStandardMaterial color="#8fdbff" emissive="#29abe2" emissiveIntensity={0.8} />
            </mesh>
            <mesh position={[0, 0, -0.35]}>
                <sphereGeometry args={[0.26, 24, 24]} />
                <meshStandardMaterial
                    color="#12283d"
                    emissive="#1f8dcb"
                    emissiveIntensity={1.15}
                    metalness={0.35}
                    roughness={0.4}
                />
            </mesh>
            <mesh position={[0, 0, -0.7]} rotation={[0, 0.2, 0]}>
                <planeGeometry args={[3.1, 1.7]} />
                <meshBasicMaterial color="#0f2335" transparent opacity={0.18} />
            </mesh>
            {nodes.map((node) => (
                <mesh key={node.key} position={node.position}>
                    <sphereGeometry args={[node.size, 12, 12]} />
                    <meshBasicMaterial color="#b8ecff" transparent opacity={node.opacity} />
                </mesh>
            ))}
        </group>
    );
}
