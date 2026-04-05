'use client';

import { motion } from 'framer-motion';
import {
    MdKeyboardArrowLeft,
    MdKeyboardArrowRight,
    MdKeyboardDoubleArrowLeft,
    MdKeyboardDoubleArrowRight
} from 'react-icons/md';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    showCount?: boolean;
    countLabel?: string;
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    onPageChange,
    showCount = false,
    countLabel = 'items'
}: PaginationProps) {
    const { t } = useLanguage();

    if (totalPages <= 1 || totalItems === 0) {
        return null;
    }

    const itemsPerPage = Math.ceil(totalItems / totalPages);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const navButtonClass =
        'flex h-11 w-11 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--brand-border-strong)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40';

    return (
        <div className="py-8 sm:py-12">
            <AvoidSidebar>
                <div className="brand-shell">
                    <motion.div
                        className="brand-card rounded-[28px] px-5 py-5 sm:px-6"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            {showCount ? (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                                        {countLabel}
                                    </p>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        {t('pagination.summary')
                                            .replace('{start}', String(startItem))
                                            .replace('{end}', String(endItem))
                                            .replace('{total}', String(totalItems))
                                            .replace('{label}', countLabel)}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                                        {t('pagination.pageSummary')
                                            .replace('{current}', String(currentPage))
                                            .replace('{total}', String(totalPages))}
                                    </p>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        {startItem}-{endItem} / {totalItems}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2">
                                <motion.button
                                    type="button"
                                    className={navButtonClass}
                                    disabled={currentPage === 1}
                                    onClick={() => onPageChange(1)}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    aria-label={t('pagination.first')}
                                >
                                    <MdKeyboardDoubleArrowLeft className="h-4 w-4" />
                                </motion.button>
                                <motion.button
                                    type="button"
                                    className={navButtonClass}
                                    disabled={currentPage === 1}
                                    onClick={() => onPageChange(currentPage - 1)}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    aria-label={t('pagination.previous')}
                                >
                                    <MdKeyboardArrowLeft className="h-4 w-4" />
                                </motion.button>

                                <div className="brand-badge px-4 py-2 text-sm font-semibold">
                                    <span>{currentPage}</span>
                                    <span className="text-[var(--text-muted)]">/</span>
                                    <span>{totalPages}</span>
                                </div>

                                <motion.button
                                    type="button"
                                    className={navButtonClass}
                                    disabled={currentPage === totalPages}
                                    onClick={() => onPageChange(currentPage + 1)}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    aria-label={t('pagination.next')}
                                >
                                    <MdKeyboardArrowRight className="h-4 w-4" />
                                </motion.button>
                                <motion.button
                                    type="button"
                                    className={navButtonClass}
                                    disabled={currentPage === totalPages}
                                    onClick={() => onPageChange(totalPages)}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    aria-label={t('pagination.last')}
                                >
                                    <MdKeyboardDoubleArrowRight className="h-4 w-4" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </AvoidSidebar>
        </div>
    );
}
