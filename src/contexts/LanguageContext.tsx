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

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
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
            subtitle: `Discover a breakthrough era of motorcycle communication with 4T HITEK—a pioneering brand in Ho Chi Minh City specializing in telecom components and motorcycle accessories. The 4THITEK solution offers limitless connectivity, safety, and convenience. Featuring cutting-edge Bluetooth technology, a wind-noise reducing mic, and crisp audio, it lets you talk, listen to music, access GPS navigation, and receive real-time safety alerts—even at high speeds or in harsh terrain. Its compact, easy-to-install, and waterproof design fits most standard helmets. With group-connect capability for 2–8 riders and hundreds-of-meters range, you'll stay in touch during group rides or events. Firmware updates via mobile app ensure you always enjoy the latest features without replacing hardware. With 4THITEK, every journey becomes an intelligent, seamless, and stylish communication experience—truly the future of motorcycle connectivity.`,
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
                professional: 'Professional',
                gaming: 'Gaming Headsets',
                wirelessHeadsets: 'Wireless Headsets',
                professionalAudio: 'Professional Audio'
            },
            featured: {
                title: 'Our Product Collection',
                subtitle: 'Explore our comprehensive range of cutting-edge audio technology solutions',
                carouselTitle: 'Featured Products',
                product: 'PRODUCT',
                discoveryNow: 'DISCOVERY NOW',
                sxProElite: 'Professional Gaming Headset with 50mm drivers and advanced noise cancelling technology',
                gxWirelessPro: 'Wireless Gaming Headset with 2.4GHz connectivity and 30-hour battery life',
                hxStudioMaster: 'Professional Studio Headphones with high-quality planar magnetic drivers',
                mxSportElite: 'Sport Wireless Earbuds with IPX7 water resistance and fast charging'
            }
        },
        reseller: {
            title: 'Find Authorized Dealers',
            subtitle:
                'Find the nearest 4THITEK authorized dealers to purchase products and receive the best technical support.',
            city: 'City',
            district: 'District',
            specificAddress: 'Specific Address',
            selectCity: 'Select City',
            selectDistrict: 'Select District',
            enterAddress: 'Enter address...',
            search: 'Search',
            searchingDealers: 'Searching for dealers...',
            loadingMap: 'Loading map...',
            resellerMapTitle: 'Dealer Map',
            clickToSelectReseller: 'Click on a dealer to view location on map',
            zoomOut: 'Zoom Out',
            zoomIn: 'Zoom In',
            fullscreen: 'Fullscreen',
            exitFullscreen: 'Exit Fullscreen',
            selectedDealer: 'Selected dealer',
            otherDealers: 'Other dealers',
            showingOnMap: 'Showing {count} dealers on map',
            useCtrlScroll: 'Use Ctrl + Scroll to zoom',
            pressEscToExit: 'Press ESC to exit fullscreen',
            searchResults: 'Search Results',
            foundDealers: 'Found {count} dealers',
            noResellersFound: 'No dealers found',
            noResellersMessage: 'Please try searching with different keywords or expand the search area.',
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
        newsroom: {
            title: 'Newsroom',
            subtitle: '#RIDING, EXPLORING, ENJOYING',
            tagline: '4T HITEK is here for your Ride...',
            exploreMore: 'Explore More',
            categories: {
                technology: 'TECHNOLOGY',
                tutorial: 'TUTORIAL',
                news: 'NEWS',
                review: 'REVIEW',
                tips: 'TIPS'
            },
            news: {
                '1': {
                    caption: 'Latest breakthrough motorcycle communication technology 2024',
                    title: 'Revolutionary Bluetooth 5.0 Technology',
                    content: 'Discover the latest breakthrough in motorcycle communication with advanced Bluetooth 5.0 technology. Enhanced connectivity, crystal clear audio quality and seamless integration with modern devices.',
                    date: 'March 15, 2024'
                },
                '2': {
                    caption: 'Explore new horizons with advanced rider communication systems',
                    title: 'Motorcycle Adventure Communication',
                    content: 'Join the adventure with premium communication systems designed for long-distance touring. Waterproof design, extended battery life and group communication capabilities for optimal riding experience.',
                    date: 'March 10, 2024'
                },
                '3': {
                    caption: 'Enjoy the ride with crystal clear group communication',
                    title: 'Excellent Group Intercom',
                    content: 'Experience seamless group communication with up to 8 riders simultaneously. Advanced noise cancellation technology ensures clear conversation even at high speeds and harsh weather conditions.',
                    date: 'March 5, 2024'
                },
                '4': {
                    caption: 'Professional riders choose 4T HITEK for reliable communication',
                    title: 'Professional Grade Reliability',
                    content: 'Trusted by professional riders worldwide, our communication systems deliver unmatched reliability and performance. Built to withstand harsh conditions while maintaining superior audio quality.',
                    date: 'February 28, 2024'
                },
                '5': {
                    caption: 'Adventure awaits with premium communication devices',
                    title: 'Premium Product Line Launch',
                    content: 'Introducing our new premium product line with advanced features including GPS navigation integration, voice commands and smart connectivity. Perfect for riders demanding the best technology.',
                    date: 'February 20, 2024'
                },
                '6': {
                    caption: 'Innovation in motorcycle safety and communication technology',
                    title: 'Safety Innovation Award',
                    content: '4T HITEK wins multiple safety innovation awards for our breakthrough communication technology, enhancing rider safety through improved connectivity and emergency features.',
                    date: 'February 15, 2024'
                }
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
        },
        account: {
            welcome: 'Hello',
            logout: 'Logout',
            vipGold: 'VIP Gold',
            customerSince: 'Customer since 2022',
            overview: 'Overview',
            registeredProducts: 'Registered Products',
            warrantyExtension: 'Warranty Extension',
            warrantyRequest: 'Warranty Request',
            accountOverview: 'Account Overview',
            recentActivity: 'Recent Activity',
            quickActions: 'Quick Actions',
            viewProducts: 'View Products',
            extendWarranty: 'Extend Warranty',
            requestWarranty: 'Request Warranty',
            productDetails: 'Product Details',
            serial: 'Serial',
            purchaseDate: 'Purchase Date',
            dealer: 'Dealer',
            warrantyUntil: 'Warranty Until',
            retailPrice: 'Retail Price',
            purchaseLocation: 'Purchase Location',
            viewDetails: 'View Details',
            warranty: 'Warranty',
            remainingDays: 'days remaining',
            expiringIn: 'Expiring in',
            days: 'days',
            warrantyRegistration: 'Warranty Registration',
            warrantyRepair: 'Warranty Repair',
            warrantyExtended: 'Warranty Extended',
            productsRegistered: 'Products Registered',
            activeWarranty: 'Active Warranty',
            expiredWarranty: 'Expired Warranty',
            expiringSoon: 'Expiring Soon',
            active: 'Active',
            expired: 'Expired',
            expiring: 'Expiring Soon',
            productImage: 'Product Image'
        },
        about: {
            title: 'ABOUT US',
            description: 'At 4thitek, we believe that exceptional audio is not just heard—it\'s experienced. Our journey began with a simple mission: to create audio products that deliver uncompromising sound quality, innovative design, and reliable performance.',
            purpose: {
                title: 'Our Purpose',
                description: 'At 4thitek, we\'re driven by our passion for sound. We combine cutting-edge technology with meticulous craftsmanship to create audio products that deliver an immersive and authentic listening experience.'
            },
            mission: {
                title: 'Our Mission',
                description: 'To revolutionize the audio industry by creating products that deliver exceptional sound quality and user experience.'
            },
            vision: {
                title: 'Our Vision',
                description: 'To become the leading global brand for premium audio solutions that enhance how people experience sound.'
            },
            values: {
                title: 'Our Values',
                description: 'Innovation, quality, customer satisfaction, and continuous improvement drive everything we do.'
            },
            history: {
                title: 'Our Journey',
                description: 'From our humble beginnings to becoming a recognized name in audio technology, our journey has been defined by innovation and excellence.',
                milestones: {
                    '2015': {
                        title: 'Company Founded',
                        description: 'Founded in Vietnam with a vision to create premium audio products for discerning listeners.'
                    },
                    '2017': {
                        title: 'First Product Launch',
                        description: 'Released our first SX Series earphones, setting new standards for audio quality in its price range.'
                    },
                    '2019': {
                        title: 'International Expansion',
                        description: 'Expanded to international markets across Southeast Asia and established key distribution partnerships.'
                    },
                    '2021': {
                        title: 'Award-Winning Design',
                        description: 'Our G Series received multiple design awards for its innovative approach to comfort and sound quality.'
                    },
                    '2023': {
                        title: 'Technology Innovation',
                        description: 'Introduced proprietary acoustic technology in our flagship G+ Series, redefining premium audio experiences.'
                    }
                }
            },
            team: {
                title: 'Meet Our Team',
                description: 'Our talented team of audio enthusiasts, engineers, and designers work together to create products that redefine the listening experience.',
                members: {
                    johnSmith: {
                        name: 'John Smith',
                        position: 'CEO & Founder',
                        bio: 'Audio engineer with over 15 years of experience in the industry.'
                    },
                    sarahJohnson: {
                        name: 'Sarah Johnson',
                        position: 'Chief Technology Officer',
                        bio: 'Former Apple engineer specializing in acoustic design and signal processing.'
                    },
                    michaelChen: {
                        name: 'Michael Chen',
                        position: 'Head of Product Design',
                        bio: 'Award-winning industrial designer with a passion for creating beautiful audio products.'
                    },
                    emilyRodriguez: {
                        name: 'Emily Rodriguez',
                        position: 'Marketing Director',
                        bio: 'Digital marketing expert with experience in building premium consumer electronics brands.'
                    }
                }
            }
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
                professional: 'Chuyên Nghiệp',
                gaming: 'Tai Nghe Gaming',
                wirelessHeadsets: 'Tai Nghe Không Dây',
                professionalAudio: 'Âm Thanh Chuyên Nghiệp'
            },
            featured: {
                title: 'Bộ Sưu Tập Sản Phẩm',
                subtitle: 'Khám phá dòng sản phẩm công nghệ âm thanh tiên tiến và đa dạng của chúng tôi',
                carouselTitle: 'Sản Phẩm Tiêu Biểu',
                product: 'SẢN PHẨM',
                discoveryNow: 'KHÁM PHÁ NGAY',
                sxProElite: 'Tai nghe Gaming chuyên nghiệp với driver 50mm và công nghệ chống ồn tiên tiến',
                gxWirelessPro: 'Tai nghe Gaming không dây với kết nối 2.4GHz và thời lượng pin 30 giờ',
                hxStudioMaster: 'Tai nghe Studio chuyên nghiệp với driver planar magnetic chất lượng cao',
                mxSportElite: 'Tai nghe thể thao không dây với khả năng chống nước IPX7 và sạc nhanh'
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
            searchingDealers: 'Đang tìm kiếm đại lý...',
            loadingMap: 'Đang tải bản đồ...',
            resellerMapTitle: 'Bản đồ đại lý',
            clickToSelectReseller: 'Nhấp vào đại lý để xem vị trí trên bản đồ',
            zoomOut: 'Phóng nhỏ',
            zoomIn: 'Phóng to',
            fullscreen: 'Toàn màn hình',
            exitFullscreen: 'Thoát toàn màn hình',
            selectedDealer: 'Đại lý được chọn',
            otherDealers: 'Đại lý khác',
            showingOnMap: 'Hiển thị {count} đại lý trên bản đồ',
            useCtrlScroll: 'Sử dụng Ctrl + Scroll để zoom',
            pressEscToExit: 'Nhấn ESC để thoát toàn màn hình',
            searchResults: 'Kết quả tìm kiếm',
            foundDealers: 'Tìm thấy {count} đại lý',
            noResellersFound: 'Không tìm thấy đại lý',
            noResellersMessage: 'Vui lòng thử tìm kiếm với từ khóa khác hoặc mở rộng khu vực tìm kiếm.',
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
        newsroom: {
            title: 'Newsroom',
            subtitle: '#RIDING, EXPLORING, ENJOYING',
            tagline: '4T HITEK is here for your Ride...',
            exploreMore: 'Khám Phá Thêm',
            categories: {
                technology: 'CÔNG NGHỆ',
                tutorial: 'HƯỚNG DẪN',
                news: 'TIN TỨC',
                review: 'ĐÁNH GIÁ',
                tips: 'MẸO HAY'
            },
            news: {
                '1': {
                    caption: 'Công nghệ truyền thông xe máy mới nhất đột phá năm 2024',
                    title: 'Công nghệ Bluetooth 5.0 Cách mạng',
                    content: 'Khám phá đột phá mới nhất trong truyền thông xe máy với công nghệ Bluetooth 5.0 tiên tiến. Kết nối nâng cao, chất lượng âm thanh trong trẻo và tích hợp liền mạch với các thiết bị hiện đại.',
                    date: '15 tháng 3, 2024'
                },
                '2': {
                    caption: 'Khám phá những chân trời mới với hệ thống truyền thông rider tiên tiến',
                    title: 'Truyền thông Phiêu lưu Xe máy',
                    content: 'Tham gia cuộc phiêu lưu với hệ thống truyền thông cao cấp được thiết kế cho touring đường dài. Thiết kế chống nước, tuổi thọ pin mở rộng và khả năng liên lạc nhóm cho trải nghiệm lái xe tối ưu.',
                    date: '10 tháng 3, 2024'
                },
                '3': {
                    caption: 'Tận hưởng chuyến đi với giao tiếp nhóm trong trẻo',
                    title: 'Intercom Nhóm Xuất sắc',
                    content: 'Trải nghiệm giao tiếp nhóm liền mạch với tối đa 8 rider đồng thời. Công nghệ khử tiếng ồn tiên tiến đảm bảo cuộc trò chuyện rõ ràng ngay cả ở tốc độ cao và trong điều kiện thời tiết khắc nghiệt.',
                    date: '5 tháng 3, 2024'
                },
                '4': {
                    caption: 'Các rider chuyên nghiệp chọn 4T HITEK để truyền thông đáng tin cậy',
                    title: 'Độ tin cậy Cấp chuyên nghiệp',
                    content: 'Được tin tưởng bởi các rider chuyên nghiệp trên toàn thế giới, hệ thống truyền thông của chúng tôi mang lại độ tin cậy và hiệu suất vô song. Được chế tạo để chịu đựng các điều kiện khắc nghiệt trong khi vẫn duy trì chất lượng âm thanh vượt trội.',
                    date: '28 tháng 2, 2024'
                },
                '5': {
                    caption: 'Cuộc phiêu lưu đang chờ đợi với các thiết bị truyền thông cao cấp',
                    title: 'Ra mắt Dòng sản phẩm Premium',
                    content: 'Giới thiệu dòng sản phẩm cao cấp mới với các tính năng nâng cao bao gồm tích hợp GPS navigation, lệnh giọng nói và kết nối thông minh. Hoàn hảo cho những rider đòi hỏi công nghệ tốt nhất.',
                    date: '20 tháng 2, 2024'
                },
                '6': {
                    caption: 'Đổi mới trong công nghệ an toàn và truyền thông xe máy',
                    title: 'Giải thưởng Đổi mới An toàn',
                    content: '4T HITEK giành được nhiều giải thưởng đổi mới an toàn cho công nghệ truyền thông đột phá của chúng tôi, nâng cao an toàn rider thông qua kết nối cải tiến và tính năng khẩn cấp.',
                    date: '15 tháng 2, 2024'
                }
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
        },
        account: {
            welcome: 'Xin chào',
            logout: 'Đăng xuất',
            vipGold: 'VIP Gold',
            customerSince: 'Khách hàng từ 2022',
            overview: 'Tổng quan',
            registeredProducts: 'Sản phẩm đã đăng ký',
            warrantyExtension: 'Gia hạn bảo hành',
            warrantyRequest: 'Yêu cầu bảo hành',
            accountOverview: 'Tổng quan tài khoản',
            recentActivity: 'Hoạt động gần đây',
            quickActions: 'Thao tác nhanh',
            viewProducts: 'Xem sản phẩm',
            extendWarranty: 'Gia hạn bảo hành',
            requestWarranty: 'Yêu cầu bảo hành',
            productDetails: 'Chi tiết sản phẩm',
            serial: 'Serial',
            purchaseDate: 'Ngày mua',
            dealer: 'Đại lý',
            warrantyUntil: 'Bảo hành đến',
            retailPrice: 'Giá bán lẻ',
            purchaseLocation: 'Nơi mua',
            viewDetails: 'Xem chi tiết',
            warranty: 'Bảo hành',
            remainingDays: 'ngày còn lại',
            expiringIn: 'Sắp hết hạn trong',
            days: 'ngày',
            warrantyRegistration: 'Đăng ký bảo hành',
            warrantyRepair: 'Sửa lỗi màn hình',
            warrantyExtended: 'Gia hạn 1 năm',
            productsRegistered: 'Sản phẩm đã đăng ký',
            activeWarranty: 'Còn bảo hành',
            expiredWarranty: 'Hết bảo hành',
            expiringSoon: 'Sắp hết hạn',
            active: 'Còn bảo hành',
            expired: 'Hết bảo hành',
            expiring: 'Sắp hết hạn',
            productImage: 'Hình sản phẩm'
        },
        about: {
            title: 'VỀ CHÚNG TÔI',
            description: 'Tại 4thitek, chúng tôi tin rằng âm thanh đặc biệt không chỉ được nghe thấy mà còn được trải nghiệm. Hành trình của chúng tôi bắt đầu với một sứ mệnh đơn giản: tạo ra các sản phẩm âm thanh mang lại chất lượng âm thanh không thỏa hiệp, thiết kế sáng tạo và hiệu suất đáng tin cậy.',
            purpose: {
                title: 'Mục Đích Của Chúng Tôi',
                description: 'Tại 4thitek, chúng tôi được thúc đẩy bởi niềm đam mê âm thanh. Chúng tôi kết hợp công nghệ tiên tiến với sự khéo léo tỉ mỉ để tạo ra các sản phẩm âm thanh mang lại trải nghiệm nghe nhập vai và chân thực.'
            },
            mission: {
                title: 'Sứ Mệnh Của Chúng Tôi',
                description: 'Cách mạng hóa ngành công nghiệp âm thanh bằng cách tạo ra các sản phẩm mang lại chất lượng âm thanh và trải nghiệm người dùng đặc biệt.'
            },
            vision: {
                title: 'Tầm Nhìn Của Chúng Tôi',
                description: 'Trở thành thương hiệu toàn cầu hàng đầu cho các giải pháp âm thanh cao cấp giúp nâng cao cách mọi người trải nghiệm âm thanh.'
            },
            values: {
                title: 'Giá Trị Của Chúng Tôi',
                description: 'Đổi mới, chất lượng, sự hài lòng của khách hàng và cải tiến liên tục thúc đẩy mọi điều chúng tôi làm.'
            },
            history: {
                title: 'Hành Trình Của Chúng Tôi',
                description: 'Từ những khởi đầu khiêm tốn đến trở thành một cái tên được công nhận trong công nghệ âm thanh, hành trình của chúng tôi được định nghĩa bởi sự đổi mới và xuất sắc.',
                milestones: {
                    '2015': {
                        title: 'Thành Lập Công Ty',
                        description: 'Được thành lập tại Việt Nam với tầm nhìn tạo ra các sản phẩm âm thanh cao cấp cho những người nghe sành điệu.'
                    },
                    '2017': {
                        title: 'Ra Mắt Sản Phẩm Đầu Tiên',
                        description: 'Phát hành dòng tai nghe SX Series đầu tiên, thiết lập các tiêu chuẩn mới về chất lượng âm thanh trong tầm giá.'
                    },
                    '2019': {
                        title: 'Mở Rộng Quốc Tế',
                        description: 'Mở rộng ra các thị trường quốc tế trên khắp Đông Nam Á và thiết lập các đối tác phân phối chính.'
                    },
                    '2021': {
                        title: 'Thiết Kế Đoạt Giải',
                        description: 'Dòng G Series của chúng tôi đã nhận được nhiều giải thưởng thiết kế cho phương pháp tiếp cận sáng tạo về sự thoải mái và chất lượng âm thanh.'
                    },
                    '2023': {
                        title: 'Đổi Mới Công Nghệ',
                        description: 'Giới thiệu công nghệ âm học độc quyền trong dòng G+ Series hàng đầu, định nghĩa lại trải nghiệm âm thanh cao cấp.'
                    }
                }
            },
            team: {
                title: 'Gặp Gỡ Đội Ngũ Của Chúng Tôi',
                description: 'Đội ngũ tài năng gồm những người đam mê âm thanh, kỹ sư và nhà thiết kế cùng nhau tạo ra những sản phẩm định nghĩa lại trải nghiệm nghe.',
                members: {
                    johnSmith: {
                        name: 'John Smith',
                        position: 'CEO & Người Sáng Lập',
                        bio: 'Kỹ sư âm thanh với hơn 15 năm kinh nghiệm trong ngành.'
                    },
                    sarahJohnson: {
                        name: 'Sarah Johnson',
                        position: 'Giám Đốc Công Nghệ',
                        bio: 'Cựu kỹ sư Apple chuyên về thiết kế âm học và xử lý tín hiệu.'
                    },
                    michaelChen: {
                        name: 'Michael Chen',
                        position: 'Trưởng Phòng Thiết Kế Sản Phẩm',
                        bio: 'Nhà thiết kế công nghiệp đoạt giải với đam mê tạo ra các sản phẩm âm thanh đẹp mắt.'
                    },
                    emilyRodriguez: {
                        name: 'Emily Rodriguez',
                        position: 'Giám Đốc Marketing',
                        bio: 'Chuyên gia marketing kỹ thuật số với kinh nghiệm xây dựng thương hiệu điện tử tiêu dùng cao cấp.'
                    }
                }
            }
        }
    }
};
