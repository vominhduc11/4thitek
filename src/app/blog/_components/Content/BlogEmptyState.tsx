'use client';

import { MdSearch, MdRefresh } from 'react-icons/md';

interface BlogEmptyStateProps {
    selectedCategory: string;
    selectedTag: string;
    onClearFilters: () => void;
}

export function BlogEmptyState({ selectedCategory, selectedTag, onClearFilters }: BlogEmptyStateProps) {
    const hasFilters = selectedCategory !== 'ALL' || selectedTag !== 'ALL';

    return (
        <div className="text-center py-16">
            <div className="max-w-md mx-auto">
                {/* Icon */}
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center">
                    <MdSearch className="text-gray-400" size={32} />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-4">
                    {hasFilters ? 'Không tìm thấy bài viết' : 'Chưa có bài viết'}
                </h3>

                {/* Description */}
                <p className="text-gray-400 mb-8 leading-relaxed">
                    {hasFilters ? (
                        <>
                            Không có bài viết nào phù hợp với bộ lọc hiện tại.
                            <br />
                            Hãy thử điều chỉnh bộ lọc hoặc xóa tất cả để xem thêm bài viết.
                        </>
                    ) : (
                        <>
                            Hiện tại chưa có bài viết nào được đăng tải.
                            <br />
                            Vui lòng quay lại sau để xem nội dung mới.
                        </>
                    )}
                </p>

                {/* Actions */}
                {hasFilters && (
                    <div className="space-y-4">
                        <button
                            onClick={onClearFilters}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4FC8FF] to-[#00A8E8] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#4FC8FF]/25 transition-all duration-300 transform hover:scale-105"
                        >
                            <MdRefresh size={18} />
                            Xóa Tất Cả Bộ Lọc
                        </button>

                        <div className="text-sm text-gray-500">
                            hoặc thử điều chỉnh bộ lọc để tìm kiếm bài viết khác
                        </div>
                    </div>
                )}

                {/* Suggestions */}
                {!hasFilters && (
                    <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
                        <h4 className="text-white font-medium mb-3">Gợi ý cho bạn:</h4>
                        <ul className="text-sm text-gray-400 space-y-2 text-left">
                            <li>• Kiểm tra lại sau để xem bài viết mới</li>
                            <li>• Đăng ký nhận thông báo khi có nội dung mới</li>
                            <li>• Khám phá các sản phẩm của chúng tôi</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
