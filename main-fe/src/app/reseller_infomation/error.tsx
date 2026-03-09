'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

export default function ResellerInfoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error('Reseller Information page error:', error);
  }, [error]);

  return (
    <motion.div
      className="min-h-screen bg-[#0c131d] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-[#1e293b] rounded-lg border border-red-500/30 p-8 max-w-md w-full text-center"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-red-400 mb-2">{t('errors.pages.resellerInfo.title')}</h3>
        <p className="text-gray-300 mb-6">
          {error.message || t('errors.pages.resellerInfo.message')}
        </p>

        <div className="flex gap-3">
          <motion.button
            onClick={reset}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t('errors.global.tryAgain')}
          </motion.button>

          <motion.a
            href="/"
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-colors inline-block text-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t('errors.global.goHome')}
          </motion.a>
        </div>
      </motion.div>
    </motion.div>
  );
}
