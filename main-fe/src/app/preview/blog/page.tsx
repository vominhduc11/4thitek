'use client';

import { useEffect, useState } from 'react';
import BlogDetailPageClient from '@/app/blogs/[id]/BlogDetailPageClient';
import { PreviewGuard } from '@/components/preview/PreviewGuard';
import { mapBlogSummaryToPost } from '@/lib/contentMappers';
import type { BlogPost } from '@/types/blog';

// Origin của app admin — chỉ nhận postMessage từ đây. Header `frame-ancestors` ở
// next.config cũng chỉ cho admin nhúng route /preview/*.
const ADMIN_ORIGIN = (process.env.NEXT_PUBLIC_ADMIN_ORIGIN ?? '').replace(/\/$/, '');

type BlogPreviewData = {
    id: string | number | null;
    title: unknown;
    description: unknown;
    image: string;
    category: unknown;
    createdAt: unknown;
    introduction?: string;
};
type PreviewInbound = { type: '4thitek-preview'; data: BlogPreviewData };

/**
 * Khung xem trước "sống" cho admin editor: nhận dữ liệu bài viết bản nháp (backend
 * dry-run đã map sang public shape) qua postMessage rồi render bằng đúng
 * <BlogDetailPageClient> của trang bài viết thật. Route noindex + chỉ admin origin
 * nhúng được (xem next.config headers).
 */
export default function BlogPreviewPage() {
    const [post, setPost] = useState<BlogPost | null>(null);

    useEffect(() => {
        function handleMessage(event: MessageEvent) {
            if (ADMIN_ORIGIN && event.origin !== ADMIN_ORIGIN) return;
            const inbound = event.data as PreviewInbound | undefined;
            if (!inbound || inbound.type !== '4thitek-preview' || !inbound.data) return;
            // id có thể null cho bản nháp — chèn id giả để mapper không loại bỏ. Nếu
            // thiếu tiêu đề, mapper trả null → giữ màn hình chờ (nhắc nhập tiêu đề).
            const mapped = mapBlogSummaryToPost({ ...inbound.data, id: inbound.data.id ?? 'preview' });
            setPost(mapped);
        }

        window.addEventListener('message', handleMessage);
        window.parent?.postMessage({ type: '4thitek-preview-ready' }, ADMIN_ORIGIN || '*');

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    if (!post) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#06111B] px-6 text-center text-sm text-white/70">
                Đang chờ dữ liệu xem trước… (cần ít nhất tiêu đề bài viết)
            </div>
        );
    }

    return (
        <>
            <PreviewGuard />
            <BlogDetailPageClient post={post} relatedPosts={[]} />
        </>
    );
}
