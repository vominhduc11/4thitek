'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    // Log error to an error reporting service
    console.error('Global error caught:', error);
    // You can send this to an error tracking service like Sentry
    // logErrorToService(error, 'global');
  }, [error]);

  return (
    <html>
      <body className="bg-[#0c131d]">
        <motion.div
          className="min-h-screen flex items-center justify-center p-4"
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
            {/* Error Icon */}
            <motion.div
              className="mb-6 text-red-500 text-5xl"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              ⚠️
            </motion.div>

            <h1 className="text-2xl font-bold text-white mb-3">
              {t('errors.global.title')}
            </h1>

            <p className="text-gray-300 mb-6">
              {error.message || t('errors.global.message')}
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 text-left bg-red-950/20 rounded p-3 border border-red-500/20">
                <summary className="cursor-pointer text-red-400 font-semibold mb-2">
                  {t('errors.global.devDetailsTitle')}
                </summary>
                <pre className="text-xs text-red-300 overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </details>
            )}

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

            {/* Error Digest for tracking */}
            {error.digest && (
              <p className="text-xs text-gray-500 mt-4">
                {t('errors.global.errorId')} {error.digest}
              </p>
            )}
          </motion.div>
        </motion.div>
      </body>
    </html>
  );
}
