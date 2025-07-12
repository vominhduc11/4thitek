'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BlogHero, BlogBreadcrumb, BlogGrid, BlogPagination } from './_components';
import type { BlogPost } from './_components/types';

// Mock data for blog posts
const mockBlogPosts: BlogPost[] = [
    {
        id: 1,
        title: 'Hướng dẫn sử dụng SCS S8X Pro cho người mới bắt đầu',
        category: 'TUTORIAL',
        tags: ['SCS', 'S8X', 'hướng dẫn', 'bluetooth'],
        image: '/blog/tutorial-s8x-pro.jpg',
        excerpt:
            'Tìm hiểu cách thiết lập và sử dụng SCS S8X Pro một cách hiệu quả nhất. Hướng dẫn từng bước chi tiết cho người mới bắt đầu.',
        content: 'Nội dung chi tiết về cách sử dụng SCS S8X Pro...',
        author: 'Nguyễn Văn A',
        publishDate: '2024-07-10',
        readTime: 8,
        featured: true,
        popularity: 95
    },
    {
        id: 2,
        title: 'Công nghệ Bluetooth 5.0 trong thiết bị truyền thông hiện đại',
        category: 'TECHNOLOGY',
        tags: ['bluetooth', 'công nghệ', 'truyền thông'],
        image: '/blog/bluetooth-technology.jpg',
        excerpt:
            'Khám phá những ưu điểm vượt trội của công nghệ Bluetooth 5.0 và ứng dụng trong các thiết bị truyền thông chuyên nghiệp.',
        content: 'Nội dung chi tiết về công nghệ Bluetooth 5.0...',
        author: 'Trần Thị B',
        publishDate: '2024-07-08',
        readTime: 12,
        featured: false,
        popularity: 88
    },
    {
        id: 3,
        title: 'Tin tức: Ra mắt dòng sản phẩm G+ Series mới nhất',
        category: 'NEWS',
        tags: ['G+ Series', 'ra mắt', 'sản phẩm mới'],
        image: '/blog/g-plus-series-launch.jpg',
        excerpt:
            'SCS chính thức giới thiệu dòng sản phẩm G+ Series với nhiều tính năng đột phá và công nghệ tiên tiến.',
        content: 'Nội dung chi tiết về dòng G+ Series...',
        author: 'Lê Văn C',
        publishDate: '2024-07-05',
        readTime: 6,
        featured: true,
        popularity: 92
    },
    {
        id: 4,
        title: 'Đánh giá chi tiết SCS G Pro: Thiết bị truyền thông chuyên nghiệp',
        category: 'REVIEW',
        tags: ['G Pro', 'đánh giá', 'chuyên nghiệp'],
        image: '/blog/g-pro-review.jpg',
        excerpt:
            'Đánh giá toàn diện về SCS G Pro từ thiết kế, tính năng đến hiệu suất sử dụng trong môi trường thực tế.',
        content: 'Nội dung đánh giá chi tiết SCS G Pro...',
        author: 'Phạm Thị D',
        publishDate: '2024-07-03',
        readTime: 15,
        featured: false,
        popularity: 85
    },
    {
        id: 5,
        title: '5 mẹo tối ưu hóa chất lượng âm thanh trên thiết bị SCS',
        category: 'TIPS',
        tags: ['mẹo hay', 'âm thanh', 'tối ưu hóa'],
        image: '/blog/audio-optimization-tips.jpg',
        excerpt:
            'Những mẹo đơn giản nhưng hiệu quả để cải thiện chất lượng âm thanh và trải nghiệm sử dụng thiết bị SCS.',
        content: 'Nội dung 5 mẹo tối ưu hóa âm thanh...',
        author: 'Hoàng Văn E',
        publishDate: '2024-07-01',
        readTime: 10,
        featured: false,
        popularity: 78
    },
    {
        id: 6,
        title: 'Cách bảo dưỡng và vệ sinh thiết bị truyền thông đúng cách',
        category: 'TUTORIAL',
        tags: ['bảo dưỡng', 'vệ sinh', 'hướng dẫn'],
        image: '/blog/maintenance-guide.jpg',
        excerpt:
            'Hướng dẫn chi tiết cách bảo dưỡng và vệ sinh thiết bị truyền thông để đảm bảo tuổi thọ và hiệu suất tối ưu.',
        content: 'Nội dung hướng dẫn bảo dưỡng thiết bị...',
        author: 'Nguyễn Thị F',
        publishDate: '2024-06-28',
        readTime: 7,
        featured: false,
        popularity: 82
    },
    {
        id: 7,
        title: 'Xu hướng công nghệ truyền thông không dây năm 2024',
        category: 'TECHNOLOGY',
        tags: ['xu hướng', '2024', 'không dây'],
        image: '/blog/wireless-trends-2024.jpg',
        excerpt:
            'Tổng quan về những xu hướng công nghệ truyền thông không dây mới nhất và dự báo phát triển trong năm 2024.',
        content: 'Nội dung về xu hướng công nghệ 2024...',
        author: 'Vũ Thị G',
        publishDate: '2024-06-25',
        readTime: 11,
        featured: true,
        popularity: 90
    },
    {
        id: 8,
        title: 'So sánh chi tiết: SX Series vs G Series',
        category: 'REVIEW',
        tags: ['so sánh', 'SX Series', 'G Series'],
        image: '/blog/sx-vs-g-comparison.jpg',
        excerpt:
            'Phân tích chi tiết sự khác biệt giữa dòng SX Series và G Series để giúp bạn chọn lựa sản phẩm phù hợp nhất.',
        content: 'Nội dung so sánh SX vs G Series...',
        author: 'Đặng Văn H',
        publishDate: '2024-06-22',
        readTime: 13,
        featured: false,
        popularity: 87
    },
    {
        id: 9,
        title: 'Cập nhật firmware mới nhất cho các thiết bị SCS',
        category: 'NEWS',
        tags: ['firmware', 'cập nhật', 'tính năng mới'],
        image: '/blog/firmware-update.jpg',
        excerpt: 'Thông tin về bản cập nhật firmware mới nhất với nhiều tính năng cải tiến và sửa lỗi quan trọng.',
        content: 'Nội dung về cập nhật firmware...',
        author: 'Ngô Thị I',
        publishDate: '2024-06-20',
        readTime: 5,
        featured: false,
        popularity: 75
    },
    {
        id: 10,
        title: 'Kinh nghiệm sử dụng thiết bị SCS trong điều kiện thời tiết khắc nghiệt',
        category: 'TIPS',
        tags: ['kinh nghiệm', 'thời tiết', 'bảo vệ'],
        image: '/blog/weather-protection-tips.jpg',
        excerpt:
            'Chia sẻ kinh nghiệm thực tế về cách bảo vệ và sử dụng thiết bị SCS trong các điều kiện thời tiết khắc nghiệt.',
        content: 'Nội dung kinh nghiệm sử dụng trong thời tiết khắc nghiệt...',
        author: 'Bùi Văn J',
        publishDate: '2024-06-18',
        readTime: 9,
        featured: false,
        popularity: 80
    }
];

function BlogPageContent() {
    // State management
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(9); // 3x3 grid

    // Get URL parameters
    const searchParams = useSearchParams();

    // Handle URL parameters on component mount
    useEffect(() => {
        if (!searchParams) return;
        
        const categoryParam = searchParams.get('category');
        if (categoryParam && categoryParam !== selectedCategory) {
            setSelectedCategory(categoryParam);
            setCurrentPage(1); // Reset to first page when category changes
        }
    }, [searchParams, selectedCategory]);

    // Filter blogs based on selected category
    const filteredBlogs = useMemo(() => {
        if (selectedCategory === 'ALL') {
            return mockBlogPosts;
        }
        return mockBlogPosts.filter((blog) => blog.category === selectedCategory);
    }, [selectedCategory]);

    // Pagination calculations
    const { currentBlogs, totalPages, totalItems } = useMemo(() => {
        const total = filteredBlogs.length;
        const pages = Math.ceil(total / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const blogs = filteredBlogs.slice(startIndex, endIndex);

        return {
            currentBlogs: blogs,
            totalPages: pages,
            totalItems: total
        };
    }, [filteredBlogs, currentPage, itemsPerPage]);

    // Event handlers
    const handleCategoryClick = (category: string) => {
        if (category === selectedCategory) return; // Prevent unnecessary re-renders
        setSelectedCategory(category);
        setCurrentPage(1); // Reset to first page when category changes
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            // Smooth scroll to top of blog grid
            const blogGrid = document.querySelector('[data-blog-grid]');
            if (blogGrid) {
                blogGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            {/* Hero Video Section */}
            <BlogHero />

            {/* Breadcrumb Section */}
            <BlogBreadcrumb
                selectedCategory={selectedCategory}
                onCategoryClick={handleCategoryClick}
                totalBlogs={mockBlogPosts.length}
                filteredCount={totalItems}
            />

            {/* Blog Grid */}
            <div data-blog-grid>
                <BlogGrid blogs={currentBlogs} />
            </div>

            {/* Pagination */}
            <BlogPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                currentItemsCount={currentBlogs.length}
                onPageChange={handlePageChange}
            />
        </div>
    );
}

export default function BlogPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#0c131d] text-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-[#4FC8FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">Đang tải blog...</p>
                    </div>
                </div>
            }
        >
            <BlogPageContent />
        </Suspense>
    );
}
