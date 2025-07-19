'use client';

import { useEffect } from 'react';

/**
 * Hook để khóa cuộn trang khi modal mở
 * @param isLocked - Trạng thái khóa cuộn
 */
export function useBodyScrollLock(isLocked: boolean) {
    useEffect(() => {
        if (!isLocked) return;

        // Lưu trạng thái cuộn hiện tại
        const originalStyle = window.getComputedStyle(document.body).overflow;
        const scrollY = window.scrollY;

        // Khóa cuộn trang
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';

        // Khôi phục trạng thái cuộn khi component unmount hoặc isLocked thay đổi
        return () => {
            document.body.style.overflow = originalStyle;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, scrollY);
        };
    }, [isLocked]);
}
