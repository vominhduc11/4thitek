'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowRight, FiHeadphones, FiMapPin, FiShield } from 'react-icons/fi';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { useAnimationConfig } from '@/hooks/useReducedMotion';
import type { HomeBrandValuesContent } from '@/types/content';

const ITEMS = [
    { icon: FiHeadphones, key: 'exclusive' },
    { icon: FiShield, key: 'warranty' },
    { icon: FiMapPin, key: 'network' }
] as const;

const PROOF_LINKS = [
    { href: '/certification', labelKey: 'certification.title', detailKey: 'brandValues.items.exclusive.title' },
    { href: '/warranty-check', labelKey: 'warrantyCheck.title', detailKey: 'brandValues.items.warranty.title' },
    { href: '/contact', labelKey: 'nav.contact', detailKey: 'brandValues.items.network.title' }
] as const;

type BrandValuesProps = {
    content?: HomeBrandValuesContent | null;
};

export default function BrandValues({ content = null }: BrandValuesProps) {
    const { t } = useLanguage();
    const { enableDecorativeAnimations } = useAnimationConfig();
    const proofLinks =
        content?.proofLinks?.length
            ? content.proofLinks
            : PROOF_LINKS.map(({ href, labelKey, detailKey }) => ({
                  href,
                  label: t(labelKey),
                  detail: t(detailKey)
              }));
    const valueItems =
        content?.items?.length
            ? content.items
            : ITEMS.map(({ key }) => ({
                  key,
                  title: t(`brandValues.items.${key}.title`),
                  description: t(`brandValues.items.${key}.description`)
              }));
    const eyebrow = content?.eyebrow?.trim() || t('brandValues.eyebrow');
    const title = content?.title?.trim() || t('brandValues.title');
    const subtitle = content?.subtitle?.trim() || t('brandValues.subtitle');
    const becomeResellerLabel = content?.becomeResellerLabel?.trim() || t('brandValues.becomeReseller');
    const becomeResellerHref = content?.becomeResellerHref?.trim() || '/become_our_reseller';

    return (
        <AvoidSidebar>
            <section className="brand-section-blue py-16 sm:py-18 md:py-20" aria-labelledby="brand-values-heading">
                <div className="absolute inset-0 bg-topo opacity-22" />
                <div className="absolute inset-0 bg-dot-grid opacity-10" />
                <div className="absolute left-[-6rem] top-10 h-60 w-60 rounded-full bg-[rgba(41,171,226,0.08)] blur-[100px]" />

                <div className="brand-shell relative z-10">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:items-start xl:gap-8">
                        <motion.div
                            className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left"
                            initial={enableDecorativeAnimations ? { opacity: 0, y: 18 } : false}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                        >
                            <span className="brand-badge mb-4">{eyebrow}</span>
                            <h2
                                id="brand-values-heading"
                                className="font-serif text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl lg:text-5xl"
                            >
                                {title}
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg lg:mx-0">
                                {subtitle}
                            </p>
                        </motion.div>

                        <motion.aside
                            className="brand-card-muted rounded-[28px] p-6"
                            initial={enableDecorativeAnimations ? { opacity: 0, y: 18 } : false}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.42, ease: 'easeOut' }}
                        >
                            <p className="brand-eyebrow text-[0.68rem]">{t('certification.title')}</p>
                            <div className="mt-4 space-y-3">
                                {proofLinks.map(({ href, label, detail }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        className="flex items-start justify-between gap-4 rounded-[20px] border border-[rgba(133,170,197,0.12)] bg-[rgba(7,17,27,0.42)] px-4 py-3 transition duration-200 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.08)]"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
                                                {label}
                                            </p>
                                            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{detail}</p>
                                        </div>
                                        <FiArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--brand-blue)]" />
                                    </Link>
                                ))}
                            </div>
                        </motion.aside>
                    </div>

                    <div className="mx-auto mt-8 grid max-w-6xl gap-4 md:grid-cols-3 lg:max-w-none">
                        {valueItems.map(({ key, title: itemTitle, description }, index) => {
                            const Icon = ITEMS.find((item) => item.key === key)?.icon ?? FiShield;

                            return (
                                <motion.article
                                    key={key}
                                    className="brand-card group rounded-[28px] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-border-strong)] hover:shadow-[0_18px_34px_rgba(0,113,188,0.12)]"
                                    initial={enableDecorativeAnimations ? { opacity: 0, y: 22 } : false}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        duration: 0.4,
                                        delay: enableDecorativeAnimations ? index * 0.06 : 0
                                    }}
                                >
                                    <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.14)] text-[var(--brand-blue)]">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">{itemTitle}</h3>
                                    <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                                        {description}
                                    </p>
                                </motion.article>
                            );
                        })}
                    </div>

                    <motion.div
                        className="mt-8 flex justify-center lg:justify-start"
                        initial={enableDecorativeAnimations ? { opacity: 0, y: 16 } : false}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: enableDecorativeAnimations ? 0.12 : 0 }}
                    >
                        <Link
                            href={becomeResellerHref}
                            className="brand-button-primary inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] transition duration-200 hover:brightness-105"
                        >
                            {becomeResellerLabel}
                            <FiArrowRight className="h-4 w-4" />
                        </Link>
                    </motion.div>
                </div>
            </section>
        </AvoidSidebar>
    );
}
