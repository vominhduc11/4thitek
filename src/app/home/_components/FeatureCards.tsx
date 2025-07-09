"use client";

import Image from "next/image";

export default function FeatureCards() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="sidebar-aware-container">
        {/* Mobile: Single column, Tablet: 2 columns, Desktop: 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Card 1 - White Card */}
          <div className="aspect-square bg-white relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Image
              height={40}
              width={120}
              src="/productCards/card1/6917c31fe5845c06a4d6ad4aa0ea13f3b79f03ca.png"
              alt="Brand logo"
              className="absolute top-6 sm:top-8 lg:top-12 left-6 sm:left-8 lg:left-12 z-10"
            />
            <div className="relative w-full h-full">
              <Image
                fill
                src="/productCards/card1/466d1bbba4340b452f1792456a3a5ef7cc9fd843.png"
                alt="Product showcase"
                className="object-cover "
              />
            </div>
            <Image
              height={0}
              width={0}
              sizes="100vw"
              src="/productCards/card1/image.png"
              alt="Icon"
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 z-20 bottom-8 left-8 sm:bottom-8 sm:left-8 lg:bottom-8 lg:left-8 absolute"
            />
          </div>

          {/* Card 2 - Video Card with Membership */}
          <div className="aspect-square relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
            {/* Video Background */}
            <video
              src="/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4"
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#29ABE2]/50 to-[#0071BC]/50 z-10" />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-8 lg:p-12">
              <div className="flex justify-between items-start">
                <Image
                  height={0}
                  width={0}
                  sizes="100vw"
                  src="/productCards/card2/image2.png"
                  alt="Membership icon"
                  className="w-30 h-10"
                />
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-white font-bold text-xl sm:text-2xl lg:text-3xl xl:text-4xl leading-tight">
                    MEMBERSHIP
                    <br />
                    PROGRAM
                  </h3>
                </div>

                <div className="flex flex-col items-end gap-4">
                  <Image
                    height={0}
                    width={0}
                    sizes="100vw"
                    src="/productCards/card1/image.png"
                    alt="Icon"
                    className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 z-20 bottom-8 left-8 absolute"
                  />
                  <Image
                    height={0}
                    width={0}
                    sizes="100vw"
                    src="/productCards/card2/image.png"
                    alt="Icon"
                    className="w-full h-full z-20 bottom-0 left-0 absolute"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 - White Card with Product */}
          <div className="aspect-square bg-white relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 lg:col-span-2 xl:col-span-1">
            <div className="relative h-full flex flex-col justify-between p-6 sm:p-8 lg:p-12">
              <div>
                <Image
                  height={80}
                  width={80}
                  src="/productCards/card3/image.png"
                  alt="Product icon"
                  className="w-36 h-16"
                />
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="relative w-full max-w-sm">
                  <Image
                    width={0}
                    height={0}
                    sizes="100vw"
                    src="/productCards/card3/image3.png"
                    alt="Product showcase"
                    className="w-full h-auto object-contain"
                    style={{
                      width: "100%",
                      height: "auto",
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-start">
                <Image
                  height={0}
                  width={0}
                  sizes="100vw"
                  src="/productCards/card1/image.png"
                  alt="Icon"
                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 z-20 bottom-8 left-8 sm:bottom-8 sm:left-8 lg:bottom-8 lg:left-8 absolute"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
