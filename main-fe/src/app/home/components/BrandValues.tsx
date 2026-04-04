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

const BRAND_VALUES_VIDEO = '/videos/brand-values-dealer-network-loop.mp4';

export default function BrandValues() {
    const { t } = useLanguage();
    const { enableInfiniteAnimations } = useAnimationConfig();

    return (
        <AvoidSidebar>
            <section className="brand-section-blue py-16 sm:py-20 md:py-24" aria-labelledby="brand-values-heading">
                <div className="absolute inset-0 bg-topo opacity-35" />
                <div className="absolute inset-0 bg-dot-grid opacity-20" />

                <div className="brand-shell relative z-10 lg:ml-20">
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:items-start xl:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.78fr)] xl:gap-12">
                        <motion.div
                            className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left"
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
                            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg lg:mx-0">
                                {t('brandValues.subtitle')}
                            </p>
                        </motion.div>

                        <motion.div
                            className="brand-card-muted relative hidden overflow-hidden rounded-[30px] border border-[rgba(41,171,226,0.18)] lg:block lg:min-h-[22rem] xl:min-h-[25rem]"
                            initial={{ opacity: 0, x: 28, scale: 0.98 }}
                            whileInView={{ opacity: 1, x: 0, scale: 1 }}
                            viewport={{ once: true, amount: 0.35 }}
                            transition={{ duration: 0.65, ease: 'easeOut' }}
                        >
                            <video
                                src={BRAND_VALUES_VIDEO}
                                className="absolute inset-0 h-full w-full scale-[1.04] object-cover object-center"
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="metadata"
                                aria-hidden="true"
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(5,14,22,0.82)_0%,rgba(5,14,22,0.38)_34%,rgba(5,14,22,0.5)_68%,rgba(5,14,22,0.82)_100%)]" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(41,171,226,0.12),transparent_36%),radial-gradient(circle_at_78%_72%,rgba(0,113,188,0.12),transparent_40%)]" />
                            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#07131f] via-[rgba(7,19,31,0.72)] to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#07131f] via-[rgba(7,19,31,0.84)] to-transparent" />
                            <div className="absolute inset-5 rounded-[24px] border border-[rgba(255,255,255,0.06)]" />

                            {enableInfiniteAnimations && (
                                <div className="pointer-events-none absolute left-6 top-6" aria-hidden="true">
                                    <div className="relative flex h-20 w-20 items-center justify-center">
                                        <div className="animate-signal-ring absolute h-full w-full rounded-full border border-[rgba(41,171,226,0.18)]" />
                                        <div className="animate-signal-ring-2 absolute h-full w-full rounded-full border border-[rgba(0,113,188,0.14)]" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-[var(--brand-blue)] shadow-[0_0_18px_rgba(41,171,226,0.45)]" />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-3 lg:mt-14 lg:max-w-none">
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
                        className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start"
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
