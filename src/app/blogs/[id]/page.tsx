'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BlogPost } from '../components/types';
import BlogDetailHero from '@/app/blogs/[id]/components/BlogDetailHero';
import AvoidSidebar from '@/components/layout/AvoidSidebar';

// Mock data - would typically come from API
const mockBlogPosts = [
    {
        id: 1,
        title: 'HƯỚNG DẪN SỬ DỤNG SCS S8X PRO CHO NGƯỜI MỚI BẮT ĐẦU',
        category: 'TUTORIAL',
        tags: ['SCS', 'S8X', 'hướng dẫn', 'bluetooth'],
        image: '/blogDetail/ace45cbf5c089422f94ce1f28689d06b472617bc.png',
        bannerImage: '/blogDetail/ace45cbf5c089422f94ce1f28689d06b472617bc.png',
        excerpt:
            'Tìm hiểu cách thiết lập và sử dụng SCS S8X Pro một cách hiệu quả nhất. Hướng dẫn từng bước chi tiết cho người mới bắt đầu.',
        author: 'Nguyễn Văn A',
        publishDate: '2025-05-08',
        readTime: 5,
        featured: true,
        content: {
            intro: 'Khám phá những tính năng vượt trội của SCS S8X Pro và cách sử dụng hiệu quả nhất trong các chuyến đi của bạn.',
            sections: [
                {
                    type: 'heading',
                    content: 'Giới thiệu về SCS S8X Pro'
                },
                {
                    type: 'paragraph',
                    content:
                        'SCS S8X Pro là một trong những thiết bị truyền thông tiên tiến nhất hiện nay, được thiết kế đặc biệt cho các ứng dụng chuyên nghiệp. Với công nghệ Bluetooth 5.0 và khả năng chống nước IPX7, thiết bị này mang đến trải nghiệm tuyệt vời cho người sử dụng.'
                },
                {
                    type: 'image',
                    src: '/blogDetail/ace45cbf5c089422f94ce1f28689d06b472617bc.png',
                    alt: 'Mũ bảo hiểm NIC chất lượng cao',
                    caption: 'Mũ bảo hiểm NIC với thiết kế hiện đại và an toàn tuyệt đối'
                },
                {
                    type: 'heading',
                    content: 'Các tính năng nổi bật'
                },
                {
                    type: 'list',
                    items: [
                        'Kết nối Bluetooth 5.0 ổn định',
                        'Thời lượng pin lên đến 20 giờ',
                        'Chống nước IPX7',
                        'Âm thanh chất lượng cao',
                        'Thiết kế ergonomic'
                    ]
                },
                {
                    type: 'quote',
                    content:
                        'SCS S8X Pro đã thay đổi hoàn toàn trải nghiệm lái xe của tôi. Chất lượng âm thanh tuyệt vời và kết nối ổn định.'
                },
                {
                    type: 'image',
                    src: '/blogDetail/ace45cbf5c089422f94ce1f28689d06b472617bc.png',
                    alt: 'Chi tiết bộ khóa an toàn',
                    caption: 'Hệ thống khóa an toàn với công nghệ tiên tiến',
                    float: 'left'
                },
                {
                    type: 'paragraph',
                    content:
                        'Việc cài đặt SCS S8X Pro rất đơn giản. Bạn chỉ cần làm theo các bước hướng dẫn trong manual và có thể sử dụng ngay lập tức. Thiết bị tương thích với hầu hết các loại mũ bảo hiểm trên thị trường.'
                }
            ]
        }
    },
    // Related posts
    {
        id: 2,
        title: 'Top 5 thiết bị Bluetooth tốt nhất 2025',
        category: 'REVIEW',
        image: '/blogDetail/ace45cbf5c089422f94ce1f28689d06b472617bc.png',
        publishDate: '2025-04-15',
        readTime: 8
    },
    {
        id: 3,
        title: 'Cách bảo dưỡng thiết bị Bluetooth',
        category: 'TIPS',
        image: '/blogDetail/ace45cbf5c089422f94ce1f28689d06b472617bc.png',
        publishDate: '2025-04-10',
        readTime: 6
    },
    {
        id: 4,
        title: 'An toàn giao thông cho biker',
        category: 'SAFETY',
        image: '/blogDetail/ace45cbf5c089422f94ce1f28689d06b472617bc.png',
        publishDate: '2025-04-05',
        readTime: 10
    }
];

export default function BlogDetailPageImproved() {
    const params = useParams();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

    useEffect(() => {
        if (!params?.id) return;

        const postId = parseInt(params.id as string);
        const foundPost = mockBlogPosts.find((p) => p.id === postId);

        if (foundPost) {
            setPost(foundPost as BlogPost);
            // Get related posts (excluding current post)
            const related = mockBlogPosts.filter((p) => p.id !== postId).slice(0, 3);
            setRelatedPosts(related as BlogPost[]);
        }
        setLoading(false);
    }, [params?.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0c131d] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4FC8FF] mx-auto mb-4"></div>
                    <p>Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#0c131d] text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Không tìm thấy bài viết</h1>
                    <Link href="/blogs" className="text-[#4FC8FF] hover:underline">
                        Quay lại danh sách blog
                    </Link>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const categories = [
        { id: 'ALL', name: 'Tất Cả' },
        { id: 'TECHNOLOGY', name: 'Công Nghệ' },
        { id: 'TUTORIAL', name: 'Hướng Dẫn' },
        { id: 'NEWS', name: 'Tin Tức' },
        { id: 'REVIEW', name: 'Đánh Giá' },
        { id: 'TIPS', name: 'Mẹo Hay' }
    ];

    const currentCategory = categories.find((cat) => cat.id === post.category);

    return (
        <div className="min-h-screen bg-[#0c131d] main-content">
            {/* Simple Hero Section - Consistent with other pages */}
            <BlogDetailHero />
            {/* 1. Thanh tiêu đề bài viết (Post Header) */}
            <AvoidSidebar>
                <section className="bg-[#0c131d] w-full -mt-16 pt-16 pb-8">
                    {/* Sử dụng chính xác cùng layout như breadcrumb */}
                    <div className="pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8">
                        <div className="px-4 sm:px-6 lg:px-8">
                            {/* Tiêu đề */}
                            <motion.h1
                                className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold text-left mb-4"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true }}
                            >
                                {post.title}
                            </motion.h1>

                            {/* Thời gian đăng & Chuyên mục */}
                            <motion.div
                                className="flex items-center gap-4 text-gray-400 text-sm"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                viewport={{ once: true }}
                            >
                                <span>{formatDate(post.publishDate)}</span>
                                <span>•</span>
                                <span className="uppercase tracking-wide">{currentCategory?.name}</span>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 2. Hình ảnh minh họa chính (Hero Image nhỏ) */}
                <section className="bg-[#0c131d] pb-8">
                    {/* Full width container để hình ảnh sát mép */}
                    <div className="w-full">
                        <motion.div
                            className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1 }}
                            viewport={{ once: true }}
                        >
                            <Image
                                src="/blogDetail/ace45cbf5c089422f94ce1f28689d06b472617bc.png"
                                alt={post.title}
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </motion.div>
                    </div>
                </section>

                {/* 3. Bố cục chính (Main Layout) */}
                <section className="bg-[#0c131d] py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                            {/* 3.1. Cột Nội dung (Left Column, chiếm ~70%) */}
                            <div className="lg:col-span-7">
                                <motion.article
                                    className="p-6 sm:p-8 lg:p-12"
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8 }}
                                    viewport={{ once: true }}
                                >
                                    {/* Đoạn mô tả mở đầu */}
                                    <motion.p
                                        className="text-gray-300 text-base leading-relaxed mb-8"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                        viewport={{ once: true }}
                                    >
                                        {typeof post.content === 'object' && post.content?.intro
                                            ? post.content.intro
                                            : post.excerpt}
                                    </motion.p>

                                    {/* Hình ảnh sản phẩm - Full width */}
                                    <motion.div
                                        className="w-full mb-8"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.4 }}
                                        viewport={{ once: true }}
                                    >
                                        <Image
                                            src="/blogDetail/ace45cbf5c089422f94ce1f28689d06b472617bc.png"
                                            alt="Thiết bị SCS S8X Pro chất lượng cao"
                                            width={800}
                                            height={500}
                                            className="w-full h-auto rounded-lg"
                                        />
                                    </motion.div>

                                    {/* Tiêu đề phụ */}
                                    <motion.h2
                                        className="text-2xl sm:text-3xl font-bold text-white mb-6"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.6 }}
                                        viewport={{ once: true }}
                                    >
                                        Mũ bảo hiểm nào an toàn nhất hiện nay? Tiêu chí đánh giá...
                                    </motion.h2>

                                    {/* Nội dung sections */}
                                    {typeof post.content === 'object' &&
                                        post.content?.sections?.map((section, index: number) => (
                                            <motion.div
                                                key={index}
                                                className="mb-8"
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                                viewport={{ once: true }}
                                            >
                                                {section.type === 'heading' && (
                                                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                                                        {section.content}
                                                    </h3>
                                                )}

                                                {section.type === 'paragraph' && (
                                                    <p className="text-gray-300 text-base leading-relaxed mb-6">
                                                        {section.content}
                                                    </p>
                                                )}

                                                {section.type === 'list' && (
                                                    <ul className="space-y-3 mb-6">
                                                        {section.items?.map((item: string, itemIndex: number) => (
                                                            <li
                                                                key={itemIndex}
                                                                className="flex items-start gap-3 text-gray-300 text-base leading-relaxed"
                                                            >
                                                                <span className="text-[#4FC8FF] mt-1">•</span>
                                                                <span>{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}

                                                {section.type === 'image' && (
                                                    <div className="w-full mb-8">
                                                        <Image
                                                            src={section.src || ''}
                                                            alt={section.alt || ''}
                                                            width={800}
                                                            height={500}
                                                            className="w-full h-auto rounded-lg"
                                                        />
                                                        {section.caption && (
                                                            <p className="text-sm text-gray-400 mt-3 text-center italic">
                                                                {section.caption}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {section.type === 'quote' && (
                                                    <blockquote className="border-l-4 border-[#4FC8FF] pl-6 py-4 mb-8 italic">
                                                        <p className="text-lg text-gray-200 leading-relaxed">
                                                            &ldquo;{section.content}&rdquo;
                                                        </p>
                                                    </blockquote>
                                                )}
                                            </motion.div>
                                        ))}
                                </motion.article>
                            </div>

                            {/* 3.2. Cột Sidebar (Right Column, chiếm ~30%) */}
                            <div className="lg:col-span-3">
                                <motion.div
                                    className="p-6 sticky top-8"
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.8 }}
                                    viewport={{ once: true }}
                                >
                                    {/* Tiêu đề widget */}
                                    <h3 className="text-lg font-bold text-white mb-6">Bài viết liên quan</h3>

                                    {/* Danh sách bài viết liên quan */}
                                    <div className="space-y-4">
                                        {relatedPosts.map((relatedPost, index) => (
                                            <motion.div
                                                key={relatedPost.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                                viewport={{ once: true }}
                                            >
                                                {/* Card Container */}
                                                <div className="w-full max-w-[350px] bg-[#1a2332] rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ease-in-out overflow-hidden group border border-gray-800/30">
                                                    {/* Post Thumbnail */}
                                                    <div className="relative w-full aspect-video overflow-hidden">
                                                        <Image
                                                            src={relatedPost.image}
                                                            alt={relatedPost.title}
                                                            fill
                                                            className="object-cover transition-transform duration-200 group-hover:scale-105"
                                                        />
                                                    </div>

                                                    {/* Card Content */}
                                                    <div className="p-4 relative">
                                                        {/* Metadata Row */}
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <svg
                                                                width="16"
                                                                height="16"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                className="text-white opacity-60"
                                                            >
                                                                <path
                                                                    d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
                                                                    fill="currentColor"
                                                                />
                                                            </svg>
                                                            <span className="text-sm text-gray-300">
                                                                {formatDate(relatedPost.publishDate)}
                                                            </span>
                                                            <span className="text-white opacity-60">/</span>
                                                            <span className="text-sm text-[#4FC8FF] uppercase font-medium">
                                                                {relatedPost.category}
                                                            </span>
                                                        </div>

                                                        {/* Title */}
                                                        <h3 className="text-xl font-bold text-white leading-6 mb-2 line-clamp-2">
                                                            {relatedPost.title}
                                                        </h3>

                                                        {/* Excerpt */}
                                                        <p className="text-base text-gray-300 leading-6 line-clamp-3 mb-4">
                                                            Tìm hiểu về những tính năng vượt trội và cách sử dụng hiệu
                                                            quả trong các chuyến đi của bạn.
                                                        </p>

                                                        {/* Action Button */}
                                                        <div className="flex justify-end">
                                                            <Link
                                                                href={`/blogs/${relatedPost.id}`}
                                                                className="w-10 h-10 bg-transparent border border-gray-600/40 rounded-full flex items-center justify-center text-white hover:bg-[#4FC8FF]/10 hover:border-[#4FC8FF]/60 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#4FC8FF]/50"
                                                            >
                                                                <svg
                                                                    width="24"
                                                                    height="24"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="w-6 h-6"
                                                                >
                                                                    <path
                                                                        d="M9 18L15 12L9 6"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                    />
                                                                </svg>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>
            </AvoidSidebar>
        </div>
    );
}
