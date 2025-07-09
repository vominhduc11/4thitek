"use client";

import { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';

export default function Header() {
  const [scrollOpacity, setScrollOpacity] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const opacity = Math.min(scrollY / 200, 0.1);
      setScrollOpacity(opacity);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className="fixed top-0 left-20 right-0 flex items-center justify-between px-6 py-4 z-30 transition-all duration-100"
      style={{
        backgroundColor: `rgba(255, 255, 255, ${scrollOpacity})`,
        backdropFilter: scrollOpacity > 0 ? 'blur(8px)' : 'none'
      }}
    >
      {/* Search icon (left) */}
      <div>
        <button className="p-2 rounded hover:bg-[#263040] transition">
          <FiSearch size={20} color="#fff" />
        </button>
      </div>



      {/* Logo and company name (right) */}
      <div className="flex items-center gap-2">
        <img src="/logo-4t.png" alt="4T HITEK" className="h-8 w-auto" />
      </div>
    </header>
  );
}
