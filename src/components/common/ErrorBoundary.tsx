'use client';

import React, { Component, ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

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
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="max-w-md w-full text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                            <FiAlertTriangle className="w-8 h-8 text-red-400" />
                        </div>

                        <h2 className="text-xl font-semibold text-white mb-2">
                            Đã xảy ra lỗi
                        </h2>

                        <p className="text-gray-400 mb-6">
                            Xin lỗi, có gì đó đã xảy ra sai sót. Vui lòng thử lại.
                        </p>

                        <button
                            onClick={this.handleRetry}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#4FC8FF] hover:bg-[#4FC8FF]/80 text-white rounded-lg transition-colors"
                        >
                            <FiRefreshCw className="w-4 h-4" />
                            Thử lại
                        </button>

                        {this.props.showDetails && this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-400">
                                    Chi tiết lỗi
                                </summary>
                                <div className="mt-2 p-4 bg-gray-800/50 rounded-lg text-xs text-gray-400 font-mono">
                                    <div className="mb-2">
                                        <strong>Error:</strong> {this.state.error.message}
                                    </div>
                                    {this.state.errorInfo && (
                                        <div>
                                            <strong>Stack:</strong>
                                            <pre className="mt-1 whitespace-pre-wrap">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;