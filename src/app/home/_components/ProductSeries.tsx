"use client";

import { useState, useRef, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiArrowUpRight } from "react-icons/fi";
import clsx from "clsx";

const seriesItems = [
  {
    id: 1,
    label: "SX SERIES",
    img: "/products/sx.png",
    thumbs: [
      { src: "/products/thumbs/sx-1.png", label: "01" },
      { src: "/products/thumbs/sx-2.png", label: "02" },
      { src: "/products/thumbs/sx-3.png", label: "03" },
    ],
  },
  {
    id: 2,
    label: "S SERIES",
    img: "/products/s.png",
    thumbs: [
      { src: "/products/thumbs/s-1.png", label: "01" },
      { src: "/products/thumbs/s-2.png", label: "02" },
      { src: "/products/thumbs/s-3.png", label: "03" },
    ],
  },
  {
    id: 3,
    label: "G SERIES",
    img: "/products/g.png",
    thumbs: [
      { src: "/products/thumbs/g-1.png", label: "01" },
      { src: "/products/thumbs/g-2.png", label: "02" },
    ],
  },
  {
    id: 4,
    label: "G+ SERIES",
    img: "/products/gplus.png",
    thumbs: [
      { src: "/products/thumbs/gplus-1.png", label: "01" },
    ],
  },
];

export default function ProductSeries() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeThumb, setActiveThumb] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll active card into center view
  useEffect(() => {
    if (scrollRef.current) {
      const card = scrollRef.current.children[activeIndex] as HTMLElement;
      card?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
    setActiveThumb(0);
  }, [activeIndex]);

  // Scroll thumbnails when change
  const thumbs = seriesItems[activeIndex].thumbs || [];
  const handleThumbNav = (dir: "left" | "right") => {
    setActiveThumb((prev) => {
      if (dir === "left") return Math.max(prev - 1, 0);
      if (dir === "right") return Math.min(prev + 1, thumbs.length - 1);
      return prev;
    });
  };

  return (
    <section className="relative w-full min-h-[600px] bg-[#0c131d] overflow-hidden select-none ml-20">
      {/* Thumbnails row */}
      <div className="flex justify-end w-full pt-4 pr-8 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleThumbNav("left")}
            className={clsx(
              "p-1 rounded bg-white/5 hover:bg-white/10 transition",
              activeThumb === 0 && "opacity-40 pointer-events-none"
            )}
            aria-label="prev thumb"
          >
            <FiChevronLeft size={20} />
          </button>
          {thumbs.map((thumb, idx) => (
            <div
              key={thumb.src}
              className={clsx(
                "relative w-20 h-14 rounded overflow-hidden cursor-pointer border-2 transition-all flex items-center justify-center",
                idx === activeThumb
                  ? "border-[#b7c7e0] bg-white/10"
                  : "border-transparent opacity-70 hover:opacity-90"
              )}
              onClick={() => setActiveThumb(idx)}
            >
              <img
                src={thumb.src}
                alt={thumb.label}
                className="object-cover w-full h-full"
                draggable={false}
              />
              <span
                className={clsx(
                  "absolute top-1 left-1 px-1.5 py-0.5 text-xs font-bold rounded text-white",
                  idx === activeThumb ? "bg-[#30445e]" : "bg-[#1a2635]/70"
                )}
              >
                {thumb.label}
              </span>
            </div>
          ))}
          <button
            onClick={() => handleThumbNav("right")}
            className={clsx(
              "p-1 rounded bg-white/5 hover:bg-white/10 transition",
              activeThumb === thumbs.length - 1 && "opacity-40 pointer-events-none"
            )}
            aria-label="next thumb"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Card scroll */}
      <div
        ref={scrollRef}
        className="flex flex-row overflow-x-auto scroll-smooth no-scrollbar w-full h-[540px] pt-2"
        style={{ minWidth: 900 }}
      >
        {seriesItems.map((item, idx) => (
          <div
            key={item.id}
            className={clsx(
              "flex flex-col items-center justify-end bg-[#111a26] min-w-[25vw] max-w-[25vw] h-full border-r border-[#232f41] transition relative group",
              idx === activeIndex &&
                "bg-gradient-to-br from-[#172035] via-[#111a26] to-[#151e2b] shadow-[0_0_40px_0_#1e2b40bb] z-10"
            )}
            onClick={() => setActiveIndex(idx)}
            style={{
              cursor: idx === activeIndex ? "default" : "pointer",
              minWidth: "25vw",
              maxWidth: "25vw",
            }}
          >
            {/* Vertical label */}
            <div
              className={clsx(
                "absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 origin-left text-[2.6vw] tracking-wider font-extrabold uppercase opacity-25 select-none pointer-events-none",
                idx === activeIndex ? "opacity-60 text-white" : "text-[#b7c7e0]"
              )}
              style={{ letterSpacing: "0.12em" }}
            >
              {item.label}
            </div>

            {/* Image */}
            <div className="flex-1 flex justify-center items-center relative w-full">
              <img
                src={
                  item.thumbs?.[activeThumb]?.src
                    ? item.thumbs[activeThumb].src
                    : item.img
                }
                alt={item.label}
                className={clsx(
                  "object-contain max-h-[240px] mx-auto drop-shadow-lg transition-all duration-300",
                  idx === activeIndex ? "scale-110" : "opacity-80"
                )}
                draggable={false}
              />
              {/* Hand cursor for active card */}
              {idx === activeIndex && (
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-2xl text-white/80 animate-bounce pointer-events-none">
                  <svg width="36" height="36" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M9.293 15.293a1 1 0 0 1 1.414 0l.293.293V6a1 1 0 1 1 2 0v9.586l.293-.293a1 1 0 1 1 1.414 1.414l-2 2a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 0-1.414z"></path></svg>
                </span>
              )}
            </div>

            {/* Content */}
            <div className="w-full p-8 pb-10 flex flex-col justify-end items-start">
              <h3 className="text-2xl font-semibold text-white mb-2">{item.label.replace(" SERIES", " Series")}</h3>
              <p className="text-base text-[#b7c7e0] mb-2 leading-tight">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              </p>
              <button className="mt-4 ml-auto flex items-center gap-2 text-white text-2xl hover:text-blue-300 transition">
                {idx === 0 ? (
                  <span>
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M9.293 15.293a1 1 0 0 1 1.414 0l.293.293V6a1 1 0 1 1 2 0v9.586l.293-.293a1 1 0 1 1 1.414 1.414l-2 2a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 0-1.414z"></path></svg>
                  </span>
                ) : (
                  <FiArrowUpRight />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}