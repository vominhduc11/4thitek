'use client';

import { motion } from 'framer-motion';

interface VideoItem {
    title: string;
    videoUrl: string;
    description?: string;
}

interface ProductVideosProps {
    productName?: string;
    videos?: VideoItem[];
}

export default function ProductVideos({ productName, videos = [] }: ProductVideosProps) {
    // Debug logging
    console.log('ProductVideos props:', { productName, videos });
    // Helper function to extract YouTube video ID from URL
    const getYouTubeVideoId = (url: string): string | null => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Helper function to get YouTube embed URL
    const getYouTubeEmbedUrl = (url: string): string => {
        console.log('Processing video URL:', url);

        // Return empty string if no URL provided
        if (!url || !url.trim()) {
            console.log('Empty URL provided');
            return '';
        }

        // If already an embed URL, return as is
        if (url.includes('/embed/')) {
            console.log('Already embed URL, returning:', url);
            return url;
        }

        const videoId = getYouTubeVideoId(url);
        if (videoId) {
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            console.log('Generated embed URL:', embedUrl);
            return embedUrl;
        }
        console.log('Not a YouTube URL, returning original:', url);
        return url; // Return original URL if not YouTube
    };
    const videoList = [
        {
            title: 'Setup & Installation Guide',
            duration: '8:45',
            views: '45K',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            description: 'Hướng dẫn cài đặt và thiết lập sản phẩm từ A-Z'
        },
        {
            title: 'Advanced Features Demo',
            duration: '12:30',
            views: '38K',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            description: 'Demo các tính năng nâng cao và cách sử dụng'
        },
        {
            title: 'Comparison with Competitors',
            duration: '15:20',
            views: '62K',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            description: 'So sánh với các sản phẩm cùng phân khúc'
        },
        {
            title: 'Troubleshooting Common Issues',
            duration: '6:15',
            views: '28K',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            description: 'Cách xử lý các vấn đề thường gặp'
        },
        {
            title: 'User Experience & Reviews',
            duration: '10:00',
            views: '72K',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            description: 'Chia sẻ trải nghiệm từ người dùng thực tế'
        },
        {
            title: 'Maintenance & Care Tips',
            duration: '5:30',
            views: '19K',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            description: 'Hướng dẫn bảo dưỡng và chăm sóc sản phẩm'
        }
    ];

    return (
        <section id="product-details" className="relative z-[60] min-h-screen">
            <div className="container mx-auto max-w-[1800px] px-4 relative py-4 pb-2 pt-8 sm:-mt-8 md:-mt-8 z-[70]">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-4xl 3xl:text-6xl 4xl:text-7xl font-bold mb-6 md:mb-8 text-white">VIDEO GALLERY</h2>

                {/* Featured Video */}
                {(videos.length > 0 || videoList.length > 0) && (
                    <div className="mb-8 md:mb-12">
                        <div className="bg-gray-900/50 rounded-2xl overflow-hidden border border-gray-700/50">
                            <div className="aspect-video bg-gray-800 relative group">
                                {videos.length > 0 && videos[0].videoUrl && videos[0].videoUrl.trim() ? (
                                    <iframe
                                        className="w-full h-full"
                                        src={getYouTubeEmbedUrl(videos[0].videoUrl)}
                                        title={videos[0].title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        onError={() => console.error('Failed to load video:', videos[0].videoUrl)}
                                    ></iframe>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <p className="text-gray-400 text-center">Không có video để hiển thị</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 md:p-6">
                                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-2xl 2xl:text-2xl 3xl:text-4xl 4xl:text-5xl font-bold text-white mb-2">
                                    {videos.length > 0 ? videos[0].title : `Đánh giá chi tiết ${productName}`}
                                </h3>
                                <p className="text-gray-400 text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl">
                                    {videos.length > 0 ? videos[0].description || `Video ${videos[0].title}` : "Video đánh giá toàn diện về sản phẩm, từ unboxing đến test thực tế"}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Video Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                    {(videos.length > 0 ? videos : videoList).map((video, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-700/30 hover:border-blue-400/50 transition-all duration-300 group cursor-pointer"
                        >
                            <div className="aspect-video bg-gray-800 relative">
                                {video.videoUrl && video.videoUrl.trim() ? (
                                    <iframe
                                        className="w-full h-full"
                                        src={getYouTubeEmbedUrl(video.videoUrl)}
                                        title={video.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        onError={() => console.error('Failed to load video:', video.videoUrl)}
                                    ></iframe>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <p className="text-gray-400 text-center text-sm">Video không khả dụng</p>
                                    </div>
                                )}
                                {('duration' in video) && (
                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs sm:text-sm md:text-base lg:text-lg xl:text-lg 2xl:text-lg 3xl:text-2xl 4xl:text-3xl px-2 py-1 rounded pointer-events-none">
                                        {(video as { duration?: string }).duration}
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h4 className="text-white font-medium mb-2 group-hover:text-blue-400 transition-colors line-clamp-2 text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl">
                                    {video.title}
                                </h4>
                                <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg xl:text-lg 2xl:text-lg 3xl:text-2xl 4xl:text-3xl line-clamp-2">
                                    {video.description || `Video về ${video.title}`}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}
