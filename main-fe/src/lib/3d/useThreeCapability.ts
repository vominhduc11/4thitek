'use client';

import { useEffect, useState } from 'react';
import { detectThreeCapability, type ThreeCapability } from '@/lib/3d/capabilities';

interface UseThreeCapabilityOptions {
    allowOnMobile?: boolean;
}

export function useThreeCapability({ allowOnMobile = false }: UseThreeCapabilityOptions = {}) {
    const [capability, setCapability] = useState<ThreeCapability>(() => detectThreeCapability({ allowOnMobile }));

    useEffect(() => {
        const updateCapability = () => {
            setCapability(detectThreeCapability({ allowOnMobile }));
        };

        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const mobileQuery = window.matchMedia('(max-width: 767px)');

        updateCapability();
        reducedMotionQuery.addEventListener('change', updateCapability);
        mobileQuery.addEventListener('change', updateCapability);
        window.addEventListener('resize', updateCapability);

        return () => {
            reducedMotionQuery.removeEventListener('change', updateCapability);
            mobileQuery.removeEventListener('change', updateCapability);
            window.removeEventListener('resize', updateCapability);
        };
    }, [allowOnMobile]);

    return capability;
}
