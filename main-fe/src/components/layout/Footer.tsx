import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants, useInView } from 'framer-motion';
import { useRef } from 'react';
import { FaFacebookF, FaYoutube } from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { typographyComponents, ultraWideSpacing } from '@/styles/typography';
import { SOCIAL_URLS } from '@/constants/urls';

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
    const { t, language, setLanguage } = useLanguage();
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
                {/* Logo + brand intro */}
                <motion.div variants={columnVariants} className="mb-10">
                    <Link href="/" className="inline-block mb-4">
                        <Image
                            src="/logo-4t.png"
                            alt={t('brand.logoAlt')}
                            width={120}
                            height={28}
                            className="h-auto w-[100px] sm:w-[120px] opacity-90 hover:opacity-100 transition-opacity"
                        />
                    </Link>
                    <p className={`max-w-xs text-sm leading-relaxed text-gray-400 ${typographyComponents.footer.link}`}>
                        {t('footer.brand.tagline')}
                    </p>
                    {/* Social icons */}
                    <div className="mt-4 flex items-center gap-3">
                        <a
                            href={SOCIAL_URLS.FACEBOOK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-gray-400 transition hover:border-cyan-400/50 hover:text-cyan-300"
                            aria-label="Facebook"
                        >
                            <FaFacebookF size={13} />
                        </a>
                        <a
                            href={SOCIAL_URLS.YOUTUBE}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-gray-400 transition hover:border-cyan-400/50 hover:text-cyan-300"
                            aria-label="YouTube"
                        >
                            <FaYoutube size={14} />
                        </a>
                        <a
                            href={SOCIAL_URLS.TIKTOK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-gray-400 transition hover:border-cyan-400/50 hover:text-cyan-300"
                            aria-label="TikTok"
                        >
                            <FaTiktok size={13} />
                        </a>
                    </div>
                </motion.div>

                {/* Nav columns */}
                <div className={`${ultraWideSpacing['content-width-xl']} mx-auto grid grid-cols-2 sm:grid-cols-4 ${ultraWideSpacing['grid-gap-md']}`}>
                    <motion.div variants={columnVariants}>
                        <h3 className={`uppercase ${typographyComponents.footer.heading} mb-3 sm:mb-4`}>
                            {t('footer.company.title')}
                        </h3>
                        <ul className="space-y-2">
                            <li><Link href="/about" className={`${typographyComponents.footer.link} hover:underline transition-colors`}>{t('footer.company.aboutUs')}</Link></li>
                            <li><Link href="/certification" className={`${typographyComponents.footer.link} hover:underline transition-colors`}>{t('footer.company.certifications')}</Link></li>
                            <li><Link href="/products" className={`${typographyComponents.footer.link} hover:underline transition-colors`}>{t('footer.company.headphones')}</Link></li>
                            <li><Link href="/contact" className={`${typographyComponents.footer.link} hover:underline transition-colors`}>{t('footer.other.contact')}</Link></li>
                        </ul>
                    </motion.div>

                    <motion.div variants={columnVariants}>
                        <h3 className={`uppercase ${typographyComponents.footer.heading} mb-3 sm:mb-4`}>
                            {t('footer.reseller.title')}
                        </h3>
                        <ul className="space-y-2">
                            <li><Link href="/become_our_reseller#dealer-network" className={`${typographyComponents.footer.link} hover:underline transition-colors`}>{t('footer.reseller.information')}</Link></li>
                            <li><Link href="/become_our_reseller" className={`${typographyComponents.footer.link} hover:underline transition-colors`}>{t('footer.reseller.becomeReseller')}</Link></li>
                        </ul>
                    </motion.div>

                    <motion.div variants={columnVariants}>
                        <h3 className={`uppercase ${typographyComponents.footer.heading} mb-3 sm:mb-4`}>{t('footer.other.title')}</h3>
                        <ul className="space-y-2">
                            <li><Link href="/warranty-check" className={`${typographyComponents.footer.link} hover:underline transition-colors`}>{t('footer.other.warrantyCheck')}</Link></li>
                            <li><Link href="/policy" className={`${typographyComponents.footer.link} hover:underline transition-colors`}>{t('footer.other.policy')}</Link></li>
                            <li><Link href="/blogs" className={`${typographyComponents.footer.link} hover:underline transition-colors`}>{t('footer.other.blog')}</Link></li>
                        </ul>
                    </motion.div>

                    <motion.div variants={columnVariants}>
                        <h3 className={`uppercase ${typographyComponents.footer.heading} mb-3 sm:mb-4`}>{t('footer.contact.title')}</h3>
                        <ul className="space-y-2 text-sm">
                            <li className={typographyComponents.footer.link}>{t('footer.contact.address')}</li>
                            <li>
                                <a href={`tel:${t('footer.contact.phoneRaw')}`} className={`${typographyComponents.footer.link} hover:text-cyan-300 transition-colors`}>
                                    {t('footer.contact.phone')}
                                </a>
                            </li>
                            <li>
                                <a href={`mailto:${t('footer.contact.email')}`} className={`${typographyComponents.footer.link} hover:text-cyan-300 transition-colors`}>
                                    {t('footer.contact.email')}
                                </a>
                            </li>
                        </ul>
                    </motion.div>
                </div>

                <motion.hr
                    className="border-gray-700/60 my-6 sm:my-8"
                    variants={lineVariants}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                />

                <motion.div
                    className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4 sm:gap-0 text-center sm:text-left"
                    variants={copyrightVariants}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                >
                    <p className={`mb-2 sm:mb-0 text-center sm:text-left ${typographyComponents.footer.copyright}`}>
                        {t('footer.copyright')}
                    </p>

                    <div className="flex items-center gap-2 justify-center sm:justify-start" aria-label={t('footer.languageSelectorLabel')}>
                        <button
                            type="button"
                            onClick={() => setLanguage('vi')}
                            className={`rounded-full border px-3 py-1 transition ${
                                language === 'vi'
                                    ? 'border-cyan-400/70 bg-cyan-400/15 text-white'
                                    : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                            }`}
                        >
                            VN
                        </button>
                        <button
                            type="button"
                            onClick={() => setLanguage('en')}
                            className={`rounded-full border px-3 py-1 transition ${
                                language === 'en'
                                    ? 'border-cyan-400/70 bg-cyan-400/15 text-white'
                                    : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                            }`}
                        >
                            EN
                        </button>
                    </div>
                </motion.div>
            </motion.footer>
        </AvoidSidebar>
    );
};

export default Footer;
