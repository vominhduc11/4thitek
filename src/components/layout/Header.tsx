import Image from 'next/image';
import { FiSearch } from 'react-icons/fi';
import { motion, Variants } from 'framer-motion';
import { useEffect, useState } from 'react';

const headerVariants: Variants = {
    hidden: { y: -48, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 14, duration: 0.7 } }
};

const logoVariants: Variants = {
    hidden: { scale: 0.85, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { delay: 0.25, type: 'spring', stiffness: 120, duration: 0.6 } }
};

const searchVariants: Variants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { delay: 0.1, type: 'spring', stiffness: 120 } }
};

export default function Header() {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Header style based on scroll position
    const headerStyle = {
        backgroundColor: scrollY <= 0 ? 'transparent' : `rgba(12,19,29,${Math.min(scrollY / 400, 0.9)})`,
        backdropFilter: scrollY > 20 ? `blur(${Math.min(scrollY / 80, 10)}px)` : 'none',
        borderBottom: `1px solid rgba(255,255,255,${Math.min(scrollY / 200, 0.1)})`,
        boxShadow: scrollY > 150 ? '0 4px 20px rgba(0,0,0,0.2)' : 'none'
    };

    // Logo animation
    const logoStyle = {
        transform: scrollY > 100 ? 'scale(0.95)' : 'scale(1)',
        filter: scrollY > 200 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none'
    };

    return (
        <motion.header
            className="fixed top-0 left-16 sm:left-20 right-0 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 transition-all duration-300 ease-out bg-transparent z-1000"
            variants={headerVariants}
            initial="hidden"
            animate="visible"
            style={headerStyle}
        >
            {/* Search icon (left) */}
            <motion.div variants={searchVariants}>
                <button className="p-1.5 sm:p-2 rounded transition-all duration-200" aria-label="Search">
                    <FiSearch size={20} className="sm:w-5 sm:h-5" color="#fff" />
                </button>
            </motion.div>

            {/* Logo and company name (right) */}
            <motion.div className="flex items-center gap-1 sm:gap-2" variants={logoVariants}>
                <div className="transition-all duration-300 ease-out" style={logoStyle}>
                    <Image
                        width={0}
                        height={0}
                        sizes="100vw"
                        priority
                        src="/logo-4t.png"
                        alt="4T HITEK"
                        className="h-6 sm:h-8 w-auto"
                    />
                </div>
            </motion.div>
        </motion.header>
    );
}
