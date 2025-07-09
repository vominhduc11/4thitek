"use client";

import Image from "next/image";

export default function FeatureCards() {
  return (
    <section className="flex flex-row flex-wrap justify-between gap-4 pl-[100px] pr-[20px]">
      {/* Ô trắng đầu */}
      <div className="w-[580px] h-[580px] bg-white relative">
        <Image
          height={50}
          width={150}
          src="/productCards/card1/6917c31fe5845c06a4d6ad4aa0ea13f3b79f03ca.png"
          alt=""
          className="absolute top-12 left-12"
        />
        <Image
          height={300}
          width={580}
          src="/productCards/card1/466d1bbba4340b452f1792456a3a5ef7cc9fd843.png"
          alt=""
        />
        <Image
          height={60}
          width={60}
          src="/productCards/card1/image.png"
          alt=""
          className="absolute bottom-12 left-12"
        />
      </div>

      {/* Ô video với overlay gradient mờ */}
      <div className="relative w-[580px] h-[580px] overflow-hidden">
        {/* Video nền */}
        <video
          src="/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4"
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
        />

        <Image
          height={60}
          width={60}
          src="/productCards/card1/image.png"
          alt=""
          className="absolute bottom-12 left-12 z-1"
        />

        <Image
          fill
          src="/productCards/card2/image.png"
          alt=""
          className="absolute bottom-0 right-0 z-2"
        />

        <Image
          height={120}
          width={120}
          src="/productCards/card2/image2.png"
          alt=""
          className="absolute top-12 left-12 z-2"
        />

        <span className="absolute top-76 left-12 z-2 text-white font-bold text-4xl">
          MEMBERSHIP
          <br />
          PROGRAM
        </span>

        {/* Overlay gradient với 50% opacity */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#29ABE2]/50 to-[#0071BC]/50" />
      </div>

      {/* Ô trắng cuối */}
      <div className="w-[580px] h-[580px] bg-white relative">
        <Image
          height={130}
          width={130}
          src="/productCards/card3/image.png"
          alt=""
          className="absolute top-12 left-12 z-2"
        />

        <Image
          width={0}
          height={0}
          sizes="100vw"
          src="/productCards/card3/image3.png"
          alt=""
          className="absolute z-2 top-[86px]"
          style={{
            width: "100%",
            height: "370px",
          }}
        />

        <Image
          height={60}
          width={60}
          src="/productCards/card1/image.png"
          alt=""
          className="absolute bottom-12 left-12"
        />
      </div>
    </section>
  );
}
