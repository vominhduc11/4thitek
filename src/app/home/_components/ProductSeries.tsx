"use client";

import { useState, useRef, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiArrowUpRight } from 'react-icons/fi';

const seriesItems = [
  { id: 1, label: 'SX Series', img: '/products/sx.png' },
  { id: 2, label: 'S Series', img: '/products/s.png' },
  { id: 3, label: 'G Series', img: '/products/g.png' },
  { id: 4, label: 'G+ Series', img: '/products/gplus.png' },
];

export default function ProductSeries() {
  const [activeThumb, setActiveThumb] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll into view on thumb change
  useEffect(() => {
    if (scrollRef.current) {
      const card = scrollRef.current.children[activeThumb] as HTMLElement;
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  }, [activeThumb]);

  return (
    <section className="relative w-full h-[400px] bg-[#20262E] text-white overflow-hidden">
      {/* SCROLL label */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-sm tracking-widest">
        SCROLL
      </div>

      {/* Series scroll container */}
      <div className="absolute inset-0 flex items-center">
        {/* Left nav */}
        <button
          onClick={() => setActiveThumb((prev) => Math.max(prev - 1, 0))}
          className="absolute left-4 z-20 p-2 bg-black/30 hover:bg-black/50 rounded-full transition"
        >
          <FiChevronLeft size={24} />
        </button>

        {/* Cards */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto no-scrollbar scroll-smooth pl-16 pr-16"
        >
          {seriesItems.map((item, idx) => (
            <div
              key={item.id}
              className="min-w-[280px] flex-shrink-0 p-4 mx-2 bg-[#1e2631] rounded-lg text-center"
            >
              <div className="relative">
                <img
                  src={item.img}
                  alt={item.label}
                  className="w-full h-auto object-contain mb-4"
                />
                <span className="absolute top-1 left-1 text-white text-lg font-bold">
                  {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.label}</h3>
              <p className="text-sm mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              </p>
              <button className="inline-flex items-center hover:text-gray-300 transition">
                <FiArrowUpRight />
              </button>
            </div>
          ))}
        </div>

        {/* Right nav */}
        <button
          onClick={() => setActiveThumb((prev) => Math.min(prev + 1, seriesItems.length - 1))}
          className="absolute right-4 z-20 p-2 bg-black/30 hover:bg-black/50 rounded-full transition"
        >
          <FiChevronRight size={24} />
        </button>
      </div>

      {/* Thumbnail Nav */}
      <div className="absolute top-8 right-8 flex items-center gap-2">
        {seriesItems.map((item, idx) => (
          <img
            key={item.id}
            src={item.img}
            alt={item.label}
            className={`w-20 h-12 object-cover rounded ${
              idx === activeThumb ? 'border-2 border-white' : 'opacity-50'
            } cursor-pointer transition`}
            onClick={() => setActiveThumb(idx)}
          />
        ))}
      </div>
    </section>
  );
}
