'use client';

import dynamic from 'next/dynamic';
import ThreeSceneSurface from '@/components/3d/core/ThreeSceneSurface';

const AboutHeroAccentScene = dynamic(() => import('@/components/3d/about/AboutHeroAccentScene'), {
    ssr: false
});

const poster = (
    <div className="absolute inset-0">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(79,200,255,0.22),rgba(41,171,226,0.08)_42%,transparent_72%)]" />
        <div className="absolute inset-[12%] rounded-full border border-[rgba(143,219,255,0.18)]" />
    </div>
);

export default function AboutHeroAccent3D() {
    return (
        <ThreeSceneSurface
            className="absolute right-[8%] top-[14%] z-20 hidden h-44 w-44 md:block lg:h-56 lg:w-56"
            poster={poster}
            posterClassName="mix-blend-screen"
            sceneClassName="mix-blend-screen"
            renderScene={({ active, capability, onReady }) => (
                <AboutHeroAccentScene active={active} maxDpr={capability.maxDpr} onReady={onReady} />
            )}
        />
    );
}
