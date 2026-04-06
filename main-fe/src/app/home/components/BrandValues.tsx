'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiArrowRight, FiArrowUpRight, FiAward, FiHeadphones, FiMapPin, FiShield } from 'react-icons/fi';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { useAnimationConfig } from '@/hooks/useReducedMotion';

const ITEMS = [
    { icon: FiHeadphones, key: 'exclusive' },
    { icon: FiShield, key: 'warranty' },
    { icon: FiMapPin, key: 'network' }
] as const;

const PROOF_LINKS = [
    { href: '/certification', icon: FiAward, labelKey: 'certification.title' },
    { href: '/warranty-check', icon: FiShield, labelKey: 'warrantyCheck.title' },
    { href: '/reseller_information', icon: FiMapPin, labelKey: 'brandValues.findReseller' }
] as const;

export default function BrandValues() {
    const { t } = useLanguage();
    const { enableDecorativeAnimations } = useAnimationConfig();

    return (
        <AvoidSidebar>
            <section className="brand-section-blue py-16 sm:py-18 md:py-20" aria-labelledby="brand-values-heading">
                <div className="absolute inset-0 bg-topo opacity-22" />
                <div className="absolute inset-0 bg-dot-grid opacity-10" />
                <div className="absolute left-[-6rem] top-10 h-60 w-60 rounded-full bg-[rgba(41,171,226,0.08)] blur-[100px]" />

                <div className="brand-shell relative z-10 lg:ml-20">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:items-center xl:gap-8">
                        <motion.div
                            className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left"
                            initial={enableDecorativeAnimations ? { opacity: 0, y: 18 } : false}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                        >
                            <span className="brand-badge mb-4">{t('brandValues.eyebrow')}</span>
                            <h2
                                id="brand-values-heading"
                                className="font-serif text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl lg:text-5xl"
                            >
                                {t('brandValues.title')}
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg lg:mx-0">
                                {t('brandValues.subtitle')}
                            </p>
                        </motion.div>

                        <motion.aside
                            className="brand-card-muted rounded-[30px] border border-[rgba(41,171,226,0.18)] p-5 sm:p-6"
                            initial={enableDecorativeAnimations ? { opacity: 0, x: 18 } : false}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.35 }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                            aria-label={t('brandValues.eyebrow')}
                        >
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <p className="brand-eyebrow text-[0.68rem]">{t('brand.message')}</p>
                                    <h3 className="mt-2 font-serif text-2xl font-semibold text-[var(--text-primary)]">
                                        {t('brandValues.title')}
                                    </h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(41,171,226,0.24)] bg-[rgba(41,171,226,0.14)] text-[var(--brand-blue)]">
                                    <FiAward className="h-5 w-5" />
                                </div>
                            </div>

                            <p className="text-sm leading-7 text-[var(--text-secondary)] sm:text-[15px]">
                                {t('brand.description')}
                            </p>

                            <div className="mt-5 space-y-3">
                                {PROOF_LINKS.map(({ href, icon: Icon, labelKey }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        className="group flex items-center justify-between rounded-[22px] border border-[rgba(133,170,197,0.14)] bg-[rgba(7,17,27,0.5)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.06)]"
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(41,171,226,0.2)] bg-[rgba(41,171,226,0.12)] text-[var(--brand-blue)]">
                                                <Icon className="h-4 w-4" />
                                            </span>
                                            <span>{t(labelKey)}</span>
                                        </span>
                                        <FiArrowUpRight className="h-4 w-4 text-[var(--text-muted)] transition-colors duration-200 group-hover:text-[var(--brand-blue)]" />
                                    </Link>
                                ))}
                            </div>
                        </motion.aside>
                    </div>

                    <div className="mx-auto mt-8 grid max-w-6xl gap-4 md:grid-cols-3 lg:max-w-none">
                        {ITEMS.map(({ icon: Icon, key }, index) => (
                            <motion.article
                                key={key}
                                className="brand-card group rounded-[28px] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-border-strong)] hover:shadow-[0_18px_34px_rgba(0,113,188,0.12)]"
                                initial={enableDecorativeAnimations ? { opacity: 0, y: 22 } : false}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: enableDecorativeAnimations ? index * 0.06 : 0 }}
                            >
                                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.14)] text-[var(--brand-blue)]">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                                    {t(`brandValues.items.${key}.title`)}
                                </h3>
                                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                                    {t(`brandValues.items.${key}.description`)}
                                </p>
                            </motion.article>
                        ))}
                    </div>

                    <motion.div
                        className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start"
                        initial={enableDecorativeAnimations ? { opacity: 0, y: 16 } : false}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: enableDecorativeAnimations ? 0.12 : 0 }}
                    >
                        <Link
                            href="/reseller_information"
                            className="brand-button-primary inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] transition duration-200 hover:brightness-105"
                        >
                            {t('brandValues.findReseller')}
                            <FiArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/become_our_reseller"
                            className="brand-button-secondary inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] transition duration-200 hover:border-[var(--brand-blue)] hover:bg-[rgba(41,171,226,0.12)]"
                        >
                            {t('brandValues.becomeReseller')}
                        </Link>
                    </motion.div>
                </div>
            </section>
        </AvoidSidebar>
    );
}
