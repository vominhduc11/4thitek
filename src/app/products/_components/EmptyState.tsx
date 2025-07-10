"use client";

import { motion } from "framer-motion";

interface EmptyStateProps {
  selectedSeries: string;
  onClearFilters: () => void;
}

const EmptyState = ({ selectedSeries, onClearFilters }: EmptyStateProps) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="w-24 h-24 mb-6 rounded-full bg-gray-800/50 flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </motion.div>
      
      <motion.h3
        className="text-2xl font-bold text-white mb-3 font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        NO PRODUCTS FOUND
      </motion.h3>
      
      <motion.p
        className="text-gray-400 mb-6 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        {selectedSeries !== "ALL" 
          ? `No products found in ${selectedSeries}. Try selecting a different series or clear all filters.`
          : "No products match your current filters. Try adjusting your search criteria."
        }
      </motion.p>
      
      <motion.button
        className="px-6 py-3 bg-[#4FC8FF] text-black font-semibold rounded-lg hover:bg-[#4FC8FF]/90 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClearFilters}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        Clear All Filters
      </motion.button>
    </motion.div>
  );
};

export default EmptyState;
