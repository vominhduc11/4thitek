'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'vi';

type TranslationValue = string | Record<string, unknown>;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    getTranslation: (key: string) => TranslationValue | null;
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

    // Translation function for strings
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

    // Translation function for objects
    const getTranslation = (key: string): TranslationValue | null => {
        const keys = key.split('.');
        let value: TranslationValue = translations[language];

        for (const k of keys) {
            if (typeof value === 'object' && value !== null) {
                value = (value as Record<string, unknown>)[k] as TranslationValue;
            } else {
                return null;
            }
        }

        return value;
    };

    const value = {
        language,
        setLanguage: handleSetLanguage,
        t,
        getTranslation,
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
            },
            detail: {
                breadcrumbs: {
                    productDetails: 'PRODUCT DESCRIPTION',
                    productVideos: 'PRODUCT VIDEOS',
                    specifications: 'SPECIFICATIONS',
                    warranty: 'WARRANTY'
                },
                loading: 'Loading product...',
                notFound: 'Product not found',
                backToProducts: 'Back to Products',
                relatedProducts: 'RELATED PRODUCTS',
                viewOtherProducts: 'View other related products'
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
            processingLocations: 'Processing locations...',
            loadingDealers: 'Loading dealers...',
            errorTitle: 'Error Loading Resellers',
            fallbackMessage: 'Showing fallback data instead.',
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
            list: {
                title: 'BLOG LIST',
                searchPlaceholder: 'Search articles...',
                showingAll: 'Showing all',
                showingFiltered: 'Showing',
                articles: 'articles',
                articlesIn: 'articles in',
                allCategories: 'ALL CATEGORIES',
                all: 'ALL'
            },
            detail: {
                loading: 'Loading...',
                notFound: 'Article Not Found',
                backToList: 'Back to Blog List',
                readTime: 'min read',
                relatedArticles: 'Related Articles',
                breadcrumbDetail: 'Blog Detail'
            },
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
        // account section removed - no longer used
        certification: {
            title: 'CERTIFICATION',
            subtitle: 'Our products meet the highest industry standards and have received certifications from leading international organizations. These certifications ensure that our audio devices deliver exceptional quality, safety, and performance.',
            list: {
                title: 'Our Certifications',
                description: 'Our products meet the highest industry standards and have received certifications from leading international organizations.',
                issuedBy: 'Issued by',
                details: 'View Details'
            },
            certifications: {
                ce: {
                    name: 'CE Certification',
                    description: 'The CE mark indicates that our products comply with health, safety, and environmental protection standards for products sold within the European Economic Area.',
                    issuedBy: 'European Union'
                },
                fcc: {
                    name: 'FCC Certification',
                    description: 'FCC certification confirms that the electromagnetic interference from our devices is under limits approved by the Federal Communications Commission.',
                    issuedBy: 'Federal Communications Commission, USA'
                },
                rohs: {
                    name: 'RoHS Compliance',
                    description: 'RoHS certification ensures our products are free from specific hazardous materials such as lead, mercury, and cadmium.',
                    issuedBy: 'European Union'
                },
                iso9001: {
                    name: 'ISO 9001:2015',
                    description: 'ISO 9001:2015 certification confirms that our quality management systems meet international standards for consistent quality products.',
                    issuedBy: 'International Organization for Standardization'
                },
                bluetooth: {
                    name: 'Bluetooth SIG Certification',
                    description: 'Bluetooth SIG certification ensures our wireless devices meet Bluetooth standards for compatibility and performance.',
                    issuedBy: 'Bluetooth Special Interest Group'
                },
                energy: {
                    name: 'Energy Star Certification',
                    description: 'Energy Star certification confirms that our products meet energy efficiency guidelines set by the US Environmental Protection Agency.',
                    issuedBy: 'US Environmental Protection Agency'
                }
            },
            process: {
                title: 'Certification Process',
                subtitle: 'Our rigorous certification process ensures every product meets the highest standards',
                steps: {
                    design: {
                        title: 'Design & Development',
                        description: 'Product design with compliance standards in mind from the beginning'
                    },
                    testing: {
                        title: 'Testing & Validation',
                        description: 'Comprehensive testing in accredited laboratories'
                    },
                    documentation: {
                        title: 'Documentation & Review',
                        description: 'Complete documentation and third-party review process'
                    },
                    certification: {
                        title: 'Certification & Approval',
                        description: 'Final certification and regulatory approval'
                    }
                }
            },
            faq: {
                title: 'Frequently Asked Questions',
                subtitle: 'Find answers to common questions about our product certifications and quality standards.',
                questions: {
                    q1: {
                        question: 'What certifications do your products have?',
                        answer: 'Our products are certified with CE, FCC, RoHS, ISO 9001:2015, Bluetooth SIG, and Energy Star certifications.'
                    },
                    q2: {
                        question: 'How do I verify certification validity?',
                        answer: 'You can verify our certifications by checking the certification numbers on our product documentation or contacting the issuing organizations directly.'
                    },
                    q3: {
                        question: 'Are your products safe for international use?',
                        answer: 'Yes, our certifications ensure compliance with international safety and performance standards for global use.'
                    }
                }
            }
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
        },
        contact: {
            title: 'CONTACT US',
            description: 'Contact us for the best consultation and support. TuneZone\'s team of specialists is always ready to answer all questions and help you find the most suitable products.',
            info: {
                address: 'Address',
                phone: 'Phone',
                email: 'Email',
                hours: 'Working Hours',
                addressContent: ['123 Le Loi Street, District 1', 'Ho Chi Minh City, Vietnam'],
                phoneContent: ['Hotline: 0123 456 789', 'Zalo: 0987 654 321'],
                emailContent: ['contact@4thiteck.com'],
                hoursContent: ['Monday - Friday: 8:00 - 18:00', 'Saturday - Sunday: 8:00 - 17:00']
            },
            form: {
                title: 'Send Message',
                name: 'Full Name',
                nameRequired: 'Full Name *',
                namePlaceholder: 'Enter full name',
                phone: 'Phone Number',
                phonePlaceholder: 'Enter phone number',
                email: 'Email',
                emailRequired: 'Email *',
                emailPlaceholder: 'Enter email address',
                subject: 'Subject',
                selectSubject: 'Select subject',
                subjects: {
                    productInquiry: 'Product Consultation',
                    warranty: 'Warranty',
                    complaint: 'Complaint',
                    partnership: 'Partnership',
                    other: 'Other'
                },
                message: 'Message',
                messageRequired: 'Message *',
                messagePlaceholder: 'Enter message content...',
                sendButton: 'Send Message',
                sendingButton: 'Sending...',
                successMessage: 'Thank you for contacting us! We will respond as soon as possible.'
            },
            map: {
                title: 'Store Location',
                connectTitle: 'Connect with us'
            }
        },
        policy: {
            title: 'POLICY',
            breadcrumbLabel: 'Policy',
            policies: {
                warranty: 'Warranty Policy',
                return: 'Return Policy',
                privacy: 'Privacy Policy',
                terms: 'Terms & Conditions'
            },
            descriptions: {
                warranty: 'Learn about our product warranty policy, processing procedures and applicable conditions. We are committed to protecting customer interests with professional and dedicated warranty services.',
                return: 'Detailed guidance on return and exchange procedures, processing time and necessary conditions. Ensuring safe and convenient shopping experience for customers.',
                privacy: 'Our commitment to protecting customer personal information. Learn how we collect, use and protect your data safely and transparently.',
                terms: 'Terms and conditions for using our services. Regulations on customer rights and obligations when using TuneZone products and services.',
                default: 'Learn about TuneZone policies and regulations. We are committed to providing the best service experience with transparent and fair policies.'
            },
            content: {
                warranty: {
                    title: 'Warranty Policy',
                    sections: {
                        'general-warranty': {
                            title: 'General Warranty',
                            content: {
                                intro: 'All products sold at TuneZone are warranted according to manufacturer\'s policy and our regulations. Warranty period is calculated from the date of purchase.',
                                conditions: 'Warranty conditions:',
                                conditionsList: [
                                    'Product is still within warranty period',
                                    'Have purchase invoice or warranty card',
                                    'Product not damaged by external factors',
                                    'No unauthorized repair or intervention'
                                ],
                                commitment: 'We are committed to supporting customers in the best way during warranty and after-sales service.'
                            }
                        },
                        'warranty-process': {
                            title: 'Warranty Process',
                            content: {
                                contact: 'When the product has problems, please contact us via hotline or visit the store directly for support.',
                                processing: 'Warranty processing time is 3-7 working days depending on product condition.',
                                notification: 'During warranty period, we will notify customers of processing progress.'
                            }
                        }
                    }
                },
                return: {
                    title: 'Return Policy',
                    sections: {
                        'return-conditions': {
                            title: 'Return Conditions',
                            content: {
                                intro: 'Customers can return products within 7 days from purchase date with the following conditions:',
                                conditionsList: [
                                    'Product remains intact and unused',
                                    'Complete packaging and accessories',
                                    'Have purchase invoice',
                                    'Product not in non-returnable category'
                                ],
                                shipping: 'Return shipping fees will be borne by customers except for manufacturing defects.'
                            }
                        },
                        'return-process': {
                            title: 'Return Process',
                            content: {
                                contact: 'Customer contacts customer service to notify about return.',
                                shipping: 'Send product to our address or visit store directly.',
                                processing: 'After inspection, we will process return within 2-3 working days.'
                            }
                        }
                    }
                },
                privacy: {
                    title: 'Privacy Policy',
                    sections: {
                        'information-collection': {
                            title: 'Information Collection',
                            content: {
                                commitment: 'TuneZone is committed to protecting customer personal information according to the highest security standards. We do not share personal information with third parties without your consent.',
                                collectTitle: 'Information we collect:',
                                collectList: [
                                    'Contact information (name, email, phone)',
                                    'Delivery address',
                                    'Payment information (securely encrypted)',
                                    'Purchase history'
                                ]
                            }
                        },
                        'information-usage': {
                            title: 'Information Usage',
                            content: {
                                purposeTitle: 'Purpose of information usage:',
                                purposeList: [
                                    'Order processing and delivery',
                                    'Customer support',
                                    'Send promotional information (if agreed)',
                                    'Service improvement'
                                ],
                                rights: 'You have the right to request to view, edit or delete your personal information at any time by contacting us.'
                            }
                        }
                    }
                },
                terms: {
                    title: 'Terms & Conditions',
                    sections: {
                        'terms-conditions': {
                            title: 'Terms and Conditions',
                            content: {
                                intro: 'This website is operated by TuneZone Store. Please read the Terms & Conditions carefully before using or registering on this website. You must fully agree to these terms and conditions if you want to use the website. If you do not agree with any part of these terms and conditions, you will not be able to use this website in any form.',
                                global: 'Note that this website is built to serve global access for users.',
                                application: 'The information on this website applies to users globally.',
                                rights: 'We reserve the right to refuse access to this website at any time without prior notice.'
                            }
                        },
                        'governing-law': {
                            title: 'Governing Law',
                            content: {
                                law: 'These terms and conditions are governed by Vietnamese law. Any disputes arising will be resolved in competent courts in Vietnam.',
                                validity: 'In case any provision in this agreement is deemed invalid or unenforceable, the remaining provisions remain fully effective.',
                                compliance: 'We are committed to strict compliance with current legal regulations and protecting customers\' legitimate interests.'
                            }
                        },
                        'changes': {
                            title: 'Changes',
                            content: {
                                rights: 'TuneZone reserves the right to change, add or remove any part of these terms at any time. Changes will take effect immediately upon posting on the website.',
                                recommendation: 'We encourage you to regularly check this page for the latest updates. Continued use of the service after changes means you accept the new terms.',
                                notification: 'In case of significant changes, we will notify via email or website notification before implementation.'
                            }
                        }
                    }
                }
            }
        },
        warrantyCheck: {
            title: 'Warranty Check',
            breadcrumb: 'Warranty Check',
            form: {
                title: 'Enter information to check',
                serialNumber: 'Serial Number',
                serialNumberRequired: 'Serial Number *',
                serialNumberPlaceholder: 'Enter product serial number',
                serialNumberHelper: 'Serial number is usually printed on product label or packaging',
                invoiceNumber: 'Invoice Number (optional)',
                invoiceNumberPlaceholder: 'Enter invoice number (if available)',
                invoiceNumberHelper: 'Invoice number helps more accurate lookup',
                checkButton: 'Check Warranty',
                checkingButton: 'Checking...',
                alertSerial: 'Please enter serial number',
                notes: {
                    title: 'Note:',
                    serialRequired: '• Serial number is required for warranty check',
                    infoDisplay: '• Warranty information will be displayed immediately after check',
                    contactSupport: '• Contact support if you encounter any issues'
                }
            },
            instructions: {
                title: 'Warranty Check Instructions',
                step1: {
                    title: 'Step 1',
                    description: 'Find serial number on product or packaging'
                },
                step2: {
                    title: 'Step 2',
                    description: 'Enter serial number in check form'
                },
                step3: {
                    title: 'Step 3',
                    description: 'View results and warranty information'
                }
            },
            demo: {
                title: 'Try with sample serial numbers',
                description: 'You can try the warranty check feature with the following serial numbers:',
                active: 'ABC123456 - Product under warranty',
                expired: 'DEF789012 - Product warranty expired',
                loginButton: 'Login to view purchased products'
            },
            result: {
                found: 'Warranty information found',
                notFound: 'Product not found',
                notFoundMessage: 'No warranty information found for this serial number.',
                backButton: 'Check another product',
                status: {
                    active: 'Active',
                    expired: 'Expired',
                    invalid: 'Invalid'
                },
                fields: {
                    serialNumber: 'Serial Number',
                    productName: 'Product Name',
                    purchaseDate: 'Purchase Date',
                    warrantyStatus: 'Warranty Status',
                    warrantyEndDate: 'Warranty End Date',
                    remainingDays: 'Remaining Days',
                    customerName: 'Customer Name',
                    dealerName: 'Dealer Name'
                }
            }
        },
        footer: {
            company: {
                title: 'Company',
                aboutUs: 'About Us',
                certifications: 'Exclusive Reseller Certifications'
            },
            product: {
                title: 'Product'
            },
            reseller: {
                title: 'Reseller',
                information: 'Reseller Information',
                becomeReseller: 'Become Our Reseller'
            },
            other: {
                title: 'Other',
                warrantyCheck: 'Warranty Checking',
                policy: 'Policy',
                blog: 'Blog',
                contact: 'Contact Us'
            },
            copyright: 'CopyRight © 2023 4T HITEK All Right Reserved.',
            languageSelector: 'Vietnam'
        },
        becomeReseller: {
            title: 'Become Our Reseller',
            subtitle: 'Join our network of trusted partners and grow your business with our premium audio products. We offer competitive pricing, marketing support, and comprehensive training.',
            applyNow: 'Apply Now',
            downloadBrochure: 'Download Brochure',
            whyPartner: {
                title: 'Why Partner With Us?',
                subtitle: 'Join hundreds of successful partners worldwide and unlock your business potential'
            },
            benefits: {
                competitiveMargins: {
                    title: 'Competitive Margins',
                    description: 'Enjoy attractive profit margins on all our products with flexible pricing structures and volume discounts.',
                    highlight: 'Up to 40% margin'
                },
                marketingSupport: {
                    title: 'Marketing Support',
                    description: 'Access to comprehensive marketing materials, product training, and co-marketing opportunities.',
                    highlight: 'Full marketing kit'
                },
                technicalSupport: {
                    title: 'Technical Support',
                    description: 'Dedicated technical support team to help you and your customers with any questions or issues.',
                    highlight: '24/7 support'
                },
                premiumProducts: {
                    title: 'Premium Products',
                    description: 'Access to our complete range of high-quality audio products with exclusive early access to new releases.',
                    highlight: 'Exclusive access'
                }
            },
            requirements: {
                title: 'Partner Requirements',
                subtitle: 'We\'re looking for committed partners who share our vision of excellence',
                list: [
                    'Established business with proven track record',
                    'Minimum 2 years experience in audio/electronics',
                    'Committed to monthly volume targets',
                    'Professional sales and support capabilities',
                    'Adherence to brand guidelines and standards'
                ]
            },
            form: {
                title: 'Submit Your Application',
                subtitle: 'Ready to join our partner network? Fill out the form below and we\'ll get back to you within 24 hours.',
                companyInfo: 'Company Information',
                contactInfo: 'Contact Information',
                businessAddress: 'Business Address',
                businessDetails: 'Business Details',
                additionalInfo: 'Additional Information',
                companyName: 'Company Name',
                companyNameRequired: 'Company Name *',
                companyNamePlaceholder: 'Your company name',
                website: 'Website',
                websitePlaceholder: 'https://yourwebsite.com',
                contactName: 'Contact Name',
                contactNameRequired: 'Contact Name *',
                contactNamePlaceholder: 'Your full name',
                email: 'Email Address',
                emailRequired: 'Email Address *',
                emailPlaceholder: 'your@email.com',
                phone: 'Phone Number',
                phoneRequired: 'Phone Number *',
                phonePlaceholder: '+1 (555) 123-4567',
                // Simplified form fields
                resellerRegistration: 'Reseller Registration',
                name: 'Company Name',
                nameRequired: 'Company Name *',
                namePlaceholder: 'Enter your company name',
                username: 'Username',
                usernameRequired: 'Username *',
                usernamePlaceholder: 'Enter username (3-20 characters)',
                password: 'Password',
                passwordRequired: 'Password *',
                passwordPlaceholder: 'Enter password (minimum 8 characters)',
                address: 'Address',
                addressPlaceholder: 'Enter your street address',
                district: 'District',
                districtRequired: 'District *', 
                districtPlaceholder: 'Enter district',
                // Validation messages
                fieldRequired: 'This field is required',
                invalidEmail: 'Please enter a valid email address',
                invalidPhone: 'Please enter a valid Vietnamese phone number (e.g., 0987654321, +84987654321)',
                invalidUsername: 'Username must be 3-20 characters and contain only letters, numbers, underscore, or hyphen',
                invalidPassword: 'Password must be at least 8 characters long',
                streetAddress: 'Street Address',
                streetAddressRequired: 'Street Address *',
                streetAddressPlaceholder: '123 Business Street',
                city: 'City',
                cityRequired: 'City *',
                cityPlaceholder: 'Your city',
                country: 'Country',
                countryRequired: 'Country *',
                countryPlaceholder: 'Your country',
                businessType: 'Business Type',
                businessTypeRequired: 'Business Type *',
                selectBusinessType: 'Select business type',
                businessTypes: {
                    retailer: 'Retailer',
                    distributor: 'Distributor',
                    onlineStore: 'Online Store',
                    systemIntegrator: 'System Integrator',
                    other: 'Other'
                },
                experience: 'Years of Experience',
                experienceRequired: 'Years of Experience *',
                selectExperience: 'Select experience',
                experienceOptions: {
                    '0-2': '0-2 years',
                    '3-5': '3-5 years',
                    '6-10': '6-10 years',
                    '10+': '10+ years'
                },
                expectedVolume: 'Expected Monthly Volume',
                expectedVolumeRequired: 'Expected Monthly Volume *',
                selectExpectedVolume: 'Select expected volume',
                volumeOptions: {
                    '1-10': '1-10 units',
                    '11-50': '11-50 units',
                    '51-100': '51-100 units',
                    '100+': '100+ units'
                },
                message: 'Tell us about your business',
                messagePlaceholder: 'Tell us about your business, target markets, or any specific requirements...',
                submitButton: 'Submit Application',
                submittingButton: 'Submitting...',
                successTitle: 'Application Submitted Successfully!',
                successMessage: 'We\'ll review your application and get back to you within 24 hours.',
                errorTitle: 'Submission Failed',
                errorMessage: 'There was an error submitting your application. Please try again.'
            },
            contact: {
                title: 'Have Questions?',
                subtitle: 'Our partnership team is here to help you get started',
                email: 'Email Us',
                emailContent: 'reseller@tunezonehifi.com',
                phone: 'Call Us',
                phoneContent: '+1 (555) 123-4567',
                visit: 'Visit Us',
                visitContent: 'Business hours: Mon-Fri 9AM-6PM'
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
            },
            detail: {
                breadcrumbs: {
                    productDetails: 'MÔ TẢ SẢN PHẨM',
                    productVideos: 'VIDEO SẢN PHẨM',
                    specifications: 'THÔNG SỐ KỸ THUẬT',
                    warranty: 'BẢO HÀNH'
                },
                loading: 'Đang tải sản phẩm...',
                notFound: 'Không tìm thấy sản phẩm',
                backToProducts: 'Quay lại Sản phẩm',
                relatedProducts: 'SẢN PHẨM LIÊN QUAN',
                viewOtherProducts: 'Xem các sản phẩm liên quan khác'
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
            processingLocations: 'Đang xử lý vị trí...',
            loadingDealers: 'Đang tải đại lý...',
            errorTitle: 'Lỗi Tải Dữ Liệu Đại Lý',
            fallbackMessage: 'Hiển thị dữ liệu dự phòng thay thế.',
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
            list: {
                title: 'DANH SÁCH BLOG',
                searchPlaceholder: 'Tìm kiếm bài viết...',
                showingAll: 'Hiển thị tất cả',
                showingFiltered: 'Hiển thị',
                articles: 'bài viết',
                articlesIn: 'bài viết trong',
                allCategories: 'TẤT CẢ DANH MỤC',
                all: 'TẤT CẢ'
            },
            detail: {
                loading: 'Đang tải...',
                notFound: 'Không tìm thấy bài viết',
                backToList: 'Quay lại danh sách blog',
                readTime: 'phút đọc',
                relatedArticles: 'Bài viết liên quan',
                breadcrumbDetail: 'Chi tiết blog'
            },
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
        // account section removed - no longer used
        certification: {
            title: 'CHỨNG NHẬN',
            subtitle: 'Sản phẩm của chúng tôi đáp ứng các tiêu chuẩn công nghiệp cao nhất và đã nhận được chứng nhận từ các tổ chức quốc tế hàng đầu. Những chứng nhận này đảm bảo rằng các thiết bị âm thanh của chúng tôi mang lại chất lượng, an toàn và hiệu suất đặc biệt.',
            list: {
                title: 'Chứng Nhận Của Chúng Tôi',
                description: 'Sản phẩm của chúng tôi đáp ứng các tiêu chuẩn công nghiệp cao nhất và đã nhận được chứng nhận từ các tổ chức quốc tế hàng đầu.',
                issuedBy: 'Được cấp bởi',
                details: 'Xem Chi Tiết'
            },
            certifications: {
                ce: {
                    name: 'Chứng Nhận CE',
                    description: 'Dấu CE cho biết sản phẩm của chúng tôi tuân thủ các tiêu chuẩn về sức khỏe, an toàn và bảo vệ môi trường đối với các sản phẩm bán trong Khu vực Kinh tế Châu Âu.',
                    issuedBy: 'Liên minh Châu Âu'
                },
                fcc: {
                    name: 'Chứng Nhận FCC',
                    description: 'Chứng nhận FCC xác nhận rằng nhiễu điện từ từ thiết bị của chúng tôi nằm trong giới hạn được Ủy ban Truyền thông Liên bang phê duyệt.',
                    issuedBy: 'Ủy ban Truyền thông Liên bang, Hoa Kỳ'
                },
                rohs: {
                    name: 'Tuân Thủ RoHS',
                    description: 'Chứng nhận RoHS đảm bảo sản phẩm của chúng tôi không chứa các chất độc hại cụ thể như chì, thủy ngân và cadmium.',
                    issuedBy: 'Liên minh Châu Âu'
                },
                iso9001: {
                    name: 'ISO 9001:2015',
                    description: 'Chứng nhận ISO 9001:2015 xác nhận rằng hệ thống quản lý chất lượng của chúng tôi đáp ứng các tiêu chuẩn quốc tế về sản phẩm chất lượng nhất quán.',
                    issuedBy: 'Tổ chức Tiêu chuẩn Quốc tế'
                },
                bluetooth: {
                    name: 'Chứng Nhận Bluetooth SIG',
                    description: 'Chứng nhận Bluetooth SIG đảm bảo các thiết bị không dây của chúng tôi đáp ứng các tiêu chuẩn Bluetooth về khả năng tương thích và hiệu suất.',
                    issuedBy: 'Nhóm Quan tâm Đặc biệt Bluetooth'
                },
                energy: {
                    name: 'Chứng Nhận Energy Star',
                    description: 'Chứng nhận Energy Star xác nhận rằng sản phẩm của chúng tôi đáp ứng hướng dẫn tiết kiệm năng lượng được thiết lập bởi Cơ quan Bảo vệ Môi trường Hoa Kỳ.',
                    issuedBy: 'Cơ quan Bảo vệ Môi trường Hoa Kỳ'
                }
            },
            process: {
                title: 'Quy Trình Chứng Nhận',
                subtitle: 'Quy trình chứng nhận nghiêm ngặt của chúng tôi đảm bảo mọi sản phẩm đều đáp ứng các tiêu chuẩn cao nhất',
                steps: {
                    design: {
                        title: 'Thiết Kế & Phát Triển',
                        description: 'Thiết kế sản phẩm với các tiêu chuẩn tuân thủ từ ban đầu'
                    },
                    testing: {
                        title: 'Kiểm Tra & Xác Thực',
                        description: 'Kiểm tra toàn diện trong các phòng thí nghiệm được công nhận'
                    },
                    documentation: {
                        title: 'Tài Liệu & Đánh Giá',
                        description: 'Tài liệu hoàn chỉnh và quy trình đánh giá bên thứ ba'
                    },
                    certification: {
                        title: 'Chứng Nhận & Phê Duyệt',
                        description: 'Chứng nhận cuối cùng và phê duyệt quy định'
                    }
                }
            },
            faq: {
                title: 'Câu Hỏi Thường Gặp',
                subtitle: 'Tìm câu trả lời cho các câu hỏi thường gặp về chứng nhận sản phẩm và tiêu chuẩn chất lượng của chúng tôi.',
                questions: {
                    q1: {
                        question: 'Sản phẩm của bạn có những chứng nhận gì?',
                        answer: 'Sản phẩm của chúng tôi được chứng nhận với CE, FCC, RoHS, ISO 9001:2015, Bluetooth SIG và chứng nhận Energy Star.'
                    },
                    q2: {
                        question: 'Làm thế nào để xác minh tính hợp lệ của chứng nhận?',
                        answer: 'Bạn có thể xác minh chứng nhận của chúng tôi bằng cách kiểm tra số chứng nhận trên tài liệu sản phẩm hoặc liên hệ trực tiếp với các tổ chức cấp chứng nhận.'
                    },
                    q3: {
                        question: 'Sản phẩm của bạn có an toàn khi sử dụng quốc tế không?',
                        answer: 'Có, các chứng nhận của chúng tôi đảm bảo tuân thủ các tiêu chuẩn an toàn và hiệu suất quốc tế để sử dụng toàn cầu.'
                    }
                }
            }
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
        },
        contact: {
            title: 'LIÊN HỆ',
            description: 'Liên hệ với chúng tôi để được tư vấn và hỗ trợ tốt nhất. Đội ngũ chuyên viên của TuneZone luôn sẵn sàng giải đáp mọi thắc mắc và hỗ trợ bạn tìm được sản phẩm phù hợp nhất.',
            info: {
                address: 'Địa chỉ',
                phone: 'Điện thoại',
                email: 'Email',
                hours: 'Giờ làm việc',
                addressContent: ['123 Đường Lê Lợi, Quận 1', 'TP. Hồ Chí Minh, Việt Nam'],
                phoneContent: ['Hotline: 0123 456 789', 'Zalo: 0987 654 321'],
                emailContent: ['contact@4thiteck.com'],
                hoursContent: ['Thứ 2 - Thứ 6: 8:00 - 18:00', 'Thứ 7 - Chủ nhật: 8:00 - 17:00']
            },
            form: {
                title: 'Gửi tin nhắn',
                name: 'Họ và tên',
                nameRequired: 'Họ và tên *',
                namePlaceholder: 'Nhập họ và tên',
                phone: 'Số điện thoại',
                phonePlaceholder: 'Nhập số điện thoại',
                email: 'Email',
                emailRequired: 'Email *',
                emailPlaceholder: 'Nhập địa chỉ email',
                subject: 'Chủ đề',
                selectSubject: 'Chọn chủ đề',
                subjects: {
                    productInquiry: 'Tư vấn sản phẩm',
                    warranty: 'Bảo hành',
                    complaint: 'Khiếu nại',
                    partnership: 'Hợp tác',
                    other: 'Khác'
                },
                message: 'Tin nhắn',
                messageRequired: 'Tin nhắn *',
                messagePlaceholder: 'Nhập nội dung tin nhắn...',
                sendButton: 'Gửi tin nhắn',
                sendingButton: 'Đang gửi...',
                successMessage: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.'
            },
            map: {
                title: 'Vị trí cửa hàng',
                connectTitle: 'Kết nối với chúng tôi'
            }
        },
        policy: {
            title: 'CHÍNH SÁCH',
            breadcrumbLabel: 'Chính sách',
            policies: {
                warranty: 'Chính sách bảo hành',
                return: 'Chính sách đổi trả hàng',
                privacy: 'Bảo mật thông tin',
                terms: 'Điều kiện, điều khoản'
            },
            descriptions: {
                warranty: 'Tìm hiểu về chính sách bảo hành sản phẩm, quy trình xử lý và các điều kiện áp dụng. Chúng tôi cam kết bảo vệ quyền lợi khách hàng với dịch vụ bảo hành chuyên nghiệp và tận tâm.',
                return: 'Hướng dẫn chi tiết về quy trình đổi trả hàng, thời gian xử lý và các điều kiện cần thiết. Đảm bảo trải nghiệm mua sắm an toàn và thuận tiện cho khách hàng.',
                privacy: 'Cam kết bảo mật thông tin cá nhân của khách hàng. Tìm hiểu cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn một cách an toàn và minh bạch.',
                terms: 'Các điều khoản và điều kiện sử dụng dịch vụ. Quy định về quyền và nghĩa vụ của khách hàng khi sử dụng sản phẩm và dịch vụ của TuneZone.',
                default: 'Tìm hiểu về các chính sách và quy định của TuneZone. Chúng tôi cam kết mang đến trải nghiệm dịch vụ tốt nhất với các chính sách minh bạch và công bằng.'
            },
            content: {
                warranty: {
                    title: 'Chính sách bảo hành',
                    sections: {
                        'general-warranty': {
                            title: 'Bảo hành tổng quát',
                            content: {
                                intro: 'Tất cả sản phẩm được bán tại TuneZone đều được bảo hành theo chính sách của nhà sản xuất và các quy định của chúng tôi. Thời gian bảo hành được tính từ ngày mua hàng.',
                                conditions: 'Điều kiện bảo hành:',
                                conditionsList: [
                                    'Sản phẩm còn trong thời hạn bảo hành',
                                    'Có hóa đơn mua hàng hoặc phiếu bảo hành',
                                    'Sản phẩm không bị hư hỏng do tác động bên ngoài',
                                    'Không tự ý sửa chữa hoặc can thiệp vào sản phẩm'
                                ],
                                commitment: 'Chúng tôi cam kết hỗ trợ khách hàng một cách tốt nhất trong quá trình bảo hành và sau bán hàng.'
                            }
                        },
                        'warranty-process': {
                            title: 'Quy trình bảo hành',
                            content: {
                                contact: 'Khi sản phẩm gặp sự cố, khách hàng vui lòng liên hệ với chúng tôi qua hotline hoặc đến trực tiếp cửa hàng để được hỗ trợ.',
                                processing: 'Thời gian xử lý bảo hành từ 3-7 ngày làm việc tùy thuộc vào tình trạng sản phẩm.',
                                notification: 'Trong thời gian bảo hành, chúng tôi sẽ thông báo tiến độ xử lý cho khách hàng.'
                            }
                        }
                    }
                },
                return: {
                    title: 'Chính sách đổi trả hàng',
                    sections: {
                        'return-conditions': {
                            title: 'Điều kiện đổi trả',
                            content: {
                                intro: 'Khách hàng có thể đổi trả sản phẩm trong vòng 7 ngày kể từ ngày mua hàng với các điều kiện sau:',
                                conditionsList: [
                                    'Sản phẩm còn nguyên vẹn, chưa qua sử dụng',
                                    'Còn đầy đủ bao bì, phụ kiện đi kèm',
                                    'Có hóa đơn mua hàng',
                                    'Sản phẩm không thuộc danh mục không được đổi trả'
                                ],
                                shipping: 'Phí vận chuyển đổi trả sẽ do khách hàng chịu trừ trường hợp sản phẩm bị lỗi từ nhà sản xuất.'
                            }
                        },
                        'return-process': {
                            title: 'Quy trình đổi trả',
                            content: {
                                contact: 'Khách hàng liên hệ với bộ phận chăm sóc khách hàng để thông báo về việc đổi trả.',
                                shipping: 'Gửi sản phẩm về địa chỉ của chúng tôi hoặc đến trực tiếp cửa hàng.',
                                processing: 'Sau khi kiểm tra, chúng tôi sẽ xử lý đổi trả trong vòng 2-3 ngày làm việc.'
                            }
                        }
                    }
                },
                privacy: {
                    title: 'Bảo mật thông tin',
                    sections: {
                        'information-collection': {
                            title: 'Thu thập thông tin',
                            content: {
                                commitment: 'TuneZone cam kết bảo vệ thông tin cá nhân của khách hàng theo các tiêu chuẩn bảo mật cao nhất. Chúng tôi không chia sẻ thông tin cá nhân với bên thứ ba mà không có sự đồng ý của bạn.',
                                collectTitle: 'Thông tin chúng tôi thu thập:',
                                collectList: [
                                    'Thông tin liên hệ (họ tên, email, số điện thoại)',
                                    'Địa chỉ giao hàng',
                                    'Thông tin thanh toán (được mã hóa an toàn)',
                                    'Lịch sử mua hàng'
                                ]
                            }
                        },
                        'information-usage': {
                            title: 'Sử dụng thông tin',
                            content: {
                                purposeTitle: 'Mục đích sử dụng thông tin:',
                                purposeList: [
                                    'Xử lý đơn hàng và giao hàng',
                                    'Hỗ trợ khách hàng',
                                    'Gửi thông tin khuyến mãi (nếu đồng ý)',
                                    'Cải thiện dịch vụ'
                                ],
                                rights: 'Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân của mình bất cứ lúc nào bằng cách liên hệ với chúng tôi.'
                            }
                        }
                    }
                },
                terms: {
                    title: 'Điều kiện, điều khoản',
                    sections: {
                        'terms-conditions': {
                            title: 'Các điều kiện và điều khoản',
                            content: {
                                intro: 'Trang web này được điều hành bởi Cửa Hàng TuneZone. Xin vui lòng đọc kỹ các Điều kiện & Điều khoản trước khi sử dụng hoặc đăng ký trên trang web này. Bạn phải hoàn toàn đồng ý với các điều kiện và điều khoản này nếu muốn sử dụng trang web. Nếu bạn không đồng ý với bất kỳ phần nào trong các điều kiện và điều khoản này, bạn sẽ không thể sử dụng trang web này dưới bất kỳ hình thức nào.',
                                global: 'Lưu ý rằng trang web này được xây dựng nhằm phục vụ truy cập trên phạm vi toàn cầu đối với người sử dụng.',
                                application: 'Những thông tin trên trang web này được áp dụng cho người sử dụng trên phạm vi toàn cầu.',
                                rights: 'Chúng tôi có quyền từ chối truy cập vào trang web này bất cứ lúc nào mà không cần phải thông báo trước.'
                            }
                        },
                        'governing-law': {
                            title: 'Luật điều chỉnh',
                            content: {
                                law: 'Các điều khoản và điều kiện này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp phát sinh sẽ được giải quyết tại các tòa án có thẩm quyền tại Việt Nam.',
                                validity: 'Trong trường hợp có bất kỳ điều khoản nào trong thỏa thuận này được coi là không hợp lệ hoặc không thể thực thi, các điều khoản còn lại vẫn có hiệu lực đầy đủ.',
                                compliance: 'Chúng tôi cam kết tuân thủ nghiêm túc các quy định pháp luật hiện hành và bảo vệ quyền lợi hợp pháp của khách hàng.'
                            }
                        },
                        'changes': {
                            title: 'Những thay đổi',
                            content: {
                                rights: 'TuneZone có quyền thay đổi, bổ sung hoặc xóa bỏ bất kỳ phần nào trong các điều khoản này vào bất cứ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải trên website.',
                                recommendation: 'Chúng tôi khuyến khích bạn thường xuyên kiểm tra trang này để cập nhật những thay đổi mới nhất. Việc tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận các điều khoản mới.',
                                notification: 'Trong trường hợp có thay đổi quan trọng, chúng tôi sẽ thông báo qua email hoặc thông báo trên website trước khi áp dụng.'
                            }
                        }
                    }
                }
            }
        },
        warrantyCheck: {
            title: 'Kiểm Tra Bảo Hành',
            breadcrumb: 'Kiểm Tra Bảo Hành',
            form: {
                title: 'Nhập thông tin kiểm tra',
                serialNumber: 'Số Serial',
                serialNumberRequired: 'Số Serial *',
                serialNumberPlaceholder: 'Nhập số serial sản phẩm',
                serialNumberHelper: 'Số serial thường được in trên nhãn sản phẩm hoặc hộp đựng',
                invoiceNumber: 'Số hóa đơn (tùy chọn)',
                invoiceNumberPlaceholder: 'Nhập số hóa đơn (nếu có)',
                invoiceNumberHelper: 'Số hóa đơn giúp tra cứu chính xác hơn',
                checkButton: 'Kiểm tra bảo hành',
                checkingButton: 'Đang kiểm tra...',
                alertSerial: 'Vui lòng nhập số serial',
                notes: {
                    title: 'Lưu ý:',
                    serialRequired: '• Số serial là bắt buộc để kiểm tra bảo hành',
                    infoDisplay: '• Thông tin bảo hành sẽ hiển thị ngay sau khi kiểm tra',
                    contactSupport: '• Liên hệ bộ phận hỗ trợ nếu gặp vấn đề'
                }
            },
            instructions: {
                title: 'Hướng dẫn kiểm tra bảo hành',
                step1: {
                    title: 'Bước 1',
                    description: 'Tìm số serial trên sản phẩm hoặc hộp đựng'
                },
                step2: {
                    title: 'Bước 2',
                    description: 'Nhập số serial vào form kiểm tra'
                },
                step3: {
                    title: 'Bước 3',
                    description: 'Xem kết quả và thông tin bảo hành'
                }
            },
            demo: {
                title: 'Thử nghiệm với số serial mẫu',
                description: 'Bạn có thể thử nghiệm tính năng kiểm tra bảo hành với các số serial sau:',
                active: 'ABC123456 - Sản phẩm còn bảo hành',
                expired: 'DEF789012 - Sản phẩm hết bảo hành',
                loginButton: 'Đăng nhập để xem sản phẩm đã mua'
            },
            result: {
                found: 'Tìm thấy thông tin bảo hành',
                notFound: 'Không tìm thấy sản phẩm',
                notFoundMessage: 'Không tìm thấy thông tin bảo hành cho số serial này.',
                backButton: 'Kiểm tra sản phẩm khác',
                status: {
                    active: 'Còn bảo hành',
                    expired: 'Hết bảo hành',
                    invalid: 'Không hợp lệ'
                },
                fields: {
                    serialNumber: 'Số Serial',
                    productName: 'Tên Sản Phẩm',
                    purchaseDate: 'Ngày Mua',
                    warrantyStatus: 'Trạng Thái Bảo Hành',
                    warrantyEndDate: 'Ngày Hết Bảo Hành',
                    remainingDays: 'Số Ngày Còn Lại',
                    customerName: 'Tên Khách Hàng',
                    dealerName: 'Tên Đại Lý'
                }
            }
        },
        footer: {
            company: {
                title: 'Công Ty',
                aboutUs: 'Về Chúng Tôi',
                certifications: 'Chứng Nhận Đại Lý Độc Quyền'
            },
            product: {
                title: 'Sản Phẩm'
            },
            reseller: {
                title: 'Đại Lý',
                information: 'Thông Tin Đại Lý',
                becomeReseller: 'Trở Thành Đại Lý'
            },
            other: {
                title: 'Khác',
                warrantyCheck: 'Kiểm Tra Bảo Hành',
                policy: 'Chính Sách',
                blog: 'Blog',
                contact: 'Liên Hệ'
            },
            copyright: 'Bản quyền © 2023 4T HITEK Tất cả quyền được bảo lưu.',
            languageSelector: 'Việt Nam'
        },
        becomeReseller: {
            title: 'Trở Thành Đại Lý',
            subtitle: 'Tham gia mạng lưới đối tác đáng tin cậy của chúng tôi và phát triển doanh nghiệp với các sản phẩm âm thanh cao cấp. Chúng tôi cung cấp giá cạnh tranh, hỗ trợ marketing và đào tạo toàn diện.',
            applyNow: 'Đăng Ký Ngay',
            downloadBrochure: 'Tải Brochure',
            whyPartner: {
                title: 'Tại Sao Nên Hợp Tác Với Chúng Tôi?',
                subtitle: 'Tham gia cùng hàng trăm đối tác thành công trên toàn thế giới và khám phá tiềm năng kinh doanh của bạn'
            },
            benefits: {
                competitiveMargins: {
                    title: 'Lợi Nhuận Cạnh Tranh',
                    description: 'Tận hưởng mức lợi nhuận hấp dẫn trên tất cả sản phẩm với cơ cấu giá linh hoạt và chiết khấu theo khối lượng.',
                    highlight: 'Lên đến 40% lợi nhuận'
                },
                marketingSupport: {
                    title: 'Hỗ Trợ Marketing',
                    description: 'Tiếp cận tài liệu marketing toàn diện, đào tạo sản phẩm và cơ hội marketing chung.',
                    highlight: 'Bộ kit marketing đầy đủ'
                },
                technicalSupport: {
                    title: 'Hỗ Trợ Kỹ Thuật',
                    description: 'Đội ngũ hỗ trợ kỹ thuật chuyên dụng giúp bạn và khách hàng giải đáp mọi thắc mắc hoặc vấn đề.',
                    highlight: 'Hỗ trợ 24/7'
                },
                premiumProducts: {
                    title: 'Sản Phẩm Cao Cấp',
                    description: 'Tiếp cận toàn bộ dòng sản phẩm âm thanh chất lượng cao với quyền truy cập sớm độc quyền vào các sản phẩm mới.',
                    highlight: 'Quyền truy cập độc quyền'
                }
            },
            requirements: {
                title: 'Yêu Cầu Đối Tác',
                subtitle: 'Chúng tôi đang tìm kiếm những đối tác cam kết chia sẻ tầm nhìn xuất sắc của chúng tôi',
                list: [
                    'Doanh nghiệp thành lập với thành tích đã được chứng minh',
                    'Tối thiểu 2 năm kinh nghiệm trong lĩnh vực âm thanh/điện tử',
                    'Cam kết đạt mục tiêu khối lượng hàng tháng',
                    'Khả năng bán hàng và hỗ trợ chuyên nghiệp',
                    'Tuân thủ hướng dẫn và tiêu chuẩn thương hiệu'
                ]
            },
            form: {
                title: 'Gửi Đơn Đăng Ký',
                subtitle: 'Sẵn sàng tham gia mạng lưới đối tác của chúng tôi? Điền vào form dưới đây và chúng tôi sẽ phản hồi trong vòng 24 giờ.',
                companyInfo: 'Thông Tin Công Ty',
                contactInfo: 'Thông Tin Liên Hệ',
                businessAddress: 'Địa Chỉ Kinh Doanh',
                businessDetails: 'Chi Tiết Kinh Doanh',
                additionalInfo: 'Thông Tin Bổ Sung',
                companyName: 'Tên Công Ty',
                companyNameRequired: 'Tên Công Ty *',
                companyNamePlaceholder: 'Tên công ty của bạn',
                website: 'Website',
                websitePlaceholder: 'https://website-cua-ban.com',
                contactName: 'Tên Người Liên Hệ',
                contactNameRequired: 'Tên Người Liên Hệ *',
                contactNamePlaceholder: 'Họ và tên đầy đủ',
                email: 'Địa Chỉ Email',
                emailRequired: 'Địa Chỉ Email *',
                emailPlaceholder: 'email@cua-ban.com',
                phone: 'Số Điện Thoại',
                phoneRequired: 'Số Điện Thoại *',
                phonePlaceholder: '+84 (xxx) xxx-xxxx',
                // Simplified form fields
                resellerRegistration: 'Đăng Ký Đại Lý',
                name: 'Tên công ty',
                nameRequired: 'Tên công ty *',
                namePlaceholder: 'Nhập tên công ty của bạn',
                username: 'Tên đăng nhập',
                usernameRequired: 'Tên đăng nhập *',
                usernamePlaceholder: 'Nhập tên đăng nhập (3-20 ký tự)',
                password: 'Mật khẩu',
                passwordRequired: 'Mật khẩu *',
                passwordPlaceholder: 'Nhập mật khẩu (tối thiểu 8 ký tự)',
                address: 'Địa Chỉ',
                addressPlaceholder: 'Nhập địa chỉ chi tiết',
                district: 'Quận/Huyện',
                districtRequired: 'Quận/Huyện *',
                districtPlaceholder: 'Nhập quận/huyện',
                // Validation messages
                fieldRequired: 'Trường này là bắt buộc',
                invalidEmail: 'Vui lòng nhập địa chỉ email hợp lệ',
                invalidPhone: 'Vui lòng nhập số điện thoại Việt Nam hợp lệ (ví dụ: 0987654321, +84987654321)',
                invalidUsername: 'Tên đăng nhập phải có 3-20 ký tự và chỉ chứa chữ cái, số, dấu gạch dưới hoặc gạch ngang',
                invalidPassword: 'Mật khẩu phải có ít nhất 8 ký tự',
                streetAddress: 'Địa Chỉ',
                streetAddressRequired: 'Địa Chỉ *',
                streetAddressPlaceholder: '123 Đường Kinh Doanh',
                city: 'Thành Phố',
                cityRequired: 'Thành Phố *',
                cityPlaceholder: 'Thành phố của bạn',
                country: 'Quốc Gia',
                countryRequired: 'Quốc Gia *',
                countryPlaceholder: 'Quốc gia của bạn',
                businessType: 'Loại Hình Kinh Doanh',
                businessTypeRequired: 'Loại Hình Kinh Doanh *',
                selectBusinessType: 'Chọn loại hình kinh doanh',
                businessTypes: {
                    retailer: 'Nhà Bán Lẻ',
                    distributor: 'Nhà Phân Phối',
                    onlineStore: 'Cửa Hàng Trực Tuyến',
                    systemIntegrator: 'Nhà Tích Hợp Hệ Thống',
                    other: 'Khác'
                },
                experience: 'Số Năm Kinh Nghiệm',
                experienceRequired: 'Số Năm Kinh Nghiệm *',
                selectExperience: 'Chọn kinh nghiệm',
                experienceOptions: {
                    '0-2': '0-2 năm',
                    '3-5': '3-5 năm',
                    '6-10': '6-10 năm',
                    '10+': '10+ năm'
                },
                expectedVolume: 'Khối Lượng Dự Kiến Hàng Tháng',
                expectedVolumeRequired: 'Khối Lượng Dự Kiến Hàng Tháng *',
                selectExpectedVolume: 'Chọn khối lượng dự kiến',
                volumeOptions: {
                    '1-10': '1-10 sản phẩm',
                    '11-50': '11-50 sản phẩm',
                    '51-100': '51-100 sản phẩm',
                    '100+': '100+ sản phẩm'
                },
                message: 'Chia sẻ về doanh nghiệp của bạn',
                messagePlaceholder: 'Chia sẻ về doanh nghiệp, thị trường mục tiêu hoặc bất kỳ yêu cầu cụ thể nào...',
                submitButton: 'Gửi Đơn Đăng Ký',
                submittingButton: 'Đang gửi...',
                successTitle: 'Gửi Đơn Đăng Ký Thành Công!',
                successMessage: 'Chúng tôi sẽ xem xét đơn đăng ký và phản hồi trong vòng 24 giờ.',
                errorTitle: 'Gửi Thất Bại',
                errorMessage: 'Có lỗi xảy ra khi gửi đơn đăng ký. Vui lòng thử lại.'
            },
            contact: {
                title: 'Có Câu Hỏi?',
                subtitle: 'Đội ngũ đối tác của chúng tôi sẵn sàng hỗ trợ bạn bắt đầu',
                email: 'Email Cho Chúng Tôi',
                emailContent: 'reseller@tunezonehifi.com',
                phone: 'Gọi Cho Chúng Tôi',
                phoneContent: '+1 (555) 123-4567',
                visit: 'Ghé Thăm Chúng Tôi',
                visitContent: 'Giờ làm việc: Thứ 2-6 9AM-6PM'
            }
        }
    }
};
