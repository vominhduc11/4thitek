import Image from 'next/image';
import Link from 'next/link';
import { motion, Variants, useInView } from 'framer-motion';
import { useRef } from 'react';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { typographyComponents, ultraWideSpacing } from '@/styles/typography';

const containerVariants: Variants = {
    hidden: { opacity: 0, y: 48 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', duration: 0.8, delayChildren: 0.1, staggerChildren: 0.05 }
    }
};
const columnVariants: Variants = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } }
};
const lineVariants: Variants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: { scaleX: 1, opacity: 1, transition: { duration: 0.6, delay: 0.25 } }
};
const copyrightVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.35 } }
};

const Footer = () => {
    const { t, language } = useLanguage();
    const ref = useRef(null);
    const inView = useInView(ref, { margin: '-60px', once: true });
    return (
        <AvoidSidebar>
            <motion.footer
                ref={ref}
                className={`bg-[#0c131d] text-gray-300 ${ultraWideSpacing['section-spacing']} ${ultraWideSpacing['container-padding']}`}
                variants={containerVariants}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
            >
                <div className={`${ultraWideSpacing['content-width-xl']} mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${ultraWideSpacing['grid-gap-md']}`}>
                    {/* COMPANY Column */}
                    <motion.div variants={columnVariants}>
                        <h3 className={`uppercase ${typographyComponents.footer.heading} mb-3 sm:mb-4`}>
                            {t('footer.company.title')}
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/about"
                                    className={`${typographyComponents.footer.link} hover:underline transition-colors`}
                                >
                                    {t('footer.company.aboutUs')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/certification"
                                    className={`${typographyComponents.footer.link} hover:underline transition-colors`}
                                >
                                    {t('footer.company.certifications')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/products"
                                    className={`${typographyComponents.footer.link} hover:underline transition-colors`}
                                >
                                    Sản phẩm
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/contact"
                                    className={`${typographyComponents.footer.link} hover:underline transition-colors`}
                                >
                                    Liên hệ
                                </Link>
                            </li>
                        </ul>
                    </motion.div>


                    {/* RESELLER Column */}
                    <motion.div variants={columnVariants}>
                        <h3 className={`uppercase ${typographyComponents.footer.heading} mb-3 sm:mb-4`}>
                            {t('footer.reseller.title')}
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/reseller_infomation"
                                    className={`${typographyComponents.footer.link} hover:underline transition-colors`}
                                >
                                    {t('footer.reseller.information')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/become_our_reseller"
                                    className={`${typographyComponents.footer.link} hover:underline transition-colors`}
                                >
                                    {t('footer.reseller.becomeReseller')}
                                </Link>
                            </li>
                        </ul>
                    </motion.div>

                    {/* OTHER Column */}
                    <motion.div variants={columnVariants}>
                        <h3 className={`uppercase ${typographyComponents.footer.heading} mb-3 sm:mb-4`}>{t('footer.other.title')}</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/warranty-check"
                                    className={`${typographyComponents.footer.link} hover:underline transition-colors`}
                                >
                                    {t('footer.other.warrantyCheck')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/policy"
                                    className={`${typographyComponents.footer.link} hover:underline transition-colors`}
                                >
                                    {t('footer.other.policy')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/blogs"
                                    className={`${typographyComponents.footer.link} hover:underline transition-colors`}
                                >
                                    {t('footer.other.blog')}
                                </Link>
                            </li>
                        </ul>
                    </motion.div>
                </div>

                {/* Separator Line */}
                <motion.hr
                    className="border-gray-600 my-6 sm:my-8"
                    variants={lineVariants}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                />

                {/* Copyright & Language Selector */}
                <motion.div
                    className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4 sm:gap-0 text-center sm:text-left"
                    variants={copyrightVariants}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                >
                    <p className={`mb-2 sm:mb-0 text-center sm:text-left ${typographyComponents.footer.copyright}`}>
                        {t('footer.copyright')}
                    </p>

                    {/* Language Selector */}
                    <div
                        className="flex items-center cursor-pointer hover:text-gray-300 transition-colors justify-center sm:justify-start"
                        aria-label="Language selector"
                    >
                        <Image
                            width={0}
                            height={0}
                            sizes="100vw"
                            priority
                            src={language === 'vi' ? "/flags/vn.svg" : "/flags/us.svg"}
                            alt={language === 'vi' ? "Vietnam flag" : "US flag"}
                            className="w-4 sm:w-5 h-4 sm:h-5 rounded-full"
                        />
                        <span className={`ml-1.5 sm:ml-2 ${typographyComponents.footer.copyright}`}>{t('footer.languageSelector')}</span>
                        <svg className="ml-1 w-3 h-3 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                            <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                </motion.div>
            </motion.footer>
        </AvoidSidebar>
    );
};

export default Footer;
