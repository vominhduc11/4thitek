'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiArrowRight, FiHeadphones, FiMap, FiShield } from 'react-icons/fi';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { useAnimationConfig } from '@/hooks/useReducedMotion';

const ITEMS = [
    { icon: FiHeadphones, key: 'exclusive' },
    { icon: FiShield, key: 'warranty' },
    { icon: FiMap, key: 'network' }
] as const;

export default function BrandValues() {
    const { t } = useLanguage();
    const { enableInfiniteAnimations } = useAnimationConfig();

    return (
        <AvoidSidebar>
            <section className="brand-section-blue py-16 sm:py-20 md:py-24" aria-labelledby="brand-values-heading">
                <div className="absolute inset-0 bg-topo opacity-35" />
                <div className="absolute inset-0 bg-dot-grid opacity-20" />

                {enableInfiniteAnimations && (
                    <div
                        className="pointer-events-none absolute right-[10%] top-1/2 hidden -translate-y-1/2 lg:block"
                        aria-hidden="true"
                    >
                        <div className="relative flex h-52 w-52 items-center justify-center">
                            <div className="animate-signal-ring absolute h-full w-full rounded-full border border-[rgba(41,171,226,0.24)]" />
                            <div className="animate-signal-ring-2 absolute h-full w-full rounded-full border border-[rgba(0,113,188,0.2)]" />
                            <div className="animate-signal-ring-3 absolute h-full w-full rounded-full border border-[rgba(41,171,226,0.16)]" />
                            <div className="h-3 w-3 rounded-full bg-[var(--brand-blue)] shadow-[0_0_20px_rgba(41,171,226,0.5)]" />
                        </div>
                    </div>
                )}

                <div className="brand-shell relative z-10 sm:ml-16 md:ml-20">
                    <motion.div
                        className="mx-auto mb-14 max-w-3xl text-center"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="brand-badge mb-5">{t('brandValues.eyebrow')}</span>
                        <h2
                            id="brand-values-heading"
                            className="font-serif text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl lg:text-5xl"
                        >
                            {t('brandValues.title')}
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                            {t('brandValues.subtitle')}
                        </p>
                    </motion.div>

                    <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
                        {ITEMS.map(({ icon: Icon, key }, index) => (
                            <motion.article
                                key={key}
                                className="brand-card group rounded-[28px] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-border-strong)] hover:shadow-[0_24px_48px_rgba(0,113,188,0.16)]"
                                initial={{ opacity: 0, y: 32 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.14)] text-[var(--brand-blue)] transition-transform duration-300 group-hover:scale-105">
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
                        className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.55, delay: 0.2 }}
                    >
                        <Link
                            href="/reseller_information"
                            className="brand-button-primary inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:brightness-105"
                        >
                            {t('brandValues.findReseller')}
                            <FiArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/become_our_reseller"
                            className="brand-button-secondary inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:border-[var(--brand-blue)] hover:bg-[rgba(41,171,226,0.14)]"
                        >
                            {t('brandValues.becomeReseller')}
                        </Link>
                    </motion.div>
                </div>
            </section>
        </AvoidSidebar>
    );
}
