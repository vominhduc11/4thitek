'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@/services/apiService';
import { extraTranslations, translations } from './languageData';

type Language = 'en' | 'vi';

type TranslationValue = string | Record<string, unknown> | unknown[];

export interface LanguageContextType {
    language: Language;
    locale: string;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    getTranslation: (key: string) => TranslationValue | null;
    isHydrated: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
    initialLanguage?: Language;
}

export const getLocaleForLanguage = (lang: Language): string => {
    switch (lang) {
        case 'vi':
            return 'vi-VN';
        case 'en':
        default:
            return 'en-US';
    }
};

const LANGUAGE_COOKIE = 'language';
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const parseLanguage = (value: string | null | undefined): Language | null => {
    if (value === 'en' || value === 'vi') {
        return value;
    }
    return null;
};

const resolveTranslationValue = (source: TranslationValue | undefined, key: string): TranslationValue | null => {
    if (!source) return null;
    const keys = key.split('.');
    let value: TranslationValue = source;

    for (const k of keys) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            value = (value as Record<string, unknown>)[k] as TranslationValue;
        } else {
            return null;
        }
    }

    return value ?? null;
};

const getTranslationValue = (language: Language, key: string): TranslationValue | null => {
    const primary = resolveTranslationValue(translations[language], key);
    if (primary !== null && primary !== undefined) {
        return primary;
    }
    return resolveTranslationValue(extraTranslations[language], key);
};

export function LanguageProvider({ children, initialLanguage = 'vi' }: LanguageProviderProps) {
    const [language, setLanguage] = useState<Language>(initialLanguage);
    const [isHydrated, setIsHydrated] = useState(false);
    const locale = getLocaleForLanguage(language);

    // Load language from localStorage on mount - proper SSR handling
    useEffect(() => {
        setIsHydrated(true);

        // Only access localStorage after hydration
        if (typeof window !== 'undefined') {
            const savedLanguage = parseLanguage(localStorage.getItem('language'));
            if (savedLanguage) {
                setLanguage(savedLanguage);
                return;
            }

            const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${LANGUAGE_COOKIE}=([^;]*)`));
            const cookieLanguage = parseLanguage(cookieMatch ? decodeURIComponent(cookieMatch[1]) : null);
            if (cookieLanguage) {
                setLanguage(cookieLanguage);
            }
        }
    }, []);

    // Save language to localStorage when changed
    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        // Only access localStorage on client side
        if (typeof window !== 'undefined') {
            localStorage.setItem('language', lang);
        }
    };

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = language;
            document.cookie = `${LANGUAGE_COOKIE}=${language}; Path=/; Max-Age=${LANGUAGE_COOKIE_MAX_AGE}; SameSite=Lax`;
        }
        apiService.setLanguage(language);
    }, [language]);

    // Translation function for strings
    const t = (key: string): string => {
        const value = getTranslationValue(language, key);
        return typeof value === 'string' ? value : key;
    };

    // Translation function for objects
    const getTranslation = (key: string): TranslationValue | null => getTranslationValue(language, key);

    const value = {
        language,
        locale,
        setLanguage: handleSetLanguage,
        t,
        getTranslation,
        isHydrated
    };

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

