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
        <section id="product-details" className="relative z-[60]">
            <div className="container mx-auto max-w-[1800px] px-4 relative py-4 pb-2 pt-8 sm:-mt-8 md:-mt-8 z-[70]">
                <h2 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-4xl 3xl:text-6xl 4xl:text-7xl font-bold mb-4 md:mb-6 text-white">
                    {t('products.specifications.title')}
                </h2>

                {/* Main Specifications Table */}
                {finalSpecs.length > 0 ? (
                    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
                        <div className="grid grid-cols-1 gap-3 md:gap-4">
                            {finalSpecs.map((spec, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-4 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-600/40 transition-colors duration-200"
                                >
                                    <span className="text-blue-300 font-semibold text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl mb-1 sm:mb-0">
                                        {spec.label}
                                    </span>
                                    <span className="text-white font-medium text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl">
                                        {spec.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-900/50 rounded-2xl border border-gray-700/50 p-6 text-center">
                        <p className="text-gray-400 text-sm sm:text-base">{t('products.specifications.updating')}</p>
                    </div>
                )}
            </div>
        </section>
    );
}
