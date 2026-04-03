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
    const specsArray = Array.isArray(specifications) ? specifications : [];
    const specsObject = !Array.isArray(specifications) ? specifications : { general: [], technical: [] };
    const displaySpecs =
        specsArray.length > 0 ? specsArray : [...(specsObject.general || []), ...(specsObject.technical || [])];
    const finalSpecs = displaySpecs;

    return (
        <section id="product-details" className="relative py-10 md:py-14">
            <div className="absolute inset-0 bg-dot-grid opacity-15 pointer-events-none" />
            <div className="brand-shell relative z-10">
                <h2 className="mb-6 font-serif text-2xl font-semibold text-[var(--text-primary)] md:mb-8 md:text-3xl xl:text-4xl">
                    {t('products.specifications.title')}
                </h2>

                {finalSpecs.length > 0 ? (
                    <div className="brand-card rounded-[30px] p-4 md:p-6 lg:p-8">
                        <div className="grid grid-cols-1 gap-3 md:gap-4">
                            {finalSpecs.map((spec, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col rounded-[22px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] px-4 py-4 transition-all duration-200 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.08)] sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <span className="mb-1 text-sm font-semibold text-[var(--brand-blue)] sm:mb-0 sm:text-base md:text-lg">
                                        {spec.label}
                                    </span>
                                    <span className="text-sm font-medium text-[var(--text-primary)] sm:text-base md:text-lg">
                                        {spec.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="brand-card-muted rounded-[28px] p-6 text-center">
                        <p className="text-sm text-[var(--text-secondary)] sm:text-base">
                            {t('products.specifications.updating')}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
