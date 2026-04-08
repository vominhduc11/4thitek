export type ThreeCapabilityReason =
    | 'server'
    | 'no-webgl'
    | 'reduced-motion'
    | 'save-data'
    | 'low-end-device'
    | 'mobile-disabled'
    | 'full';

export interface ThreeCapability {
    allowThree: boolean;
    isMobile: boolean;
    isLowEndDevice: boolean;
    prefersReducedMotion: boolean;
    saveData: boolean;
    maxDpr: number;
    reason: ThreeCapabilityReason;
}

interface DetectThreeCapabilityOptions {
    allowOnMobile?: boolean;
}

type NavigatorWithConnection = Navigator & {
    connection?: {
        effectiveType?: string;
        saveData?: boolean;
    };
    deviceMemory?: number;
    hardwareConcurrency?: number;
};

let webglSupportCache: boolean | null = null;

function hasWebGLSupport() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return false;
    }

    if (webglSupportCache !== null) {
        return webglSupportCache;
    }

    try {
        const canvas = document.createElement('canvas');
        const context =
            canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ||
            canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true }) ||
            canvas.getContext('experimental-webgl');

        webglSupportCache = Boolean(context);
    } catch {
        webglSupportCache = false;
    }

    return webglSupportCache;
}

export function detectThreeCapability({
    allowOnMobile = false
}: DetectThreeCapabilityOptions = {}): ThreeCapability {
    if (typeof window === 'undefined') {
        return {
            allowThree: false,
            isMobile: false,
            isLowEndDevice: true,
            prefersReducedMotion: true,
            saveData: false,
            maxDpr: 1,
            reason: 'server'
        };
    }

    const navigatorWithConnection = window.navigator as NavigatorWithConnection;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const hardwareConcurrency =
        typeof navigatorWithConnection.hardwareConcurrency === 'number'
            ? navigatorWithConnection.hardwareConcurrency
            : 4;
    const deviceMemory =
        typeof navigatorWithConnection.deviceMemory === 'number'
            ? navigatorWithConnection.deviceMemory
            : 4;
    const effectiveType = navigatorWithConnection.connection?.effectiveType ?? '';
    const saveData = Boolean(navigatorWithConnection.connection?.saveData);
    const isLowEndDevice =
        hardwareConcurrency <= 4 ||
        deviceMemory <= 4 ||
        effectiveType === 'slow-2g' ||
        effectiveType === '2g' ||
        effectiveType === '3g';

    if (!hasWebGLSupport()) {
        return {
            allowThree: false,
            isMobile,
            isLowEndDevice,
            prefersReducedMotion,
            saveData,
            maxDpr: 1,
            reason: 'no-webgl'
        };
    }

    if (prefersReducedMotion) {
        return {
            allowThree: false,
            isMobile,
            isLowEndDevice,
            prefersReducedMotion,
            saveData,
            maxDpr: 1,
            reason: 'reduced-motion'
        };
    }

    if (saveData) {
        return {
            allowThree: false,
            isMobile,
            isLowEndDevice,
            prefersReducedMotion,
            saveData,
            maxDpr: 1,
            reason: 'save-data'
        };
    }

    if (isLowEndDevice) {
        return {
            allowThree: false,
            isMobile,
            isLowEndDevice,
            prefersReducedMotion,
            saveData,
            maxDpr: 1,
            reason: 'low-end-device'
        };
    }

    if (isMobile && !allowOnMobile) {
        return {
            allowThree: false,
            isMobile,
            isLowEndDevice,
            prefersReducedMotion,
            saveData,
            maxDpr: 1,
            reason: 'mobile-disabled'
        };
    }

    return {
        allowThree: true,
        isMobile,
        isLowEndDevice,
        prefersReducedMotion,
        saveData,
        maxDpr: isMobile ? 1.1 : 1.5,
        reason: 'full'
    };
}
