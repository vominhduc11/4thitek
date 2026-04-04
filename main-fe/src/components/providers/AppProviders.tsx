'use client';

import type { ReactNode } from 'react';
import { LanguageProvider, type LanguageContextType } from '@/context/LanguageContext';
import { SearchModalProvider } from '@/context/SearchModalContext';

interface AppProvidersProps {
    children: ReactNode;
    initialLanguage?: LanguageContextType['language'];
}

export default function AppProviders({ children, initialLanguage }: AppProvidersProps) {
    return (
        <LanguageProvider initialLanguage={initialLanguage}>
            <SearchModalProvider>{children}</SearchModalProvider>
        </LanguageProvider>
    );
}
