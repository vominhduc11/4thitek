"use client";

export default function HeroSection() {
  return (
    <section className="relative w-full h-[700px] overflow-hidden">
      {/* Background Video */}
      <video
        src="/videos/motorbike-road-trip-2022-07-26-01-49-02-utc.mp4"
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* Title (behind image) */}
      <h1
        className="absolute top-[20%] left-1/2 transform -translate-x-1/2 text-white text-[200px] font-serif leading-none z-20"
      >
        SCS S8X
      </h1>

      {/* Product Image (on top of title but below description) */}
      <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2 z-25">
        <img
          src="/products/product1.png"
          alt="SCS S8X"
          className="w-96 h-auto object-contain"
        />
      </div>

      {/* Description & Button (above image) */}
      <div className="absolute bottom-[6%] left-1/2 transform -translate-x-1/2 text-center px-4 z-30">
        <p className="text-white max-w-2xl mb-6">
          SCSETC latest S8X&apos;s unique appearance and a variety of functions allow
          users to have a better product experience. S8X has a unique rain proof
          structure, Bluetooth 5.0 communication technology, group intercom
          connection, advanced noise control, stereo music playback, GPS
          navigation, etc.
        </p>
        <button className="px-6 py-3 border border-white text-white rounded-full hover:bg-white hover:text-black transition">
          DISCOVERY NOW
        </button>
      </div>
      {/* Dải gradient nối xuống dưới */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black"></div>
    </section>
  );
}
