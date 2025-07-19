'use client';

import AvoidSidebar from '@/components/layout/AvoidSidebar';
import { motion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function Newsroom() {
    const router = useRouter();

    const handleExploreMore = () => {
        router.push('/blogs');
    };

    const handleNewsClick = (newsId: number) => {
        router.push(`/blogs/${newsId}`);
    };

    // Types and interfaces (inline)
    interface NewsItem {
        id: number;
        img: string;
        caption: string;
        title: string;
        content: string;
        date: string;
        category: string;
    }

    // Mock data (inline)
    const newsItems: NewsItem[] = [
        {
            id: 1,
            img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=500&fit=crop',
            caption: 'Công nghệ truyền thông xe máy mới nhất đột phá năm 2024',
            title: 'Công nghệ Bluetooth 5.0 Cách mạng',
            content:
                'Khám phá đột phá mới nhất trong truyền thông xe máy với công nghệ Bluetooth 5.0 tiên tiến. Kết nối nâng cao, chất lượng âm thanh trong trẻo và tích hợp liền mạch với các thiết bị hiện đại.',
            date: 'March 15, 2024',
            category: 'TECHNOLOGY'
        },
        {
            id: 2,
            img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=500&fit=crop',
            caption: 'Khám phá những chân trời mới với hệ thống truyền thông rider tiên tiến',
            title: 'Truyền thông Phiêu lưu Xe máy',
            content:
                'Tham gia cuộc phiêu lưu với hệ thống truyền thông cao cấp được thiết kế cho touring đường dài. Thiết kế chống nước, tuổi thọ pin mở rộng và khả năng liên lạc nhóm cho trải nghiệm lái xe tối ưu.',
            date: 'March 10, 2024',
            category: 'TUTORIAL'
        },
        {
            id: 3,
            img: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=500&fit=crop',
            caption: 'Tận hưởng chuyến đi với giao tiếp nhóm trong trẻo',
            title: 'Intercom Nhóm Xuất sắc',
            content:
                'Trải nghiệm giao tiếp nhóm liền mạch với tối đa 8 rider đồng thời. Công nghệ khử tiếng ồn tiên tiến đảm bảo cuộc trò chuyện rõ ràng ngay cả ở tốc độ cao và trong điều kiện thời tiết khắc nghiệt.',
            date: 'March 5, 2024',
            category: 'NEWS'
        },
        {
            id: 4,
            img: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=500&fit=crop',
            caption: 'Các rider chuyên nghiệp chọn 4T HITEK để truyền thông đáng tin cậy',
            title: 'Độ tin cậy Cấp chuyên nghiệp',
            content:
                'Được tin tưởng bởi các rider chuyên nghiệp trên toàn thế giới, hệ thống truyền thông của chúng tôi mang lại độ tin cậy và hiệu suất vô song. Được chế tạo để chịu đựng các điều kiện khắc nghiệt trong khi vẫn duy trì chất lượng âm thanh vượt trội.',
            date: 'February 28, 2024',
            category: 'REVIEW'
        },
        {
            id: 5,
            img: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=500&fit=crop',
            caption: 'Cuộc phiêu lưu đang chờ đợi với các thiết bị truyền thông cao cấp',
            title: 'Ra mắt Dòng sản phẩm Premium',
            content:
                'Giới thiệu dòng sản phẩm cao cấp mới với các tính năng nâng cao bao gồm tích hợp GPS navigation, lệnh giọng nói và kết nối thông minh. Hoàn hảo cho những rider đòi hỏi công nghệ tốt nhất.',
            date: 'February 20, 2024',
            category: 'TIPS'
        },
        {
            id: 6,
            img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=500&fit=crop',
            caption: 'Đổi mới trong công nghệ an toàn và truyền thông xe máy',
            title: 'Giải thưởng Đổi mới An toàn',
            content:
                '4T HITEK giành được nhiều giải thưởng đổi mới an toàn cho công nghệ truyền thông đột phá của chúng tôi, nâng cao an toàn rider thông qua kết nối cải tiến và tính năng khẩn cấp.',
            date: 'February 15, 2024',
            category: 'REVIEW'
        }
    ];

    // Animation variants (inline)
    const animationVariants = {
        section: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.8 }
        },
        header: {
            initial: { y: -50, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            transition: { duration: 0.8, delay: 0.2 }
        },
        subtitle: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.6, delay: 0.5 }
        },
        tagline: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.6, delay: 0.7 }
        },
        newsItem: (index: number) => ({
            initial: { opacity: 0, y: 100, scale: 0.8 },
            animate: { opacity: 1, y: 0, scale: 1 },
            transition: {
                duration: 0.6,
                delay: index * 0.1,
                type: 'spring',
                stiffness: 100
            }
        }),
        button: {
            initial: { opacity: 0, y: 50 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.8, delay: 0.5 }
        }
    };

    // Background dots (inline)
    const backgroundDots = Array.from({ length: 4 }, (_, i) => ({
        id: i,
        left: `${10 + i * 25}%`,
        top: `${20 + i * 15}%`,
        animate: { scale: [1, 2, 1], opacity: [0.3, 0.8, 0.3] },
        transition: { duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.5 }
    }));

    return (
        <AvoidSidebar>
            <motion.section
                className="relative bg-gradient-to-b from-[#001A35] to-[#0c131d] py-16 sm:py-20 md:py-24 overflow-hidden"
                {...animationVariants.section}
                viewport={{ once: true, amount: 0.2 }}
            >
                <div className="sidebar-aware-container  pl-8 pr-8">
                    {/* Header Section */}
                    <motion.div
                        className="text-center text-white z-10 mb-8 sm:mb-10 md:mb-12"
                        {...animationVariants.header}
                        viewport={{ once: true }}
                    >
                        <motion.h2
                            className="text-3xl sm:text-4xl md:text-5xl font-semibold font-sans"
                            whileHover={{ scale: 1.05, color: '#4FC8FF', transition: { duration: 0.3 } }}
                        >
                            Newsroom
                        </motion.h2>
                        <motion.p
                            className="mt-2 sm:mt-3 text-sm sm:text-base uppercase tracking-wider font-sans"
                            {...animationVariants.subtitle}
                            viewport={{ once: true }}
                        >
                            #RIDING, EXPLORING, ENJOYING
                        </motion.p>
                        <motion.span
                            className="mt-1 sm:mt-2 text-xs sm:text-sm text-white/70 block font-sans"
                            {...animationVariants.tagline}
                            viewport={{ once: true }}
                        >
                            4T HITEK is here for your Ride...
                        </motion.span>
                    </motion.div>

                    {/* News Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6 z-10 relative">
                        {newsItems.map((post, index) => (
                            <motion.div
                                key={post.id}
                                className="relative w-full h-64 sm:h-72 md:h-80 bg-black/10 rounded-lg overflow-hidden group cursor-pointer"
                                variants={animationVariants.newsItem(index)}
                                initial="initial"
                                whileInView="animate"
                                viewport={{ once: true, amount: 0.3 }}
                                whileHover={{
                                    y: -10,
                                    scale: 1.02,
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                                    transition: { duration: 0.3 }
                                }}
                                onClick={() => handleNewsClick(post.id)}
                            >
                                <motion.img
                                    src={post.img}
                                    alt={post.caption}
                                    className="w-full h-full object-cover"
                                    whileHover={{ scale: 1.1 }}
                                    transition={{ duration: 0.4 }}
                                    loading={index < 3 ? 'eager' : 'lazy'}
                                />

                                {/* Overlay Content */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2 sm:p-3 md:p-4">
                                    {/* Header */}
                                    <div className="flex justify-between items-start">
                                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#4FC8FF] text-white text-xs font-semibold rounded-full">
                                            {post.category || 'News'}
                                        </span>
                                        <span className="text-white/70 text-xs font-medium">
                                            {post.date || '2024-07-09'}
                                        </span>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 flex flex-col justify-center space-y-2 my-3">
                                        <h3 className="text-white font-bold text-xs sm:text-sm md:text-base leading-tight line-clamp-2">
                                            {post.title || 'Sample Title'}
                                        </h3>
                                        <p className="text-white/90 text-xs leading-relaxed line-clamp-3">
                                            {post.content ||
                                                'Sample content preview of this article will show here. Add real content.'}
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex justify-between items-end">
                                        <div className="flex-1 mr-1 sm:mr-2">
                                            <p className="text-white/70 text-xs leading-tight line-clamp-2">
                                                {post.caption}
                                            </p>
                                        </div>
                                        <motion.button
                                            className="p-1.5 sm:p-2 bg-white/20 hover:bg-[#4FC8FF] rounded-full transition-colors duration-300 flex-shrink-0"
                                            whileHover={{
                                                scale: 1.2,
                                                rotate: 45,
                                                backgroundColor: '#4FC8FF'
                                            }}
                                            whileTap={{ scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNewsClick(post.id);
                                            }}
                                            aria-label={`Read more about ${post.title}`}
                                        >
                                            <FiArrowUpRight size={12} className="sm:w-3.5 sm:h-3.5" color="white" />
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Animated border */}
                                <motion.div
                                    className="absolute inset-0 border-2 border-transparent rounded-lg pointer-events-none"
                                    whileHover={{
                                        borderColor: '#4FC8FF',
                                        boxShadow: '0 0 20px rgba(79, 200, 255, 0.3)'
                                    }}
                                    transition={{ duration: 0.3 }}
                                />

                                {/* Reading time indicator */}
                                <motion.div
                                    className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-black/60 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    initial={{ scale: 0 }}
                                    whileHover={{ scale: 1 }}
                                    transition={{ duration: 0.3, delay: 0.2 }}
                                >
                                    <span className="text-white text-xs font-medium">2 min read</span>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Explore More Button */}
                    <motion.div
                        className="text-center mt-8 sm:mt-10 z-10 relative"
                        {...animationVariants.button}
                        viewport={{ once: true }}
                    >
                        <motion.button
                            className="px-6 sm:px-8 py-2 sm:py-3 border border-white text-white hover:bg-white/10 rounded-full transition text-sm sm:text-base font-medium font-sans"
                            whileHover={{
                                scale: 1.05,
                                borderColor: '#4FC8FF',
                                color: '#4FC8FF',
                                boxShadow: '0 10px 25px rgba(79, 200, 255, 0.2)'
                            }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            onClick={handleExploreMore}
                            aria-label="Explore more news articles"
                        >
                            Explore More
                        </motion.button>
                    </motion.div>

                    {/* Background Animated Elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {backgroundDots.map((dot) => (
                            <motion.div
                                key={dot.id}
                                className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
                                style={{ left: dot.left, top: dot.top }}
                                animate={dot.animate}
                                transition={dot.transition}
                            />
                        ))}
                    </div>
                </div>
            </motion.section>
        </AvoidSidebar>
    );
}
