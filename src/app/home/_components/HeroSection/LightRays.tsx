import { motion } from 'framer-motion';
import { LightRayConfig } from './types';
import { EFFECTS } from './constants';

interface LightRaysProps {
    lightRays: LightRayConfig[];
}

function LightRays({ lightRays }: LightRaysProps) {
    return (
        <div className="absolute inset-0 z-5 pointer-events-none overflow-hidden">
            {lightRays.map((ray) => (
                <motion.div
                    key={`ray-${ray.id}`}
                    className="absolute w-px h-full bg-gradient-to-b from-transparent via-white/8 to-transparent hidden sm:block"
                    style={{ 
                        left: ray.left, 
                        transform: `rotate(${EFFECTS.LIGHT_RAYS.ROTATION})` 
                    }}
                    animate={{ 
                        opacity: [0, 0.25, 0], 
                        scaleY: [0.4, 1, 0.4] 
                    }}
                    transition={{ 
                        duration: ray.duration, 
                        repeat: Infinity, 
                        delay: ray.delay, 
                        ease: 'easeInOut' 
                    }}
                />
            ))}
        </div>
    );
}

export default LightRays;
