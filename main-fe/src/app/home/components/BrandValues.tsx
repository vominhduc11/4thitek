'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiShield, FiMap, FiHeadphones, FiArrowRight } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
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
            <section className="group relative overflow-hidden bg-gradient-to-b from-[#060d16] to-[#001A35] py-16 sm:py-20 md:py-24 bg-grain" aria-labelledby="brand-values-heading">

                {/* ── Signal connectivity rings — brand identity: Bluetooth range ── */}
                {enableInfiniteAnimations && (
                    <div className="absolute right-[12%] top-1/2 -translate-y-1/2 pointer-events-none hidden lg:block" aria-hidden="true">
                        <div className="relative h-48 w-48 flex items-center justify-center">
                            <div className="absolute h-full w-full rounded-full border border-amber-400/25 animate-signal-ring group-hover:border-amber-400/60 transition-colors duration-700" />
                            <div className="absolute h-full w-full rounded-full border border-amber-400/20 animate-signal-ring-2 group-hover:border-amber-400/50 transition-colors duration-700" />
                            <div className="absolute h-full w-full rounded-full border border-amber-400/15 animate-signal-ring-3 group-hover:border-amber-400/40 transition-colors duration-700" />
                            {/* Centre dot — signal source */}
                            <div className="h-2 w-2 rounded-full bg-amber-400/60 transition-all duration-700 group-hover:scale-150 group-hover:bg-amber-400" />
                        </div>
                    </div>
                )}

                {/* ── Dot-grid texture in background ── */}
                <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />

                <div className="relative z-10 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                    {/* Section heading */}
                    <motion.div
                        className="mb-14 text-center"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        {/* Amber warm accent — energy, motion, rider spirit */}
                        <span className="mb-4 inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
                            {t('brandValues.eyebrow')}
                        </span>
                        <h2 id="brand-values-heading" className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                            {t('brandValues.title')}
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-400 sm:text-lg">
                            {t('brandValues.subtitle')}
                        </p>
                    </motion.div>

                    {/* Value cards */}
                    <div className="mx-auto mb-14 grid max-w-5xl gap-5 sm:grid-cols-2 md:grid-cols-3">
                        {ITEMS.map(({ icon: Icon, key }, index) => (
                            <motion.div
                                key={key}
                                className="group/card relative rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-sm transition-all duration-500 hover:border-cyan-500/40 hover:bg-carbon hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(79,200,255,0.15)] overflow-hidden"
                                initial={{ opacity: 0, y: 32 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.12 }}
                            >
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 transition-all duration-500 group-hover/card:bg-cyan-500/30 group-hover/card:scale-110 group-hover/card:shadow-[0_0_15px_rgba(79,200,255,0.4)]">
                                    <Icon className="h-6 w-6 transition-transform duration-500 group-hover/card:rotate-12" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-white transition-colors duration-300 group-hover/card:text-cyan-300">
                                    {t(`brandValues.items.${key}.title`)}
                                </h3>
                                <p className="text-sm leading-relaxed text-gray-400 transition-colors duration-300 group-hover/card:text-gray-300">
                                    {t(`brandValues.items.${key}.description`)}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA row */}
                    <motion.div
                        className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <Link
                            href="/reseller_information"
                            className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-7 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                        >
                            {t('brandValues.findReseller')}
                            <FiArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/become_our_reseller"
                            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white transition hover:border-cyan-400/50 hover:text-cyan-300"
                        >
                            {t('brandValues.becomeReseller')}
                        </Link>
                    </motion.div>
                </div>
            </section>
        </AvoidSidebar>
    );
}
