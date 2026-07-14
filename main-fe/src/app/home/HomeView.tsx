'use client';

import { useEffect, useState } from 'react';
import { HeroSection, Newsroom, ProductSeries } from './components';
import BrandValues from './components/BrandValues';
import { useLanguage } from '@/context/LanguageContext';
import { apiService } from '@/services/apiService';
import { DEFAULT_LOCALE } from '@/lib/site';
import type { HomeContent } from '@/types/content';
import type { SimpleProduct } from '@/types/product';
import type { BlogPost } from '@/types/blog';

function WaveDivider({ fromColor, toColor }: { fromColor: string; toColor: string }) {
    return (
        <div
            className="relative h-10 overflow-hidden sm:h-14 md:h-[72px] lg:h-20 xl:h-24"
            style={{ background: toColor }}
            aria-hidden="true"
        >
            <svg
                viewBox="0 0 1440 72"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0 h-full w-full"
            >
                <path d="M0,0 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,0 Z" fill={fromColor} />
            </svg>
        </div>
    );
}

interface HomeViewProps {
    heroProduct: SimpleProduct | null;
    homepageProducts: SimpleProduct[];
    blogs: BlogPost[];
    /** Nội dung CMS bản `vi` render sẵn ở server (SEO canonical + first paint). */
    initialContent: HomeContent | null;
}

/**
 * Lớp CSR-hybrid cho home: server render bản `vi` tĩnh (SSG/ISR). Products/blogs không phụ
 * thuộc ngôn ngữ nên giữ nguyên; chỉ nội dung CMS (hero/showcase/brandValues/newsroom) cần
 * đổi theo ngôn ngữ. Khi khách chọn `en`, fetch bản `en` ở client và override — vẫn giữ
 * kiến trúc không-SSR. Bản `vi` không phải fetch lại (đã có sẵn từ server).
 */
export default function HomeView({ heroProduct, homepageProducts, blogs, initialContent }: HomeViewProps) {
    const { language } = useLanguage();
    const [content, setContent] = useState<HomeContent | null>(initialContent);

    useEffect(() => {
        // `vi` đã được server render sẵn → dùng luôn initialContent, không fetch lại.
        if (language === DEFAULT_LOCALE) {
            setContent(initialContent);
            return;
        }

        let cancelled = false;
        void apiService
            .fetchContentSection<HomeContent>('home', language)
            .then((response) => {
                if (!cancelled) {
                    setContent(response.data ?? initialContent);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setContent(initialContent);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [language, initialContent]);

    return (
        <div className="relative overflow-hidden bg-[#06111B] text-white">
            <HeroSection initialProduct={heroProduct} content={content?.hero} />
            <ProductSeries initialProducts={homepageProducts} content={content?.showcase} />
            <WaveDivider fromColor="#06111B" toColor="#081A2A" />
            <BrandValues content={content?.brandValues} />
            <WaveDivider fromColor="#081A2A" toColor="#06111B" />
            <Newsroom initialBlogs={blogs} content={content?.newsroom} />
        </div>
    );
}
