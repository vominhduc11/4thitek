'use client';

import React, { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { LanguageContext, LanguageContextType } from '@/context/LanguageContext';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    showDetails?: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    static contextType = LanguageContext;
    declare context: LanguageContextType | undefined;

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });

        // Call optional error handler
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Report to error tracking service (if available)
        if (typeof window !== 'undefined' && (window as { gtag?: (...args: unknown[]) => void }).gtag) {
            ((window as unknown) as { gtag: (...args: unknown[]) => void }).gtag('event', 'exception', {
                description: error?.toString() || 'Unknown error',
                fatal: false
            });
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            const context = this.context;
            const t = context?.t ?? ((key: string) => key);
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI with motion animations
            return (
                <motion.div
                    className="min-h-[400px] flex items-center justify-center p-8 bg-[#0c131d]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="max-w-md w-full bg-[#1e293b] rounded-lg border border-red-500/30 p-8 text-center"
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center"
                            animate={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <FiAlertTriangle className="w-8 h-8 text-red-400" />
                        </motion.div>

                        <h2 className="text-xl font-semibold text-red-400 mb-2">
                            {t('errors.global.title')}
                        </h2>

                        <p className="text-gray-300 mb-6">
                            {this.state.error?.message || t('errors.global.message')}
                        </p>

                        <motion.button
                            onClick={this.handleRetry}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <FiRefreshCw className="w-4 h-4" />
                            {t('errors.global.tryAgain')}
                        </motion.button>

                        {this.props.showDetails && this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                                    {t('errors.global.detailsTitle')}
                                </summary>
                                <div className="mt-2 p-4 bg-gray-800/50 rounded-lg text-xs text-gray-400 font-mono overflow-auto max-h-40">
                                    <div className="mb-2">
                                        <strong>{t('errors.global.errorLabel')}:</strong> {this.state.error.message}
                                    </div>
                                    {this.state.errorInfo && (
                                        <div>
                                            <strong>{t('errors.global.stackLabel')}:</strong>
                                            <pre className="mt-1 whitespace-pre-wrap break-words">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </details>
                        )}
                    </motion.div>
                </motion.div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
