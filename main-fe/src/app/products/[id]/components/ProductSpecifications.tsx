'use client';

import { useLanguage } from '@/context/LanguageContext';

interface SpecificationItem {
    label: string;
    value: string;
}

interface ProductSpecificationsProps {
    specifications?: SpecificationItem[] | { general?: SpecificationItem[]; technical?: SpecificationItem[] };
}

export default function ProductSpecifications({ specifications = [] }: ProductSpecificationsProps) {
    const { t } = useLanguage();
    // Handle both array and object formats
    const specsArray = Array.isArray(specifications) ? specifications : [];
    const specsObject = !Array.isArray(specifications) ? specifications : { general: [], technical: [] };

    // Use array format if available, otherwise use object format
    const displaySpecs = specsArray.length > 0 ? specsArray : [
        ...(specsObject.general || []),
        ...(specsObject.technical || [])
    ];

    const finalSpecs = displaySpecs;

    return (
        <section id="product-details" className="relative z-[60] bg-[#0a0f1a] py-10 md:py-14">
            {/* Brand dot-grid texture */}
            <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />
            <div className="relative z-10 mx-auto max-w-[1800px] px-4">
                <h2 className="mb-6 text-xl font-bold text-white md:mb-8 md:text-2xl lg:text-3xl xl:text-4xl">
                    {t('products.specifications.title')}
                </h2>

                {finalSpecs.length > 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-sm md:p-6 lg:p-8">
                        <div className="grid grid-cols-1 gap-3 md:gap-4">
                            {finalSpecs.map((spec, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col rounded-xl border border-white/8 bg-white/4 px-4 py-3 transition-colors duration-200 hover:border-cyan-500/30 hover:bg-white/6 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <span className="mb-1 text-sm font-semibold text-cyan-300 sm:mb-0 sm:text-base md:text-lg">
                                        {spec.label}
                                    </span>
                                    <span className="text-sm font-medium text-white sm:text-base md:text-lg">
                                        {spec.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-gray-700/50 bg-gray-900/50 p-6 text-center">
                        <p className="text-sm text-gray-400 sm:text-base">{t('products.specifications.updating')}</p>
                    </div>
                )}
            </div>
        </section>
    );
}
