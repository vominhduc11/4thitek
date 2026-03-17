import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants, useInView } from 'framer-motion';
import { useRef } from 'react';
import { FaFacebookF, FaYoutube } from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';
import { MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { typographyComponents } from '@/styles/typography';
import { SOCIAL_URLS } from '@/constants/urls';

const containerVariants: Variants = {
    hidden: { opacity: 0, y: 48 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', duration: 0.8, delayChildren: 0.1, staggerChildren: 0.06 }
    }
};
const columnVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
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
                className="bg-[#0c131d] text-gray-300 border-t border-white/5"
                variants={containerVariants}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
            >
                {/* Top accent line */}
                <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

                <div className="px-6 sm:px-8 lg:px-12 xl:px-16 pt-12 pb-10">
                    {/* Main grid — logo col + 4 nav cols */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-10 lg:gap-8">

                        {/* Column 1 — Brand */}
                        <motion.div variants={columnVariants} className="sm:col-span-2 lg:col-span-1">
                            <Link href="/" className="inline-block mb-5">
                                <Image
                                    src="/logo-4t.png"
                                    alt={t('brand.logoAlt')}
                                    width={120}
                                    height={28}
                                    className="h-auto w-[100px] sm:w-[120px] opacity-90 hover:opacity-100 transition-opacity"
                                />
                            </Link>
                            <p className="text-sm leading-relaxed text-gray-400 max-w-[220px] mb-6">
                                {t('footer.brand.tagline')}
                            </p>
                            <div className="flex items-center gap-2">
                                <a
                                    href={SOCIAL_URLS.FACEBOOK}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-gray-400 transition hover:border-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-400/5"
                                    aria-label="Facebook"
                                >
                                    <FaFacebookF size={13} />
                                </a>
                                <a
                                    href={SOCIAL_URLS.YOUTUBE}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-gray-400 transition hover:border-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-400/5"
                                    aria-label="YouTube"
                                >
                                    <FaYoutube size={14} />
                                </a>
                                <a
                                    href={SOCIAL_URLS.TIKTOK}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-gray-400 transition hover:border-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-400/5"
                                    aria-label="TikTok"
                                >
                                    <FaTiktok size={13} />
                                </a>
                            </div>
                        </motion.div>

                        {/* Column 2 — Company */}
                        <motion.div variants={columnVariants}>
                            <h3 className={`uppercase tracking-widest text-xs font-semibold text-white/70 mb-4`}>
                                {t('footer.company.title')}
                            </h3>
                            <ul className="space-y-2.5">
                                <li><Link href="/about" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.company.aboutUs')}</Link></li>
                                <li><Link href="/certification" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.company.certifications')}</Link></li>
                                <li><Link href="/products" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.company.headphones')}</Link></li>
                                <li><Link href="/contact" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.other.contact')}</Link></li>
                            </ul>
                        </motion.div>

                        {/* Column 3 — Reseller */}
                        <motion.div variants={columnVariants}>
                            <h3 className="uppercase tracking-widest text-xs font-semibold text-white/70 mb-4">
                                {t('footer.reseller.title')}
                            </h3>
                            <ul className="space-y-2.5">
                                <li><Link href="/become_our_reseller#dealer-network" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.reseller.information')}</Link></li>
                                <li><Link href="/become_our_reseller" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.reseller.becomeReseller')}</Link></li>
                            </ul>
                        </motion.div>

                        {/* Column 4 — Other */}
                        <motion.div variants={columnVariants}>
                            <h3 className="uppercase tracking-widest text-xs font-semibold text-white/70 mb-4">
                                {t('footer.other.title')}
                            </h3>
                            <ul className="space-y-2.5">
                                <li><Link href="/warranty-check" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.other.warrantyCheck')}</Link></li>
                                <li><Link href="/policy" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.other.policy')}</Link></li>
                                <li><Link href="/blogs" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.other.blog')}</Link></li>
                            </ul>
                        </motion.div>

                        {/* Column 5 — Contact */}
                        <motion.div variants={columnVariants}>
                            <h3 className="uppercase tracking-widest text-xs font-semibold text-white/70 mb-4">
                                {t('footer.contact.title')}
                            </h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-2 text-gray-400">
                                    <MapPinIcon className="h-4 w-4 mt-0.5 shrink-0 text-cyan-400/60" />
                                    <span>{t('footer.contact.address')}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <PhoneIcon className="h-4 w-4 shrink-0 text-cyan-400/60" />
                                    <a
                                        href={`tel:${t('footer.contact.phoneRaw')}`}
                                        className={`${typographyComponents.footer.link} transition-colors`}
                                    >
                                        {t('footer.contact.phone')}
                                    </a>
                                </li>
                                <li className="flex items-center gap-2">
                                    <EnvelopeIcon className="h-4 w-4 shrink-0 text-cyan-400/60" />
                                    <a
                                        href={`mailto:${t('footer.contact.email')}`}
                                        className={`${typographyComponents.footer.link} transition-colors`}
                                    >
                                        {t('footer.contact.email')}
                                    </a>
                                </li>
                            </ul>
                        </motion.div>
                    </div>

                    {/* Divider */}
                    <motion.hr
                        className="border-gray-700/50 mt-10 mb-6"
                        variants={lineVariants}
                        initial="hidden"
                        animate={inView ? 'visible' : 'hidden'}
                    />

                    {/* Bottom bar */}
                    <motion.div
                        className="flex flex-col sm:flex-row justify-between items-center gap-4"
                        variants={copyrightVariants}
                        initial="hidden"
                        animate={inView ? 'visible' : 'hidden'}
                    >
                        <p className={`${typographyComponents.footer.copyright} text-center sm:text-left`}>
                            {t('footer.copyright')}
                        </p>

                        <div className="flex items-center gap-2" aria-label={t('footer.languageSelectorLabel')}>
                            <button
                                type="button"
                                onClick={() => setLanguage('vi')}
                                className={`rounded-full border px-3 py-1 text-xs transition ${
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
                                className={`rounded-full border px-3 py-1 text-xs transition ${
                                    language === 'en'
                                        ? 'border-cyan-400/70 bg-cyan-400/15 text-white'
                                        : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                                }`}
                            >
                                EN
                            </button>
                        </div>
                    </motion.div>
                </div>
            </motion.footer>
        </AvoidSidebar>
    );
};

export default Footer;
