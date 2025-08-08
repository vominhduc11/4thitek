/**
 * Centralized Modal Manager to prevent scroll lock conflicts
 * Manages body scroll state when multiple modals are open
 */
class ModalManager {
    private static instance: ModalManager;
    private openModals: Set<string> = new Set();
    private originalBodyStyle: string = '';
    private originalBodyPadding: string = '';
    private scrollBarWidth: number = 0;

    private constructor() {}

    static getInstance(): ModalManager {
        if (!ModalManager.instance) {
            ModalManager.instance = new ModalManager();
        }
        return ModalManager.instance;
    }

    /**
     * Calculate scrollbar width for consistent padding
     */
    private calculateScrollBarWidth(): number {
        if (typeof window === 'undefined') return 0;
        return window.innerWidth - document.documentElement.clientWidth;
    }

    /**
     * Open a modal and manage body scroll
     */
    openModal(modalId: string): void {
        if (typeof window === 'undefined') return;

        // If this is the first modal, lock body scroll
        if (this.openModals.size === 0) {
            this.originalBodyStyle = document.body.style.overflow;
            this.originalBodyPadding = document.body.style.paddingRight;
            this.scrollBarWidth = this.calculateScrollBarWidth();

            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${this.scrollBarWidth}px`;
        }

        this.openModals.add(modalId);
    }

    /**
     * Close a modal and restore body scroll if no modals remain
     */
    closeModal(modalId: string): void {
        if (typeof window === 'undefined') return;

        this.openModals.delete(modalId);

        // If no modals are open, restore body scroll
        if (this.openModals.size === 0) {
            document.body.style.overflow = this.originalBodyStyle;
            document.body.style.paddingRight = this.originalBodyPadding;
        }
    }

    /**
     * Force close all modals and restore body scroll
     */
    closeAllModals(): void {
        if (typeof window === 'undefined') return;

        this.openModals.clear();
        document.body.style.overflow = this.originalBodyStyle;
        document.body.style.paddingRight = this.originalBodyPadding;
    }

    /**
     * Check if any modals are currently open
     */
    hasOpenModals(): boolean {
        return this.openModals.size > 0;
    }

    /**
     * Get the current modal stack
     */
    getOpenModals(): string[] {
        return Array.from(this.openModals);
    }
}

export const modalManager = ModalManager.getInstance();

/**
 * React hook for managing modal scroll lock
 */
export function useModalScrollLock(modalId: string, isOpen: boolean): void {
    // Using useEffect pattern would require React import
    // This is a utility function that components can call directly
    if (isOpen) {
        modalManager.openModal(modalId);
    } else {
        modalManager.closeModal(modalId);
    }
}