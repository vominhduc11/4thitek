'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function ProductWarranty() {
    const { t, getTranslation } = useLanguage();
    const coveredItems = (getTranslation('products.warranty.covered.items') as string[]) || [];
    const notCoveredItems = (getTranslation('products.warranty.notCovered.items') as string[]) || [];
    const processSteps = (getTranslation('products.warranty.process.steps') as { title: string; description: string }[]) || [];

    const stepColors = [
        { badge: 'text-blue-400', bg: 'bg-blue-500/20' },
        { badge: 'text-green-400', bg: 'bg-green-500/20' },
        { badge: 'text-purple-400', bg: 'bg-purple-500/20' },
        { badge: 'text-orange-400', bg: 'bg-orange-500/20' }
    ];
    return (
        <section id="product-details" className="relative min-h-screen">
            <div className="container mx-auto max-w-[1800px] px-4 relative py-4 pb-2 pt-8 sm:-mt-8 md:-mt-8 z-10">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 3xl:text-6xl font-bold mb-6 md:mb-8 text-white">
                    {t('products.warranty.title')}
                </h2>

                {/* Warranty Overview */}
                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-700/50 mb-8 md:mb-12">
                    <div className="text-center mb-8">
                        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">🛡️</span>
                        </div>
                        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 3xl:text-5xl font-bold text-white mb-2">
                            {t('products.warranty.overview.title')}
                        </h3>
                        <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 3xl:text-3xl">
                            {t('products.warranty.overview.description')}
                        </p>
                    </div>
                </div>

                {/* Warranty Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                    {/* What's Covered */}
                    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-700/50">
                        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-green-400 mb-4 md:mb-6 flex items-center gap-2">
                            <span>✅</span>
                            {t('products.warranty.covered.title')}
                        </h3>
                        <ul className="space-y-3 text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
                            {coveredItems.map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <span className="text-green-400 mt-1">•</span>
                                    <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 3xl:text-2xl">
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* What's Not Covered */}
                    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-700/50">
                        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-red-400 mb-4 md:mb-6 flex items-center gap-2">
                            <span>❌</span>
                            {t('products.warranty.notCovered.title')}
                        </h3>
                        <ul className="space-y-3 text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
                            {notCoveredItems.map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1">•</span>
                                    <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 3xl:text-2xl">
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Warranty Process */}
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 mb-12">
                    <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-6 md:mb-8 text-center">
                        {t('products.warranty.process.title')}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {processSteps.map((step, index) => {
                            const colors = stepColors[index] || stepColors[0];
                            return (
                                <div key={step.title} className="text-center">
                                    <div className={`w-16 h-16 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                        <span className={`text-2xl font-bold ${colors.badge}`}>{index + 1}</span>
                                    </div>
                                    <h4 className="font-bold text-white mb-2 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
                                        {step.title}
                                    </h4>
                                    <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
                                        {step.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                    <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 md:mb-6 text-center">
                        {t('products.warranty.contact.title')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">📞</span>
                            </div>
                            <h4 className="font-bold text-white mb-2 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
                                {t('products.warranty.contact.hotline.title')}
                            </h4>
                            <p className="text-blue-400 font-semibold text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
                                {t('products.warranty.contact.hotline.value')}
                            </p>
                            <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
                                {t('products.warranty.contact.hotline.note')}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">📘</span>
                            </div>
                            <h4 className="font-bold text-white mb-2">{t('products.warranty.contact.facebook.title')}</h4>
                            <a
                                href="https://www.facebook.com/bigbikegear"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-400 font-semibold"
                            >
                                {t('products.warranty.contact.facebook.value')}
                            </a>
                            <p className="text-gray-400 text-sm">{t('products.warranty.contact.facebook.note')}</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">📍</span>
                            </div>
                            <h4 className="font-bold text-white mb-2">{t('products.warranty.contact.address.title')}</h4>
                            <p className="text-purple-400 font-semibold">{t('products.warranty.contact.address.value')}</p>
                            <p className="text-gray-400 text-sm">{t('products.warranty.contact.address.note')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
