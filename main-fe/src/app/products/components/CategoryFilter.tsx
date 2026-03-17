'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

interface Category {
    id: string;
    name: string;
    description: string;
}

interface CategoryFilterProps {
    categories: Category[];
    selectedCategories: string[];
    onToggleCategory: (categoryId: string) => void;
}

export default function CategoryFilter({ categories, selectedCategories, onToggleCategory }: CategoryFilterProps) {
    const { t } = useLanguage();
    return (
        <motion.div
            className="mb-6 2xl:mb-8 3xl:mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <h3 className="text-lg 2xl:text-xl 3xl:text-2xl font-semibold text-white mb-4 2xl:mb-6 3xl:mb-8 flex items-center gap-2 2xl:gap-3 3xl:gap-4">
                <svg
                    className="w-5 h-5 2xl:w-6 2xl:h-6 3xl:w-7 3xl:h-7 text-[#4FC8FF]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                </svg>
                {t('products.filters.categories')}
            </h3>
            <div className="space-y-2 2xl:space-y-3 3xl:space-y-4">
                {categories.map((category) => (
                    <motion.button
                        key={category.id}
                        onClick={() => onToggleCategory(category.id)}
                        className={`w-full text-left px-4 py-3 2xl:px-6 2xl:py-4 3xl:px-8 3xl:py-5 rounded-xl 2xl:rounded-2xl 3xl:rounded-3xl transition-all duration-300 group ${
                            selectedCategories.includes(category.id)
                                ? 'bg-gradient-to-r from-[#4FC8FF]/20 to-[#00D4FF]/10 border border-[#4FC8FF]/30 text-[#4FC8FF]'
                                : 'bg-gray-800/30 border border-gray-700/50 text-gray-300 hover:text-white hover:border-[#4FC8FF]/30 hover:bg-gray-700/30'
                        }`}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-medium text-base 2xl:text-lg 3xl:text-xl">{category.name}</span>
                                <p className="text-xs 2xl:text-sm 3xl:text-base text-gray-400 mt-0.5 2xl:mt-1 3xl:mt-1.5">{category.description}</p>
                            </div>
                            {selectedCategories.includes(category.id) && (
                                <motion.div
                                    className="w-2 h-2 2xl:w-3 2xl:h-3 3xl:w-4 3xl:h-4 bg-[#4FC8FF] rounded-full"
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
