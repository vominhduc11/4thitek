'use client';

import { motion } from 'framer-motion';

interface ProductVideosProps {
    productName?: string;
}

export default function ProductVideos({ productName }: ProductVideosProps) {
    const videoList = [
        {
            title: 'Setup & Installation Guide',
            duration: '8:45',
            views: '45K',
            videoUrl: '/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4',
            description: 'Hướng dẫn cài đặt và thiết lập sản phẩm từ A-Z'
        },
        {
            title: 'Advanced Features Demo',
            duration: '12:30',
            views: '38K',
            videoUrl: '/videos/motorbike-road-trip-2022-07-26-01-49-02-utc.mp4',
            description: 'Demo các tính năng nâng cao và cách sử dụng'
        },
        {
            title: 'Comparison with Competitors',
            duration: '15:20',
            views: '62K',
            videoUrl: '/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4',
            description: 'So sánh với các sản phẩm cùng phân khúc'
        },
        {
            title: 'Troubleshooting Common Issues',
            duration: '6:15',
            views: '28K',
            videoUrl: '/videos/motorbike-road-trip-2022-07-26-01-49-02-utc.mp4',
            description: 'Cách xử lý các vấn đề thường gặp'
        },
        {
            title: 'User Experience & Reviews',
            duration: '10:00',
            views: '72K',
            videoUrl: '/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4',
            description: 'Chia sẻ trải nghiệm từ người dùng thực tế'
        },
        {
            title: 'Maintenance & Care Tips',
            duration: '5:30',
            views: '19K',
            videoUrl: '/videos/motorbike-road-trip-2022-07-26-01-49-02-utc.mp4',
            description: 'Hướng dẫn bảo dưỡng và chăm sóc sản phẩm'
        }
    ];

    return (
        <section id="product-details" className="relative z-[60] min-h-screen">
            <div className="container mx-auto max-w-[1800px] px-4 relative py-4 pb-2 pt-8 sm:-mt-8 md:-mt-8 z-[70]">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl 3xl:text-6xl 4xl:text-7xl font-bold mb-6 md:mb-8 text-white">VIDEO GALLERY</h2>

                {/* Featured Video */}
                <div className="mb-8 md:mb-12">
                    <div className="bg-gray-900/50 rounded-2xl overflow-hidden border border-gray-700/50">
                        <div className="aspect-video bg-gray-800 relative group">
                            <video
                                className="w-full h-full object-cover"
                                controls
                                preload="metadata"
                                poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgdmlld0JveD0iMCAwIDgwMCA0NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDUwIiBmaWxsPSIjMTExODI3Ii8+CjxwYXRoIGQ9Ik0zNTAgMjAwTDQ1MCAyMjVMMzUwIDI1MFYyMDBaIiBmaWxsPSIjNEY5NEZGIi8+Cjwvc3ZnPgo="
                            >
                                <source
                                    src="/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4"
                                    type="video/mp4"
                                />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <div className="p-4 md:p-6">
                            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-bold text-white mb-2">
                                Đánh giá chi tiết {productName}
                            </h3>
                            <p className="text-gray-400 text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">
                                Video đánh giá toàn diện về sản phẩm, từ unboxing đến test thực tế
                            </p>
                        </div>
                    </div>
                </div>

                {/* Video Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                    {videoList.map((video, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-700/30 hover:border-blue-400/50 transition-all duration-300 group cursor-pointer"
                        >
                            <div className="aspect-video bg-gray-800 relative">
                                <video
                                    className="w-full h-full object-cover"
                                    preload="metadata"
                                    poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xMzAgODBMMTcwIDEwMEwxMzAgMTIwVjgwWiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K"
                                    onMouseEnter={(e) => {
                                        const video = e.target as HTMLVideoElement;
                                        video.play();
                                    }}
                                    onMouseLeave={(e) => {
                                        const video = e.target as HTMLVideoElement;
                                        video.pause();
                                        video.currentTime = 0;
                                    }}
                                    onClick={(e) => {
                                        const video = e.target as HTMLVideoElement;
                                        if (video.paused) {
                                            video.play();
                                        } else {
                                            video.pause();
                                        }
                                    }}
                                    muted
                                    loop
                                >
                                    <source src={video.videoUrl} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs sm:text-sm md:text-base lg:text-lg xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl px-2 py-1 rounded">
                                    {video.duration}
                                </div>
                            </div>
                            <div className="p-4">
                                <h4 className="text-white font-medium mb-2 group-hover:text-blue-400 transition-colors line-clamp-2 text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">
                                    {video.title}
                                </h4>
                                <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl line-clamp-2">{video.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}
