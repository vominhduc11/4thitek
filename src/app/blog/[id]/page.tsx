'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MdCalendarToday, MdLocalOffer } from 'react-icons/md';
import { BlogDetailHero } from '../_components';
import { BlogPost } from '../_components/types';

// Mock data - would typically come from API
const mockBlogPosts = [
    {
        id: 1,
        title: 'HƯỚNG DẪN SỬ DỤNG SCS S8X PRO CHO NGƯỜI MỚI BẮT ĐẦU',
        category: 'TUTORIAL',
        tags: ['SCS', 'S8X', 'hướng dẫn', 'bluetooth'],
        image: '/blog/tutorial-s8x-pro.jpg',
        bannerImage: '/blog/honda-motorbike-banner.jpg',
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
                    src: '/blog/nic-helmet.jpg',
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
                    src: '/blog/lock-detail.jpg',
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
        title: 'Top 5 mũ bảo hiểm tốt nhất 2025',
        category: 'REVIEW',
        image: '/blog/helmet-review.jpg',
        publishDate: '2025-04-15',
        readTime: 8
    },
    {
        id: 3,
        title: 'Cách bảo dưỡng thiết bị Bluetooth',
        category: 'TIPS',
        image: '/blog/bluetooth-maintenance.jpg',
        publishDate: '2025-04-10',
        readTime: 6
    },
    {
        id: 4,
        title: 'An toàn giao thông cho biker',
        category: 'SAFETY',
        image: '/blog/biker-safety.jpg',
        publishDate: '2025-04-05',
        readTime: 10
    }
];

export default function BlogDetailPage() {
    const params = useParams();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

    useEffect(() => {
        const postId = parseInt(params.id as string);
        const foundPost = mockBlogPosts.find((p) => p.id === postId);

        if (foundPost) {
            setPost(foundPost as BlogPost);
            // Get related posts (excluding current post)
            const related = mockBlogPosts.filter((p) => p.id !== postId).slice(0, 3);
            setRelatedPosts(related as BlogPost[]);
        }
        setLoading(false);
    }, [params.id]);

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
                    <Link href="/blog" className="text-[#4FC8FF] hover:underline">
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

    return (
        <div className="min-h-screen bg-[#0c131d]">
            {/* Hero Section */}
            <BlogDetailHero post={post} />

            {/* Header & Title Section */}
            <section className="relative w-full h-[400px] overflow-hidden">
                {/* Banner Image */}
                <div className="absolute inset-0">
                    <Image
                        src={post.bannerImage || post.image}
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-black/60"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 h-full flex items-center">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                        <div className="max-w-4xl">
                            {/* Title */}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight uppercase">
                                {post.title}
                            </h1>

                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-6 text-white/80">
                                <div className="flex items-center gap-2">
                                    <MdCalendarToday size={16} />
                                    <span className="text-sm">{formatDate(post.publishDate)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MdLocalOffer size={16} />
                                    <span className="text-sm uppercase tracking-wide">{post.category}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gradient Overlay - Smooth transition */}
                <div
                    className="
          absolute inset-x-0 bottom-0
          h-32 sm:h-48 md:h-64
          bg-gradient-to-b
          from-transparent
          via-[#0c131d]/50
          to-[#0c131d]
          pointer-events-none
          z-10
        "
                ></div>
            </section>

            {/* Intro Section - Seamless continuation */}
            <section className="bg-[#0c131d] py-16 -mt-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16">
                    <p className="text-lg sm:text-xl text-white leading-relaxed">
                        {typeof post.content === 'object' && post.content?.intro ? post.content.intro : post.excerpt}
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="bg-gray-50 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Content Frame */}
                        <div className="lg:col-span-3">
                            <article className="bg-white rounded-lg shadow-lg p-8 sm:p-12">
                                {typeof post.content === 'object' &&
                                    post.content?.sections?.map((section, index: number) => (
                                        <div key={index} className="mb-8">
                                            {section.type === 'heading' && (
                                                <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">
                                                    {section.content}
                                                </h2>
                                            )}

                                            {section.type === 'paragraph' && (
                                                <p className="text-base text-gray-800 leading-relaxed mb-6">
                                                    {section.content}
                                                </p>
                                            )}

                                            {section.type === 'image' && (
                                                <div
                                                    className={`mb-6 ${section.float === 'left' ? 'sm:float-left sm:w-1/2 sm:mr-6 sm:mb-4' : 'text-center'}`}
                                                >
                                                    <div className="relative w-full max-w-2xl mx-auto">
                                                        <Image
                                                            src={section.src || ''}
                                                            alt={section.alt || ''}
                                                            width={800}
                                                            height={600}
                                                            className="w-full h-auto rounded-lg"
                                                        />
                                                        {section.caption && (
                                                            <p className="text-sm text-gray-600 mt-2 italic">
                                                                {section.caption}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {section.type === 'list' && (
                                                <ul className="list-disc list-inside space-y-2 mb-6 ml-5">
                                                    {section.items?.map((item: string, itemIndex: number) => (
                                                        <li
                                                            key={itemIndex}
                                                            className="text-base text-gray-800 leading-relaxed"
                                                        >
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {section.type === 'quote' && (
                                                <blockquote className="bg-gray-50 border-l-4 border-[#4FC8FF] p-6 mb-6 italic">
                                                    <p className="text-lg text-gray-700">
                                                        &ldquo;{section.content}&rdquo;
                                                    </p>
                                                </blockquote>
                                            )}
                                        </div>
                                    ))}
                            </article>
                        </div>

                        {/* Sidebar - Related Posts */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                                <h3 className="text-xl font-bold text-black mb-6">Bài viết liên quan</h3>

                                <div className="space-y-4">
                                    {relatedPosts.map((relatedPost) => (
                                        <Link
                                            key={relatedPost.id}
                                            href={`/blog/${relatedPost.id}`}
                                            className="block group hover:bg-gray-50 p-3 rounded-lg transition-colors duration-200"
                                        >
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0">
                                                    <Image
                                                        src={relatedPost.image}
                                                        alt={relatedPost.title}
                                                        width={80}
                                                        height={80}
                                                        className="w-20 h-20 object-cover rounded-lg"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-black group-hover:text-[#4FC8FF] line-clamp-2 mb-2">
                                                        {relatedPost.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <span>{formatDate(relatedPost.publishDate)}</span>
                                                        <span>•</span>
                                                        <span>{relatedPost.readTime} phút đọc</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
