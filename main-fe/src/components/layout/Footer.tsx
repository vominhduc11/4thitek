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
                className="relative overflow-hidden border-t border-[var(--brand-border)] bg-[#09111a] text-[var(--text-secondary)] bg-topo"
                variants={containerVariants}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
            >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(41,171,226,0.16),transparent_34%),linear-gradient(180deg,rgba(8,18,27,0.9),rgba(6,12,18,0.98))]" />

                <div className="relative h-[2px] w-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--brand-blue)] to-transparent" />
                    <div className="absolute inset-0 bg-[var(--brand-blue)]/25 blur-[3px]" />
                </div>

                <div className="brand-shell relative z-10 px-4 pb-10 pt-12 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                    <div className="mb-8 flex flex-col gap-4 border-b border-[var(--brand-border)] pb-8 md:flex-row md:items-end md:justify-between">
                        <div className="max-w-2xl">
                            <p className="brand-eyebrow text-[0.78rem]">{t('footer.brand.tagline')}</p>
                            <h2 className="mt-3 font-serif text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
                                {t('brand.message')}
                            </h2>
                        </div>
                        <p className="max-w-xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                            {t('brand.description')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] lg:gap-8">
                        <motion.div variants={columnVariants} className="sm:col-span-2 lg:col-span-1">
                            <Link href="/" className="mb-5 inline-block">
                                <Image
                                    src="/logo-4t.png"
                                    alt={t('brand.logoAlt')}
                                    width={120}
                                    height={28}
                                    className="h-auto w-[100px] opacity-95 transition-opacity hover:opacity-100 sm:w-[120px]"
                                />
                            </Link>
                            <p className="mb-6 max-w-[260px] text-sm leading-relaxed text-[var(--text-secondary)]">
                                {t('footer.brand.tagline')}
                            </p>
                            <div className="flex items-center gap-3">
                                <a
                                    href={SOCIAL_URLS.FACEBOOK}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] text-[var(--text-secondary)] transition-all duration-300 hover:scale-105 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.14)] hover:text-[var(--brand-blue)]"
                                    aria-label="Facebook"
                                >
                                    <FaFacebookF size={14} />
                                </a>
                                <a
                                    href={SOCIAL_URLS.YOUTUBE}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] text-[var(--text-secondary)] transition-all duration-300 hover:scale-105 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.14)] hover:text-[var(--brand-blue)]"
                                    aria-label="YouTube"
                                >
                                    <FaYoutube size={15} />
                                </a>
                                <a
                                    href={SOCIAL_URLS.TIKTOK}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] text-[var(--text-secondary)] transition-all duration-300 hover:scale-105 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.14)] hover:text-[var(--brand-blue)]"
                                    aria-label="TikTok"
                                >
                                    <FaTiktok size={14} />
                                </a>
                            </div>
                        </motion.div>

                        <motion.div variants={columnVariants}>
                            <h3 className="brand-eyebrow mb-4 text-[0.75rem]">{t('footer.company.title')}</h3>
                            <ul className="space-y-2.5">
                                <li><Link href="/about" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.company.aboutUs')}</Link></li>
                                <li><Link href="/certification" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.company.certifications')}</Link></li>
                                <li><Link href="/products" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.company.headphones')}</Link></li>
                                <li><Link href="/contact" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.other.contact')}</Link></li>
                            </ul>
                        </motion.div>

                        <motion.div variants={columnVariants}>
                            <h3 className="brand-eyebrow mb-4 text-[0.75rem]">{t('footer.reseller.title')}</h3>
                            <ul className="space-y-2.5">
                                <li><Link href="/become_our_reseller#dealer-network" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.reseller.information')}</Link></li>
                                <li><Link href="/become_our_reseller" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.reseller.becomeReseller')}</Link></li>
                            </ul>
                        </motion.div>

                        <motion.div variants={columnVariants}>
                            <h3 className="brand-eyebrow mb-4 text-[0.75rem]">{t('footer.other.title')}</h3>
                            <ul className="space-y-2.5">
                                <li><Link href="/warranty-check" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.other.warrantyCheck')}</Link></li>
                                <li><Link href="/policy" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.other.policy')}</Link></li>
                                <li><Link href="/blogs" className={`${typographyComponents.footer.link} transition-colors`}>{t('footer.other.blog')}</Link></li>
                            </ul>
                        </motion.div>

                        <motion.div variants={columnVariants}>
                            <h3 className="brand-eyebrow mb-4 text-[0.75rem]">{t('footer.contact.title')}</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-2 text-[var(--text-secondary)]">
                                    <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-blue)]" />
                                    <span>{t('footer.contact.address')}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <PhoneIcon className="h-4 w-4 shrink-0 text-[var(--brand-blue)]" />
                                    <a
                                        href={`tel:${t('footer.contact.phoneRaw')}`}
                                        className={`${typographyComponents.footer.link} transition-colors`}
                                    >
                                        {t('footer.contact.phone')}
                                    </a>
                                </li>
                                <li className="flex items-center gap-2">
                                    <EnvelopeIcon className="h-4 w-4 shrink-0 text-[var(--brand-blue)]" />
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

                    <motion.hr
                        className="mb-6 mt-10 border-[var(--brand-border)]"
                        variants={lineVariants}
                        initial="hidden"
                        animate={inView ? 'visible' : 'hidden'}
                    />

                    <motion.div
                        className="flex flex-col items-center justify-between gap-4 sm:flex-row"
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
                                        ? 'border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.16)] text-[var(--text-primary)]'
                                        : 'border-[var(--brand-border)] text-[var(--text-secondary)] hover:border-[var(--brand-border-strong)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                VN
                            </button>
                            <button
                                type="button"
                                onClick={() => setLanguage('en')}
                                className={`rounded-full border px-3 py-1 text-xs transition ${
                                    language === 'en'
                                        ? 'border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.16)] text-[var(--text-primary)]'
                                        : 'border-[var(--brand-border)] text-[var(--text-secondary)] hover:border-[var(--brand-border-strong)] hover:text-[var(--text-primary)]'
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
