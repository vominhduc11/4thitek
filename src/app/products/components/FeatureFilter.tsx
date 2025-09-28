'use client';

import { motion } from 'framer-motion';

interface FeatureFilterProps {
    features: string[];
    selectedFeatures: string[];
    onToggleFeature: (feature: string) => void;
}

export default function FeatureFilter({ features, selectedFeatures, onToggleFeature }: FeatureFilterProps) {
    return (
        <motion.div
            className="mb-6 2xl:mb-8 3xl:mb-10 4xl:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <h3 className="text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl font-semibold text-white mb-4 2xl:mb-6 3xl:mb-8 4xl:mb-10 flex items-center gap-2 2xl:gap-3 3xl:gap-4 4xl:gap-5">
                <svg
                    className="w-5 h-5 2xl:w-6 2xl:h-6 3xl:w-7 3xl:h-7 4xl:w-8 4xl:h-8 text-[#4FC8FF]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                </svg>
                Features
            </h3>
            <div className="grid grid-cols-1 gap-2 2xl:gap-3 3xl:gap-4 4xl:gap-5">
                {features.map((feature) => (
                    <motion.button
                        key={feature}
                        onClick={() => onToggleFeature(feature)}
                        className={`text-left px-4 py-2 2xl:px-6 2xl:py-3 3xl:px-8 3xl:py-4 4xl:px-10 4xl:py-5 rounded-lg 2xl:rounded-xl 3xl:rounded-2xl transition-all duration-300 ${
                            selectedFeatures.includes(feature)
                                ? 'bg-[#4FC8FF]/20 border border-[#4FC8FF]/30 text-[#4FC8FF]'
                                : 'bg-gray-800/30 border border-gray-700/50 text-gray-300 hover:text-white hover:border-[#4FC8FF]/30'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl font-medium">{feature}</span>
                            {selectedFeatures.includes(feature) && (
                                <motion.div
                                    className="w-1.5 h-1.5 2xl:w-2 2xl:h-2 3xl:w-2.5 3xl:h-2.5 4xl:w-3 4xl:h-3 bg-[#4FC8FF] rounded-full"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                />
                            )}
                        </div>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}