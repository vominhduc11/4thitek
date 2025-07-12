import { motion } from 'framer-motion';
import { ParticleConfig } from './types';

interface FloatingParticlesProps {
    particles: ParticleConfig[];
}

function FloatingParticles({ particles }: FloatingParticlesProps) {
    return (
        <div className="absolute inset-0 z-5 pointer-events-none">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute w-1.5 xs:w-2 sm:w-2.5 h-1.5 xs:h-2 sm:h-2.5 bg-white/20 rounded-full"
                    style={{ 
                        left: particle.left, 
                        top: particle.top 
                    }}
                    animate={{ 
                        y: [-15, 15, -15], 
                        opacity: [0.1, 0.6, 0.1], 
                        scale: [0.8, 1.3, 0.8] 
                    }}
                    transition={{ 
                        duration: particle.duration, 
                        repeat: Infinity, 
                        delay: particle.delay, 
                        ease: 'easeInOut' 
                    }}
                />
            ))}
        </div>
    );
}

export default FloatingParticles;
