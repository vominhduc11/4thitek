'use client';

import { MdClose } from 'react-icons/md';

interface FilterHeaderProps {
    filteredCount: number;
    totalCount: number;
    onClose: () => void;
}

export default function FilterHeader({ filteredCount, totalCount, onClose }: FilterHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6 2xl:mb-8 3xl:mb-10 4xl:mb-12">
            <div>
                <h2 className="text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-bold text-white mb-1 2xl:mb-2 3xl:mb-3 4xl:mb-4 flex items-center gap-2 2xl:gap-3 3xl:gap-4 4xl:gap-5">
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
                            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                        />
                    </svg>
                    Filters
                </h2>
                <p className="text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl text-gray-400">
                    {filteredCount} of {totalCount} products
                </p>
            </div>
            <button
                onClick={onClose}
                className="lg:hidden p-2 2xl:p-3 3xl:p-4 4xl:p-5 hover:bg-gray-700/50 rounded-lg 2xl:rounded-xl 3xl:rounded-2xl transition-colors"
            >
                <MdClose className="w-5 h-5 2xl:w-6 2xl:h-6 3xl:w-7 3xl:h-7 4xl:w-8 4xl:h-8 text-gray-400" />
            </button>
        </div>
    );
}