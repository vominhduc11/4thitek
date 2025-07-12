'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';

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
        <header
            className="fixed top-0 left-16 sm:left-20 right-0 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 z-50 transition-all duration-300 ease-out"
            style={headerStyle}
        >
            {/* Search icon (left) */}
            <div>
                <button className="p-1.5 sm:p-2 rounded transition-all duration-200" aria-label="Search">
                    <FiSearch size={20} className="sm:w-5 sm:h-5" color="#fff" />
                </button>
            </div>

            {/* Logo and company name (right) */}
            <div className="flex items-center gap-1 sm:gap-2">
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
            </div>
        </header>
    );
}
