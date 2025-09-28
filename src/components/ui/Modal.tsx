'use client';

import React, { useEffect, useState } from 'react';
import ReactModal from 'react-modal';
import { motion, AnimatePresence } from 'framer-motion';

// Set app element for accessibility (should be called once in the app)
if (typeof window !== 'undefined' && document.getElementById('__next')) {
    ReactModal.setAppElement('#__next');
} else if (typeof window !== 'undefined' && document.body) {
    ReactModal.setAppElement('body');
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
    overlayClassName?: string;
    contentClassName?: string;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    preventBodyScroll?: boolean;
    maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    className = '',
    overlayClassName = '',
    contentClassName = '',
    closeOnOverlayClick = true,
    closeOnEscape = true,
    preventBodyScroll = true,
    maxWidth = 'max-w-2xl'
}) => {
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);
    // Additional body scroll prevention
    useEffect(() => {
        if (!preventBodyScroll || !isHydrated) return;

        if (isOpen) {
            // Store current scroll position
            const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;

            // Apply styles to completely prevent scrolling
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        } else {
            // Restore scroll position
            const scrollY = parseInt(document.body.style.top || '0', 10);

            // Reset styles
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';
            document.body.style.touchAction = '';

            // Restore scroll position
            if (typeof window !== 'undefined') {
                window.scrollTo(0, Math.abs(scrollY));
            }
        }

        // Cleanup on unmount
        return () => {
            if (isOpen) {
                const scrollY = parseInt(document.body.style.top || '0', 10);
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.left = '';
                document.body.style.right = '';
                document.body.style.overflow = '';
                document.body.style.touchAction = '';
                if (typeof window !== 'undefined') {
                    window.scrollTo(0, Math.abs(scrollY));
                }
            }
        };
    }, [isOpen, preventBodyScroll, isHydrated]);
    const customStyles = {
        overlay: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overscrollBehavior: 'contain' as const,
            touchAction: 'none' as const,
            overflow: 'hidden' as const
        },
        content: {
            position: 'relative' as const,
            top: 'auto',
            left: 'auto',
            right: 'auto',
            bottom: 'auto',
            border: 'none',
            background: 'transparent',
            overflow: 'visible',
            WebkitOverflowScrolling: 'touch' as const,
            borderRadius: '0',
            outline: 'none',
            padding: '0',
            margin: '0',
            maxHeight: '90vh',
            width: '100%',
            maxWidth: '42rem', // 2xl
            inset: 'auto'
        }
    };

    return (
        <ReactModal
            isOpen={isOpen}
            onRequestClose={onClose}
            shouldCloseOnOverlayClick={closeOnOverlayClick}
            shouldCloseOnEsc={closeOnEscape}
            shouldFocusAfterRender={true}
            shouldReturnFocusAfterClose={true}
            preventScroll={preventBodyScroll}
            style={customStyles}
            className={`outline-none ${className}`}
            overlayClassName={`fixed inset-0 ${overlayClassName}`}
            contentLabel="Modal"
        >
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={`${maxWidth} w-full max-h-[90vh] overflow-y-auto bg-[#1a2332] rounded-xl border border-gray-700 shadow-2xl ${contentClassName}`}
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </ReactModal>
    );
};

export default Modal;