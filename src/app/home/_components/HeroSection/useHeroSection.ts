import { useMemo } from 'react';
import { ParticleConfig, LightRayConfig } from './types';
import { EFFECTS } from './constants';

export function useHeroSection() {
    const particles = useMemo<ParticleConfig[]>(() => 
        Array.from({ length: EFFECTS.PARTICLES.COUNT }, (_, i) => ({
            id: i,
            left: `${EFFECTS.PARTICLES.BASE_LEFT + i * EFFECTS.PARTICLES.POSITION_INCREMENT}%`,
            top: `${EFFECTS.PARTICLES.BASE_TOP + (i % 3) * EFFECTS.PARTICLES.TOP_INCREMENT}%`,
            duration: EFFECTS.PARTICLES.BASE_DURATION + i * EFFECTS.PARTICLES.DURATION_INCREMENT,
            delay: i * EFFECTS.PARTICLES.DELAY_INCREMENT
        }))
    , []);

    const lightRays = useMemo<LightRayConfig[]>(() => 
        Array.from({ length: EFFECTS.LIGHT_RAYS.COUNT }, (_, i) => ({
            id: i,
            left: `${EFFECTS.LIGHT_RAYS.BASE_LEFT + i * EFFECTS.LIGHT_RAYS.POSITION_INCREMENT}%`,
            duration: EFFECTS.LIGHT_RAYS.BASE_DURATION + i * EFFECTS.LIGHT_RAYS.DURATION_INCREMENT,
            delay: i * EFFECTS.LIGHT_RAYS.DELAY_INCREMENT
        }))
    , []);

    return {
        particles,
        lightRays
    };
}
