'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { MdArrowForward } from 'react-icons/md';
import type { BlogPost } from './types';

interface BlogGridProps {
    blogs: BlogPost[];
}

const BlogGrid = ({ blogs }: BlogGridProps) => {
    // Format date to Vietnamese format
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Get category display name in Vietnamese
    const getCategoryDisplay = (category: string) => {
        const categoryNames: { [key: string]: string } = {
            TECHNOLOGY: 'CÔNG NGHỆ',
            TUTORIAL: 'HƯỚNG DẪN',
            NEWS: 'TIN TỨC',
            REVIEW: 'ĐÁNH GIÁ',
            TIPS: 'MẸO HAY'
        };
        return categoryNames[category] || category;
    };

    // Get category color
    const getCategoryColor = (category: string) => {
        const categoryColors: { [key: string]: string } = {
            TECHNOLOGY: 'text-blue-400',
            TUTORIAL: 'text-green-400',
            NEWS: 'text-red-400',
            REVIEW: 'text-purple-400',
            TIPS: 'text-yellow-400'
        };
        return categoryColors[category] || 'text-gray-400';
    };

    return (
        <div className="ml-16 sm:ml-20 px-6 sm:px-12 lg:px-20 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {blogs.map((blog, index) => (
                    <motion.article
                        key={blog.id}
                        className="group bg-transparent rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-white/10 hover:border-white/20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{
                            y: -8,
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
                        }}
                    >
                        <Link href={`/blog/${blog.id}`} className="block">
                            {/* Cover Image - 16:9 Aspect Ratio */}
                            <div className="relative w-full aspect-video overflow-hidden">
                                <Image
                                    src={blog.image}
                                    alt={`Ảnh bìa bài viết: ${blog.title}`}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                />

                                {/* Featured Badge */}
                                {blog.featured && (
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-[#4FC8FF] text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                                            Nổi bật
                                        </span>
                                    </div>
                                )}

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>

                            {/* Card Content */}
                            <div className="p-6">
                                {/* Metadata */}
                                <div className="flex items-center justify-between mb-3">
                                    <time
                                        dateTime={blog.publishDate}
                                        className="text-xs font-medium text-gray-400 uppercase tracking-wide"
                                    >
                                        {formatDate(blog.publishDate)}
                                    </time>
                                    <span
                                        className={`text-xs font-bold uppercase tracking-wide ${getCategoryColor(blog.category)}`}
                                    >
                                        {getCategoryDisplay(blog.category)}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-[#4FC8FF] transition-colors duration-300">
                                    {blog.title}
                                </h3>

                                {/* Excerpt */}
                                <p className="text-sm sm:text-base text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                                    {blog.excerpt}
                                </p>

                                {/* Bottom Section */}
                                <div className="flex items-center justify-between">
                                    {/* Author & Read Time */}
                                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                                        <span className="font-medium">{blog.author}</span>
                                        <span>•</span>
                                        <span>{blog.readTime} phút đọc</span>
                                    </div>

                                    {/* CTA Arrow Button */}
                                    <motion.div
                                        className="flex items-center justify-center w-11 h-11 bg-white/10 rounded-full group-hover:bg-[#4FC8FF] transition-all duration-300 backdrop-blur-sm"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <MdArrowForward
                                            className="w-5 h-5 text-white group-hover:text-white transition-colors duration-300"
                                            aria-label="Đọc bài viết"
                                        />
                                    </motion.div>
                                </div>
                            </div>
                        </Link>
                    </motion.article>
                ))}
            </div>

            {/* Empty State */}
            {blogs.length === 0 && (
                <motion.div
                    className="text-center py-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="max-w-md mx-auto">
                        <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <svg
                                className="w-12 h-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">Không tìm thấy bài viết</h3>
                        <p className="text-gray-400">
                            Hiện tại chưa có bài viết nào trong danh mục này.
                            <br />
                            Vui lòng quay lại sau để xem nội dung mới.
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default BlogGrid;
