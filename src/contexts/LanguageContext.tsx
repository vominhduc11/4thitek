'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'vi';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    isHydrated: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const [language, setLanguage] = useState<Language>('en');
    const [isHydrated, setIsHydrated] = useState(false);

    // Load language from localStorage on mount - proper SSR handling
    useEffect(() => {
        setIsHydrated(true);
        
        // Only access localStorage after hydration
        if (typeof window !== 'undefined') {
            const savedLanguage = localStorage.getItem('language') as Language;
            if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'vi')) {
                setLanguage(savedLanguage);
            }
        }
    }, []);

    // Save language to localStorage when changed
    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        // Only access localStorage on client side
        if (typeof window !== 'undefined') {
            localStorage.setItem('language', lang);
        }
    };

    // Translation function
    const t = (key: string): string => {
        const keys = key.split('.');
        let value: Record<string, unknown> | string = translations[language];
        
        for (const k of keys) {
            if (typeof value === 'object' && value !== null) {
                value = (value as Record<string, unknown>)[k] as Record<string, unknown> | string;
            } else {
                return key;
            }
        }
        
        return typeof value === 'string' ? value : key; // Return key if translation not found
    };

    const value = {
        language,
        setLanguage: handleSetLanguage,
        t,
        isHydrated
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Translation data
const translations = {
    en: {
        nav: {
            navigation: 'Navigation',
            home: 'Home',
            products: 'Products',
            company: 'Company',
            reseller: 'Reseller',
            blog: 'Blog',
            contact: 'Contact Us'
        },
        hero: {
            title: 'Professional Audio Communication',
            subtitle: 'Experience the future of motorcycle communication with 4THITEK',
            cta: 'Explore Products'
        },
        products: {
            title: 'Our Products',
            subtitle: 'Discover our range of professional audio communication devices',
            contactForInfo: 'Contact for Information',
            distributorProduct: 'Distributor Product',
            viewDetails: 'View Details',
            categories: {
                all: 'All',
                bluetooth: 'Bluetooth',
                wireless: 'Wireless',
                professional: 'Professional'
            }
        },
        reseller: {
            title: 'Find Authorized Dealers',
            subtitle: 'Find the nearest 4THITEK authorized dealers to purchase products and receive the best technical support.',
            city: 'City',
            district: 'District',
            specificAddress: 'Specific Address',
            selectCity: 'Select City',
            selectDistrict: 'Select District',
            enterAddress: 'Enter address...',
            search: 'Search',
            hours: 'Hours',
            phone: 'Phone',
            email: 'Email',
            specialties: 'Specialties',
            directions: 'Get Directions'
        },
        blog: {
            title: 'Latest News & Articles',
            subtitle: 'Stay updated with the latest technology trends and product updates',
            readMore: 'Read More',
            relatedArticles: 'Related Articles',
            categories: {
                all: 'All',
                technology: 'Technology',
                tutorial: 'Tutorial',
                news: 'News',
                review: 'Review',
                tips: 'Tips',
                safety: 'Safety'
            }
        },
        common: {
            loading: 'Loading...',
            notFound: 'Not Found',
            backToHome: 'Back to Home',
            backToBlog: 'Back to Blog List',
            contactUs: 'Contact Us',
            readTime: 'min read',
            language: 'Language',
            vietnamese: 'Vietnamese',
            english: 'English'
        }
    },
    vi: {
        nav: {
            navigation: 'Điều Hướng',
            home: 'Trang Chủ',
            products: 'Sản Phẩm',
            company: 'Công Ty',
            reseller: 'Đại Lý',
            blog: 'Blog',
            contact: 'Liên Hệ'
        },
        hero: {
            title: 'Truyền Thông Âm Thanh Chuyên Nghiệp',
            subtitle: 'Trải nghiệm tương lai của giao tiếp xe máy với 4THITEK',
            cta: 'Khám Phá Sản Phẩm'
        },
        products: {
            title: 'Sản Phẩm Của Chúng Tôi',
            subtitle: 'Khám phá dòng sản phẩm thiết bị truyền thông âm thanh chuyên nghiệp',
            contactForInfo: 'Liên Hệ Để Biết Thông Tin',
            distributorProduct: 'Sản Phẩm Phân Phối',
            viewDetails: 'Xem Chi Tiết',
            categories: {
                all: 'Tất Cả',
                bluetooth: 'Bluetooth',
                wireless: 'Không Dây',
                professional: 'Chuyên Nghiệp'
            }
        },
        reseller: {
            title: 'Tìm Đại Lý Ủy Quyền',
            subtitle: 'Tìm kiếm đại lý ủy quyền 4THITEK gần nhất để mua sản phẩm và nhận hỗ trợ kỹ thuật tốt nhất.',
            city: 'Thành Phố',
            district: 'Quận/Huyện',
            specificAddress: 'Địa Chỉ Cụ Thể',
            selectCity: 'Chọn Thành Phố',
            selectDistrict: 'Chọn Quận/Huyện',
            enterAddress: 'Nhập địa chỉ...',
            search: 'Tìm Kiếm',
            hours: 'Giờ Mở Cửa',
            phone: 'Điện Thoại',
            email: 'Email',
            specialties: 'Chuyên Môn',
            directions: 'Chỉ Đường'
        },
        blog: {
            title: 'Tin Tức & Bài Viết Mới Nhất',
            subtitle: 'Cập nhật xu hướng công nghệ mới nhất và thông tin sản phẩm',
            readMore: 'Đọc Thêm',
            relatedArticles: 'Bài Viết Liên Quan',
            categories: {
                all: 'Tất Cả',
                technology: 'Công Nghệ',
                tutorial: 'Hướng Dẫn',
                news: 'Tin Tức',
                review: 'Đánh Giá',
                tips: 'Mẹo Hay',
                safety: 'An Toàn'
            }
        },
        common: {
            loading: 'Đang tải...',
            notFound: 'Không tìm thấy',
            backToHome: 'Về Trang Chủ',
            backToBlog: 'Quay Lại Danh Sách Blog',
            contactUs: 'Liên Hệ',
            readTime: 'phút đọc',
            language: 'Ngôn Ngữ',
            vietnamese: 'Tiếng Việt',
            english: 'Tiếng Anh'
        }
    }
};