'use client';

import dynamic from 'next/dynamic';
import ThreeSceneSurface from '@/components/3d/core/ThreeSceneSurface';

const HomeHeroScene = dynamic(() => import('@/components/3d/home/HomeHeroScene'), {
    ssr: false
});

const poster = (
    <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_42%,rgba(79,200,255,0.32),transparent_0,_transparent_18%,rgba(79,200,255,0.12)_28%,transparent_52%),radial-gradient(circle_at_82%_38%,rgba(41,171,226,0.2),transparent_24%),linear-gradient(180deg,#07111A_0%,#081420_54%,#03070D_100%)]" />
        <div className="absolute inset-0 bg-topo opacity-30" />
        <div className="absolute right-[8%] top-[16%] h-[42svh] w-[42svh] min-h-[260px] min-w-[260px] rounded-full border border-[rgba(79,200,255,0.16)] bg-[radial-gradient(circle,rgba(79,200,255,0.14)_0%,rgba(41,171,226,0.06)_46%,transparent_72%)] shadow-[0_0_120px_rgba(0,113,188,0.18)] blur-[1px]" />
        <div className="absolute right-[14%] top-[23%] h-[24svh] w-[24svh] min-h-[160px] min-w-[160px] rounded-full border border-[rgba(184,236,255,0.14)]" />
        <div className="absolute inset-y-[18%] right-[11%] w-px bg-[linear-gradient(180deg,rgba(41,171,226,0),rgba(41,171,226,0.28),rgba(41,171,226,0))]" />
    </div>
);

export default function HomeHero3D() {
    return (
        <ThreeSceneSurface
            className="absolute inset-0 z-0"
            poster={poster}
            posterClassName="mix-blend-screen"
            sceneClassName="mix-blend-screen"
            renderScene={({ active, capability, onReady }) => (
                <HomeHeroScene active={active} maxDpr={capability.maxDpr} onReady={onReady} />
            )}
        />
    );
}
