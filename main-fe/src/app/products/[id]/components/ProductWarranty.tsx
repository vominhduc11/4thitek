'use client';

import { FiCheckCircle, FiExternalLink, FiMapPin, FiPhone, FiShield, FiXCircle } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';

export default function ProductWarranty() {
    const { t, getTranslation } = useLanguage();
    const coveredItems = (getTranslation('products.warranty.covered.items') as string[]) || [];
    const notCoveredItems = (getTranslation('products.warranty.notCovered.items') as string[]) || [];
    const processSteps =
        (getTranslation('products.warranty.process.steps') as { title: string; description: string }[]) || [];

    const stepTones = [
        {
            badge: 'text-[var(--brand-blue)]',
            bg: 'bg-[rgba(41,171,226,0.14)]',
            border: 'border-[rgba(41,171,226,0.22)]'
        },
        {
            badge: 'text-[var(--success)]',
            bg: 'bg-[rgba(43,224,134,0.14)]',
            border: 'border-[rgba(43,224,134,0.22)]'
        },
        {
            badge: 'text-[var(--support-teal)]',
            bg: 'bg-[rgba(5,167,175,0.14)]',
            border: 'border-[rgba(5,167,175,0.22)]'
        },
        {
            badge: 'text-[var(--support-royal)]',
            bg: 'bg-[rgba(11,95,244,0.14)]',
            border: 'border-[rgba(11,95,244,0.22)]'
        }
    ];

    return (
        <section id="product-details" className="relative min-h-screen">
            <div className="container relative z-10 mx-auto max-w-[1800px] px-4 py-4 pb-2 pt-8 sm:-mt-8 md:-mt-8">
                <h2 className="mb-6 text-lg font-bold text-white sm:text-xl md:mb-8 md:text-2xl lg:text-3xl xl:text-4xl 3xl:text-6xl">
                    {t('products.warranty.title')}
                </h2>

                <div className="brand-card mb-8 rounded-[30px] border border-[var(--brand-border)] p-4 md:mb-12 md:p-6 lg:p-8">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.14)]">
                            <FiShield className="h-10 w-10 text-[var(--brand-blue)]" />
                        </div>
                        <h3 className="mb-2 text-base font-bold text-white sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 3xl:text-5xl">
                            {t('products.warranty.overview.title')}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] sm:text-base md:text-lg lg:text-lg xl:text-xl 3xl:text-3xl">
                            {t('products.warranty.overview.description')}
                        </p>
                    </div>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 md:mb-12 md:grid-cols-2 md:gap-8">
                    <div className="brand-card-muted rounded-[28px] border border-[rgba(43,224,134,0.2)] p-4 md:p-6 lg:p-8">
                        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--success)] sm:text-lg md:mb-6 md:text-xl lg:text-2xl xl:text-3xl">
                            <FiCheckCircle className="h-6 w-6" />
                            {t('products.warranty.covered.title')}
                        </h3>
                        <ul className="space-y-3 text-xs text-[var(--text-secondary)] sm:text-sm md:text-base lg:text-lg xl:text-xl">
                            {coveredItems.map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <span className="mt-1 text-[var(--success)]">•</span>
                                    <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 3xl:text-2xl">
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="brand-card-muted rounded-[28px] border border-[rgba(239,95,120,0.2)] p-4 md:p-6 lg:p-8">
                        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--destructive)] sm:text-lg md:mb-6 md:text-xl lg:text-2xl xl:text-3xl">
                            <FiXCircle className="h-6 w-6" />
                            {t('products.warranty.notCovered.title')}
                        </h3>
                        <ul className="space-y-3 text-xs text-[var(--text-secondary)] sm:text-sm md:text-base lg:text-lg xl:text-xl">
                            {notCoveredItems.map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <span className="mt-1 text-[var(--destructive)]">•</span>
                                    <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 3xl:text-2xl">
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="brand-card-muted mb-12 rounded-[28px] border border-[var(--brand-border)] p-8">
                    <h3 className="mb-6 text-center text-lg font-bold text-white sm:text-xl md:mb-8 md:text-2xl lg:text-3xl xl:text-4xl">
                        {t('products.warranty.process.title')}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                        {processSteps.map((step, index) => {
                            const tone = stepTones[index] || stepTones[0];
                            return (
                                <div key={step.title} className="text-center">
                                    <div
                                        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border ${tone.bg} ${tone.border}`}
                                    >
                                        <span className={`text-2xl font-bold ${tone.badge}`}>{index + 1}</span>
                                    </div>
                                    <h4 className="mb-2 text-sm font-bold text-white sm:text-base md:text-lg lg:text-xl xl:text-2xl">
                                        {step.title}
                                    </h4>
                                    <p className="text-xs text-[var(--text-secondary)] sm:text-sm md:text-base lg:text-lg xl:text-xl">
                                        {step.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="brand-card-muted rounded-[28px] border border-[var(--brand-border)] p-8">
                    <h3 className="mb-4 text-center text-lg font-bold text-white sm:text-xl md:mb-6 md:text-2xl lg:text-3xl xl:text-4xl">
                        {t('products.warranty.contact.title')}
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.14)]">
                                <FiPhone className="h-7 w-7 text-[var(--brand-blue)]" />
                            </div>
                            <h4 className="mb-2 font-bold text-white text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
                                {t('products.warranty.contact.hotline.title')}
                            </h4>
                            <p className="text-sm font-semibold text-[var(--brand-blue)] sm:text-base md:text-lg lg:text-xl xl:text-2xl">
                                {t('products.warranty.contact.hotline.value')}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] sm:text-sm md:text-base lg:text-lg xl:text-xl">
                                {t('products.warranty.contact.hotline.note')}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(43,224,134,0.22)] bg-[rgba(43,224,134,0.14)]">
                                <FiExternalLink className="h-7 w-7 text-[var(--success)]" />
                            </div>
                            <h4 className="mb-2 font-bold text-white">
                                {t('products.warranty.contact.facebook.title')}
                            </h4>
                            <a
                                href="https://www.facebook.com/bigbikegear"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-[var(--success)] transition-colors hover:text-white"
                            >
                                {t('products.warranty.contact.facebook.value')}
                            </a>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {t('products.warranty.contact.facebook.note')}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(5,167,175,0.22)] bg-[rgba(5,167,175,0.14)]">
                                <FiMapPin className="h-7 w-7 text-[var(--support-teal)]" />
                            </div>
                            <h4 className="mb-2 font-bold text-white">
                                {t('products.warranty.contact.address.title')}
                            </h4>
                            <p className="font-semibold text-[var(--support-teal)]">
                                {t('products.warranty.contact.address.value')}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {t('products.warranty.contact.address.note')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
