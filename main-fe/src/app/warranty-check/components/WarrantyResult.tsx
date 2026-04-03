import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useHydration } from '@/hooks/useHydration';
import { WarrantyInfo } from '@/types/warranty';

interface WarrantyResultProps {
    warrantyInfo: WarrantyInfo | null;
    errorInfo: { message: string; type: 'not_found' | 'network' | 'server' | 'unknown' } | null;
    onReset: () => void;
}

const actionButtonClass =
    'inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-semibold uppercase tracking-[0.08em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06111B]';

const detailCardClass =
    'rounded-[24px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-border-strong)] hover:shadow-[0_18px_36px_rgba(0,113,188,0.14)]';

function getErrorTone(type?: NonNullable<WarrantyResultProps['errorInfo']>['type']) {
    switch (type) {
        case 'not_found':
            return {
                bubble: 'border-[rgba(189,249,25,0.28)] bg-[rgba(189,249,25,0.14)] text-[var(--support-lime)]',
                title: 'text-[var(--support-lime)]'
            };
        case 'network':
            return {
                bubble: 'border-[rgba(11,95,244,0.28)] bg-[rgba(11,95,244,0.14)] text-[var(--support-royal)]',
                title: 'text-[var(--support-royal)]'
            };
        case 'server':
        case 'unknown':
        default:
            return {
                bubble: 'border-[rgba(239,95,120,0.28)] bg-[rgba(239,95,120,0.14)] text-[var(--destructive)]',
                title: 'text-[var(--destructive-text)]'
            };
    }
}

function getStatusTone(status: string) {
    switch (status) {
        case 'active':
            return {
                pill: 'border-[rgba(43,224,134,0.28)] bg-[rgba(43,224,134,0.14)] text-[var(--success)]',
                panel: 'border-[rgba(43,224,134,0.24)] bg-[rgba(43,224,134,0.1)]',
                heading: 'text-[var(--success)]',
                body: 'text-[#bdf7d8]'
            };
        case 'expired':
            return {
                pill: 'border-[rgba(239,95,120,0.28)] bg-[rgba(239,95,120,0.14)] text-[var(--destructive)]',
                panel: 'border-[rgba(239,95,120,0.24)] bg-[rgba(239,95,120,0.1)]',
                heading: 'text-[var(--destructive-text)]',
                body: 'text-[#ffd5dc]'
            };
        case 'void':
            return {
                pill: 'border-[rgba(189,249,25,0.28)] bg-[rgba(189,249,25,0.14)] text-[var(--support-lime)]',
                panel: 'border-[rgba(189,249,25,0.24)] bg-[rgba(189,249,25,0.08)]',
                heading: 'text-[var(--support-lime)]',
                body: 'text-[#eefdb8]'
            };
        default:
            return {
                pill: 'border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] text-[var(--text-secondary)]',
                panel: 'border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)]',
                heading: 'text-[var(--text-primary)]',
                body: 'text-[var(--text-secondary)]'
            };
    }
}

const WarrantyResult: React.FC<WarrantyResultProps> = ({ warrantyInfo, errorInfo, onReset }) => {
    const { t, locale, getTranslation } = useLanguage();
    const isHydrated = useHydration();

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return t('warrantyCheck.result.status.active');
            case 'expired':
                return t('warrantyCheck.result.status.expired');
            case 'void':
                return t('warrantyCheck.result.status.void');
            case 'invalid':
            default:
                return t('warrantyCheck.result.status.invalid');
        }
    };

    const handleDownloadInfo = () => {
        if (!warrantyInfo) return;

        const statusText = getStatusText(warrantyInfo.warrantyStatus);
        const lines = [
            `=== ${t('warrantyCheck.export.title')} ===`,
            '',
            `${t('warrantyCheck.export.productInfoTitle')}:`,
            `- ${t('warrantyCheck.export.serialLabel')}: ${warrantyInfo.serialNumber}`,
            `- ${t('warrantyCheck.export.productNameLabel')}: ${warrantyInfo.productName}`,
            ...(warrantyInfo.productSku
                ? [`- ${t('warrantyCheck.export.productSkuLabel')}: ${warrantyInfo.productSku}`]
                : []),
            '',
            `${t('warrantyCheck.export.warrantyInfoTitle')}:`,
            `- ${t('warrantyCheck.export.purchaseDateLabel')}: ${warrantyInfo.purchaseDate}`,
            `- ${t('warrantyCheck.export.warrantyEndDateLabel')}: ${warrantyInfo.warrantyEndDate}`,
            ...(warrantyInfo.warrantyCode
                ? [`- ${t('warrantyCheck.export.warrantyCodeLabel')}: ${warrantyInfo.warrantyCode}`]
                : []),
            `- ${t('warrantyCheck.export.statusLabel')}: ${statusText}`,
            ...(warrantyInfo.warrantyStatus === 'active'
                ? [
                      `- ${t('warrantyCheck.export.remainingDaysLabel')}: ${t('warrantyCheck.export.remainingDaysValue').replace('{days}', String(warrantyInfo.remainingDays))}`
                  ]
                : []),
            '',
            `${t('warrantyCheck.export.supportTitle')}:`,
            `- ${t('warrantyCheck.export.hotlineLabel')}: ${t('warrantyCheck.export.hotlineValue')}`,
            `- ${t('warrantyCheck.export.supportEmailLabel')}: ${t('warrantyCheck.export.supportEmailValue')}`,
            '',
            `${t('warrantyCheck.export.exportTimestampLabel')}: ${isHydrated ? new Date().toLocaleString(locale) : ''}`
        ];

        const content = lines.filter(Boolean).join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.style.display = 'none';
        anchor.href = url;
        anchor.download = `${t('warrantyCheck.export.fileNamePrefix')}-${warrantyInfo.serialNumber}-${isHydrated ? new Date().toISOString().split('T')[0] : 'export'}.txt`;
        document.body.appendChild(anchor);
        anchor.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(anchor);
    };

    const getErrorIcon = () => {
        switch (errorInfo?.type) {
            case 'not_found':
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                );
            case 'network':
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                    />
                );
            case 'server':
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                    />
                );
            default:
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />;
        }
    };

    const getErrorTitle = () => {
        switch (errorInfo?.type) {
            case 'not_found':
                return t('warrantyCheck.errors.notFoundTitle');
            case 'network':
                return t('warrantyCheck.errors.networkTitle');
            case 'server':
                return t('warrantyCheck.errors.serverTitle');
            default:
                return t('warrantyCheck.errors.unknownTitle');
        }
    };

    const getErrorMessage = () => {
        switch (errorInfo?.type) {
            case 'not_found':
                return t('warrantyCheck.errors.notFoundMessage');
            case 'network':
                return t('warrantyCheck.errors.networkMessage');
            case 'server':
                return t('warrantyCheck.errors.serverMessage');
            default:
                return errorInfo?.message || t('warrantyCheck.errors.unknownMessage');
        }
    };

    const getStatusIcon = (status: string) => {
        const tone =
            status === 'active'
                ? 'text-[var(--success)]'
                : status === 'expired'
                  ? 'text-[var(--destructive)]'
                  : status === 'void'
                    ? 'text-[var(--support-lime)]'
                    : 'text-[var(--text-secondary)]';

        switch (status) {
            case 'active':
                return (
                    <svg className={`h-8 w-8 ${tone}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
            case 'expired':
                return (
                    <svg className={`h-8 w-8 ${tone}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
            case 'void':
                return (
                    <svg className={`h-8 w-8 ${tone}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            default:
                return (
                    <svg className={`h-8 w-8 ${tone}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
        }
    };

    if (!warrantyInfo) {
        const tone = getErrorTone(errorInfo?.type);
        const tips = (getTranslation('warrantyCheck.errors.tips.items') as string[]) || [];

        return (
            <motion.div
                className="brand-card mx-auto max-w-3xl rounded-[30px] p-6 sm:p-8"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
            >
                <div className="text-center">
                    <div
                        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border ${tone.bubble}`}
                    >
                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {getErrorIcon()}
                        </svg>
                    </div>
                    <h2 className={`mt-5 font-serif text-2xl font-semibold ${tone.title}`}>{getErrorTitle()}</h2>
                    <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                        {getErrorMessage()}
                    </p>

                    <div className="mt-6 rounded-[24px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] p-5 text-left">
                        <div className="flex items-center gap-2 text-[var(--text-primary)]">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(41,171,226,0.14)] text-[var(--brand-blue)]">
                                i
                            </span>
                            <h3 className="font-semibold">{t('warrantyCheck.errors.tips.title')}</h3>
                        </div>
                        <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
                            {tips.map((tip) => (
                                <li key={tip} className="flex items-start gap-3">
                                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--brand-blue)]" />
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <motion.button
                            type="button"
                            onClick={onReset}
                            className={`${actionButtonClass} brand-button-primary px-8 text-[var(--text-primary)] shadow-[0_18px_42px_rgba(0,113,188,0.18)] hover:-translate-y-0.5 hover:brightness-105`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {t('warrantyCheck.result.actions.checkAnother')}
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        );
    }

    const statusTone = getStatusTone(warrantyInfo.warrantyStatus);

    return (
        <motion.div
            className="brand-card mx-auto max-w-4xl rounded-[30px] p-6 sm:p-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)]">
                    {getStatusIcon(warrantyInfo.warrantyStatus)}
                </div>
                <h2 className="mt-5 font-serif text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
                    {t('warrantyCheck.result.title')}
                </h2>
                <div
                    className={`mt-4 inline-flex rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] ${statusTone.pill}`}
                >
                    {getStatusText(warrantyInfo.warrantyStatus)}
                </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
                <div className={detailCardClass}>
                    <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)]">
                        {t('warrantyCheck.result.sections.productInfo')}
                    </h3>
                    <div className="mt-4 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
                        <p>
                            <span className="font-semibold text-[var(--text-primary)]">
                                {t('warrantyCheck.result.fields.serialNumber')}:
                            </span>{' '}
                            {warrantyInfo.serialNumber}
                        </p>
                        <p>
                            <span className="font-semibold text-[var(--text-primary)]">
                                {t('warrantyCheck.result.fields.productName')}:
                            </span>{' '}
                            {warrantyInfo.productName}
                        </p>
                        {warrantyInfo.productSku && (
                            <p>
                                <span className="font-semibold text-[var(--text-primary)]">
                                    {t('warrantyCheck.result.fields.productSku')}:
                                </span>{' '}
                                {warrantyInfo.productSku}
                            </p>
                        )}
                    </div>
                </div>

                {warrantyInfo.productImage && (
                    <div className={detailCardClass}>
                        <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)]">
                            {t('warrantyCheck.result.sections.productImage')}
                        </h3>
                        <div className="relative mt-4 h-40 overflow-hidden rounded-[18px] border border-[var(--brand-border)] bg-[rgba(6,17,27,0.9)]">
                            <Image
                                src={warrantyInfo.productImage}
                                alt={warrantyInfo.productName}
                                fill
                                className="object-cover transition-transform duration-500 hover:scale-105"
                                onError={(event) => {
                                    const target = event.target as HTMLImageElement;
                                    target.src = '/images/product-placeholder.jpg';
                                }}
                            />
                        </div>
                    </div>
                )}

                <div className={detailCardClass}>
                    <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)]">
                        {t('warrantyCheck.result.sections.warrantyInfo')}
                    </h3>
                    <div className="mt-4 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
                        <p>
                            <span className="font-semibold text-[var(--text-primary)]">
                                {t('warrantyCheck.result.fields.purchaseDate')}:
                            </span>{' '}
                            {warrantyInfo.purchaseDate}
                        </p>
                        <p>
                            <span className="font-semibold text-[var(--text-primary)]">
                                {t('warrantyCheck.result.fields.warrantyEndDate')}:
                            </span>{' '}
                            {warrantyInfo.warrantyEndDate}
                        </p>
                        {warrantyInfo.warrantyCode && (
                            <p>
                                <span className="font-semibold text-[var(--text-primary)]">
                                    {t('warrantyCheck.result.fields.warrantyCode')}:
                                </span>{' '}
                                {warrantyInfo.warrantyCode}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {warrantyInfo.warrantyStatus !== 'invalid' && (
                <div className={`mt-6 rounded-[24px] border p-5 ${statusTone.panel}`}>
                    {warrantyInfo.warrantyStatus === 'active' && (
                        <>
                            <h3 className={`font-semibold ${statusTone.heading}`}>
                                {t('warrantyCheck.result.active.title')}
                            </h3>
                            <p className={`mt-2 text-sm leading-6 ${statusTone.body}`}>
                                {t('warrantyCheck.result.active.message').replace(
                                    '{days}',
                                    String(warrantyInfo.remainingDays)
                                )}
                            </p>
                            <p className={`mt-2 text-sm leading-6 ${statusTone.heading}`}>
                                {t('warrantyCheck.result.active.support')}
                            </p>
                        </>
                    )}

                    {warrantyInfo.warrantyStatus === 'expired' && (
                        <>
                            <h3 className={`font-semibold ${statusTone.heading}`}>
                                {t('warrantyCheck.result.expired.title')}
                            </h3>
                            <p className={`mt-2 text-sm leading-6 ${statusTone.body}`}>
                                {t('warrantyCheck.result.expired.message').replace(
                                    '{date}',
                                    warrantyInfo.warrantyEndDate
                                )}
                            </p>
                            <p className={`mt-2 text-sm leading-6 ${statusTone.heading}`}>
                                {t('warrantyCheck.result.expired.support')}
                            </p>
                        </>
                    )}

                    {warrantyInfo.warrantyStatus === 'void' && (
                        <>
                            <h3 className={`font-semibold ${statusTone.heading}`}>
                                {t('warrantyCheck.result.void.title')}
                            </h3>
                            <p className={`mt-2 text-sm leading-6 ${statusTone.body}`}>
                                {t('warrantyCheck.result.void.description')}
                            </p>
                            <p className={`mt-2 text-sm leading-6 ${statusTone.heading}`}>
                                {t('warrantyCheck.result.void.contact')}
                            </p>
                        </>
                    )}
                </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <motion.button
                    type="button"
                    onClick={onReset}
                    className={`${actionButtonClass} brand-button-secondary flex-1 text-[var(--text-primary)] hover:-translate-y-0.5 hover:border-[var(--brand-blue)] hover:bg-[rgba(41,171,226,0.14)]`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {t('warrantyCheck.result.actions.checkAnother')}
                </motion.button>
                <motion.button
                    type="button"
                    onClick={handleDownloadInfo}
                    className={`${actionButtonClass} brand-button-primary flex-1 text-[var(--text-primary)] shadow-[0_18px_42px_rgba(0,113,188,0.18)] hover:-translate-y-0.5 hover:brightness-105`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {t('warrantyCheck.result.actions.download')}
                </motion.button>
            </div>

            <div className="mt-6 rounded-[24px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] p-5">
                <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)]">
                    {t('warrantyCheck.result.support.title')}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {t('warrantyCheck.result.support.description')}
                </p>
                <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-4">
                    <span className="font-medium text-[var(--brand-blue)]">
                        {t('warrantyCheck.result.support.hotlineLabel')}:{' '}
                        {t('warrantyCheck.result.support.hotlineValue')}
                    </span>
                    <span className="font-medium text-[var(--brand-blue)]">
                        {t('warrantyCheck.result.support.emailLabel')}: {t('warrantyCheck.result.support.emailValue')}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default WarrantyResult;
