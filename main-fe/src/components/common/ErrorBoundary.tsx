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
            (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'exception', {
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
                    className="brand-section flex min-h-[400px] items-center justify-center p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="brand-card max-w-md w-full rounded-[28px] border border-[rgba(239,95,120,0.28)] p-8 text-center"
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(239,95,120,0.14)]"
                            animate={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <FiAlertTriangle className="h-8 w-8 text-[var(--destructive)]" />
                        </motion.div>

                        <h2 className="mb-2 font-serif text-xl font-semibold text-[var(--destructive-text)]">
                            {t('errors.global.title')}
                        </h2>

                        <p className="mb-6 text-[var(--text-secondary)]">
                            {this.state.error?.message || t('errors.global.message')}
                        </p>

                        <motion.button
                            onClick={this.handleRetry}
                            className="brand-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-[var(--text-primary)]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <FiRefreshCw className="w-4 h-4" />
                            {t('errors.global.tryAgain')}
                        </motion.button>

                        {this.props.showDetails && this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="cursor-pointer text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                                    {t('errors.global.detailsTitle')}
                                </summary>
                                <div className="mt-2 max-h-40 overflow-auto rounded-2xl border border-[var(--brand-border)] bg-[rgba(7,17,27,0.8)] p-4 font-mono text-xs text-[var(--text-secondary)]">
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
